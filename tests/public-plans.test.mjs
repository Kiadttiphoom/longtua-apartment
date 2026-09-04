import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function source(relativePath) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("publicPlansApi_requiresApiKeyAndValidatesSecurely", () => {
  const route = source("../app/api/public/plans/route.ts");

  assert.match(route, /process\.env\.LONGTUA_PUBLIC_API_KEY/);
  assert.match(route, /timingSafeEqual\(expectedHash, suppliedHash\)/);
  assert.match(route, /createHash\("sha256"\)/);
  assert.match(route, /if \(!hasValidApiKey\(request\)\)[\s\S]*?status: 401/);
  assert.match(route, /from\("subscription_plans"\)/);
  assert.match(route, /FALLBACK_PUBLIC_PLANS/);
  assert.match(route, /success:\s*true/);
  assert.match(route, /faqs:\s*PRICING_FAQS/);
});

test("subscriptionPlansMigration_definesPlansAndUsageTables", () => {
  const migration = source("../supabase/migrations/20260904170000_subscription_plans_and_usage.sql");

  assert.match(migration, /create table if not exists public\.subscription_plans/);
  assert.match(migration, /create table if not exists public\.subscription_usage/);
  assert.match(migration, /alter table public\.subscriptions[\s\S]*?add column if not exists plan_code/);
  assert.match(migration, /alter table public\.subscriptions[\s\S]*?add column if not exists max_slip_verifications/);
  assert.match(migration, /insert into public\.subscription_plans/);
  assert.match(migration, /'trial'[\s\S]*?'Starter'[\s\S]*?'Growth'[\s\S]*?'Pro'[\s\S]*?'Business'/);
  assert.match(migration, /15[\s\S]*?45[\s\S]*?150[\s\S]*?450[\s\S]*?1000/);
});

test("plansHelper_definesPublicPlanStructureAndQuotas", () => {
  const plans = source("../lib/portal/plans.ts");

  assert.match(plans, /export interface PublicPlanItem/);
  assert.match(plans, /maxSlipVerifications:\s*number/);
  assert.match(plans, /export const FALLBACK_PUBLIC_PLANS/);
  assert.match(plans, /id:\s*"trial"[\s\S]*?maxSlipVerifications:\s*15/);
  assert.match(plans, /id:\s*"starter"[\s\S]*?maxSlipVerifications:\s*45/);
  assert.match(plans, /id:\s*"growth"[\s\S]*?maxSlipVerifications:\s*150/);
  assert.match(plans, /id:\s*"pro"[\s\S]*?maxSlipVerifications:\s*450/);
  assert.match(plans, /id:\s*"business"[\s\S]*?maxSlipVerifications:\s*1000/);
});

test("marketingWebsite_hasConfiguredPublicPlansIntegration", () => {
  const marketingPlansFetcher = source("../../longtua/lib/api/plans.ts");
  const marketingEnv = source("../../longtua/.env.example");

  assert.match(marketingPlansFetcher, /process\.env\.LONGTUA_PUBLIC_API_KEY/);
  assert.match(marketingPlansFetcher, /process\.env\.LONGTUA_APARTMENT_API_URL/);
  assert.match(marketingPlansFetcher, /x-api-key/);
  assert.match(marketingPlansFetcher, /next:\s*\{\s*revalidate:\s*300\s*\}/);
  assert.match(marketingEnv, /LONGTUA_PUBLIC_API_KEY=/);
  assert.match(marketingEnv, /LONGTUA_APARTMENT_API_URL=/);
});

test("adminSubscriptions_hasPlanCatalogueAndEditForm", () => {
  const actions = source("../app/(admin)/admin/actions.ts");
  const views = source("../components/admin/views/AdminManagementViews.tsx");
  const sectionPage = source("../components/admin/AdminSectionPage.tsx");
  const adminTypes = source("../components/admin/admin-types.ts");

  assert.match(actions, /export async function saveSubscriptionPlanAction/);
  assert.match(actions, /from\("subscription_plans"\)[\s\S]*?\.upsert\(/);
  assert.match(actions, /subscription_plan\.updated/);

  assert.match(views, /AdminSubscriptionsView/);
  assert.match(views, /subscriptionPlans/);
  assert.match(views, /แคตตาล็อกแพ็กเกจราคา/);
  assert.match(views, /saveSubscriptionPlanAction/);
  assert.match(views, /maxSlipVerifications/);

  assert.match(sectionPage, /from\("subscription_plans"\)/);
  assert.match(sectionPage, /subscriptionPlans=\{subscriptionPlans\}/);

  assert.match(adminTypes, /export type SubscriptionPlan =/);
  assert.match(adminTypes, /subscriptionPlans:\s*SubscriptionPlan\[\]/);
});

