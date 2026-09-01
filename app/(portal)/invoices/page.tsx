import { InvoicesPage } from "@/components/portal/InvoicesPage";
import { loadPortalData } from "@/lib/portal/data";
import { can, requirePortalContext } from "@/lib/portal/context";

export default async function Page() {
  const [context, data] = await Promise.all([requirePortalContext(), loadPortalData()]);
  return (
    <InvoicesPage
      canCreate={can(context, "customer_invoices", "create")}
      canEdit={can(context, "customer_invoices", "update")}
      invoices={data.invoices}
      leases={data.leases}
      meters={data.meters}
      organizationId={context.organization.id}
      properties={data.properties}
      readings={data.meterReadings}
      rooms={data.rooms}
      settings={data.settings}
      tenants={data.tenants}
    />
  );
}
