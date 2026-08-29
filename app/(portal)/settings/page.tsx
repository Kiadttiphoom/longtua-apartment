import { SettingsPage } from "@/components/portal/SettingsPage";
import { loadPortalData } from "@/lib/portal/data";
import { can, requirePortalContext } from "@/lib/portal/context";

export default async function Page() { const [context, data] = await Promise.all([requirePortalContext(), loadPortalData()]); return <SettingsPage organizationId={context.organization.id} properties={data.properties} settings={data.settings} canEdit={can(context, "customer_settings", "update")} />; }
