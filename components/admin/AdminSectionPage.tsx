import { redirect } from "next/navigation";
import { AdminViewContent } from "@/components/admin/AdminViewContent";
import { isRegistrationEnabled, isSystemAdmin } from "@/lib/auth/system-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// AdminViewContent composes setRegistrationEnabledAction, RolePermissionMatrix, and UserPermissionMatrix in dedicated views.

export type AdminSection = "overview" | "trial-requests" | "organizations" | "properties" | "users" | "rooms" | "tenants" | "leases" | "meters" | "invoices" | "payments" | "receivables" | "reports" | "line" | "subscriptions" | "roles" | "permissions" | "menus" | "audit" | "settings";
export type AdminSearchParams = { saved?: string; error?: string; mode?: "role" | "user"; role?: string; organization?: string; user?: string };

const viewMeta: Record<AdminSection, { title: string; description: string }> = {
  overview: { title: "ภาพรวมระบบ", description: "สถานะลูกค้า ผู้ใช้งาน และ Subscription ของระบบจริง" }, "trial-requests": { title: "คำขอทดลองใช้", description: "ตรวจสอบตัวตน ความเสี่ยง และอนุมัติ Trial ก่อนสร้างกิจการจริง" }, organizations: { title: "กิจการ", description: "ตรวจสอบและควบคุมสถานะกิจการลูกค้าทั้งหมด" }, properties: { title: "หอพัก", description: "หอพักจริงทั้งหมดในทุกกิจการ" }, users: { title: "ผู้ใช้งาน", description: "ควบคุมบัญชีและตั้งรหัสผ่านชั่วคราวให้ผู้ใช้" }, rooms: { title: "ห้องพัก", description: "สถานะห้องพักจริงจากทุกหอและทุกกิจการ" }, tenants: { title: "ผู้เช่า", description: "ทะเบียนผู้เช่ารวมทั้งแพลตฟอร์ม" }, leases: { title: "สัญญาเช่า", description: "สัญญาเช่าจริงและสถานะปัจจุบัน" }, meters: { title: "มิเตอร์", description: "มิเตอร์และรายการจดล่าสุดจากทุกหอพัก" }, invoices: { title: "ใบแจ้งหนี้", description: "ใบแจ้งหนี้จริงทั้งหมดในระบบ" }, payments: { title: "รับชำระ", description: "รายการรับชำระจริงจากทุกกิจการ" }, receivables: { title: "ยอดค้าง", description: "ใบแจ้งหนี้ที่ยังมียอดคงเหลือ" }, reports: { title: "รายงาน", description: "ภาพรวมการดำเนินงานและการเงินทั้งแพลตฟอร์ม" }, line: { title: "LINE แจ้งเตือน", description: "สถานะบริการแจ้งเตือนของแพลตฟอร์ม" }, subscriptions: { title: "แพ็กเกจและบริการ", description: "จัดการ Trial สถานะสมาชิก และวันที่อนุญาตให้ใช้งาน" }, roles: { title: "Role", description: "สร้างและแก้ไขบทบาทระดับแพลตฟอร์ม กิจการ หรือหอพัก" }, permissions: { title: "Permission", description: "สร้าง Permission และกำหนดสิทธิ์ให้แต่ละ Role" }, menus: { title: "เมนูระบบ", description: "จัดลำดับ เปลี่ยนชื่อ และเปิดหรือปิดเมนู" }, audit: { title: "Audit Log", description: "ประวัติการดำเนินการของ Super Admin" }, settings: { title: "ตั้งค่าระบบ", description: "การตั้งค่าที่มีผลกับลูกค้าทั้งแพลตฟอร์ม" },
};

