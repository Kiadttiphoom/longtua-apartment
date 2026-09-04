"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUsername } from "@/lib/auth/validation.mjs";
import { hasOrganizationPermission, type MenuActionCode } from "@/lib/auth/organization-access";
import { getRelatedPeriodMonth } from "@/lib/portal/meter-reading.mjs";
import { calculateInvoiceBreakdown, invoiceMissingMessage } from "@/lib/portal/invoice-calculation.mjs";
import { getPlanByQuota } from "@/lib/portal/plans";

export type DashboardActionResult = { ok: boolean; message: string; requestId?: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : Number.NaN;
}

function fail(message: string): DashboardActionResult {
  return { ok: false, message };
}

function logFailure(requestId: string, stage: string, error: unknown) {
  const details = error && typeof error === "object"
    ? error as { code?: unknown; message?: unknown; details?: unknown }
    : {};

  console.error(`[dashboard] ${JSON.stringify({
    requestId,
    stage,
    code: typeof details.code === "string" ? details.code : undefined,
    message: typeof details.message === "string" ? details.message : "Unexpected dashboard error",
    details: typeof details.details === "string" ? details.details : undefined,
  })}`);
}

type ActionContext =
  | { ok: false; error: DashboardActionResult }
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      organizationId: string;
      userId: string;
      subscription: {
        status: string;
        max_properties: number | null;
        max_rooms: number | null;
      };
    };

async function actionContext(formData: FormData, menuCode: string, actionCode: MenuActionCode): Promise<ActionContext> {
  const organizationId = text(formData, "organizationId");
  if (!UUID_PATTERN.test(organizationId)) return { ok: false, error: fail("ไม่พบกิจการที่ต้องการทำรายการ") };

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (authError || !userId) return { ok: false, error: fail("กรุณาเข้าสู่ระบบอีกครั้ง") };

  const [{ data: membership }, { data: subscription }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("role_code")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, access_until, grace_ends_at, max_properties, max_rooms")
      .eq("organization_id", organizationId)
      .maybeSingle(),
  ]);

  if (!membership || !subscription) return { ok: false, error: fail("คุณไม่มีสิทธิ์เข้าถึงกิจการนี้") };

  const allowed = await hasOrganizationPermission(userId, organizationId, menuCode, actionCode);
  if (allowed === false) return { ok: false, error: fail("Role ของคุณไม่มี Permission สำหรับรายการนี้") };
  if (allowed === null && !["owner", "manager", "accounting"].includes(membership.role_code)) {
    return { ok: false, error: fail("บัญชีนี้ไม่มีสิทธิ์แก้ไขข้อมูล") };
  }

  const accessUntil = subscription.access_until ?? subscription.grace_ends_at;
  const writable = subscription.status === "trialing"
    || subscription.status === "active"
    || (subscription.status === "past_due" && accessUntil && new Date(accessUntil) > new Date());

  if (!writable) return { ok: false, error: fail("แพ็กเกจหมดอายุแล้ว ขณะนี้เปิดดูข้อมูลได้อย่างเดียว") };
  return {
    ok: true,
    supabase,
    organizationId,
    userId,
    subscription: {
      status: subscription.status,
      max_properties: subscription.max_properties ?? 1,
      max_rooms: subscription.max_rooms ?? 10,
    },
  };
}

function success(message: string): DashboardActionResult {
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { ok: true, message };
}

export async function createPropertyAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_properties", "create");
  if (!context.ok) return context.error;

  const maxProperties = context.subscription.max_properties;
  if (maxProperties != null) {
    const { count, error: countError } = await context.supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organizationId);

    if (!countError && typeof count === "number" && count >= maxProperties) {
      return fail(
        `แพ็กเกจของคุณจำกัดที่ ${maxProperties} หอพัก (ปัจจุบันมีแล้ว ${count} หอพัก) กรุณาอัปเกรดแพ็กเกจเพื่อเพิ่มหอพักใหม่`
      );
    }
  }

  const name = text(formData, "name");
  if (name.length < 1 || name.length > 160) return fail("กรุณากรอกชื่อหอพักไม่เกิน 160 ตัวอักษร");

  const { error } = await context.supabase.rpc("create_property_with_defaults", {
    target_organization_id: context.organizationId,
    property_name: name,
    property_address: text(formData, "address"),
    property_phone: text(formData, "phone"),
  });
  if (error) {
    logFailure(requestId, "property.create", error);
    if (typeof error === "object" && error && "message" in error && String((error as { message: unknown }).message).includes("Property limit reached")) {
      return { ...fail("คุณสร้างหอพักครบตามจำนวนที่แพ็กเกจกำหนดแล้ว กรุณาอัปเกรดแพ็กเกจ"), requestId };
    }
    return { ...fail("เพิ่มหอพักไม่สำเร็จ"), requestId };
  }
  return success("เพิ่มหอพักเรียบร้อยแล้ว");
}

export async function createRoomAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_rooms", "create");
  if (!context.ok) return context.error;

  const propertyId = text(formData, "propertyId");
  const baseRent = numberValue(formData, "baseRent");
  const floor = text(formData, "floor");
  if (!UUID_PATTERN.test(propertyId)) return fail("กรุณาเลือกหอพัก");
  if (!Number.isFinite(baseRent) || baseRent < 0) return fail("ค่าเช่าต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
  if (floor.length > 40) return fail("ชื่อชั้นต้องไม่เกิน 40 ตัวอักษร");

  let roomNumbers: unknown;
  try {
    roomNumbers = JSON.parse(text(formData, "roomNumbers"));
  } catch {
    roomNumbers = [text(formData, "roomNumber")];
  }
  if (!Array.isArray(roomNumbers) || roomNumbers.length < 1 || roomNumbers.length > 200) {
    return fail("กรุณาระบุห้องตั้งแต่ 1–200 ห้องต่อครั้ง");
  }
  if (roomNumbers.some((roomNumber) => typeof roomNumber !== "string" || !roomNumber.trim() || roomNumber.trim().length > 40)) {
    return fail("หมายเลขห้องแต่ละห้องต้องมีความยาว 1–40 ตัวอักษร");
  }

  const maxRooms = context.subscription.max_rooms;
  if (maxRooms != null) {
    const { count, error: countError } = await context.supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organizationId);

    if (!countError && typeof count === "number") {
      const requestedRooms = (roomNumbers as string[]).map((r) => r.trim());
      if (count + requestedRooms.length > maxRooms) {
        return fail(
          `แพ็กเกจของคุณจำกัดที่ ${maxRooms} ห้อง ปัจจุบันมีแล้ว ${count} ห้อง (ต้องการเพิ่ม ${requestedRooms.length} ห้อง รวมเป็น ${count + requestedRooms.length} ห้อง) กรุณาอัปเกรดแพ็กเกจเพื่อเพิ่มห้อง`
        );
      }
    }
  }

  const { data, error } = await context.supabase.rpc("create_rooms_with_meters", {
    target_organization_id: context.organizationId,
    target_property_id: propertyId,
    requested_room_numbers: roomNumbers.map((roomNumber) => (roomNumber as string).trim()),
    room_floor: floor || null,
    room_base_rent: baseRent,
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    logFailure(requestId, "room.create_bulk", error);
    if (typeof error === "object" && error && "message" in error && String((error as { message: unknown }).message).includes("Room limit reached")) {
      return { ...fail("จำนวนห้องเกินขีดจำกัดของแพ็กเกจ กรุณาอัปเกรดแพ็กเกจ"), requestId };
    }
    return { ...fail("เพิ่มห้องไม่สำเร็จ กรุณาตรวจหมายเลขห้องและลองอีกครั้ง"), requestId };
  }

  const result = data as { created_count?: unknown; skipped_count?: unknown };
  const createdCount = Number(result.created_count ?? 0);
  const skippedCount = Number(result.skipped_count ?? 0);
  if (createdCount < 1) return fail("ไม่มีห้องใหม่ให้เพิ่ม หมายเลขห้องอาจมีอยู่แล้วทั้งหมด");

  const skippedMessage = skippedCount > 0 ? ` ข้ามหมายเลขที่ซ้ำ ${skippedCount} ห้อง` : "";
  return success(`เพิ่มห้องพัก ${createdCount} ห้องเรียบร้อยแล้ว${skippedMessage}`);
}

