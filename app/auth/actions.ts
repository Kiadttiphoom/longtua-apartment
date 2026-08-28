"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { isRegistrationEnabled, isSystemAdmin } from "@/lib/auth/system-admin";
import {
  normalizePhone,
  normalizeUsername,
  validateLoginInput,
  validateRegistrationInput,
} from "@/lib/auth/validation.mjs";

type FieldErrors = Record<string, string>;

export type AuthActionState = {
  status: "idle" | "error";
  error?: {
    code: string;
    message: string;
    requestId: string;
    retryable: boolean;
    fields?: FieldErrors;
  };
  values?: {
    username?: string;
    displayName?: string;
    organizationName?: string;
    phone?: string;
  };
};

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function errorState(
  requestId: string,
  code: string,
  message: string,
  options?: { retryable?: boolean; fields?: FieldErrors; values?: AuthActionState["values"] },
): AuthActionState {
  return {
    status: "error",
    error: {
      code,
      message,
      requestId,
      retryable: options?.retryable ?? false,
      fields: options?.fields,
    },
    values: options?.values,
  };
}

function logAuthFailure(requestId: string, stage: string, error: unknown) {
  const details = error && typeof error === "object"
    ? error as { code?: unknown; message?: unknown }
    : {};

  console.error(`[auth] ${JSON.stringify({
    requestId,
    stage,
    code: typeof details.code === "string" ? details.code : undefined,
    message: typeof details.message === "string" ? details.message : "Unexpected authentication error",
  })}`);
}

