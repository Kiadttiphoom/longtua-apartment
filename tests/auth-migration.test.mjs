import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const migrationUrl = new URL(
  "../supabase/migrations/20260828070647_auth_foundation.sql",
  import.meta.url,
);
const migration = readFileSync(fileURLToPath(migrationUrl), "utf8");

test("authMigration_ownerSignup_createsThirtyDayTrialInSingleDatabaseFunction", () => {
  assert.match(migration, /function public\.complete_owner_signup\(/);
  assert.match(migration, /started_at \+ interval '30 days'/);
  assert.match(migration, /insert into public\.organization_members/);
  assert.match(migration, /insert into public\.subscriptions/);
  assert.match(migration, /'trialing'/);
});

test("authMigration_usernameAlias_isServerOnlyAndRlsProtected", () => {
  assert.match(migration, /alter table public\.auth_login_aliases enable row level security/);
  assert.match(migration, /revoke all on table public\.auth_login_aliases from anon, authenticated/);
  assert.match(migration, /grant all on table public\.auth_login_aliases[^;]+to service_role/s);
});

test("authMigration_tenantTables_requireAuthenticatedOrganizationMembership", () => {
  assert.match(migration, /membership\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /create policy organizations_select_member/);
  assert.match(migration, /create policy organization_members_select_member/);
  assert.match(migration, /create policy subscriptions_select_member/);
  assert.match(migration, /grant select on table public\.profiles, public\.organizations, public\.organization_members, public\.subscriptions to authenticated/);
});
