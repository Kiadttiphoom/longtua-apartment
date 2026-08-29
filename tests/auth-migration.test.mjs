import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const foundationMigrationUrl = new URL(
  "../supabase/migrations/20260828070647_auth_foundation.sql",
  import.meta.url,
);
const trialMigrationUrl = new URL(
  "../supabase/migrations/20260829103004_trial_approval_workflow.sql",
  import.meta.url,
);
const foundationMigration = readFileSync(fileURLToPath(foundationMigrationUrl), "utf8");
const trialMigration = readFileSync(fileURLToPath(trialMigrationUrl), "utf8");

test("authMigration_trialRequestRequiresApprovalBeforeCreatingOrganization", () => {
  assert.match(trialMigration, /function public\.create_trial_request\(/);
  assert.match(trialMigration, /function public\.approve_trial_request\(/);
  assert.match(trialMigration, /started_at \+ interval '30 days'/);
  assert.match(trialMigration, /insert into public\.organization_members/);
  assert.match(trialMigration, /insert into public\.subscriptions/);
  assert.match(trialMigration, /drop function if exists public\.complete_owner_signup/);
});

test("authMigration_usernameAlias_isServerOnlyAndRlsProtected", () => {
  assert.match(foundationMigration, /alter table public\.auth_login_aliases enable row level security/);
  assert.match(foundationMigration, /revoke all on table public\.auth_login_aliases from anon, authenticated/);
  assert.match(foundationMigration, /grant all on table public\.auth_login_aliases[^;]+to service_role/s);
});

test("authMigration_tenantTables_requireAuthenticatedOrganizationMembership", () => {
  assert.match(foundationMigration, /membership\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(foundationMigration, /create policy organizations_select_member/);
  assert.match(foundationMigration, /create policy organization_members_select_member/);
  assert.match(foundationMigration, /create policy subscriptions_select_member/);
  assert.match(foundationMigration, /grant select on table public\.profiles, public\.organizations, public\.organization_members, public\.subscriptions to authenticated/);
});
