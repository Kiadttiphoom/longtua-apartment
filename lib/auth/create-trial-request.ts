import "server-only";
import { scheduleMonitorEvent } from "@/lib/monitor/events";
import { getRegistrationCapacity, REGISTRATION_CAPACITY_MESSAGE } from "@/lib/auth/registration-capacity";
import { NextResponse } from "next/server";
import { isRegistrationEnabled } from "@/lib/auth/system-admin";
import { normalizePhone, normalizeUsername, validateTrialRequestInput } from "@/lib/auth/validation.mjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export type TrialRequestBody = {
  username?: unknown;
  operatorName?: unknown;
  propertyName?: unknown;
  contactEmail?: unknown;
  phone?: unknown;
  requestedRoomCount?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  accepted?: unknown;
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function createTrialRequest(body: TrialRequestBody, origin = "") {
  const requestId = crypto.randomUUID();
  const username = normalizeUsername(body.username);
  const operatorName = stringValue(body.operatorName).trim();
  const propertyName = stringValue(body.propertyName).trim();
  const contactEmail = stringValue(body.contactEmail).trim().toLowerCase();
  const phone = stringValue(body.phone);
  const requestedRoomCount = 10;
  const password = stringValue(body.password);
  const confirmPassword = stringValue(body.confirmPassword);
  const fields = validateTrialRequestInput({
    username,
    operatorName,
    propertyName,
    contactEmail,
    phone,
    requestedRoomCount,
    password,
    confirmPassword,
    accepted: body.accepted === true,
  }) as unknown as Record<string, string>;

  if (Object.keys(fields).length) {
    return json({ error: "validation_failed", message: "กรุณาตรวจสอบข้อมูลที่กรอก", fields }, 422);
  }

  try {
    getSupabasePublicConfig();
    const registration = await isRegistrationEnabled();
    if (!registration.configured || !registration.enabled) {
      return json({ error: "registration_closed", message: "ขณะนี้ระบบปิดรับคำขอทดลองใช้" }, 403);
    }

    const admin = createAdminClient();
    const capacity = await getRegistrationCapacity();
    if (capacity.full) {
      return json({ error: "registration_full", message: REGISTRATION_CAPACITY_MESSAGE }, 403);
    }
    const normalizedPhone = normalizePhone(phone)!;
    const [aliasResult, emailResult, phoneResult] = await Promise.all([
      admin.from("auth_login_aliases").select("auth_user_id").eq("username", username).maybeSingle(),
      admin.from("trial_requests").select("id").eq("contact_email", contactEmail).maybeSingle(),
      admin.from("trial_requests").select("id").eq("normalized_phone", normalizedPhone).maybeSingle(),
    ]);
    if ([aliasResult, emailResult, phoneResult].some((result) => result.error)) {
      throw aliasResult.error ?? emailResult.error ?? phoneResult.error;
    }

    const duplicateFields: Record<string, string> = {};
    if (aliasResult.data) duplicateFields.username = "ชื่อผู้ใช้นี้ถูกใช้แล้ว";
    if (emailResult.data) duplicateFields.contactEmail = "อีเมลนี้เคยส่งคำขอทดลองใช้แล้ว";
    if (phoneResult.data) duplicateFields.phone = "เบอร์โทรนี้เคยส่งคำขอทดลองใช้แล้ว";
    if (Object.keys(duplicateFields).length) {
      return json({ error: "duplicate_request", message: "พบข้อมูลที่เคยลงทะเบียนแล้ว", fields: duplicateFields }, 409);
    }

    const domain = process.env.AUTH_INTERNAL_EMAIL_DOMAIN?.trim().toLowerCase();
    if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
      throw new Error("AUTH_INTERNAL_EMAIL_DOMAIN is not configured");
    }

    const internalEmail = `${crypto.randomUUID()}@${domain}`;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: operatorName },
    });
    if (createError || !created.user) throw createError ?? new Error("Auth user was not returned");

    const authUserId = created.user.id;
    const { data: trialRequestId, error: requestError } = await admin.rpc("create_trial_request", {
      new_auth_user_id: authUserId,
      new_username: username,
      new_internal_email: internalEmail,
      new_operator_name: operatorName,
      new_property_name: propertyName,
      new_contact_email: contactEmail,
      new_phone: normalizedPhone,
      new_requested_room_count: requestedRoomCount,
    });

    if (requestError || !trialRequestId) {
      await admin.auth.admin.deleteUser(authUserId);
      if (requestError?.message === "registration_organization_limit_reached") {
        return json({ error: "registration_full", message: REGISTRATION_CAPACITY_MESSAGE }, 403);
      }
      if (requestError?.code === "23505") {
        return json({ error: "duplicate_request", message: "พบข้อมูลที่เคยลงทะเบียนแล้ว" }, 409);
      }
      throw requestError ?? new Error("Trial request was not returned");
    }

    const appUrl = process.env.APARTMENT_APP_URL?.trim().replace(/\/$/, "") || origin;
    return json({
      requestId: trialRequestId,
      status: "pending",
      message: "ส่งคำขอทดลองใช้แล้ว กรุณาเข้าสู่ระบบเพื่อตรวจสอบสถานะ",
      loginUrl: `${appUrl}/login`,
    }, 201);
  } catch (error) {
    scheduleMonitorEvent("registration.create", "error", requestId, error);
    const details = error && typeof error === "object" ? error as { code?: string; message?: string } : {};
    console.error(`[trial] ${JSON.stringify({ requestId, stage: "public_request.create", code: details.code, message: details.message ?? "Unexpected trial request error" })}`);
    return json({ error: "request_failed", message: "ส่งคำขอทดลองใช้ไม่สำเร็จ กรุณาลองอีกครั้ง", requestId }, 500);
  }
}
