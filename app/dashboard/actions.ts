"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasOrganizationPermission, type MenuActionCode } from "@/lib/auth/organization-access";

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
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; organizationId: string; userId: string };

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
      .select("status, access_until, grace_ends_at")
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
  return { ok: true, supabase, organizationId, userId };
}

function success(message: string): DashboardActionResult {
  revalidatePath("/dashboard");
  return { ok: true, message };
}

export async function createPropertyAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_properties", "create");
  if (!context.ok) return context.error;

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
    return { ...fail("เพิ่มหอพักไม่สำเร็จ"), requestId };
  }
  return success("เพิ่มหอพักเรียบร้อยแล้ว");
}

export async function createRoomAction(formData: FormData): Promise<DashboardActionResult> {
  const requestId = crypto.randomUUID();
  const context = await actionContext(formData, "customer_rooms", "create");
  if (!context.ok) return context.error;

  const propertyId = text(formData, "propertyId");
  const roomNumber = text(formData, "roomNumber");
  const baseRent = numberValue(formData, "baseRent");
  if (!UUID_PATTERN.test(propertyId)) return fail("กรุณาเลือกหอพัก");
  if (!roomNumber || roomNumber.length > 40) return fail("กรุณากรอกหมายเลขห้อง");
  if (!Number.isFinite(baseRent) || baseRent < 0) return fail("ค่าเช่าต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");

  const { data: room, error } = await context.supabase
    .from("rooms")
    .insert({
      organization_id: context.organizationId,
      property_id: propertyId,
      room_number: roomNumber,
      floor: text(formData, "floor") || null,
      base_rent: baseRent,
    })
    .select("id")
    .single();

  if (error || !room) {
    logFailure(requestId, "room.create", error);
    return { ...fail("เพิ่มห้องไม่สำเร็จ หมายเลขห้องอาจซ้ำ"), requestId };
  }

  const { error: meterError } = await context.supabase.from("meters").insert([
    { organization_id: context.organizationId, property_id: propertyId, room_id: room.id, meter_type: "electric" },
    { organization_id: context.organizationId, property_id: propertyId, room_id: room.id, meter_type: "water" },
  ]);
  if (meterError) logFailure(requestId, "room.create_default_meters", meterError);

  await context.supabase.from("audit_logs").insert({
    organization_id: context.organizationId,
    action: "room.created",
    entity_type: "room",
    entity_id: room.id,
  });
  return success("เพิ่มห้องพักเรียบร้อยแล้ว");
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
  if (![propertyId, roomId, tenantId].every((id) => UUID_PATTERN.test(id))) return fail("กรุณาเลือกหอ ห้อง และผู้เช่าให้ครบ");
  if (!leaseNumber || !startDate) return fail("กรุณากรอกเลขที่สัญญาและวันเริ่มสัญญา");
  if (!Number.isFinite(rentAmount) || rentAmount < 0) return fail("ค่าเช่าไม่ถูกต้อง");

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

  const propertyId = text(formData, "propertyId");
  const roomId = text(formData, "roomId");
  const leaseId = text(formData, "leaseId");
  const total = numberValue(formData, "total");
  const invoiceNumber = text(formData, "invoiceNumber");
  const dueAt = text(formData, "dueAt");
  if (![propertyId, roomId].every((id) => UUID_PATTERN.test(id))) return fail("กรุณาเลือกหอและห้อง");
  if (!invoiceNumber || !dueAt || !Number.isFinite(total) || total < 0) return fail("กรุณากรอกข้อมูลใบแจ้งหนี้ให้ครบ");

  const { data: invoice, error } = await context.supabase.from("rent_invoices").insert({
    organization_id: context.organizationId,
    property_id: propertyId,
    room_id: roomId,
    lease_id: UUID_PATTERN.test(leaseId) ? leaseId : null,
    invoice_number: invoiceNumber,
    due_at: dueAt,
    subtotal: total,
    total,
    balance_due: total,
    status: "issued",
    note: text(formData, "note") || null,
  }).select("id").single();

  if (error || !invoice) {
    logFailure(requestId, "invoice.create", error);
    return { ...fail("ออกใบแจ้งหนี้ไม่สำเร็จ เลขที่เอกสารอาจซ้ำ"), requestId };
  }

  const { error: itemError } = await context.supabase.from("rent_invoice_items").insert({
    organization_id: context.organizationId,
    rent_invoice_id: invoice.id,
    item_type: "rent",
    description: text(formData, "description") || "ค่าเช่าห้องพัก",
    quantity: 1,
    unit_price: total,
    amount: total,
  });
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
  const previousValue = numberValue(formData, "previousValue");
  const currentValue = numberValue(formData, "currentValue");
  if (![propertyId, roomId].every((id) => UUID_PATTERN.test(id))) return fail("กรุณาเลือกหอและห้อง");
  if (!["electric", "water"].includes(meterType)) return fail("ประเภทมิเตอร์ไม่ถูกต้อง");
  if (!/^\d{4}-\d{2}$/.test(periodMonth)) return fail("กรุณาเลือกรอบเดือน");
  if (![previousValue, currentValue].every(Number.isFinite) || previousValue < 0 || currentValue < previousValue) {
    return fail("เลขมิเตอร์ใหม่ต้องไม่น้อยกว่าเลขครั้งก่อน");
  }

  const { data: meter, error: meterError } = await context.supabase
    .from("meters")
    .select("id")
    .eq("organization_id", context.organizationId)
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
  const billDay = numberValue(formData, "billDay");
  const dueDay = numberValue(formData, "dueDay");
  const lateFee = numberValue(formData, "lateFee");
  if ([electricRate, waterRate, lateFee].some((value) => !Number.isFinite(value) || value < 0)) return fail("อัตราค่าบริการไม่ถูกต้อง");
  if (![billDay, dueDay].every((value) => Number.isInteger(value) && value >= 1 && value <= 28)) return fail("วันออกบิลและวันครบกำหนดต้องอยู่ระหว่าง 1–28");

  const { error } = await context.supabase.from("property_settings").update({
    electric_rate: electricRate,
    water_rate: waterRate,
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
