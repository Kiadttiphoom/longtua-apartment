import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function source(relativePath) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const migration = source("../supabase/migrations/20260828090230_super_admin_and_registration_control.sql");
const managementMigration = source("../supabase/migrations/20260828091931_admin_management_catalog.sql");
const granularMigration = source("../supabase/migrations/20260828101032_granular_menu_permissions.sql");
const trialRequestApi = source("../app/api/public/trial-requests/route.ts");
const adminActions = source("../app/(admin)/admin/actions.ts");
const adminPage = source("../components/admin/AdminSectionPage.tsx");
const adminShell = source("../components/admin/AdminPlatformShell.tsx");
const adminViewContent = source("../components/admin/AdminViewContent.tsx");
const adminManagementViews = source("../components/admin/views/AdminManagementViews.tsx");
const demo = source("../components/demo/ApartmentDemo.tsx");

test("superAdmin_isPlatformScopedAndServerOnly", () => {
  assert.match(migration, /create table public\.system_admins/);
  assert.match(migration, /revoke all on table public\.system_admins, public\.system_settings from public, anon, authenticated/);
  assert.match(migration, /grant all on table public\.system_admins, public\.system_settings to service_role/);
  assert.doesNotMatch(migration, /organization_members[\s\S]*super_admin/);
});

test("registrationControl_isCheckedOnServerAndNotOnlyHiddenInUi", () => {
  assert.match(trialRequestApi, /await isRegistrationEnabled\(\)/);
  assert.match(trialRequestApi, /registration_closed/);
  assert.match(adminActions, /await isSystemAdmin\(userId\)/);
  assert.match(adminActions, /registration_enabled/);
});

test("adminConsole_hasRegistrationMenuAndDemoDoesNotExposeIt", () => {
  for (const menu of ["กิจการ", "หอพัก", "ผู้ใช้งาน", "ห้องพัก", "ผู้เช่า", "สัญญาเช่า", "มิเตอร์", "ใบแจ้งหนี้", "รับชำระ", "ยอดค้าง", "รายงาน", "LINE แจ้งเตือน", "แพ็กเกจและบริการ", "Role", "Permission", "เมนูระบบ", "Audit Log", "ตั้งค่าระบบ"]) {
    assert.match(adminShell, new RegExp(menu));
  }
  assert.match(adminManagementViews, /setRegistrationEnabledAction/);
  assert.doesNotMatch(demo, /ปิดการลงทะเบียน|ศูนย์ควบคุมระบบ/);
});

test("adminRoutes_useExplicitFeatureFoldersInsteadOfDynamicSection", () => {
  const sections = ["organizations", "properties", "users", "rooms", "tenants", "leases", "meters", "invoices", "payments", "receivables", "reports", "line", "subscriptions", "roles", "permissions", "menus", "audit", "settings"];
  assert.equal(existsSync(fileURLToPath(new URL("../app/(admin)/admin/[section]", import.meta.url))), false);
  for (const section of sections) {
    assert.equal(existsSync(fileURLToPath(new URL(`../app/(admin)/admin/${section}/page.tsx`, import.meta.url))), true, `missing /admin/${section}`);
  }
});

test("superAdminOperations_loadRealCrossOrganizationData", () => {
  for (const table of ["properties", "rooms", "tenants", "leases", "meters", "meter_readings", "rent_invoices", "rent_payments"]) {
    assert.match(adminPage, new RegExp(`from\\("${table}"\\)`));
  }
  assert.doesNotMatch(adminPage, /localStorage/);
});

test("adminManagementCatalog_isServerOnlyAndSeedsFullAccessModel", () => {
  for (const table of ["platform_roles", "platform_permissions", "platform_role_permissions", "platform_menus", "platform_audit_logs"]) {
    assert.match(managementMigration, new RegExp(`create table public\\.${table}`));
  }
  assert.match(managementMigration, /revoke all on table public\.platform_roles,[\s\S]*from public, anon, authenticated/);
  assert.match(managementMigration, /grant all on table public\.platform_roles,[\s\S]*to service_role/);
  assert.match(managementMigration, /where role\.code = 'super_admin'/);
  assert.match(managementMigration, /admin_settings/);
});

test("adminMutations_reauthorizeAndWritePlatformAuditLog", () => {
  for (const action of ["updateOrganizationAction", "updateUserStatusAction", "updateMembershipRoleAction", "resetUserPasswordAction", "updateSubscriptionAction", "saveRoleAction", "savePermissionAction", "setRolePermissionAction", "saveMenuAction"]) {
    assert.match(adminActions, new RegExp(`export async function ${action}`));
  }
  assert.match(adminActions, /async function adminContext\(\)[\s\S]*await isSystemAdmin\(userId\)/);
  assert.match(adminActions, /from\("platform_audit_logs"\)\.insert/);
  assert.match(adminActions, /menu\.lockout_protection/);
});

test("menuActionPermissions_controlMenusServerMutationsAndRls", () => {
  const portalContext = source("../lib/portal/context.ts");
  const dashboardActions = source("../app/(portal)/resource-actions.ts");
  const accessResolver = source("../lib/auth/organization-access.ts");
  for (const table of ["platform_permission_actions", "platform_menu_actions", "platform_role_menu_actions", "platform_user_menu_actions"]) {
    assert.match(granularMigration, new RegExp(`create table public\\.${table}`));
  }
  assert.match(granularMigration, /coalesce\(user_value\.is_allowed, role_value\.is_allowed, false\)/);
  assert.match(granularMigration, /private\.has_menu_action/);
  assert.match(granularMigration, /enable row level security/);
  assert.match(accessResolver, /userValues/);
  assert.match(accessResolver, /overrideValue \?\? roleValue \?\? false/);
  assert.match(portalContext, /getOrganizationAccess/);
  assert.match(portalContext, /permissions: Array\.from\(access\.permissions\)/);
  assert.match(portalContext, /access\.menus\.flatMap/);
  assert.match(dashboardActions, /actionContext\(formData, "customer_properties", "create"\)/);
  assert.match(dashboardActions, /actionContext\(formData, "customer_payments", "create"\)/);
  assert.match(adminViewContent + adminManagementViews, /RolePermissionMatrix/);
  assert.match(adminViewContent + adminManagementViews, /UserPermissionMatrix/);
});