export async function createTenantAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_tenants", "create");
  if (!context.ok) return context.error;

  const fullName = text(formData, "fullName");
  const idCardLast4 = text(formData, "idCardLast4");
  if (fullName.length < 2 || fullName.length > 160) return fail("กรุณากรอกชื่อผู้เช่า 2–160 ตัวอักษร");
  if (idCardLast4 && !/^\d{4}$/.test(idCardLast4)) return fail("เลขบัตรประชาชนให้กรอกเฉพาะ 4 ตัวท้าย");

  const { data, error } = await context.supabase.from("tenants").insert({
    organization_id: context.organizationId,
    full_name: fullName,
    phone: text(formData, "phone") || null,
    email: text(formData, "email") || null,
    id_card_last4: idCardLast4 || null,
    address: text(formData, "address") || null,
  }).select("id").single();

  if (error || !data) {
    logFailure(requestId, "tenant.create", error);
    return { ...fail("เพิ่มผู้เช่าไม่สำเร็จ"), requestId };
  }
  await context.supabase.from("audit_logs").insert({ organization_id: context.organizationId, action: "tenant.created", entity_type: "tenant", entity_id: data.id });
  return success("เพิ่มผู้เช่าเรียบร้อยแล้ว");
}

export async function createLeaseAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_leases", "create");
  if (!context.ok) return context.error;

  const propertyId = text(formData, "propertyId");
  const roomId = text(formData, "roomId");
  const tenantId = text(formData, "tenantId");
  const rentAmount = numberValue(formData, "rentAmount");
  const leaseNumber = text(formData, "leaseNumber");
  const startDate = text(formData, "startDate");
  const endDate = text(formData, "endDate");
  const occupantCount = numberValue(formData, "occupantCount");
  if (![propertyId, roomId, tenantId].every((id) => UUID_PATTERN.test(id))) return fail("กรุณาเลือกหอ ห้อง และผู้เช่าให้ครบ");
  if (!leaseNumber || !startDate) return fail("กรุณากรอกเลขที่สัญญาและวันเริ่มสัญญา");
  if (!Number.isFinite(rentAmount) || rentAmount < 0) return fail("ค่าเช่าไม่ถูกต้อง");
  if (!Number.isInteger(occupantCount) || occupantCount < 1 || occupantCount > 50) return fail("จำนวนผู้พักต้องอยู่ระหว่าง 1–50 คน");

  const { data, error } = await context.supabase.from("leases").insert({
    organization_id: context.organizationId,
    property_id: propertyId,
    room_id: roomId,
    primary_tenant_id: tenantId,
    lease_number: leaseNumber,
    start_date: startDate,
    end_date: endDate || null,
    rent_amount: rentAmount,
    deposit_amount: numberValue(formData, "depositAmount") || 0,
    advance_amount: numberValue(formData, "advanceAmount") || 0,
    occupant_count: occupantCount,
    terms: text(formData, "terms") || null,
    status: "active",
  }).select("id").single();

  if (error || !data) {
    logFailure(requestId, "lease.create", error);
    return { ...fail("สร้างสัญญาไม่สำเร็จ ห้องนี้อาจมีสัญญาที่ใช้งานอยู่แล้ว"), requestId };
  }
  await context.supabase.from("rooms").update({ status: "occupied" }).eq("id", roomId).eq("organization_id", context.organizationId);
  await context.supabase.from("audit_logs").insert({ organization_id: context.organizationId, action: "lease.created", entity_type: "lease", entity_id: data.id });
  return success("สร้างสัญญาเช่าเรียบร้อยแล้ว");
}

