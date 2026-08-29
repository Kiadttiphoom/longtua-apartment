import { GuestroomsPage } from "@/components/portal/GuestroomsPage";
import { loadPortalData } from "@/lib/portal/data";
import { can, requirePortalContext } from "@/lib/portal/context";
import { loadTenantPortalAccountSummaries } from "@/lib/portal/tenant-accounts";

export default async function Page() {
  const [context, data] = await Promise.all([requirePortalContext(), loadPortalData()]);
  const accounts = await loadTenantPortalAccountSummaries(context.organization.id);
  return <GuestroomsPage
    organizationId={context.organization.id}
    items={data.rooms}
    properties={data.properties}
    leases={data.leases}
    tenants={data.tenants}
    portalAccounts={accounts}
    canCreate={can(context, "customer_rooms", "create")}
    canEdit={can(context, "customer_rooms", "update")}
    canDelete={can(context, "customer_rooms", "delete")}
    canManageTenantPortal={can(context, "customer_tenants", "update")}
  />;
}