export async function AdminSectionPage({ section, searchParams }: { section: AdminSection; searchParams: Promise<AdminSearchParams> }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  if (!await isSystemAdmin(userId)) redirect("/dashboard");
  const params = await searchParams;
  const admin = createAdminClient();
  const isSection = (...sections: AdminSection[]) => sections.includes(section);
  const skipQuery = () => Promise.resolve({ data: [] as never[], error: null, count: 0 });
  const needsProperties = isSection("properties", "rooms", "leases", "meters", "invoices", "payments", "reports");
  const needsRooms = isSection("properties", "rooms", "leases", "meters", "invoices", "receivables", "reports");
  const needsTenants = isSection("tenants", "leases");
  const needsLeases = isSection("leases");
  const needsMeters = isSection("meters");
  const needsInvoices = isSection("invoices", "receivables", "reports");
  const needsPayments = isSection("payments", "reports");
  const operationsPromise = Promise.all([
    needsProperties ? admin.from("properties").select("id, organization_id, name, address, phone, status, created_at").order("created_at", { ascending: false }).limit(1000) : skipQuery(),
    needsRooms ? admin.from("rooms").select("id, organization_id, property_id, room_number, floor, base_rent, status").order("created_at", { ascending: false }).limit(2000) : skipQuery(),
    needsTenants ? admin.from("tenants").select("id, organization_id, full_name, phone, email, status, created_at").order("created_at", { ascending: false }).limit(2000) : skipQuery(),
    needsLeases ? admin.from("leases").select("id, organization_id, property_id, room_id, primary_tenant_id, lease_number, start_date, end_date, rent_amount, status").order("created_at", { ascending: false }).limit(2000) : skipQuery(),
    needsMeters ? admin.from("meters").select("id, organization_id, property_id, room_id, meter_type, serial_number, status").order("created_at", { ascending: false }).limit(3000) : skipQuery(),
    needsMeters ? admin.from("meter_readings").select("meter_id, current_value, usage_value, read_at").order("read_at", { ascending: false }).limit(5000) : skipQuery(),
    needsInvoices ? admin.from("rent_invoices").select("id, organization_id, property_id, room_id, invoice_number, issued_at, due_at, total, balance_due, status").order("issued_at", { ascending: false }).limit(3000) : skipQuery(),
    needsPayments ? admin.from("rent_payments").select("id, organization_id, property_id, receipt_number, paid_at, amount, method, reference, status").order("paid_at", { ascending: false }).limit(3000) : skipQuery(),
  ]);
  const needsOrganizations = !isSection("trial-requests", "line", "roles", "menus", "audit", "settings");
  const needsProfiles = isSection("organizations", "users", "permissions", "audit");
  const needsMemberships = isSection("overview", "organizations", "users", "permissions");
  const needsSubscriptions = isSection("overview", "subscriptions");
  const needsRoles = isSection("roles", "permissions");
  const needsPermissions = isSection("menus");
  const needsMenus = isSection("permissions", "menus");
  const [organizationsResult, organizationCountResult, profileCountResult, profilesResult, membershipsResult, subscriptionsResult, adminsResult, rolesResult, permissionsResult, menusResult, auditsResult, trialRequestsResult, permissionActionsResult, menuActionsResult, granularRolePermissionsResult, userOverridesResult, registration] = await Promise.all([
    needsOrganizations ? admin.from("organizations").select("id, name, status, owner_user_id, created_at").order("created_at", { ascending: false }).limit(500) : skipQuery(),
    section === "overview" ? admin.from("organizations").select("id", { count: "exact", head: true }) : skipQuery(),
    section === "overview" ? admin.from("profiles").select("id", { count: "exact", head: true }) : skipQuery(),
    needsProfiles ? admin.from("profiles").select("id, username, display_name, phone, status, created_at").order("created_at", { ascending: false }).limit(500) : skipQuery(),
    needsMemberships ? admin.from("organization_members").select("organization_id, user_id, role_code, status") : skipQuery(),
    needsSubscriptions ? admin.from("subscriptions").select("organization_id, status, trial_ends_at, current_period_end, access_until").order("created_at", { ascending: false }) : skipQuery(),
    section === "users" ? admin.from("system_admins").select("user_id, status") : skipQuery(),
    needsRoles ? admin.from("platform_roles").select("id, code, name, scope_type, description, is_system, status").order("created_at") : skipQuery(),
    needsPermissions ? admin.from("platform_permissions").select("code, module, action, name, description, status").order("module").order("action") : skipQuery(),
    needsMenus ? admin.from("platform_menus").select("id, code, label, href, icon, sort_order, required_permission, audience, status").order("sort_order") : skipQuery(),
    section === "audit" ? admin.from("platform_audit_logs").select("id, actor_user_id, action, entity_type, entity_id, before_data, after_data, created_at").order("created_at", { ascending: false }).limit(300) : skipQuery(),
    section === "trial-requests" ? admin.from("trial_requests").select("id, auth_user_id, username, operator_name, property_name, contact_email, phone, requested_room_count, status, risk_flags, submitted_at, reviewed_at, rejection_reason").order("submitted_at", { ascending: false }).limit(500) : skipQuery(),
    section === "permissions" ? admin.from("platform_permission_actions").select("code, name, sort_order, status").eq("status", "active").order("sort_order") : skipQuery(),
    section === "permissions" ? admin.from("platform_menu_actions").select("menu_id, action_code, is_active").eq("is_active", true) : skipQuery(),
    section === "permissions" ? admin.from("platform_role_menu_actions").select("role_id, menu_id, action_code, is_allowed") : skipQuery(),
    section === "permissions" ? admin.from("platform_user_menu_actions").select("organization_id, user_id, menu_id, action_code, is_allowed") : skipQuery(),
    section === "settings" ? isRegistrationEnabled() : Promise.resolve({ enabled: false }),
  ]);
  const [propertiesResult, roomsResult, tenantsResult, leasesResult, metersResult, meterReadingsResult, invoicesResult, paymentsResult] = await operationsPromise;
  const organizations = organizationsResult.data ?? [], profiles = profilesResult.data ?? [], memberships = membershipsResult.data ?? [], subscriptions = subscriptionsResult.data ?? [];
  const properties = propertiesResult.data ?? [], rooms = roomsResult.data ?? [], tenants = tenantsResult.data ?? [], leases = leasesResult.data ?? [], meters = metersResult.data ?? [], meterReadings = meterReadingsResult.data ?? [], invoices = invoicesResult.data ?? [], payments = paymentsResult.data ?? [];
  const roles = rolesResult.data ?? [], permissions = permissionsResult.data ?? [], menus = menusResult.data ?? [], audits = auditsResult.data ?? [], trialRequests = trialRequestsResult.data ?? [];
  const systemAdminIds = new Set((adminsResult.data ?? []).filter((item) => item.status === "active").map((item) => item.user_id));
  const organizationMap = new Map(organizations.map((item) => [item.id, item.name])), profileMap = new Map(profiles.map((item) => [item.id, item.display_name]));
  const propertyMap = new Map(properties.map((item) => [item.id, item.name])), roomMap = new Map(rooms.map((item) => [item.id, item.room_number])), tenantMap = new Map(tenants.map((item) => [item.id, item.full_name]));
  const latestReadingByMeter = new Map<string, (typeof meterReadings)[number]>(); for (const reading of meterReadings) if (!latestReadingByMeter.has(reading.meter_id)) latestReadingByMeter.set(reading.meter_id, reading);
  const memberCountByOrganization = new Map<string, number>(), organizationCountByUser = new Map<string, number>(); for (const membership of memberships.filter((item) => item.status === "active")) { memberCountByOrganization.set(membership.organization_id, (memberCountByOrganization.get(membership.organization_id) ?? 0) + 1); organizationCountByUser.set(membership.user_id, (organizationCountByUser.get(membership.user_id) ?? 0) + 1); }
  const view = section, meta = viewMeta[view];
  const actionCodesByMenu = new Map<string, string[]>(); for (const item of menuActionsResult.data ?? []) actionCodesByMenu.set(item.menu_id, [...(actionCodesByMenu.get(item.menu_id) ?? []), item.action_code]);
  const matrixActions = (permissionActionsResult.data ?? []).map((item) => ({ code: item.code, name: item.name }));
  const matrixMenus = menus.filter((item) => item.status === "active" && (item.audience === "customer" || item.audience === "all")).map((item) => ({ id: item.id, code: item.code, label: item.label, actionCodes: actionCodesByMenu.get(item.id) ?? [] })).filter((item) => item.actionCodes.length);
  const matrixRoles = roles.filter((role) => role.status === "active" && (role.scope_type === "organization" || role.code === "super_admin")).map((role) => ({ id: role.id, code: role.code, name: role.name, values: Object.fromEntries((granularRolePermissionsResult.data ?? []).filter((item) => item.role_id === role.id).map((item) => [`${item.menu_id}:${item.action_code}`, item.is_allowed])) }));
  const selectedRoleId = matrixRoles.some((role) => role.id === params.role) ? params.role! : (matrixRoles.find((role) => role.code === "owner")?.id ?? matrixRoles[0]?.id ?? ""), selectedOrganizationId = organizations.some((organization) => organization.id === params.organization) ? params.organization! : (organizations[0]?.id ?? "");
  const selectedOrganizationUsers = memberships.filter((membership) => membership.organization_id === selectedOrganizationId && membership.status === "active").map((membership) => { const profile = profiles.find((item) => item.id === membership.user_id), role = roles.find((item) => item.code === membership.role_code), overrides = (userOverridesResult.data ?? []).filter((item) => item.organization_id === selectedOrganizationId && item.user_id === membership.user_id); return { id: membership.user_id, username: profile?.username ?? membership.user_id, name: profile?.display_name ?? profile?.username ?? membership.user_id, roleCode: membership.role_code, roleName: role?.name ?? membership.role_code, values: Object.fromEntries(overrides.map((item) => [`${item.menu_id}:${item.action_code}`, item.is_allowed ? "allow" : "deny"])) as Record<string, "inherit" | "allow" | "deny"> }; });
  const selectedUserId = selectedOrganizationUsers.some((item) => item.id === params.user) ? params.user! : (selectedOrganizationUsers[0]?.id ?? ""), totalBilled = invoices.reduce((sum, item) => sum + Number(item.total), 0), totalOutstanding = invoices.reduce((sum, item) => sum + Number(item.balance_due), 0), totalCollected = payments.filter((item) => item.status === "confirmed").reduce((sum, item) => sum + Number(item.amount), 0), occupiedRooms = rooms.filter((item) => item.status === "occupied").length;
  const paramsForViews = { saved: params.saved, error: params.error, mode: params.mode, role: params.role, organization: params.organization, user: params.user };
  return <AdminViewContent view={view} title={meta.title} description={meta.description} params={paramsForViews} catalogReady={!rolesResult.error && !permissionsResult.error && !menusResult.error && !auditsResult.error} granularPermissionsReady={!permissionActionsResult.error && !menuActionsResult.error && !granularRolePermissionsResult.error && !userOverridesResult.error} organizationCount={organizationCountResult.count ?? organizations.length} profileCount={profileCountResult.count ?? profiles.length} organizations={organizations} profiles={profiles} memberships={memberships} subscriptions={subscriptions} properties={properties} rooms={rooms} tenants={tenants} leases={leases} meters={meters} invoices={invoices} payments={payments} roles={roles} permissions={permissions} menus={menus} audits={audits} trialRequests={trialRequests} propertiesReady={!propertiesResult.error} roomsReady={!roomsResult.error} tenantsReady={!tenantsResult.error} leasesReady={!leasesResult.error} metersReady={!metersResult.error} invoicesReady={!invoicesResult.error} paymentsReady={!paymentsResult.error} registration={registration} systemAdminIds={systemAdminIds} organizationMap={organizationMap} profileMap={profileMap} propertyMap={propertyMap} roomMap={roomMap} tenantMap={tenantMap} latestReadingByMeter={latestReadingByMeter} memberCountByOrganization={memberCountByOrganization} organizationCountByUser={organizationCountByUser} matrixActions={matrixActions} matrixMenus={matrixMenus} matrixRoles={matrixRoles} selectedRoleId={selectedRoleId} selectedOrganizationId={selectedOrganizationId} selectedOrganizationUsers={selectedOrganizationUsers} selectedUserId={selectedUserId} totalBilled={totalBilled} totalOutstanding={totalOutstanding} totalCollected={totalCollected} occupiedRooms={occupiedRooms} />;
}
