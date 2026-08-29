import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function isTenantUser(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("tenant_accounts").select("tenant_id").eq("auth_user_id", userId).eq("status", "active").maybeSingle();
  return !error && Boolean(data);
}

export const requireTenantContext = cache(async () => {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (authError || !userId) redirect("/login");

  const { data: account, error } = await supabase
    .from("tenant_accounts")
    .select("tenant_id, organization_id, status")
    .eq("auth_user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error || !account) redirect("/dashboard");
  return { supabase, userId, tenantId: account.tenant_id, organizationId: account.organization_id };
});
