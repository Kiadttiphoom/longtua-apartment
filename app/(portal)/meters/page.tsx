import { MetersPage } from "@/components/portal/MetersPage";
import { loadPortalData } from "@/lib/portal/data";
import { can, requirePortalContext } from "@/lib/portal/context";

export default async function Page() { const [context, data] = await Promise.all([requirePortalContext(), loadPortalData()]); return <MetersPage organizationId={context.organization.id} properties={data.properties} rooms={data.rooms} meters={data.meters} readings={data.meterReadings} canCreate={can(context, "customer_meters", "create")} />; }