export async function createInvoiceAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_invoices", "create");
  if (!context.ok) return context.error;

  const leaseId = text(formData, "leaseId");
  const periodMonth = text(formData, "periodMonth");
  const invoiceNumber = text(formData, "invoiceNumber");
  const dueAt = text(formData, "dueAt");
  if (!UUID_PATTERN.test(leaseId)) return fail("กรุณาเลือกสัญญาและห้องพัก");
  if (!/^\d{4}-\d{2}$/.test(periodMonth)) return fail("กรุณาเลือกรอบเดือน");
  const today = new Date().toISOString().slice(0, 10);
  if (!invoiceNumber || !/^\d{4}-\d{2}-\d{2}$/.test(dueAt) || dueAt < today) return fail("กรุณากรอกเลขที่ใบแจ้งหนี้และวันครบกำหนดตั้งแต่วันนี้เป็นต้นไป");

  const { data: lease, error: leaseError } = await context.supabase
    .from("leases")
    .select("id, property_id, room_id, rent_amount, occupant_count, status")
    .eq("id", leaseId)
    .eq("organization_id", context.organizationId)
    .eq("status", "active")
    .single();
  if (leaseError || !lease) return fail("ไม่พบสัญญาที่กำลังใช้งาน");

  const monthDate = `${periodMonth}-01`;
  const { data: cycle, error: cycleError } = await context.supabase
    .from("billing_cycles")
    .upsert({ organization_id: context.organizationId, property_id: lease.property_id, period_month: monthDate }, { onConflict: "property_id,period_month" })
    .select("id")
    .single();
  if (cycleError || !cycle) {
    logFailure(requestId, "invoice.billing_cycle", cycleError);
    return { ...fail("สร้างรอบบิลไม่สำเร็จ"), requestId };
  }

  const { data: existingInvoice, error: existingInvoiceError } = await context.supabase
    .from("rent_invoices")
    .select("id")
    .eq("organization_id", context.organizationId)
    .eq("lease_id", lease.id)
    .eq("billing_cycle_id", cycle.id)
    .neq("status", "void")
    .maybeSingle();
  if (existingInvoiceError) {
    logFailure(requestId, "invoice.duplicate_check", existingInvoiceError);
    return { ...fail("ตรวจสอบใบแจ้งหนี้เดิมไม่สำเร็จ"), requestId };
  }
  if (existingInvoice) return fail("สัญญานี้มีใบแจ้งหนี้ของรอบเดือนดังกล่าวแล้ว");

  const [{ data: settings, error: settingsError }, { data: meters, error: metersError }] = await Promise.all([
    context.supabase.from("property_settings").select("electric_rate, water_rate, water_billing_method").eq("organization_id", context.organizationId).eq("property_id", lease.property_id).single(),
    context.supabase.from("meters").select("id, room_id, meter_type, status").eq("organization_id", context.organizationId).eq("room_id", lease.room_id).eq("status", "active"),
  ]);
  if (settingsError || metersError || !settings) {
    logFailure(requestId, "invoice.billing_sources", settingsError ?? metersError);
    return { ...fail("โหลดการตั้งค่าค่าน้ำและค่าไฟไม่สำเร็จ"), requestId };
  }

  const meterIds = (meters ?? []).map((meter) => meter.id);
  const { data: readings, error: readingsError } = meterIds.length
    ? await context.supabase.from("meter_readings").select("meter_id, previous_value, current_value, usage_value").eq("organization_id", context.organizationId).eq("billing_cycle_id", cycle.id).in("meter_id", meterIds)
    : { data: [], error: null };
  if (readingsError) {
    logFailure(requestId, "invoice.meter_readings", readingsError);
    return { ...fail("โหลดเลขมิเตอร์ของรอบบิลไม่สำเร็จ"), requestId };
  }

  const calculation = calculateInvoiceBreakdown({
    lease,
    settings,
    meters: meters ?? [],
    readings: (readings ?? []).map((reading) => ({ ...reading, period_month: monthDate })),
    periodMonth,
  });
  if (!calculation.ready) return fail(invoiceMissingMessage(calculation.missing));

  const { data: invoice, error } = await context.supabase.from("rent_invoices").insert({
    organization_id: context.organizationId,
    property_id: lease.property_id,
    room_id: lease.room_id,
    lease_id: lease.id,
    billing_cycle_id: cycle.id,
    invoice_number: invoiceNumber,
    due_at: dueAt,
    subtotal: calculation.total,
    total: calculation.total,
    balance_due: calculation.total,
    status: "issued",
    note: text(formData, "note") || null,
  }).select("id").single();

  if (error || !invoice) {
    logFailure(requestId, "invoice.create", error);
    return { ...fail("ออกใบแจ้งหนี้ไม่สำเร็จ เลขที่เอกสารอาจซ้ำ"), requestId };
  }

  const { error: itemError } = await context.supabase.from("rent_invoice_items").insert(calculation.items.map((item) => ({
    organization_id: context.organizationId,
    rent_invoice_id: invoice.id,
    item_type: item.itemType,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    amount: item.amount,
    metadata: { ...item.metadata, period_month: monthDate, rate_snapshot: item.unitPrice },
  })));
  if (itemError) {
    logFailure(requestId, "invoice.create_item", itemError);
    await context.supabase.from("rent_invoices").delete().eq("id", invoice.id).eq("organization_id", context.organizationId);
    return { ...fail("สร้างรายการในใบแจ้งหนี้ไม่สำเร็จ"), requestId };
  }
  await context.supabase.from("audit_logs").insert({ organization_id: context.organizationId, action: "invoice.created", entity_type: "rent_invoice", entity_id: invoice.id });
  return success("ออกใบแจ้งหนี้เรียบร้อยแล้ว");
}

export async function saveMeterReadingAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_meters", "create");
  if (!context.ok) return context.error;

  const propertyId = text(formData, "propertyId");
  const roomId = text(formData, "roomId");
  const meterType = text(formData, "meterType");
  const periodMonth = text(formData, "periodMonth");
  const currentValue = numberValue(formData, "currentValue");
  if (![propertyId, roomId].every((id) => UUID_PATTERN.test(id))) return fail("กรุณาเลือกหอและห้อง");
  if (!["electric", "water"].includes(meterType)) return fail("ประเภทมิเตอร์ไม่ถูกต้อง");
  if (!/^\d{4}-\d{2}$/.test(periodMonth)) return fail("กรุณาเลือกรอบเดือน");
  if (!Number.isFinite(currentValue) || currentValue < 0) return fail("กรุณากรอกเลขมิเตอร์ตั้งแต่ 0 ขึ้นไป");

  const { data: meter, error: meterError } = await context.supabase
    .from("meters")
    .select("id")
    .eq("organization_id", context.organizationId)
    .eq("property_id", propertyId)
    .eq("room_id", roomId)
    .eq("meter_type", meterType)
    .single();
  if (meterError || !meter) {
    logFailure(requestId, "meter.find", meterError);
    return { ...fail("ไม่พบมิเตอร์ของห้องนี้"), requestId };
  }

  const monthDate = `${periodMonth}-01`;
  const { data: cycle, error: cycleError } = await context.supabase
    .from("billing_cycles")
    .upsert({ organization_id: context.organizationId, property_id: propertyId, period_month: monthDate }, { onConflict: "property_id,period_month" })
    .select("id")
    .single();
  if (cycleError || !cycle) {
    logFailure(requestId, "meter.billing_cycle", cycleError);
    return { ...fail("สร้างรอบบิลไม่สำเร็จ"), requestId };
  }

  const { data: existingReading, error: existingError } = await context.supabase
    .from("meter_readings")
    .select("previous_value")
    .eq("organization_id", context.organizationId)
    .eq("meter_id", meter.id)
    .eq("billing_cycle_id", cycle.id)
    .maybeSingle();
  if (existingError) {
    logFailure(requestId, "meter.existing_reading", existingError);
    return { ...fail("ตรวจสอบเลขมิเตอร์เดิมไม่สำเร็จ"), requestId };
  }

  let previousValue = Number(existingReading?.previous_value ?? 0);
  if (!existingReading) {
    const { data: priorReadings, error: priorError } = await context.supabase
      .from("meter_readings")
      .select("current_value, billing_cycles!inner(period_month)")
      .eq("organization_id", context.organizationId)
      .eq("meter_id", meter.id)
      .lt("billing_cycles.period_month", monthDate);
    if (priorError) {
      logFailure(requestId, "meter.previous_reading", priorError);
      return { ...fail("ค้นหาเลขมิเตอร์รอบก่อนไม่สำเร็จ"), requestId };
    }
    const latestReading = (priorReadings ?? []).sort((left, right) =>
      getRelatedPeriodMonth(right.billing_cycles).localeCompare(getRelatedPeriodMonth(left.billing_cycles))
    )[0];
    previousValue = Number(latestReading?.current_value ?? 0);
  }
  if (currentValue < previousValue) return fail(`เลขครั้งนี้ต้องไม่น้อยกว่าเลขครั้งก่อน (${previousValue.toLocaleString("th-TH")})`);

  const { error } = await context.supabase.from("meter_readings").upsert({
    organization_id: context.organizationId,
    meter_id: meter.id,
    billing_cycle_id: cycle.id,
    previous_value: previousValue,
    current_value: currentValue,
    read_at: new Date().toISOString(),
  }, { onConflict: "meter_id,billing_cycle_id" });
  if (error) {
    logFailure(requestId, "meter.reading_upsert", error);
    return { ...fail("บันทึกเลขมิเตอร์ไม่สำเร็จ"), requestId };
  }
  return success("บันทึกเลขมิเตอร์เรียบร้อยแล้ว");
}

