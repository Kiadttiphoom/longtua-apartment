import { DormitoriesPage } from "@/components/portal/DormitoriesPage";
import { loadPortalData } from "@/lib/portal/data";
import { can, requirePortalContext } from "@/lib/portal/context";

export default async function Page() { const [context, data] = await Promise.all([requirePortalContext(), loadPortalData()]); return <DormitoriesPage organizationId={context.organization.id} items={data.properties} rooms={data.rooms} canCreate={can(context, "customer_properties", "create")} canEdit={can(context, "customer_properties", "update")} canDelete={can(context, "customer_properties", "delete")} />; }
