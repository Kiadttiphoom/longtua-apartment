import { InvoicesPage } from "@/components/portal/InvoicesPage";
import { loadPortalData } from "@/lib/portal/data";
import { can, requirePortalContext } from "@/lib/portal/context";

export default async function Page() { const [context, data] = await Promise.all([requirePortalContext(), loadPortalData()]); return <InvoicesPage organizationId={context.organization.id} invoices={data.invoices} leases={data.leases} rooms={data.rooms} tenants={data.tenants} settings={data.settings} meters={data.meters} readings={data.meterReadings} canCreate={can(context, "customer_invoices", "create")} canEdit={can(context, "customer_invoices", "update")} />; }
