import { MetersPage } from "@/components/portal/MetersPage";
import { loadPortalData } from "@/lib/portal/data";
import { can, requirePortalContext } from "@/lib/portal/context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function Page() {
  const [context, data] = await Promise.all([requirePortalContext(), loadPortalData()]);
  const supabase = context.isImpersonating ? createAdminClient() : await createClient();
  const { data: submissions } = await supabase
    .from("payment_submissions")
    .select("id, invoice_id, status")
    .eq("organization_id", context.organization.id);

  return (
    <MetersPage
      organizationId={context.organization.id}
      properties={data.properties}
      rooms={data.rooms}
      meters={data.meters}
      readings={data.meterReadings}
      invoices={data.invoices}
      submissions={submissions ?? []}
      canCreate={can(context, "customer_meters", "create")}
    />
  );
}
