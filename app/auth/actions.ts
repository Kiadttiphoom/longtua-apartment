"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { isSystemAdmin } from "@/lib/auth/system-admin";
import { isTenantUser } from "@/lib/auth/tenant-access";
import {
  normalizeUsername,
  validateLoginInput,
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
  let profileStatus: string | undefined;
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
      if (profile?.status !== "pending") {
        return errorState(requestId, "account_suspended", "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
      }
    }
    profileStatus = profile.status;

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

  if (profileStatus === "pending") redirect("/registration/pending");
  if (authUserId && await isSystemAdmin(authUserId)) redirect("/admin");
  if (authUserId && await isTenantUser(authUserId)) redirect("/tenant");
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
