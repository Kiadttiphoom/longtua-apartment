import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function isSystemAdmin(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("system_admins")
    .select("user_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error(`[admin] ${JSON.stringify({ stage: "system_admin.lookup", userId, code: error.code, message: error.message })}`);
    return false;
  }
  return Boolean(data);
}

export async function isRegistrationEnabled() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("system_settings")
    .select("value")
    .eq("key", "registration_enabled")
    .maybeSingle();

  if (error) {
    console.error(`[admin] ${JSON.stringify({ stage: "registration_setting.read", code: error.code, message: error.message })}`);
    return { enabled: false, configured: false };
  }
  return { enabled: data?.value === true, configured: Boolean(data) };
}
