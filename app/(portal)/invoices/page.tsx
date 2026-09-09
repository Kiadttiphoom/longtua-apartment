import { InvoicesPage } from "@/components/portal/InvoicesPage";
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
      submissions={submissions ?? []}
      tenants={data.tenants}
    />
  );
}
