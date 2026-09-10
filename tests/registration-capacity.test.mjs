import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = source("supabase/migrations/20260910094755_limit_trial_organizations.sql");

test("registrationCapacity_capsAllOrganizationsAtTwentyUnderSharedLock", () => {
  assert.match(migration, /security definer\s+set search_path = ''/);
  assert.match(migration, /pg_advisory_xact_lock[\s\S]*?if \(select count\(\*\) from public.organizations\) >= 20 then/);
  assert.match(migration, /errcode = '23514', message = 'registration_organization_limit_reached'/);
  for (const table of ["organizations", "trial_requests"]) {
    assert.match(migration, new RegExp(`before insert on public\\.${table}\\s+for each row execute function private\\.enforce_registration_organization_limit\\(\\)`));
  }
  assert.match(migration, /revoke all on function private.enforce_registration_organization_limit\(\) from public, anon, authenticated/);
  assert.doesNotMatch(migration, /delete from|update public.organizations/i);
});

test("registrationCapacity_checksBeforeAuthCreationAndCleansUpRacingRequest", () => {
  const service = source("lib/auth/create-trial-request.ts");
  assert.ok(service.indexOf("if (capacity.full)") < service.indexOf("admin.auth.admin.createUser("));
  assert.match(service, /if \(capacity.full\)[\s\S]*?registration_full[\s\S]*?403/);
  assert.match(service, /await admin.auth.admin.deleteUser\(authUserId\);\s+if \(requestError\?\.message === "registration_organization_limit_reached"\)/);
  const capacity = source("lib/auth/registration-capacity.ts");
  assert.match(capacity, /REGISTRATION_ORGANIZATION_LIMIT = 20/);
  assert.match(capacity, /count: "exact", head: true/);
  assert.match(capacity, /if \(error \|\| count === null\) throw/);
  assert.match(capacity, /count >= REGISTRATION_ORGANIZATION_LIMIT/);
  assert.doesNotMatch(capacity, /\.eq\("status"/);
});

test("registrationCapacity_fullOrUnknownCapacityDisablesForm", () => {
  const page = source("app/register/page.tsx");
  assert.match(page, /getRegistrationCapacity\(\).catch\(\(\) => null\)/);
  assert.match(page, /registration.enabled && capacity !== null && !capacity.full/);
  assert.match(source("components/auth/RegisterForm.tsx"), /full \? "ขณะนี้ครบจำนวน 20 กิจการแล้ว/);
});

test("registrationCapacity_approvalPrechecksAndReportsDatabaseLimit", () => {
  const actions = source("app/(admin)/admin/actions.ts");
  const approval = actions.slice(actions.indexOf("export async function approveTrialRequestAction"), actions.indexOf("export async function rejectTrialRequestAction"));
  assert.ok(approval.indexOf("if (capacity.full)") < approval.indexOf('rpc("approve_trial_request"'));
  assert.match(approval, /error\?\.message === "registration_organization_limit_reached"\) redirect/);
  assert.match(source("components/admin/AdminViewContent.tsx"), /params.notice/);
});
