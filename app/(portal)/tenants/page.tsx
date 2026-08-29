import { TenantsPage } from "@/components/portal/TenantsPage";
import { loadPortalData } from "@/lib/portal/data";
import { can, requirePortalContext } from "@/lib/portal/context";
import { loadTenantPortalAccountSummaries } from "@/lib/portal/tenant-accounts";

export default async function Page() {
  const [context, data] = await Promise.all([requirePortalContext(), loadPortalData()]);
  const accounts = await loadTenantPortalAccountSummaries(context.organization.id);
  return <TenantsPage organizationId={context.organization.id} items={data.tenants} portalAccounts={accounts} canCreate={can(context, "customer_tenants", "create")} canEdit={can(context, "customer_tenants", "update")} />;
}
