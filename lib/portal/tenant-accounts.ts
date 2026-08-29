import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type TenantPortalAccountSummary = {
  tenantId: string;
  authUserId: string;
  username: string;
};

export async function loadTenantPortalAccountSummaries(organizationId: string): Promise<TenantPortalAccountSummary[]> {
  const supabase = await createClient();
  const { data: accounts, error } = await supabase
    .from("tenant_accounts")
    .select("tenant_id, auth_user_id")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (error || !accounts?.length) return [];

  const admin = createAdminClient();
  const { data: aliases } = await admin
    .from("auth_login_aliases")
    .select("auth_user_id, username")
    .in("auth_user_id", accounts.map((account) => account.auth_user_id));
  const usernameByUserId = new Map((aliases ?? []).map((alias) => [alias.auth_user_id, alias.username]));

  return accounts.map((account) => ({
    tenantId: account.tenant_id,
    authUserId: account.auth_user_id,
    username: usernameByUserId.get(account.auth_user_id) ?? "",
  }));
}
