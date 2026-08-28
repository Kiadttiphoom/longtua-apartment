import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, BookOpenCheck, Building2, CalendarRange, CircleDollarSign, FileText, Gauge, Hotel, KeyRound, LayoutDashboard, LogOut, Menu, MessageCircle, ReceiptText, Settings, ShieldCheck, UserCog, UserRoundCheck, Users, WalletCards } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
import { resetUserPasswordAction, saveMenuAction, saveRoleAction, setRegistrationEnabledAction, updateOrganizationAction, updateSubscriptionAction, updateUserStatusAction } from "@/app/admin/actions";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { RolePermissionMatrix, UserPermissionMatrix } from "@/components/admin/PermissionMatrix";
import { isRegistrationEnabled, isSystemAdmin } from "@/lib/auth/system-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ViewKey = "overview" | "organizations" | "properties" | "users" | "rooms" | "tenants" | "leases" | "meters" | "invoices" | "payments" | "receivables" | "reports" | "line" | "subscriptions" | "roles" | "permissions" | "menus" | "audit" | "settings";
const navigation: Array<{ key: ViewKey; label: string; icon: typeof Building2 }> = [
  { key: "overview", label: "ภาพรวมระบบ", icon: LayoutDashboard }, { key: "organizations", label: "กิจการ", icon: Building2 },
  { key: "properties", label: "หอพัก", icon: Hotel }, { key: "users", label: "ผู้ใช้งาน", icon: Users },
  { key: "rooms", label: "ห้องพัก", icon: KeyRound }, { key: "tenants", label: "ผู้เช่า", icon: Users },
  { key: "leases", label: "สัญญาเช่า", icon: CalendarRange }, { key: "meters", label: "มิเตอร์", icon: Gauge },
  { key: "invoices", label: "ใบแจ้งหนี้", icon: FileText }, { key: "payments", label: "รับชำระ", icon: WalletCards },
  { key: "receivables", label: "ยอดค้าง", icon: ReceiptText }, { key: "reports", label: "รายงาน", icon: BookOpenCheck },
  { key: "line", label: "LINE แจ้งเตือน", icon: MessageCircle }, { key: "subscriptions", label: "แพ็กเกจและบริการ", icon: CircleDollarSign },
  { key: "roles", label: "Role", icon: UserCog }, { key: "permissions", label: "Permission", icon: KeyRound },
  { key: "menus", label: "เมนูระบบ", icon: Menu }, { key: "audit", label: "Audit Log", icon: Activity },
  { key: "settings", label: "ตั้งค่าระบบ", icon: Settings },
];
const viewMeta: Record<ViewKey, { title: string; description: string }> = {
  overview: { title: "ภาพรวมระบบ", description: "สถานะลูกค้า ผู้ใช้งาน และ Subscription ของระบบจริง" },
  organizations: { title: "กิจการ", description: "ตรวจสอบและควบคุมสถานะกิจการลูกค้าทั้งหมด" },
  properties: { title: "หอพัก", description: "หอพักจริงทั้งหมดในทุกกิจการ" },
  users: { title: "ผู้ใช้งาน", description: "ควบคุมบัญชีและตั้งรหัสผ่านชั่วคราวให้ผู้ใช้" },
  rooms: { title: "ห้องพัก", description: "สถานะห้องพักจริงจากทุกหอและทุกกิจการ" },
  tenants: { title: "ผู้เช่า", description: "ทะเบียนผู้เช่ารวมทั้งแพลตฟอร์ม" },
  leases: { title: "สัญญาเช่า", description: "สัญญาเช่าจริงและสถานะปัจจุบัน" },
  meters: { title: "มิเตอร์", description: "มิเตอร์และรายการจดล่าสุดจากทุกหอพัก" },
  invoices: { title: "ใบแจ้งหนี้", description: "ใบแจ้งหนี้จริงทั้งหมดในระบบ" },
  payments: { title: "รับชำระ", description: "รายการรับชำระจริงจากทุกกิจการ" },
  receivables: { title: "ยอดค้าง", description: "ใบแจ้งหนี้ที่ยังมียอดคงเหลือ" },
  reports: { title: "รายงาน", description: "ภาพรวมการดำเนินงานและการเงินทั้งแพลตฟอร์ม" },
  line: { title: "LINE แจ้งเตือน", description: "สถานะบริการแจ้งเตือนของแพลตฟอร์ม" },
  subscriptions: { title: "แพ็กเกจและบริการ", description: "จัดการ Trial สถานะสมาชิก และวันที่อนุญาตให้ใช้งาน" },
  roles: { title: "Role", description: "สร้างและแก้ไขบทบาทระดับแพลตฟอร์ม กิจการ หรือหอพัก" },
  permissions: { title: "Permission", description: "สร้าง Permission และกำหนดสิทธิ์ให้แต่ละ Role" },
  menus: { title: "เมนูระบบ", description: "จัดลำดับ เปลี่ยนชื่อ และเปิดหรือปิดเมนู" },
  audit: { title: "Audit Log", description: "ประวัติการดำเนินการของ Super Admin" },
  settings: { title: "ตั้งค่าระบบ", description: "การตั้งค่าที่มีผลกับลูกค้าทั้งแพลตฟอร์ม" },
};
const organizationStatuses = ["active", "suspended", "closed"];
const subscriptionStatuses = ["trialing", "active", "past_due", "readonly", "paused", "cancelled"];

