import { PaymentsPage } from "@/components/portal/PaymentsPage";
import { loadPortalData } from "@/lib/portal/data";
import { can, requirePortalContext } from "@/lib/portal/context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function Page() {
  const [context, data] = await Promise.all([requirePortalContext(), loadPortalData()]);
  const supabase = context.isImpersonating ? createAdminClient() : await createClient();
  const { data: submissions } = await supabase.from("payment_submissions").select("id, tenant_id, invoice_id, amount, paid_at, method, reference, slip_path, note, status, created_at").eq("organization_id", context.organization.id).eq("status", "pending").order("created_at");
  const submissionsWithUrls = (submissions ?? []).map((item) => ({
    ...item,
    slipUrl: item.slip_path ? `/api/payment-slips/${item.id}` : null,
  }));
  const canReview = can(context, "customer_payments", "create") || ["owner", "manager", "accounting"].includes(context.roleCode);
  return <PaymentsPage organizationId={context.organization.id} payments={data.payments} invoices={data.invoices} properties={data.properties} rooms={data.rooms} tenants={data.tenants} submissions={submissionsWithUrls} canCreate={can(context, "customer_payments", "create")} canReview={canReview} />;
}