function isInvalidCredentialsError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const details = error as { code?: unknown; message?: unknown; status?: unknown };
  return details.code === "invalid_credentials"
    || details.status === 400 && typeof details.message === "string" && /invalid login credentials/i.test(details.message);
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const requestId = crypto.randomUUID();
  const username = normalizeUsername(textValue(formData, "username"));
  const password = textValue(formData, "password");
  const fields = validateLoginInput({ username, password }) as unknown as FieldErrors;

  if (Object.keys(fields).length > 0) {
    return errorState(requestId, "validation_failed", "กรุณาตรวจสอบข้อมูลที่กรอก", {
      fields,
      values: { username },
    });
  }

  let authUserId: string | undefined;
  try {
    getSupabasePublicConfig();
    const admin = createAdminClient();
    const { data: alias, error: aliasError } = await admin
      .from("auth_login_aliases")
      .select("internal_email, auth_user_id")
      .eq("username", username)
      .maybeSingle();

    if (aliasError) {
      logAuthFailure(requestId, "login.username_lookup", aliasError);
      return errorState(requestId, "login_failed", "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน", { retryable: true });
    }
    if (!alias) {
      return errorState(requestId, "invalid_credentials", "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
    authUserId = alias.auth_user_id;

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("status")
      .eq("id", authUserId)
      .maybeSingle();
    if (profileError) {
      logAuthFailure(requestId, "login.profile_status", profileError);
      return errorState(requestId, "login_failed", "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน", { retryable: true });
    }
    if (!profile || profile.status !== "active") {
      return errorState(requestId, "account_suspended", "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: alias.internal_email,
      password,
    });

    if (error) {
      if (!isInvalidCredentialsError(error)) logAuthFailure(requestId, "login.password_signin", error);
      return errorState(requestId, "invalid_credentials", "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
  } catch (error) {
    logAuthFailure(requestId, "login.unexpected", error);
    return errorState(requestId, "login_failed", "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน", { retryable: true });
  }

  redirect(authUserId && await isSystemAdmin(authUserId) ? "/admin" : "/dashboard");
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const requestId = crypto.randomUUID();
  const username = normalizeUsername(textValue(formData, "username"));
  const displayName = textValue(formData, "displayName").trim();
  const organizationName = textValue(formData, "organizationName").trim();
  const phoneInput = textValue(formData, "phone");
  const password = textValue(formData, "password");
  const confirmPassword = textValue(formData, "confirmPassword");
  const accepted = formData.get("accepted") === "on";
  const values = { username, displayName, organizationName, phone: phoneInput };
  const fields = validateRegistrationInput({
    username,
    displayName,
    organizationName,
    phone: phoneInput,
    password,
    confirmPassword,
    accepted,
  }) as unknown as FieldErrors;

  if (Object.keys(fields).length > 0) {
    return errorState(requestId, "validation_failed", "กรุณาตรวจสอบข้อมูลที่กรอก", { fields, values });
  }

  let authUserId: string | undefined;
  let internalEmail = "";

  try {
    getSupabasePublicConfig();
    const registration = await isRegistrationEnabled();
    if (!registration.configured) {
      return errorState(requestId, "registration_unavailable", "ระบบสมัครสมาชิกยังตั้งค่าไม่ครบ", { retryable: true, values });
    }
    if (!registration.enabled) {
      return errorState(requestId, "registration_closed", "ขณะนี้ระบบปิดรับสมัครสมาชิกใหม่", { values });
    }
    const admin = createAdminClient();
    const { data: existing, error: existingError } = await admin
      .from("auth_login_aliases")
      .select("auth_user_id")
      .eq("username", username)
      .maybeSingle();

    if (existingError) {
      logAuthFailure(requestId, "register.username_lookup", existingError);
      return errorState(requestId, "registration_unavailable", "ระบบสมัครสมาชิกไม่พร้อมใช้งานชั่วคราว", { retryable: true, values });
    }
    if (existing) {
      return errorState(requestId, "username_taken", "ชื่อผู้ใช้นี้ถูกใช้แล้ว", {
        fields: { username: "กรุณาเลือกชื่อผู้ใช้อื่น" },
        values,
      });
    }

    const domain = process.env.AUTH_INTERNAL_EMAIL_DOMAIN?.trim().toLowerCase();
    if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
      return errorState(requestId, "registration_unavailable", "ระบบสมัครสมาชิกยังตั้งค่าไม่ครบ", { values });
    }

    internalEmail = `${crypto.randomUUID()}@${domain}`;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: displayName },
    });

    if (createError || !created.user) {
      logAuthFailure(requestId, "register.create_auth_user", createError ?? new Error("Auth user was not returned"));
      return errorState(requestId, "registration_failed", "ไม่สามารถสร้างบัญชีได้ กรุณาลองอีกครั้ง", { retryable: true, values });
    }
    authUserId = created.user.id;

    const organizationSlug = `org-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
    const { error: setupError } = await admin.rpc("complete_owner_signup", {
      new_auth_user_id: authUserId,
      new_username: username,
      new_internal_email: internalEmail,
      new_display_name: displayName,
      new_phone: normalizePhone(phoneInput) ?? "",
      new_organization_name: organizationName,
      new_organization_slug: organizationSlug,
    });

    if (setupError) {
      logAuthFailure(requestId, "register.complete_owner_signup", setupError);
      await admin.auth.admin.deleteUser(authUserId);
      if (setupError.code === "23505") {
        return errorState(requestId, "username_taken", "ชื่อผู้ใช้นี้ถูกใช้แล้ว", {
          fields: { username: "กรุณาเลือกชื่อผู้ใช้อื่น" },
          values,
        });
      }
      return errorState(requestId, "registration_failed", "สร้างบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง", { retryable: true, values });
    }

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: internalEmail, password });
    if (signInError) {
      logAuthFailure(requestId, "register.initial_signin", signInError);
      return errorState(requestId, "signin_required", "สร้างบัญชีแล้ว กรุณาเข้าสู่ระบบอีกครั้ง", { values: { username } });
    }
  } catch (error) {
    logAuthFailure(requestId, "register.unexpected", error);
    if (authUserId) {
      try {
        const admin = createAdminClient();
        await admin.auth.admin.deleteUser(authUserId);
      } catch {
        // Preserve the original error response; orphan cleanup is safe to retry operationally.
      }
    }
    return errorState(requestId, "registration_unavailable", "ระบบสมัครสมาชิกไม่พร้อมใช้งานชั่วคราว", { retryable: true, values });
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