export async function recordPaymentAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_payments", "create");
  if (!context.ok) return context.error;

  const invoiceId = text(formData, "invoiceId");
  const amount = numberValue(formData, "amount");
  if (!UUID_PATTERN.test(invoiceId) || !Number.isFinite(amount) || amount <= 0) return fail("กรุณาเลือกใบแจ้งหนี้และกรอกยอดรับชำระ");

  const { data: invoice, error: invoiceError } = await context.supabase
    .from("rent_invoices")
    .select("id, property_id, balance_due")
    .eq("id", invoiceId)
    .eq("organization_id", context.organizationId)
    .single();
  if (invoiceError || !invoice) return fail("ไม่พบใบแจ้งหนี้");
  if (amount > Number(invoice.balance_due)) return fail("ยอดรับชำระมากกว่ายอดคงเหลือ");

  const { data: payment, error } = await context.supabase.from("rent_payments").insert({
    organization_id: context.organizationId,
    property_id: invoice.property_id,
    receipt_number: text(formData, "receiptNumber"),
    amount,
    method: text(formData, "method") || "transfer",
    reference: text(formData, "reference") || null,
  }).select("id").single();
  if (error || !payment) {
    logFailure(requestId, "payment.create", error);
    return { ...fail("บันทึกรับชำระไม่สำเร็จ เลขที่ใบเสร็จอาจซ้ำ"), requestId };
  }

  const { error: allocationError } = await context.supabase.from("rent_payment_allocations").insert({
    organization_id: context.organizationId,
    rent_payment_id: payment.id,
    rent_invoice_id: invoice.id,
    amount,
  });
  if (allocationError) {
    logFailure(requestId, "payment.allocate", allocationError);
    await context.supabase.from("rent_payments").delete().eq("id", payment.id).eq("organization_id", context.organizationId);
    return { ...fail("จัดสรรยอดชำระไม่สำเร็จ"), requestId };
  }

  const nextBalance = Number(invoice.balance_due) - amount;
  await context.supabase.from("rent_invoices").update({
    balance_due: nextBalance,
    status: nextBalance === 0 ? "paid" : "partial",
  }).eq("id", invoice.id).eq("organization_id", context.organizationId);
  await context.supabase.from("audit_logs").insert({ organization_id: context.organizationId, action: "payment.recorded", entity_type: "rent_payment", entity_id: payment.id });
  return success("บันทึกรับชำระเรียบร้อยแล้ว");
}

export async function updatePropertySettingsAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_settings", "update");
  if (!context.ok) return context.error;
  const propertyId = text(formData, "propertyId");
  if (!UUID_PATTERN.test(propertyId)) return fail("กรุณาเลือกหอพัก");

  const electricRate = numberValue(formData, "electricRate");
  const waterRate = numberValue(formData, "waterRate");
  const waterBillingMethod = text(formData, "waterBillingMethod");
  const billDay = numberValue(formData, "billDay");
  const dueDay = numberValue(formData, "dueDay");
  const lateFee = numberValue(formData, "lateFee");
  if ([electricRate, waterRate, lateFee].some((value) => !Number.isFinite(value) || value < 0)) return fail("อัตราค่าบริการไม่ถูกต้อง");
  if (!["meter", "per_person", "flat_room"].includes(waterBillingMethod)) return fail("วิธีคิดค่าน้ำไม่ถูกต้อง");
  if (![billDay, dueDay].every((value) => Number.isInteger(value) && value >= 1 && value <= 28)) return fail("วันออกบิลและวันครบกำหนดต้องอยู่ระหว่าง 1–28");

  const { error } = await context.supabase.from("property_settings").update({
    electric_rate: electricRate,
    water_rate: waterRate,
    water_billing_method: waterBillingMethod,
    bill_day: billDay,
    due_day: dueDay,
    late_fee: lateFee,
    promptpay_id: text(formData, "promptpayId") || null,
    account_name: text(formData, "accountName") || null,
    invoice_note: text(formData, "invoiceNote") || null,
  }).eq("property_id", propertyId).eq("organization_id", context.organizationId);
  if (error) {
    logFailure(requestId, "settings.update", error);
    return { ...fail("บันทึกการตั้งค่าไม่สำเร็จ"), requestId };
  }
  return success("บันทึกการตั้งค่าเรียบร้อยแล้ว");
}

