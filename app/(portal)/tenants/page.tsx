import { TenantsPage } from "@/components/portal/TenantsPage";
import { loadPortalData } from "@/lib/portal/data";
import { can, requirePortalContext } from "@/lib/portal/context";
import { loadTenantPortalAccountSummaries } from "@/lib/portal/tenant-accounts";

export default async function Page() {
  const [context, data] = await Promise.all([requirePortalContext(), loadPortalData()]);
  const accounts = await loadTenantPortalAccountSummaries(context.organization.id);
  return (
    <TenantsPage
      canCreate={can(context, "customer_tenants", "create")}
      canDelete={can(context, "customer_tenants", "delete")}
      canEdit={can(context, "customer_tenants", "update")}
      items={data.tenants}
      leases={data.leases}
      organizationId={context.organization.id}
      portalAccounts={accounts}
    />
  );
}
