import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function source(relativePath) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const dashboardPage = source("../app/(portal)/dashboard/page.tsx");
const portalData = source("../lib/portal/data.ts");
const portalShell = source("../components/portal/PortalShell.tsx");
const appNavLink = source("../components/ui/AppNavLink.tsx");
const demoPage = source("../app/demo/page.tsx");
const migration = source("../supabase/migrations/20260828083714_apartment_core.sql");

test("productionDashboard_isSeparatedFromDemoComponentAndBrowserStorage", () => {
  assert.doesNotMatch(dashboardPage, /ApartmentDemo/);
  assert.match(dashboardPage, /DashboardOverview/);
  assert.doesNotMatch(portalShell, /localStorage|INITIAL_PROPERTIES|สมชายแมนชั่น/);
  assert.match(demoPage, /ApartmentDemo/);
});

test("apartmentCoreMigration_containsOperationalTablesAndTenantIsolation", () => {
  for (const table of [
    "properties", "property_settings", "rooms", "tenants", "leases", "meters",
    "billing_cycles", "meter_readings", "rent_invoices", "rent_invoice_items",
    "rent_payments", "rent_payment_allocations", "audit_logs",
  ]) {
    assert.match(migration, new RegExp(`create table public\\.${table} \\(`));
  }

  assert.match(migration, /enable row level security/);
  assert.match(migration, /private\.is_organization_member\(organization_id\)/);
  assert.match(migration, /private\.can_write_organization\(organization_id\)/);
  assert.match(migration, /leases_one_active_per_room_idx/);
});

test("productionDashboard_loadsOnlyRowsForSelectedOrganization", () => {
  for (const table of ["properties", "rooms", "tenants", "leases", "meters", "meter_readings", "rent_invoices", "rent_payments"]) {
    const queryPattern = new RegExp(`from\\(\"${table}\"\\)[\\s\\S]*?eq\\(\"organization_id\", organizationId\\)`);
    assert.match(portalData, queryPattern);
  }
});

test("productionDashboard_schemaFailure_logsOnlyOnServer", () => {
  assert.match(portalData, /serverError\("portal"/);
  assert.doesNotMatch(portalData, /console\.error/);
});

test("activeNavigation_doesNotNavigateToTheCurrentRouteAgain", () => {
  assert.match(portalShell, /AppNavLink/);
  assert.match(appNavLink, /if \(active\) event\.preventDefault\(\)/);
  assert.match(appNavLink, /aria-current=\{active \? "page"/);
});
