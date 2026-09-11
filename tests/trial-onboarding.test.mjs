import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function source(relativePath) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

function functionBody(sql, functionName) {
  const start = sql.indexOf(`create or replace function ${functionName}`);
  assert.notEqual(start, -1, `${functionName} is missing`);
  const next = sql.indexOf("\ncreate or replace function ", start + 1);
  return sql.slice(start, next === -1 ? undefined : next);
}

const migration = source("../supabase/migrations/20260829103004_trial_approval_workflow.sql");

test("trialRegistration_rendersLocalFormWithRegistrationSwitch", () => {
  const page = source("../app/register/page.tsx");
  const form = source("../components/auth/RegisterForm.tsx");
  const action = source("../app/register/actions.ts");
  assert.match(page, /await isRegistrationEnabled/);
  assert.match(page, /enabled=\{registration.configured && registration.enabled && capacity !== null && !capacity.full\}/);
  assert.doesNotMatch(page, /permanentRedirect/);
  assert.match(form, /useActionState\(/);
  assert.match(form, /await registerAction\(previous, formData\)/);
  assert.match(form, /!enabled/);
  assert.match(form, /state.status === "success"/);
  assert.match(action, /await createTrialRequest/);
  assert.match(action, /formData.get\("accepted"\) === "on"/);
  assert.doesNotMatch(form, /TRIAL_REQUEST_API_SECRET/);
});

test("loginUi_hasSupportContactAndSignup", () => {
  const loginForm = source("../components/auth/LoginForm.tsx");
  const loginPage = source("../app/login/page.tsx");

  assert.match(loginForm, /ติดต่อผู้ดูแลระบบ/);
  assert.match(loginForm, /href=\{supportUrl\}/);
  assert.match(loginPage, /supportContactUrl\(\)/);
  assert.match(loginForm, /href="\/register">สมัครสมาชิก/);
});

test("publicTrialApi_requiresServerSecretAndCreatesPendingRequest", () => {
  const route = source("../app/api/public/trial-requests/route.ts");

  assert.match(route, /process\.env\.TRIAL_REQUEST_API_SECRET/);
  assert.match(route, /authorization\.startsWith\("Bearer "\)/);
  assert.match(route, /timingSafeEqual\(expectedHash, suppliedHash\)/);
  assert.match(route, /if \(!hasValidApiSecret\(request\)\)[\s\S]*?401/);
  assert.match(route, /return createTrialRequest\(body, request.nextUrl.origin\)/);
  const service = source("../lib/auth/create-trial-request.ts");
  assert.match(service, /await isRegistrationEnabled\(\)/);
  assert.match(service, /admin\.auth\.admin\.createUser\(/);
  assert.match(service, /admin\.rpc\("create_trial_request"/);
  assert.match(service, /status: "pending"/);
  assert.match(service, /loginUrl: `\$\{appUrl\}\/login`/);
  assert.match(service, /await admin\.auth\.admin\.deleteUser\(authUserId\)/);

  const createRequest = functionBody(migration, "public.create_trial_request");
  assert.match(createRequest, /insert into public\.profiles[\s\S]*?'pending'/);
  assert.match(createRequest, /insert into public\.trial_requests/);
  assert.doesNotMatch(createRequest, /insert into public\.organizations/);
  assert.doesNotMatch(createRequest, /insert into public\.properties/);
  assert.doesNotMatch(createRequest, /insert into public\.subscriptions/);
});

test("pendingApplicants_areRedirectedToRegistrationPendingBeforePortalAccess", () => {
  const authActions = source("../app/auth/actions.ts");
  const loginPage = source("../app/login/page.tsx");
  const homePage = source("../app/page.tsx");
  const portalContext = source("../lib/portal/context.ts");

  assert.match(authActions, /if \(profileStatus === "pending"\) redirect\("\/registration\/pending"\)/);
  assert.match(loginPage, /isPendingApplicant\(userId\)[\s\S]*?redirect\("\/registration\/pending"\)/);
  assert.match(homePage, /isPendingApplicant\(userId\)[\s\S]*?redirect\("\/registration\/pending"\)/);
  assert.match(portalContext, /profile\?\.status === "pending"\) redirect\("\/registration\/pending"\)/);
  assert.equal(existsSync(fileURLToPath(new URL("../app/registration/pending/page.tsx", import.meta.url))), true);
});

test("adminTrialRequests_hasExplicitRouteMenuViewAndReviewActions", () => {
  const adminShell = source("../components/admin/AdminPlatformShell.tsx");
  const adminContent = source("../components/admin/AdminViewContent.tsx");
  const adminView = source("../components/admin/views/AdminManagementViews.tsx");
  const adminActions = source("../app/(admin)/admin/actions.ts");

  assert.equal(existsSync(fileURLToPath(new URL("../app/(admin)/admin/trial-requests/page.tsx", import.meta.url))), true);
  assert.match(adminShell, /\["trial-requests", "คำขอทดลองใช้", ClipboardCheck\]/);
  assert.match(adminContent, /view === "trial-requests"[\s\S]*?<AdminTrialRequestsView/);
  assert.match(adminView, /approveTrialRequestAction/);
  assert.match(adminView, /rejectTrialRequestAction/);
  assert.match(adminActions, /export async function approveTrialRequestAction/);
  assert.match(adminActions, /rpc\("approve_trial_request"/);
  assert.match(adminActions, /export async function rejectTrialRequestAction/);
  assert.match(adminActions, /rpc\("reject_trial_request"/);
});

test("trialApproval_createsExactlyOneOrganizationAndPropertyAndStartsLimitedThirtyDayTrial", () => {
  const approval = functionBody(migration, "public.approve_trial_request");
  const organizationInserts = approval.match(/insert into public\.organizations/g) ?? [];
  const propertyInserts = approval.match(/insert into public\.properties/g) ?? [];

  assert.equal(organizationInserts.length, 1);
  assert.equal(propertyInserts.length, 1);
  assert.match(approval, /started_at timestamptz := clock_timestamp\(\)/);
  assert.match(approval, /ends_at timestamptz := started_at \+ interval '30 days'/);
  assert.match(approval, /insert into public\.subscriptions[\s\S]*?max_properties, max_rooms[\s\S]*?'trialing', started_at, ends_at, ends_at, 1, 100/);
  assert.match(approval, /insert into public\.organization_members[\s\S]*?'owner', 'active'/);
  assert.match(approval, /set status = 'active'/);
  assert.match(approval, /set status = 'approved'/);
});

test("trialDatabase_enforcesOnePropertyAndOneHundredRoomLimits", () => {
  const limits = functionBody(migration, "private.enforce_subscription_limits");

  assert.match(migration, /requested_room_count integer not null check \(requested_room_count between 1 and 100\)/);
  assert.match(migration, /subscriptions_max_properties_positive[\s\S]*?max_properties > 0/);
  assert.match(migration, /subscriptions_max_rooms_positive[\s\S]*?max_rooms > 0/);
  assert.match(limits, /pg_advisory_xact_lock/);
  assert.match(limits, /tg_table_name = 'properties'[\s\S]*?count\(\*\) from public\.properties[\s\S]*?>= property_limit/);
  assert.match(limits, /tg_table_name = 'rooms'[\s\S]*?count\(\*\) from public\.rooms[\s\S]*?>= room_limit/);
  assert.match(migration, /create trigger properties_enforce_subscription_limit[\s\S]*?before insert on public\.properties[\s\S]*?private\.enforce_subscription_limits\(\)/);
  assert.match(migration, /create trigger rooms_enforce_subscription_limit[\s\S]*?before insert on public\.rooms[\s\S]*?private\.enforce_subscription_limits\(\)/);
});