export async function createTenantPortalAccountAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_tenants", "update");
  if (!context.ok) return context.error;
  const tenantId = text(formData, "tenantId"), username = normalizeUsername(text(formData, "username")), temporaryPassword = text(formData, "temporaryPassword");
  if (!UUID_PATTERN.test(tenantId)) return fail("ไม่พบผู้เช่าที่ต้องการเปิดบัญชี");
  if (!/^[a-z0-9][a-z0-9._-]{2,28}[a-z0-9]$/.test(username)) return fail("ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง 4–30 ตัว");
  if (temporaryPassword.length < 8) return fail("รหัสผ่านชั่วคราวต้องมีอย่างน้อย 8 ตัวอักษร");
  const { data: tenant } = await context.supabase.from("tenants").select("id, full_name, phone").eq("id", tenantId).eq("organization_id", context.organizationId).maybeSingle();
  if (!tenant) return fail("ไม่พบผู้เช่าในกิจการนี้");
  const admin = createAdminClient();
  const { data: existingAccount } = await admin.from("tenant_accounts").select("auth_user_id").eq("tenant_id", tenantId).maybeSingle();
  if (existingAccount) return fail("ผู้เช่ารายนี้มีบัญชี Tenant Portal แล้ว");
  const { data: existingAlias } = await admin.from("auth_login_aliases").select("auth_user_id").eq("username", username).maybeSingle();
  if (existingAlias) return fail("ชื่อผู้ใช้นี้ถูกใช้แล้ว กรุณาเลือกชื่ออื่น");
  const domain = process.env.AUTH_INTERNAL_EMAIL_DOMAIN?.trim().toLowerCase();
  if (!domain) return fail("ระบบบัญชียังตั้งค่าไม่ครบ");
  const internalEmail = `${crypto.randomUUID()}@${domain}`;
  const { data: created, error: createError } = await admin.auth.admin.createUser({ email: internalEmail, password: temporaryPassword, email_confirm: true, user_metadata: { username, display_name: tenant.full_name, account_type: "tenant" } });
  if (createError || !created.user) return fail("สร้างบัญชีผู้เช่าไม่สำเร็จ");
  const authUserId = created.user.id;
  const results = await Promise.all([
    admin.from("auth_login_aliases").insert({ username, auth_user_id: authUserId, internal_email: internalEmail }),
    admin.from("profiles").insert({ id: authUserId, username, display_name: tenant.full_name, phone: tenant.phone, must_change_password: true }),
    admin.from("tenant_accounts").insert({ tenant_id: tenantId, organization_id: context.organizationId, auth_user_id: authUserId, invited_by: context.userId }),
  ]);
  const setupError = results.find((result) => result.error)?.error;
  if (setupError) {
    logFailure(requestId, "tenant.portal_account_create", setupError);
    await admin.auth.admin.deleteUser(authUserId);
    return { ...fail("เปิดบัญชีผู้เช่าไม่สำเร็จ กรุณาลองใหม่"), requestId };
  }
  revalidatePath("/tenants");
  revalidatePath("/guestrooms");
  revalidatePath("/leases");
  return success("เปิดบัญชี Tenant Portal แล้ว กรุณาส่งชื่อผู้ใช้และรหัสผ่านชั่วคราวให้ผู้เช่า");
}

export async function updateTenantPortalAccountAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_tenants", "update");
  if (!context.ok) return context.error;
  const tenantId = text(formData, "tenantId");
  const username = normalizeUsername(text(formData, "username"));
  const newPassword = text(formData, "temporaryPassword");
  if (!UUID_PATTERN.test(tenantId)) return fail("ไม่พบบัญชีผู้เช่าที่ต้องการแก้ไข");
  if (!/^[a-z0-9][a-z0-9._-]{2,28}[a-z0-9]$/.test(username)) return fail("ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง 4–30 ตัว");
  if (newPassword && newPassword.length < 8) return fail("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");

  const admin = createAdminClient();
  const { data: account, error: accountError } = await admin
    .from("tenant_accounts")
    .select("auth_user_id")
    .eq("tenant_id", tenantId)
    .eq("organization_id", context.organizationId)
    .eq("status", "active")
    .maybeSingle();
  if (accountError || !account) return fail("ไม่พบบัญชี Tenant Portal ของผู้เช่ารายนี้");

  const { data: currentAlias, error: aliasError } = await admin
    .from("auth_login_aliases")
    .select("username")
    .eq("auth_user_id", account.auth_user_id)
    .maybeSingle();
  if (aliasError || !currentAlias) return fail("ไม่พบชื่อผู้ใช้ของบัญชีนี้");

  const { data: duplicateAlias } = await admin
    .from("auth_login_aliases")
    .select("auth_user_id")
    .eq("username", username)
    .neq("auth_user_id", account.auth_user_id)
    .maybeSingle();
  if (duplicateAlias) return fail("ชื่อผู้ใช้นี้ถูกใช้แล้ว กรุณาเลือกชื่ออื่น");
  if (currentAlias.username === username && !newPassword) return fail("ยังไม่มีข้อมูลที่เปลี่ยนแปลง");

  if (newPassword) {
    const { error: passwordError } = await admin.auth.admin.updateUserById(account.auth_user_id, { password: newPassword });
    if (passwordError) {
      logFailure(requestId, "tenant.portal_account_password_update", passwordError);
      return { ...fail("ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองอีกครั้ง"), requestId };
    }
  }

  const { error: usernameError } = await admin
    .from("auth_login_aliases")
    .update({ username })
    .eq("auth_user_id", account.auth_user_id);
  if (usernameError) {
    logFailure(requestId, "tenant.portal_account_username_update", usernameError);
    return { ...fail(newPassword ? "รหัสผ่านถูกเปลี่ยนแล้ว แต่เปลี่ยนชื่อผู้ใช้ไม่สำเร็จ กรุณาลองแก้ชื่อผู้ใช้อีกครั้ง" : "เปลี่ยนชื่อผู้ใช้ไม่สำเร็จ กรุณาลองอีกครั้ง"), requestId };
  }

  const profilePatch: { username: string; must_change_password?: boolean } = { username };
  if (newPassword) profilePatch.must_change_password = true;
  const { error: profileError } = await admin.from("profiles").update(profilePatch).eq("id", account.auth_user_id);
  if (profileError) {
    await admin.from("auth_login_aliases").update({ username: currentAlias.username }).eq("auth_user_id", account.auth_user_id);
    logFailure(requestId, "tenant.portal_account_profile_update", profileError);
    return { ...fail(newPassword ? "รหัสผ่านถูกเปลี่ยนแล้ว แต่บันทึกชื่อผู้ใช้ไม่ครบ กรุณาลองอีกครั้ง" : "บันทึกชื่อผู้ใช้ไม่สำเร็จ กรุณาลองอีกครั้ง"), requestId };
  }

  revalidatePath("/tenants");
  revalidatePath("/guestrooms");
  revalidatePath("/leases");
  return success(newPassword ? "แก้ไขชื่อผู้ใช้และตั้งรหัสผ่านใหม่แล้ว" : "แก้ไขชื่อผู้ใช้แล้ว");
}

export async function reviewPaymentSubmissionAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_payments", "update");
  if (!context.ok) return context.error;
  const submissionId = text(formData, "submissionId"), decision = text(formData, "decision");
  if (!UUID_PATTERN.test(submissionId) || !["approve", "reject"].includes(decision)) return fail("ไม่พบรายการหลักฐานที่ต้องการตรวจสอบ");
  if (decision === "approve") {
    const { error } = await context.supabase.rpc("approve_payment_submission", { target_submission_id: submissionId });
    if (error) { logFailure(requestId, "payment_submission.approve", error); return { ...fail("ยืนยันยอดไม่สำเร็จ ยอดคงเหลืออาจมีการเปลี่ยนแปลง"), requestId }; }
  } else {
    const reason = text(formData, "rejectionReason");
    if (reason.length < 3) return fail("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
    const { data, error } = await context.supabase.from("payment_submissions").update({ status: "rejected", rejection_reason: reason, reviewed_by: context.userId, reviewed_at: new Date().toISOString() }).eq("id", submissionId).eq("organization_id", context.organizationId).eq("status", "pending").select("id").maybeSingle();
    if (error || !data) return fail("รายการนี้อาจถูกตรวจสอบไปแล้ว กรุณาโหลดหน้าใหม่");
  }
  revalidatePath("/payments"); revalidatePath("/tenant"); revalidatePath("/tenant/bills");
  return success(decision === "approve" ? "ยืนยันยอดและตัดใบแจ้งหนี้แล้ว" : "ส่งรายการกลับให้ผู้เช่าแก้ไขแล้ว");
}

export async function updatePropertyAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_properties", "update");
  if (!context.ok) return context.error;
  const propertyId = text(formData, "propertyId"), name = text(formData, "name");
  const status = text(formData, "status") || "active";
  if (!UUID_PATTERN.test(propertyId)) return fail("ไม่พบหอพักที่ต้องการแก้ไข");
  if (!name || name.length > 160) return fail("กรุณากรอกชื่อหอพักไม่เกิน 160 ตัวอักษร");
  if (!["active", "inactive"].includes(status)) return fail("สถานะหอพักไม่ถูกต้อง");
  const { data, error } = await context.supabase.from("properties").update({
    name, address: text(formData, "address"), phone: text(formData, "phone") || null, status,
  }).eq("id", propertyId).eq("organization_id", context.organizationId).select("id").maybeSingle();
  if (error || !data) {
    logFailure(requestId, "property.update", error);
    return { ...fail("แก้ไขหอพักไม่สำเร็จ ชื่อหอพักอาจซ้ำ"), requestId };
  }
  return success("แก้ไขข้อมูลหอพักเรียบร้อยแล้ว");
}

export async function updateRoomAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_rooms", "update");
  if (!context.ok) return context.error;
  const roomId = text(formData, "roomId"), propertyId = text(formData, "propertyId");
  const roomNumber = text(formData, "roomNumber"), floor = text(formData, "floor");
  const baseRent = numberValue(formData, "baseRent"), status = text(formData, "status");
  if (![roomId, propertyId].every((value) => UUID_PATTERN.test(value))) return fail("ไม่พบห้องพักที่ต้องการแก้ไข");
  if (!roomNumber || roomNumber.length > 40) return fail("กรุณากรอกหมายเลขห้องไม่เกิน 40 ตัวอักษร");
  if (floor.length > 40) return fail("ชั้นต้องไม่เกิน 40 ตัวอักษร");
  if (!Number.isFinite(baseRent) || baseRent < 0) return fail("ค่าเช่าต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
  if (!["vacant", "occupied", "maintenance", "inactive"].includes(status)) return fail("สถานะห้องไม่ถูกต้อง");
  if (status === "vacant") {
    const { data: activeLease } = await context.supabase
      .from("leases")
      .select("lease_number")
      .eq("room_id", roomId)
      .eq("organization_id", context.organizationId)
      .eq("status", "active")
      .maybeSingle();
    if (activeLease) {
      return fail(`ไม่สามารถเปลี่ยนสถานะเป็นห้องว่างได้ เนื่องจากมีสัญญาเช่าที่ยังมีผลอยู่ (${activeLease.lease_number}) กรุณาสิ้นสุดหรือยกเลิกสัญญาเช่าก่อน`);
    }
  }
  const { data, error } = await context.supabase.from("rooms").update({
    property_id: propertyId, room_number: roomNumber, floor: floor || null, base_rent: baseRent, status,
  }).eq("id", roomId).eq("organization_id", context.organizationId).select("id").maybeSingle();
  if (error || !data) {
    logFailure(requestId, "room.update", error);
    return { ...fail("แก้ไขห้องไม่สำเร็จ หมายเลขห้องอาจซ้ำ"), requestId };
  }
  return success("แก้ไขข้อมูลห้องพักเรียบร้อยแล้ว");
}

export async function deletePropertyAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_properties", "delete");
  if (!context.ok) return context.error;
  const propertyId = text(formData, "propertyId");
  if (!UUID_PATTERN.test(propertyId)) return fail("ไม่พบหอพักที่ต้องการลบ");

  const { data, error } = await context.supabase.from("properties").delete()
    .eq("id", propertyId).eq("organization_id", context.organizationId).select("id").maybeSingle();
  if (error) {
    logFailure(requestId, "property.delete", error);
    if (error.code === "23503") return fail("ลบหอพักไม่ได้ เพราะมีสัญญา ใบแจ้งหนี้ การรับชำระ หรือประวัติมิเตอร์อยู่ กรุณาเปลี่ยนสถานะเป็นไม่ใช้งานแทน");
    return { ...fail("ลบหอพักไม่สำเร็จ กรุณาลองอีกครั้ง"), requestId };
  }
  if (!data) return fail("ไม่พบหอพัก หรือคุณไม่มีสิทธิ์ลบหอพักนี้");
  await context.supabase.from("audit_logs").insert({ organization_id: context.organizationId, action: "property.deleted", entity_type: "property", entity_id: propertyId });
  return success("ลบหอพักเรียบร้อยแล้ว");
}

export async function deleteRoomAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_rooms", "delete");
  if (!context.ok) return context.error;
  const roomId = text(formData, "roomId");
  if (!UUID_PATTERN.test(roomId)) return fail("ไม่พบห้องพักที่ต้องการลบ");

  const { data, error } = await context.supabase.from("rooms").delete()
    .eq("id", roomId).eq("organization_id", context.organizationId).select("id").maybeSingle();
  if (error) {
    logFailure(requestId, "room.delete", error);
    if (error.code === "23503") return fail("ลบห้องไม่ได้ เพราะมีสัญญา ใบแจ้งหนี้ หรือประวัติมิเตอร์อยู่ กรุณาเปลี่ยนสถานะเป็นไม่ใช้งานแทน");
    return { ...fail("ลบห้องพักไม่สำเร็จ กรุณาลองอีกครั้ง"), requestId };
  }
  if (!data) return fail("ไม่พบห้องพัก หรือคุณไม่มีสิทธิ์ลบห้องนี้");
  await context.supabase.from("audit_logs").insert({ organization_id: context.organizationId, action: "room.deleted", entity_type: "room", entity_id: roomId });
  return success("ลบห้องพักเรียบร้อยแล้ว");
}

