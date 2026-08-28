import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function source(relativePath) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const dashboardPage = source("../app/dashboard/page.tsx");
const productionDashboard = source("../components/dashboard/ApartmentDashboard.tsx");
const demoPage = source("../app/demo/page.tsx");
const migration = source("../supabase/migrations/20260828083714_apartment_core.sql");

test("productionDashboard_isSeparatedFromDemoComponentAndBrowserStorage", () => {
  assert.doesNotMatch(dashboardPage, /ApartmentDemo/);
  assert.match(dashboardPage, /ApartmentDashboard/);
  assert.doesNotMatch(productionDashboard, /localStorage|INITIAL_PROPERTIES|สมชายแมนชั่น/);
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
    assert.match(dashboardPage, queryPattern);
  }
});
