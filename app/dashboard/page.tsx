import { redirect } from "next/navigation";
import { ApartmentDashboard } from "@/components/dashboard/ApartmentDashboard";
import { logoutAction } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { isSystemAdmin } from "@/lib/auth/system-admin";
import { serverError } from "@/lib/server-log";
import { getOrganizationAccess } from "@/lib/auth/organization-access";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function roleLabel(role: string) {
  const roles: Record<string, string> = {
    owner: "เจ้าของกิจการ", manager: "ผู้จัดการ", accounting: "ฝ่ายบัญชี", staff: "พนักงาน",
  };
  return roles[role] ?? role;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ organization?: string; page?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (authError || !userId) redirect("/login");
  if (await isSystemAdmin(userId)) redirect("/admin");

  const [{ data: profile }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    supabase.from("organization_members").select("organization_id, role_code").eq("user_id", userId).eq("status", "active").order("created_at"),
  ]);
  if (!profile || membershipsError || !memberships?.length) redirect("/login");

  const requested = await searchParams;
  const requestedOrganizationId = requested.organization;
  const selectedMembership = requestedOrganizationId && UUID_PATTERN.test(requestedOrganizationId)
    ? memberships.find((membership) => membership.organization_id === requestedOrganizationId)
    : memberships[0];
  if (!selectedMembership) redirect("/dashboard");

  const { data: organizations, error: organizationsError } = await supabase
    .from("organizations").select("id, name").in("id", memberships.map((item) => item.organization_id)).order("created_at");
  if (organizationsError || !organizations?.length) redirect("/login");

  const organization = organizations.find((item) => item.id === selectedMembership.organization_id);
  if (!organization) redirect("/login");
  const organizationId = organization.id;

  const organizationAccess = await getOrganizationAccess(userId, organizationId);
  if (!organizationAccess) redirect("/login");
  const menuItems = organizationAccess.granularReady
    ? organizationAccess.menus.map((item) => ({ key: item.code.replace(/^customer_/, ""), label: item.label }))
    : undefined;

  const [subscriptionResult, propertiesResult, settingsResult, roomsResult, tenantsResult, leasesResult,
    metersResult, meterReadingsResult, invoicesResult, paymentsResult] = await Promise.all([
    supabase.from("subscriptions").select("status, trial_ends_at").eq("organization_id", organizationId).single(),
    supabase.from("properties").select("id, name, address, phone, status").eq("organization_id", organizationId).order("created_at"),
    supabase.from("property_settings").select("property_id, electric_rate, water_rate, bill_day, due_day, late_fee, promptpay_id, account_name, invoice_note").eq("organization_id", organizationId),
    supabase.from("rooms").select("id, property_id, room_number, floor, base_rent, status").eq("organization_id", organizationId).order("room_number"),
    supabase.from("tenants").select("id, full_name, phone, email, id_card_last4, status").eq("organization_id", organizationId).order("full_name"),
    supabase.from("leases").select("id, property_id, room_id, primary_tenant_id, lease_number, start_date, end_date, rent_amount, deposit_amount, status").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    supabase.from("meters").select("id, room_id, meter_type").eq("organization_id", organizationId),
    supabase.from("meter_readings").select("id, meter_id, current_value, usage_value, read_at").eq("organization_id", organizationId).order("read_at", { ascending: false }).limit(200),
    supabase.from("rent_invoices").select("id, property_id, room_id, lease_id, invoice_number, issued_at, due_at, total, balance_due, status").eq("organization_id", organizationId).order("issued_at", { ascending: false }).limit(500),
    supabase.from("rent_payments").select("id, property_id, receipt_number, paid_at, amount, method, reference, status").eq("organization_id", organizationId).order("paid_at", { ascending: false }).limit(500),
  ]);

  if (subscriptionResult.error || !subscriptionResult.data) redirect("/login");
  const coreErrors = [propertiesResult.error, settingsResult.error, roomsResult.error, tenantsResult.error,
    leasesResult.error, metersResult.error, meterReadingsResult.error, invoicesResult.error, paymentsResult.error].filter(Boolean);

  if (coreErrors.length) serverError("dashboard", {
    stage: "dashboard.load_core", organizationId,
    errors: coreErrors.map((error) => ({ code: error?.code, message: error?.message })),
  });

  return <ApartmentDashboard
    organization={organization}
    organizations={organizations}
    userName={profile.display_name}
    roleLabel={roleLabel(selectedMembership.role_code)}
    subscription={subscriptionResult.data}
    properties={propertiesResult.data ?? []}
    settings={settingsResult.data ?? []}
    rooms={roomsResult.data ?? []}
    tenants={tenantsResult.data ?? []}
    leases={leasesResult.data ?? []}
    meters={metersResult.data ?? []}
    meterReadings={meterReadingsResult.data ?? []}
    invoices={invoicesResult.data ?? []}
    payments={paymentsResult.data ?? []}
    initialPage={requested.page}
    menuItems={menuItems}
    permissionKeys={organizationAccess.granularReady ? Array.from(organizationAccess.permissions) : undefined}
    schemaError={coreErrors.length ? "ยังไม่ได้ติดตั้ง migration apartment_core กรุณารัน Supabase migration ก่อนใช้งาน" : undefined}
    logoutAction={logoutAction}
  />;
}
