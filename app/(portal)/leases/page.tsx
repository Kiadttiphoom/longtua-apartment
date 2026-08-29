import { LeasesPage } from "@/components/portal/LeasesPage";
import { loadPortalData } from "@/lib/portal/data";
import { can, requirePortalContext } from "@/lib/portal/context";
import { loadTenantPortalAccountSummaries } from "@/lib/portal/tenant-accounts";

export default async function Page() {
  const [context, data] = await Promise.all([requirePortalContext(), loadPortalData()]);
  const portalAccounts = await loadTenantPortalAccountSummaries(context.organization.id);
  return <LeasesPage
    organizationId={context.organization.id}
    leases={data.leases}
    properties={data.properties}
    rooms={data.rooms}
    tenants={data.tenants}
    portalAccounts={portalAccounts}
    canCreate={can(context, "customer_leases", "create")}
    canEdit={can(context, "customer_leases", "update")}
    canManageTenantPortal={can(context, "customer_tenants", "update")}
  />;
}
