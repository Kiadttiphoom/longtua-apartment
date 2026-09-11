import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const organizationId = "11111111-1111-4111-8111-111111111111";
const tenantId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const compiled = ts.transpileModule(read("app/(portal)/resource-actions.ts") + "\nexports.actionContextForTest = actionContext;", {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness({ admin = true, selected = organizationId, signedIn = true, membership = null, allowed = false, missingOrganization = false } = {}) {
  const calls = [];
  const client = {
    auth: { getClaims: async () => ({ data: { claims: signedIn ? { sub: userId } : null } }) },
    from(table) {
      const call = { table, filters: [] };
      calls.push(call);
      const query = {
        select() { return query; },
        eq(key, value) { call.filters.push([key, value]); return query; },
        update(patch) { call.patch = patch; return query; },
        async maybeSingle() {
          const data = {
            organizations: missingOrganization ? null : { id: organizationId },
            subscriptions: { status: admin ? "readonly" : "active", max_properties: 1, max_rooms: 10 },
            organization_members: membership,
            tenants: { id: tenantId },
          }[table] ?? null;
          return { data, error: null };
        },
      };
      return query;
    },
  };
  const exports = {};
  const modules = {
    "@/lib/monitor/events": { scheduleMonitorEvent() {} },
    "next/cache": { revalidatePath() {} },
    "next/headers": { cookies: async () => ({ get: () => selected ? { value: selected } : undefined }) },
    "@/lib/auth/system-admin": { isSystemAdmin: async () => admin },
    "@/lib/portal/context": { IMPERSONATE_ORGANIZATION_COOKIE: "longtua_impersonate_organization" },
    "@/lib/supabase/server": { createClient: async () => client },
    "@/lib/supabase/admin": { createAdminClient: () => { throw new Error("Must retain authenticated client"); } },
    "@/lib/auth/organization-access": { hasOrganizationPermission: async () => allowed },
    "@/lib/portal/validation.mjs": { validateFloor: () => "", validateTenant: () => ({}) },
  };
  vm.runInNewContext(compiled, { exports, require: (name) => modules[name] ?? {}, console, crypto, Date });
  const form = new FormData();
  for (const [key, value] of Object.entries({ organizationId, tenantId, fullName: "ผู้เช่าทดสอบ", status: "active" })) form.set(key, value);
  return { exports, client, calls, form };
}

test("adminManagement_activeAdminUpdatesSelectedOrganizationWithoutMembership", async () => {
  const h = harness();
  const result = await h.exports.updateTenantAction(h.form);
  assert.equal(result.ok, true);
  const update = h.calls.find((call) => call.table === "tenants");
  assert.equal(update.patch.full_name, "ผู้เช่าทดสอบ");
  assert.deepEqual(update.filters, [["id", tenantId], ["organization_id", organizationId]]);
  assert.equal(h.calls.some((call) => call.table === "organization_members"), false);
});

test("adminManagement_rejectsMissingOrDifferentSelectedOrganizationBeforeWrite", async () => {
  for (const selected of [null, tenantId]) {
    const h = harness({ selected });
    assert.equal((await h.exports.updateTenantAction(h.form)).ok, false);
    assert.equal(h.calls.length, 0);
  }
});

test("adminManagement_cookieCannotGrantAdminRightsToOrdinaryUser", async () => {
  const h = harness({ admin: false });
  assert.equal((await h.exports.updateTenantAction(h.form)).ok, false);
  assert.equal(h.calls.some((call) => call.patch), false);
});

test("adminManagement_ordinaryMemberStillRequiresPermission", async () => {
  const h = harness({ admin: false, membership: { role_code: "manager" }, allowed: false });
  assert.equal((await h.exports.updateTenantAction(h.form)).ok, false);
  assert.equal(h.calls.some((call) => call.patch), false);
});

test("adminManagement_preservesAuthenticatedActorAndRejectsMissingOrganization", async () => {
  const h = harness();
  const result = await h.exports.actionContextForTest(h.form, "customer_tenants", "update");
  assert.equal(result.userId, userId);
  assert.equal(result.supabase, h.client);
  for (const options of [{ signedIn: false }, { missingOrganization: true }]) {
    const denied = harness(options);
    assert.equal((await denied.exports.updateTenantAction(denied.form)).ok, false);
    assert.equal(denied.calls.some((call) => call.patch), false);
  }
});

test("adminManagement_allOperationalMenusHaveValidatedManagementDestination", () => {
  const paths = read("lib/portal/admin-management-paths.ts");
  for (const section of ["organizations", "properties", "users", "rooms", "tenants", "leases", "meters", "invoices", "payments", "receivables", "reports"]) {
    assert.match(paths, new RegExp(`${section}: "/`));
  }
  assert.match(read("components/admin/AdminViewContent.tsx"), /AdminManageOrganization section=\{view\}/);
  assert.match(read("app/(admin)/admin/actions.ts"), /Object.hasOwn\(adminManagementPaths, section\)/);
});

test("adminManagement_databaseRequiresActiveAdminAndPreservesMemberRules", () => {
  const sql = read("supabase/migrations/20260910095511_super_admin_portal_management.sql");
  assert.match(sql, /user_id = \(select auth.uid\(\)\) and status = 'active'/);
  assert.match(sql, /private.is_active_system_admin\(\) and exists \(select 1 from public.organizations where id = target_organization_id\)/);
  assert.match(sql, /membership.user_id = \(select auth.uid\(\)\)/);
  assert.match(sql, /coalesce\(user_value.is_allowed, role_value.is_allowed, false\)/);
  assert.doesNotMatch(sql, /user_metadata|disable row level security/);
});