function statusLabel(status: string) {
  const labels: Record<string, string> = { active: "ใช้งาน", inactive: "ปิดใช้งาน", suspended: "ระงับ", closed: "ปิดกิจการ", trialing: "ทดลองใช้ฟรี", past_due: "เกินกำหนด", readonly: "ดูได้อย่างเดียว", paused: "หยุดชั่วคราว", cancelled: "ยกเลิก", vacant: "ว่าง", occupied: "มีผู้เช่า", maintenance: "ซ่อมบำรุง", former: "ผู้เช่าเดิม", blocked: "บล็อก", draft: "ฉบับร่าง", ended: "สิ้นสุด", issued: "รอชำระ", partial: "ชำระบางส่วน", paid: "ชำระแล้ว", overdue: "เกินกำหนด", void: "ยกเลิกเอกสาร", confirmed: "ยืนยันแล้ว", pending: "รอตรวจสอบ", replaced: "เปลี่ยนแล้ว" };
  return labels[status] ?? status;
}
function thaiDate(value: string | null) { return value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value)) : "—"; }
function dateInput(value: string | null) { return value ? new Date(value).toISOString().slice(0, 10) : ""; }
function money(value: number) { return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(value); }
function AdminTable({ headers, rows, empty = "ยังไม่มีข้อมูล" }: { headers: string[]; rows: React.ReactNode[][]; empty?: string }) {
  if (!rows.length) return <p className="admin-empty">{empty}</p>;
  return <div className="admin-table-wrap"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ view?: string; saved?: string; error?: string; mode?: "role" | "user"; role?: string; organization?: string; user?: string }> }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  if (!await isSystemAdmin(userId)) redirect("/dashboard");
  const params = await searchParams;
  const requestedView = navigation.some((item) => item.key === params.view) ? params.view as ViewKey : "overview";
  const admin = createAdminClient();
  const operationsPromise = Promise.all([
    admin.from("properties").select("id, organization_id, name, address, phone, status, created_at").order("created_at", { ascending: false }).limit(1000),
    admin.from("rooms").select("id, organization_id, property_id, room_number, floor, base_rent, status").order("created_at", { ascending: false }).limit(2000),
    admin.from("tenants").select("id, organization_id, full_name, phone, email, status, created_at").order("created_at", { ascending: false }).limit(2000),
    admin.from("leases").select("id, organization_id, property_id, room_id, primary_tenant_id, lease_number, start_date, end_date, rent_amount, status").order("created_at", { ascending: false }).limit(2000),
    admin.from("meters").select("id, organization_id, property_id, room_id, meter_type, serial_number, status").order("created_at", { ascending: false }).limit(3000),
    admin.from("meter_readings").select("meter_id, current_value, usage_value, read_at").order("read_at", { ascending: false }).limit(5000),
    admin.from("rent_invoices").select("id, organization_id, property_id, room_id, invoice_number, issued_at, due_at, total, balance_due, status").order("issued_at", { ascending: false }).limit(3000),
    admin.from("rent_payments").select("id, organization_id, property_id, receipt_number, paid_at, amount, method, reference, status").order("paid_at", { ascending: false }).limit(3000),
  ]);
  const [profileResult, organizationsResult, organizationCountResult, profileCountResult, profilesResult, membershipsResult, subscriptionsResult, adminsResult, rolesResult, permissionsResult, menusResult, auditsResult, permissionActionsResult, menuActionsResult, granularRolePermissionsResult, userOverridesResult, registration] = await Promise.all([
    admin.from("profiles").select("display_name, username").eq("id", userId).single(),
    admin.from("organizations").select("id, name, status, owner_user_id, created_at").order("created_at", { ascending: false }).limit(500),
    admin.from("organizations").select("id", { count: "exact", head: true }), admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id, username, display_name, phone, status, created_at").order("created_at", { ascending: false }).limit(500),
    admin.from("organization_members").select("organization_id, user_id, role_code, status"),
    admin.from("subscriptions").select("organization_id, status, trial_ends_at, current_period_end, access_until").order("created_at", { ascending: false }),
    admin.from("system_admins").select("user_id, status"),
    admin.from("platform_roles").select("id, code, name, scope_type, description, is_system, status").order("created_at"),
    admin.from("platform_permissions").select("code, module, action, name, description, status").order("module").order("action"),
    admin.from("platform_menus").select("id, code, label, href, icon, sort_order, required_permission, audience, status").order("sort_order"),
    admin.from("platform_audit_logs").select("id, actor_user_id, action, entity_type, entity_id, before_data, after_data, created_at").order("created_at", { ascending: false }).limit(300),
    admin.from("platform_permission_actions").select("code, name, sort_order, status").eq("status", "active").order("sort_order"),
    admin.from("platform_menu_actions").select("menu_id, action_code, is_active").eq("is_active", true),
    admin.from("platform_role_menu_actions").select("role_id, menu_id, action_code, is_allowed"),
    admin.from("platform_user_menu_actions").select("organization_id, user_id, menu_id, action_code, is_allowed"),
    isRegistrationEnabled(),
  ]);
  const [propertiesResult, roomsResult, tenantsResult, leasesResult, metersResult, meterReadingsResult, invoicesResult, paymentsResult] = await operationsPromise;
  const organizations = organizationsResult.data ?? [], profiles = profilesResult.data ?? [], memberships = membershipsResult.data ?? [], subscriptions = subscriptionsResult.data ?? [];
  const properties = propertiesResult.data ?? [], rooms = roomsResult.data ?? [], tenants = tenantsResult.data ?? [], leases = leasesResult.data ?? [];
  const meters = metersResult.data ?? [], meterReadings = meterReadingsResult.data ?? [], invoices = invoicesResult.data ?? [], payments = paymentsResult.data ?? [];
  const roles = rolesResult.data ?? [], permissions = permissionsResult.data ?? [], menus = menusResult.data ?? [];
  const catalogReady = !rolesResult.error && !permissionsResult.error && !menusResult.error && !auditsResult.error;
  const granularPermissionsReady = !permissionActionsResult.error && !menuActionsResult.error && !granularRolePermissionsResult.error && !userOverridesResult.error;
  const systemAdminIds = new Set((adminsResult.data ?? []).filter((item) => item.status === "active").map((item) => item.user_id));
  const organizationMap = new Map(organizations.map((item) => [item.id, item.name])), profileMap = new Map(profiles.map((item) => [item.id, item.display_name]));
  const propertyMap = new Map(properties.map((item) => [item.id, item.name])), roomMap = new Map(rooms.map((item) => [item.id, item.room_number])), tenantMap = new Map(tenants.map((item) => [item.id, item.full_name]));
  const latestReadingByMeter = new Map<string, (typeof meterReadings)[number]>();
  for (const reading of meterReadings) if (!latestReadingByMeter.has(reading.meter_id)) latestReadingByMeter.set(reading.meter_id, reading);
  const memberCountByOrganization = new Map<string, number>(), organizationCountByUser = new Map<string, number>();
  for (const membership of memberships.filter((item) => item.status === "active")) {
    memberCountByOrganization.set(membership.organization_id, (memberCountByOrganization.get(membership.organization_id) ?? 0) + 1);
    organizationCountByUser.set(membership.user_id, (organizationCountByUser.get(membership.user_id) ?? 0) + 1);
  }
  const menuMap = new Map(menus.map((item) => [item.code, item]));
  const completeAdminCatalog = navigation.every((item) => menuMap.has(`admin_${item.key}`));
  const visibleNavigation = navigation.map((item, defaultOrder) => ({ ...item, defaultOrder, catalog: menuMap.get(`admin_${item.key}`) })).filter((item) => !item.catalog || item.catalog.status === "active").sort((a, b) => completeAdminCatalog ? (a.catalog?.sort_order ?? 999) - (b.catalog?.sort_order ?? 999) : a.defaultOrder - b.defaultOrder);
  const view = visibleNavigation.some((item) => item.key === requestedView) ? requestedView : "overview", meta = viewMeta[view];
  const matrixActions = (permissionActionsResult.data ?? []).map((item) => ({ code: item.code, name: item.name }));
  const actionCodesByMenu = new Map<string, string[]>();
  for (const item of menuActionsResult.data ?? []) actionCodesByMenu.set(item.menu_id, [...(actionCodesByMenu.get(item.menu_id) ?? []), item.action_code]);
  const matrixMenus = menus.filter((item) => item.status === "active" && (item.audience === "customer" || item.audience === "all")).map((item) => ({ id: item.id, code: item.code, label: item.label, actionCodes: actionCodesByMenu.get(item.id) ?? [] })).filter((item) => item.actionCodes.length);
  const matrixRoles = roles.filter((role) => role.status === "active" && (role.scope_type === "organization" || role.code === "super_admin")).map((role) => ({
    id: role.id, code: role.code, name: role.name,
    values: Object.fromEntries((granularRolePermissionsResult.data ?? []).filter((item) => item.role_id === role.id).map((item) => [`${item.menu_id}:${item.action_code}`, item.is_allowed])),
  }));
  const selectedRoleId = matrixRoles.some((role) => role.id === params.role) ? params.role! : (matrixRoles.find((role) => role.code === "owner")?.id ?? matrixRoles[0]?.id ?? "");
  const selectedOrganizationId = organizations.some((organization) => organization.id === params.organization) ? params.organization! : (organizations[0]?.id ?? "");
  const selectedOrganizationUsers = memberships.filter((membership) => membership.organization_id === selectedOrganizationId && membership.status === "active").map((membership) => {
    const profile = profiles.find((item) => item.id === membership.user_id);
    const role = roles.find((item) => item.code === membership.role_code);
    const overrides = (userOverridesResult.data ?? []).filter((item) => item.organization_id === selectedOrganizationId && item.user_id === membership.user_id);
    return { id: membership.user_id, username: profile?.username ?? membership.user_id, name: profile?.display_name ?? profile?.username ?? membership.user_id, roleCode: membership.role_code, roleName: role?.name ?? membership.role_code, values: Object.fromEntries(overrides.map((item) => [`${item.menu_id}:${item.action_code}`, item.is_allowed ? "allow" : "deny"])) as Record<string, "inherit" | "allow" | "deny"> };
  });
  const selectedUserId = selectedOrganizationUsers.some((item) => item.id === params.user) ? params.user! : (selectedOrganizationUsers[0]?.id ?? "");
  const totalBilled = invoices.reduce((sum, item) => sum + Number(item.total), 0), totalOutstanding = invoices.reduce((sum, item) => sum + Number(item.balance_due), 0);
  const totalCollected = payments.filter((item) => item.status === "confirmed").reduce((sum, item) => sum + Number(item.amount), 0);
  const occupiedRooms = rooms.filter((item) => item.status === "occupied").length;

  return <main className="admin-shell"><aside className="admin-sidebar">
    <div className="admin-brand"><BrandLogo /></div><div className="admin-identity"><span><ShieldCheck size={19} /></span><div><strong>{profileResult.data?.display_name ?? "Super Admin"}</strong><small>Super Admin · Longtua</small></div></div>
    <nav>{visibleNavigation.map((item) => <Link className={view === item.key ? "active" : ""} href={item.catalog?.href ?? `/admin?view=${item.key}`} key={item.key}><item.icon size={18} />{item.catalog?.label ?? item.label}</Link>)}</nav>
    <form action={logoutAction}><button type="submit"><LogOut size={18} />ออกจากระบบ</button></form>
  </aside><section className="admin-content">
    <header><div><small>LONGTUA PLATFORM</small><h1>{meta.title}</h1><p>{meta.description}</p></div><span className="admin-role-badge"><ShieldCheck size={15} />SUPER ADMIN</span></header>
    {params.saved ? <div className="admin-notice success">{params.saved}</div> : null}{params.error ? <div className="admin-notice error">บันทึกไม่สำเร็จ · รหัสอ้างอิง {params.error}</div> : null}
    {!catalogReady ? <div className="admin-notice error">เมนูจัดการขั้นสูงยังไม่พร้อม กรุณา apply migration <code>20260828091931_admin_management_catalog.sql</code></div> : null}

    {view === "overview" ? <><section className="admin-stats">
      <article><span><Building2 size={20} /></span><div><small>กิจการทั้งหมด</small><strong>{organizationCountResult.count ?? organizations.length}</strong></div></article><article><span><Users size={20} /></span><div><small>ผู้ใช้งานทั้งหมด</small><strong>{profileCountResult.count ?? profiles.length}</strong></div></article>
      <article><span><UserRoundCheck size={20} /></span><div><small>ทดลองใช้ฟรี</small><strong>{subscriptions.filter((item) => item.status === "trialing").length}</strong></div></article><article><span><ShieldCheck size={20} /></span><div><small>สมาชิก Active</small><strong>{subscriptions.filter((item) => item.status === "active").length}</strong></div></article>
    </section><section className="admin-card"><div className="admin-card-head"><div><small>ลูกค้าระบบจริง</small><h2>กิจการล่าสุด</h2></div><Link href="/admin?view=organizations">จัดการทั้งหมด</Link></div><AdminTable headers={["ชื่อกิจการ", "สถานะ", "ผู้ใช้งาน", "วันที่สมัคร"]} rows={organizations.slice(0, 10).map((item) => [item.name, <span className={`admin-status ${item.status}`} key="s">{statusLabel(item.status)}</span>, memberCountByOrganization.get(item.id) ?? 0, thaiDate(item.created_at)])} /></section></> : null}

    {view === "organizations" ? <section className="admin-card"><AdminTable headers={["ชื่อกิจการ", "เจ้าของ", "สมาชิก", "วันที่สมัคร", "ควบคุมสถานะ"]} rows={organizations.map((item) => [item.name, profileMap.get(item.owner_user_id) ?? "—", memberCountByOrganization.get(item.id) ?? 0, thaiDate(item.created_at), <form action={updateOrganizationAction} className="admin-inline-form" key="f"><input name="organizationId" type="hidden" value={item.id} /><select aria-label={`สถานะ ${item.name}`} defaultValue={item.status} name="status">{organizationStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select><button type="submit">บันทึก</button></form>])} /></section> : null}

    {view === "properties" ? <section className="admin-card"><AdminTable headers={["กิจการ", "ชื่อหอพัก", "ที่อยู่", "โทรศัพท์", "จำนวนห้อง", "สถานะ"]} rows={properties.map((item) => [organizationMap.get(item.organization_id) ?? "—", item.name, item.address || "—", item.phone || "—", rooms.filter((room) => room.property_id === item.id).length, <span className={`admin-status ${item.status}`} key="s">{statusLabel(item.status)}</span>])} empty={propertiesResult.error ? "ตารางหอพักยังไม่พร้อม" : "ยังไม่มีหอพักในระบบ"} /></section> : null}

    {view === "users" ? <section className="admin-card"><AdminTable headers={["บัญชี", "ประเภท", "กิจการ", "สถานะ", "ตั้งรหัสผ่านชั่วคราว"]} rows={profiles.map((item) => [<div key="u"><strong>{item.username}</strong><small className="admin-cell-note">{item.display_name} · {item.phone || "ไม่มีเบอร์"}</small></div>, systemAdminIds.has(item.id) ? <span className="admin-role-badge" key="r">SUPER ADMIN</span> : "ผู้ใช้กิจการ", organizationCountByUser.get(item.id) ?? 0, systemAdminIds.has(item.id) ? <span className="admin-status active" key="s">ป้องกันการระงับ</span> : <form action={updateUserStatusAction} className="admin-inline-form" key="f"><input name="userId" type="hidden" value={item.id} /><select defaultValue={item.status} name="status"><option value="active">ใช้งาน</option><option value="suspended">ระงับ</option></select><button type="submit">บันทึก</button></form>, <form action={resetUserPasswordAction} className="admin-inline-form" key="p"><input name="userId" type="hidden" value={item.id} /><input autoComplete="new-password" minLength={12} name="temporaryPassword" pattern="(?=.*[A-Za-z])(?=.*\d).{12,}" placeholder="อย่างน้อย 12 ตัว มีอักษร/เลข" required type="password" /><button className="danger" type="submit">รีเซ็ต</button></form>])} /></section> : null}

    {view === "rooms" ? <section className="admin-card"><AdminTable headers={["กิจการ", "หอพัก", "ห้อง", "ชั้น", "ค่าเช่า", "สถานะ"]} rows={rooms.map((item) => [organizationMap.get(item.organization_id) ?? "—", propertyMap.get(item.property_id) ?? "—", item.room_number, item.floor || "—", money(Number(item.base_rent)), <span className={`admin-status ${item.status}`} key="s">{statusLabel(item.status)}</span>])} empty={roomsResult.error ? "ตารางห้องพักยังไม่พร้อม" : "ยังไม่มีห้องพัก"} /></section> : null}

    {view === "tenants" ? <section className="admin-card"><AdminTable headers={["กิจการ", "ชื่อผู้เช่า", "โทรศัพท์", "อีเมล", "สถานะ", "วันที่สร้าง"]} rows={tenants.map((item) => [organizationMap.get(item.organization_id) ?? "—", item.full_name, item.phone || "—", item.email || "—", <span className={`admin-status ${item.status}`} key="s">{statusLabel(item.status)}</span>, thaiDate(item.created_at)])} empty={tenantsResult.error ? "ตารางผู้เช่ายังไม่พร้อม" : "ยังไม่มีผู้เช่า"} /></section> : null}

    {view === "leases" ? <section className="admin-card"><AdminTable headers={["กิจการ", "เลขที่สัญญา", "หอ/ห้อง", "ผู้เช่า", "ระยะเวลา", "ค่าเช่า", "สถานะ"]} rows={leases.map((item) => [organizationMap.get(item.organization_id) ?? "—", item.lease_number, `${propertyMap.get(item.property_id) ?? "—"} / ${roomMap.get(item.room_id) ?? "—"}`, tenantMap.get(item.primary_tenant_id) ?? "—", `${thaiDate(item.start_date)} – ${thaiDate(item.end_date)}`, money(Number(item.rent_amount)), <span className={`admin-status ${item.status}`} key="s">{statusLabel(item.status)}</span>])} empty={leasesResult.error ? "ตารางสัญญาเช่ายังไม่พร้อม" : "ยังไม่มีสัญญาเช่า"} /></section> : null}

    {view === "meters" ? <section className="admin-card"><AdminTable headers={["กิจการ", "หอ/ห้อง", "ประเภท", "เลขล่าสุด", "หน่วยใช้", "วันที่จด", "สถานะ"]} rows={meters.map((item) => { const reading = latestReadingByMeter.get(item.id); return [organizationMap.get(item.organization_id) ?? "—", `${propertyMap.get(item.property_id) ?? "—"} / ${roomMap.get(item.room_id) ?? "—"}`, item.meter_type === "electric" ? "ไฟฟ้า" : "น้ำ", reading ? Number(reading.current_value).toLocaleString("th-TH") : "—", reading ? Number(reading.usage_value).toLocaleString("th-TH") : "—", thaiDate(reading?.read_at ?? null), <span className={`admin-status ${item.status}`} key="s">{statusLabel(item.status)}</span>]; })} empty={metersResult.error ? "ตารางมิเตอร์ยังไม่พร้อม" : "ยังไม่มีมิเตอร์"} /></section> : null}

    {view === "invoices" ? <section className="admin-card"><AdminTable headers={["กิจการ", "เลขที่ใบแจ้งหนี้", "หอ/ห้อง", "วันที่ออก", "ครบกำหนด", "ยอดรวม", "คงเหลือ", "สถานะ"]} rows={invoices.map((item) => [organizationMap.get(item.organization_id) ?? "—", item.invoice_number, `${propertyMap.get(item.property_id) ?? "—"} / ${roomMap.get(item.room_id) ?? "—"}`, thaiDate(item.issued_at), thaiDate(item.due_at), money(Number(item.total)), money(Number(item.balance_due)), <span className={`admin-status ${item.status}`} key="s">{statusLabel(item.status)}</span>])} empty={invoicesResult.error ? "ตารางใบแจ้งหนี้ยังไม่พร้อม" : "ยังไม่มีใบแจ้งหนี้"} /></section> : null}

    {view === "payments" ? <section className="admin-card"><AdminTable headers={["กิจการ", "เลขที่ใบเสร็จ", "หอพัก", "วันที่รับ", "ยอดเงิน", "ช่องทาง", "อ้างอิง", "สถานะ"]} rows={payments.map((item) => [organizationMap.get(item.organization_id) ?? "—", item.receipt_number, propertyMap.get(item.property_id) ?? "—", thaiDate(item.paid_at), money(Number(item.amount)), item.method, item.reference || "—", <span className={`admin-status ${item.status}`} key="s">{statusLabel(item.status)}</span>])} empty={paymentsResult.error ? "ตารางรับชำระยังไม่พร้อม" : "ยังไม่มีรายการรับชำระ"} /></section> : null}

    {view === "receivables" ? <section className="admin-card"><AdminTable headers={["กิจการ", "เลขที่ใบแจ้งหนี้", "ห้อง", "ครบกำหนด", "ยอดรวม", "ยอดค้าง", "สถานะ"]} rows={invoices.filter((item) => Number(item.balance_due) > 0 && item.status !== "void").map((item) => [organizationMap.get(item.organization_id) ?? "—", item.invoice_number, roomMap.get(item.room_id) ?? "—", thaiDate(item.due_at), money(Number(item.total)), <strong key="b">{money(Number(item.balance_due))}</strong>, <span className={`admin-status ${item.status}`} key="s">{statusLabel(item.status)}</span>])} empty="ไม่มียอดค้างชำระ" /></section> : null}

    {view === "reports" ? <><section className="admin-stats"><article><span><Hotel size={20} /></span><div><small>หอพักทั้งหมด</small><strong>{properties.length}</strong></div></article><article><span><KeyRound size={20} /></span><div><small>อัตราเข้าพัก</small><strong>{rooms.length ? Math.round(occupiedRooms / rooms.length * 100) : 0}%</strong></div></article><article><span><WalletCards size={20} /></span><div><small>รับชำระสะสม</small><strong>{money(totalCollected)}</strong></div></article><article><span><ReceiptText size={20} /></span><div><small>ยอดค้างทั้งหมด</small><strong>{money(totalOutstanding)}</strong></div></article></section><section className="admin-card"><div className="admin-card-head"><div><small>PLATFORM FINANCE</small><h2>สรุปรายกิจการ</h2></div><strong>ยอดออกบิล {money(totalBilled)}</strong></div><AdminTable headers={["กิจการ", "หอพัก", "ห้อง", "ออกบิล", "รับชำระ", "ยอดค้าง"]} rows={organizations.map((organization) => { const orgInvoices = invoices.filter((item) => item.organization_id === organization.id), orgPayments = payments.filter((item) => item.organization_id === organization.id && item.status === "confirmed"); return [organization.name, properties.filter((item) => item.organization_id === organization.id).length, rooms.filter((item) => item.organization_id === organization.id).length, money(orgInvoices.reduce((sum, item) => sum + Number(item.total), 0)), money(orgPayments.reduce((sum, item) => sum + Number(item.amount), 0)), money(orgInvoices.reduce((sum, item) => sum + Number(item.balance_due), 0))]; })} /></section></> : null}

    {view === "line" ? <section className="admin-card admin-addon-card"><span><MessageCircle size={28} /></span><div><small>ADD-ON</small><h2>LINE แจ้งเตือน</h2><p>เมนูเตรียมไว้แล้ว แต่ระบบจริงยังไม่ได้เชื่อม LINE Messaging API จึงยังไม่มีการส่งข้อความออก เพื่อไม่ให้หน้า Demo หลอกว่าเปิดใช้บริการแล้ว</p></div><span className="admin-status inactive">ยังไม่เชื่อมต่อ</span></section> : null}

    {view === "subscriptions" ? <section className="admin-card"><AdminTable headers={["กิจการ", "Trial", "สิ้นสุดรอบ", "จัดการสิทธิ์ใช้งาน"]} rows={subscriptions.map((item) => [organizationMap.get(item.organization_id) ?? "—", thaiDate(item.trial_ends_at), thaiDate(item.current_period_end), <form action={updateSubscriptionAction} className="admin-inline-form" key="f"><input name="organizationId" type="hidden" value={item.organization_id} /><select defaultValue={item.status} name="status">{subscriptionStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select><input defaultValue={dateInput(item.access_until)} name="accessUntil" type="date" /><button type="submit">บันทึก</button></form>])} /></section> : null}

    {view === "roles" ? <><section className="admin-card"><div className="admin-card-head"><div><small>ROLE ใหม่</small><h2>เพิ่มบทบาท</h2></div></div><form action={saveRoleAction} className="admin-create-form"><input name="code" pattern="[a-z][a-z0-9_]{2,49}" placeholder="code เช่น auditor" required /><input name="name" placeholder="ชื่อ Role" required /><select name="scopeType" defaultValue="organization"><option value="platform">Platform</option><option value="organization">กิจการ</option><option value="property">หอพัก</option></select><input className="wide" name="description" placeholder="คำอธิบาย" /><button type="submit">เพิ่ม Role</button></form></section><section className="admin-card"><AdminTable headers={["Code", "แก้ไข Role", "ประเภท"]} rows={roles.map((role) => [<code key="c">{role.code}</code>, <form action={saveRoleAction} className="admin-inline-form admin-form-wide" key="f"><input name="roleId" type="hidden" value={role.id} /><input name="name" defaultValue={role.name} required /><select name="scopeType" defaultValue={role.scope_type}><option value="platform">Platform</option><option value="organization">กิจการ</option><option value="property">หอพัก</option></select><input name="description" defaultValue={role.description ?? ""} placeholder="คำอธิบาย" /><select name="status" defaultValue={role.status}><option value="active">ใช้งาน</option><option value="inactive">ปิดใช้งาน</option></select><button type="submit">บันทึก</button></form>, role.is_system ? "System" : "กำหนดเอง"])} /></section></> : null}

    {view === "permissions" ? <section className="admin-card admin-permissions-card">
      <div className="admin-card-head"><div><small>MENU × ACTION</small><h2>กำหนดสิทธิ์การใช้งาน</h2><p>สิทธิ์รายผู้ใช้มีผลเหนือ Role และระบบจะปฏิเสธสิทธิ์ที่ไม่ได้กำหนดไว้โดยอัตโนมัติ</p></div></div>
      {!granularPermissionsReady ? <div className="admin-notice error">ระบบสิทธิ์แบบละเอียดยังไม่พร้อม กรุณา apply migration <code>20260828101032_granular_menu_permissions.sql</code></div> : <>
        <div className="admin-permission-tabs"><Link className={params.mode !== "user" ? "active" : ""} href="/admin?view=permissions">สิทธิ์ตาม Role</Link><Link className={params.mode === "user" ? "active" : ""} href="/admin?view=permissions&mode=user">กำหนดเฉพาะผู้ใช้</Link></div>
        {params.mode === "user" ? <UserPermissionMatrix actions={matrixActions} menus={matrixMenus} organizations={organizations.map((item) => ({ id: item.id, name: item.name }))} organizationRoles={roles.filter((item) => item.scope_type === "organization" && item.status === "active").map((item) => ({ code: item.code, name: item.name }))} selectedOrganizationId={selectedOrganizationId} users={selectedOrganizationUsers} selectedUserId={selectedUserId} /> : <RolePermissionMatrix actions={matrixActions} menus={matrixMenus} roles={matrixRoles} selectedRoleId={selectedRoleId} />}
      </>}
    </section> : null}

    {view === "menus" ? <><section className="admin-card"><div className="admin-card-head"><div><small>MENU ใหม่</small><h2>เพิ่มเมนู</h2></div></div><form action={saveMenuAction} className="admin-create-form"><input name="code" pattern="[a-z][a-z0-9_]{2,49}" placeholder="menu_code" required /><input name="label" placeholder="ชื่อเมนู" required /><input name="href" pattern="/.*" placeholder="/path" required /><input name="icon" placeholder="Icon เช่น Circle" /><input name="sortOrder" type="number" defaultValue="100" /><select name="requiredPermission" defaultValue=""><option value="">ไม่กำหนด Permission</option>{permissions.map((permission) => <option key={permission.code} value={permission.code}>{permission.code}</option>)}</select><select name="audience" defaultValue="customer"><option value="admin">Admin</option><option value="customer">Customer</option><option value="all">ทั้งหมด</option></select><button type="submit">เพิ่มเมนู</button></form></section><section className="admin-card"><AdminTable headers={["Code", "แก้ไขเมนู"]} rows={menus.map((item) => [<code key="c">{item.code}</code>, <form action={saveMenuAction} className="admin-inline-form admin-form-wide" key="f"><input name="menuId" type="hidden" value={item.id} /><input name="label" defaultValue={item.label} required /><input name="href" defaultValue={item.href} required /><input name="icon" defaultValue={item.icon} /><input className="admin-number" name="sortOrder" type="number" defaultValue={item.sort_order} /><select name="requiredPermission" defaultValue={item.required_permission ?? ""}><option value="">ไม่กำหนด</option>{permissions.map((permission) => <option key={permission.code} value={permission.code}>{permission.code}</option>)}</select><select name="audience" defaultValue={item.audience}><option value="admin">Admin</option><option value="customer">Customer</option><option value="all">ทั้งหมด</option></select><select name="status" defaultValue={item.status}><option value="active">ใช้งาน</option><option value="inactive">ปิดใช้งาน</option></select><button type="submit">บันทึก</button></form>])} /></section></> : null}

    {view === "audit" ? <section className="admin-card"><AdminTable headers={["เวลา", "ผู้ดำเนินการ", "เหตุการณ์", "ข้อมูล", "รายละเอียด"]} rows={(auditsResult.data ?? []).map((item) => [thaiDate(item.created_at), profileMap.get(item.actor_user_id ?? "") ?? "ระบบ", item.action, `${item.entity_type}${item.entity_id ? ` · ${item.entity_id}` : ""}`, <details key="d"><summary>ดูการเปลี่ยนแปลง</summary><pre>{JSON.stringify({ before: item.before_data, after: item.after_data }, null, 2)}</pre></details>])} empty={auditsResult.error ? "ตาราง Platform Audit Log ยังไม่พร้อม" : "ยังไม่มี Audit Log"} /></section> : null}
    {view === "settings" ? <section className="admin-card registration-control"><div><small>การตั้งค่าระบบ</small><h2>เปิด/ปิดการลงทะเบียน</h2><p>เมื่อปิด ผู้ใช้ใหม่จะสมัครผ่าน <code>/register</code> ไม่ได้ แต่ผู้ใช้เดิมยังเข้าสู่ระบบได้ตามปกติ</p></div><div className="registration-state"><span className={registration.enabled ? "on" : "off"}>{registration.enabled ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}</span><form action={setRegistrationEnabledAction}><input type="hidden" name="enabled" value={registration.enabled ? "false" : "true"} /><button className={registration.enabled ? "danger" : "primary"} type="submit">{registration.enabled ? "ปิดการลงทะเบียน" : "เปิดการลงทะเบียน"}</button></form></div></section> : null}
  </section></main>;
}