export async function updateTenantAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_tenants", "update");
  if (!context.ok) return context.error;
  const tenantId = text(formData, "tenantId"), fullName = text(formData, "fullName");
  const idCardLast4 = text(formData, "idCardLast4"), status = text(formData, "status");
  if (!UUID_PATTERN.test(tenantId)) return fail("ไม่พบผู้เช่าที่ต้องการแก้ไข");
  if (fullName.length < 2 || fullName.length > 160) return fail("กรุณากรอกชื่อผู้เช่า 2–160 ตัวอักษร");
  if (idCardLast4 && !/^\d{4}$/.test(idCardLast4)) return fail("เลขบัตรประชาชนให้กรอกเฉพาะ 4 ตัวท้าย");
  if (!["active", "former", "blocked"].includes(status)) return fail("สถานะผู้เช่าไม่ถูกต้อง");
  const { data, error } = await context.supabase.from("tenants").update({
    full_name: fullName, phone: text(formData, "phone") || null, email: text(formData, "email") || null,
    id_card_last4: idCardLast4 || null, address: text(formData, "address") || null, status,
  }).eq("id", tenantId).eq("organization_id", context.organizationId).select("id").maybeSingle();
  if (error || !data) {
    logFailure(requestId, "tenant.update", error);
    return { ...fail("แก้ไขข้อมูลผู้เช่าไม่สำเร็จ"), requestId };
  }
  return success("แก้ไขข้อมูลผู้เช่าเรียบร้อยแล้ว");
}

export async function deleteTenantAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_tenants", "delete");
  if (!context.ok) return context.error;
  const tenantId = text(formData, "tenantId");
  if (!UUID_PATTERN.test(tenantId)) return fail("ไม่พบผู้เช่าที่ต้องการลบ");

  // Check if tenant has tenant_accounts
  const admin = createAdminClient();
  if (admin) {
    const { data: acc } = await admin.from("tenant_accounts").select("auth_user_id").eq("tenant_id", tenantId).maybeSingle();
    if (acc?.auth_user_id) {
      await admin.auth.admin.deleteUser(acc.auth_user_id);
    }
  }

  const { data, error } = await context.supabase.from("tenants").delete()
    .eq("id", tenantId).eq("organization_id", context.organizationId).select("id").maybeSingle();
  if (error) {
    logFailure(requestId, "tenant.delete", error);
    if (error.code === "23503") return fail("ลบผู้เช่าไม่ได้ เนื่องจากมีสัญญาเช่า ใบแจ้งหนี้ หรือประวัติการชำระเงินผูกอยู่ กรุณาเปลี่ยนสถานะเป็น 'ผู้เช่าเดิม' หรือ 'ระงับ' แทน");
    return { ...fail("ลบผู้เช่าไม่สำเร็จ กรุณาลองอีกครั้ง"), requestId };
  }
  if (!data) return fail("ไม่พบผู้เช่า หรือคุณไม่มีสิทธิ์ลบผู้เช่านี้");
  await context.supabase.from("audit_logs").insert({ organization_id: context.organizationId, action: "tenant.deleted", entity_type: "tenant", entity_id: tenantId });
  return success("ลบข้อมูลผู้เช่าเรียบร้อยแล้ว");
}

export async function updateLeaseAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_leases", "update");
  if (!context.ok) return context.error;
  const leaseId = text(formData, "leaseId"), leaseNumber = text(formData, "leaseNumber");
  const startDate = text(formData, "startDate"), endDate = text(formData, "endDate");
  const rentAmount = numberValue(formData, "rentAmount"), depositAmount = numberValue(formData, "depositAmount");
  const advanceAmount = numberValue(formData, "advanceAmount"), status = text(formData, "status");
  const occupantCount = numberValue(formData, "occupantCount");
  if (!UUID_PATTERN.test(leaseId)) return fail("ไม่พบสัญญาที่ต้องการแก้ไข");
  if (!leaseNumber || !startDate || (endDate && endDate < startDate)) return fail("กรุณาตรวจเลขที่สัญญาและช่วงวันที่");
  if (![rentAmount, depositAmount, advanceAmount].every((value) => Number.isFinite(value) && value >= 0)) return fail("จำนวนเงินในสัญญาไม่ถูกต้อง");
  if (!Number.isInteger(occupantCount) || occupantCount < 1 || occupantCount > 50) return fail("จำนวนผู้พักต้องอยู่ระหว่าง 1–50 คน");
  if (!["draft", "active", "ended", "cancelled"].includes(status)) return fail("สถานะสัญญาไม่ถูกต้อง");
  const { data, error } = await context.supabase.from("leases").update({
    lease_number: leaseNumber, start_date: startDate, end_date: endDate || null, rent_amount: rentAmount,
    deposit_amount: depositAmount, advance_amount: advanceAmount, terms: text(formData, "terms") || null, status,
    occupant_count: occupantCount,
  }).eq("id", leaseId).eq("organization_id", context.organizationId).select("id, room_id").maybeSingle();
  if (error || !data) {
    logFailure(requestId, "lease.update", error);
    return { ...fail("แก้ไขสัญญาไม่สำเร็จ เลขที่สัญญาอาจซ้ำ"), requestId };
  }
  if (data.room_id) {
    if (status === "active") {
      await context.supabase.from("rooms").update({ status: "occupied" }).eq("id", data.room_id).eq("organization_id", context.organizationId);
    } else if (["ended", "cancelled"].includes(status)) {
      const { data: otherActive } = await context.supabase
        .from("leases")
        .select("id")
        .eq("room_id", data.room_id)
        .eq("organization_id", context.organizationId)
        .eq("status", "active")
        .neq("id", leaseId)
        .maybeSingle();
      if (!otherActive) {
        await context.supabase.from("rooms").update({ status: "vacant" }).eq("id", data.room_id).eq("organization_id", context.organizationId);
      }
    }
  }
  return success("แก้ไขสัญญาเช่าเรียบร้อยแล้ว");
}

export async function updateInvoiceAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_invoices", "update");
  if (!context.ok) return context.error;
  const invoiceId = text(formData, "invoiceId"), invoiceNumber = text(formData, "invoiceNumber"), dueAt = text(formData, "dueAt");
  if (!UUID_PATTERN.test(invoiceId)) return fail("ไม่พบใบแจ้งหนี้ที่ต้องการแก้ไข");
  if (!invoiceNumber || !dueAt) return fail("กรุณากรอกเลขที่เอกสารและวันครบกำหนด");
  const { data, error } = await context.supabase.from("rent_invoices").update({
    invoice_number: invoiceNumber, due_at: dueAt, note: text(formData, "note") || null,
  }).eq("id", invoiceId).eq("organization_id", context.organizationId).in("status", ["draft", "issued", "partial"]).select("id").maybeSingle();
  if (error || !data) {
    logFailure(requestId, "invoice.update", error);
    return { ...fail("แก้ไขใบแจ้งหนี้ไม่สำเร็จ เอกสารอาจชำระแล้วหรือเลขที่ซ้ำ"), requestId };
  }
  return success("แก้ไขใบแจ้งหนี้เรียบร้อยแล้ว");
}

export async function createOrganizationMemberAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_users", "create");
  if (!context.ok) return context.error;

  const fullName = text(formData, "fullName");
  const usernameOrEmail = text(formData, "username").trim();
  const password = text(formData, "password");
  const roleCode = text(formData, "roleCode");

  if (fullName.length < 2 || fullName.length > 160) return fail("กรุณากรอกชื่อ-นามสกุล 2-160 ตัวอักษร");
  if (!usernameOrEmail) return fail("กรุณากรอกชื่อผู้ใช้หรืออีเมล");
  if (password.length < 6) return fail("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
  if (!["manager", "accounting", "staff"].includes(roleCode)) return fail("ระดับสิทธิ์ไม่ถูกต้อง");

  const plan = getPlanByQuota(context.subscription.max_properties, context.subscription.max_rooms);
  if (plan.maxUsers > 0) {
    const { count: currentMemberCount } = await context.supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organizationId)
      .eq("status", "active");

    if (typeof currentMemberCount === "number" && currentMemberCount >= plan.maxUsers) {
      return fail(
        `แพ็กเกจของคุณ (${plan.name}) จำกัดผู้ใช้งานที่ ${plan.maxUsers} คน (ปัจจุบันมีแล้ว ${currentMemberCount} คน) กรุณาอัปเกรดแพ็กเกจเพื่อเพิ่มผู้ใช้งาน`
      );
    }
  }

  const admin = createAdminClient();
  const normalizedUser = usernameOrEmail.toLowerCase();
  const isEmail = normalizedUser.includes("@");

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, username")
    .or(`username.eq.${normalizedUser}`)
    .maybeSingle();

  let authUserId: string;

  if (existingProfile) {
    authUserId = existingProfile.id;
    const { data: existingMember } = await admin
      .from("organization_members")
      .select("id")
      .eq("organization_id", context.organizationId)
      .eq("user_id", authUserId)
      .maybeSingle();

    if (existingMember) return fail("ผู้ใช้งานนี้เป็นสมาชิกในกิจการนี้อยู่แล้ว");
  } else {
    const domain = process.env.AUTH_INTERNAL_EMAIL_DOMAIN?.trim().toLowerCase() || "longtua.internal";
    const emailToUse = isEmail ? normalizedUser : `${crypto.randomUUID()}@${domain}`;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: emailToUse,
      password,
      email_confirm: true,
      user_metadata: {
        username: normalizedUser,
        display_name: fullName,
      },
    });

    if (createError || !created.user) {
      logFailure(requestId, "user.create", createError);
      return fail(createError?.message || "ไม่สามารถสร้างบัญชีผู้ใช้งานได้");
    }

    authUserId = created.user.id;

    await admin.from("profiles").upsert({
      id: authUserId,
      username: normalizedUser,
      display_name: fullName,
      status: "active",
    });

    if (!isEmail) {
      await admin.from("auth_login_aliases").upsert({
        username: normalizedUser,
        auth_user_id: authUserId,
        internal_email: emailToUse,
      });
    }
  }

  const { error: memberError } = await admin.from("organization_members").insert({
    organization_id: context.organizationId,
    user_id: authUserId,
    role_code: roleCode,
    status: "active",
  });

  if (memberError) {
    logFailure(requestId, "organization_members.insert", memberError);
    return fail("เพิ่มผู้ใช้เข้าสู่กิจการไม่สำเร็จ");
  }

  revalidatePath("/users");
  return success(`เพิ่มผู้ใช้งาน "${fullName}" เรียบร้อยแล้ว`);
}

export async function updateOrganizationMemberAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_users", "update");
  if (!context.ok) return context.error;

  const memberId = text(formData, "memberId");
  const roleCode = text(formData, "roleCode");
  const newPassword = text(formData, "newPassword");

  if (!UUID_PATTERN.test(memberId)) return fail("ไม่พบผู้ใช้งานที่ต้องการแก้ไข");
  if (!["manager", "accounting", "staff"].includes(roleCode)) return fail("ระดับสิทธิ์ไม่ถูกต้อง");

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("organization_members")
    .select("user_id, role_code")
    .eq("user_id", memberId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (!member) return fail("ไม่พบผู้ใช้งานในกิจการนี้");
  if (member.role_code === "owner") return fail("ไม่สามารถเปลี่ยนระดับสิทธิ์ของเจ้าของกิจการได้");

  await admin
    .from("organization_members")
    .update({ role_code: roleCode })
    .eq("user_id", memberId)
    .eq("organization_id", context.organizationId);

  if (newPassword && newPassword.length >= 6) {
    await admin.auth.admin.updateUserById(member.user_id, { password: newPassword });
  }

  revalidatePath("/users");
  return success("อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว");
}

export async function deleteOrganizationMemberAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_users", "delete");
  if (!context.ok) return context.error;

  const memberId = text(formData, "memberId");
  if (!UUID_PATTERN.test(memberId)) return fail("ไม่พบผู้ใช้งานที่ต้องการลบ");

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("organization_members")
    .select("user_id, role_code")
    .eq("user_id", memberId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (!member) return fail("ไม่พบผู้ใช้งานในกิจการนี้");
  if (member.role_code === "owner") return fail("ไม่สามารถลบเจ้าของกิจการได้");

  const { error } = await admin
    .from("organization_members")
    .delete()
    .eq("user_id", memberId)
    .eq("organization_id", context.organizationId);

  if (error) {
    logFailure(requestId, "organization_members.delete", error);
    return fail("ลบผู้ใช้งานไม่สำเร็จ");
  }

  revalidatePath("/users");
  return success("ลบผู้ใช้งานออกจากกิจการเรียบร้อยแล้ว");
}

