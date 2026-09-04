import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SUBSCRIPTION_PLANS, getPlanByQuota } from "../lib/portal/plans.ts";

function read(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

test("subscriptionPlans_matrixMatchesAgreedThailandPricingTiers", () => {
  // Trial: 1 property, 10 rooms, 1 user, 0 THB
  assert.equal(SUBSCRIPTION_PLANS.trial.priceMonthly, 0);
  assert.equal(SUBSCRIPTION_PLANS.trial.maxProperties, 1);
  assert.equal(SUBSCRIPTION_PLANS.trial.maxRooms, 10);
  assert.equal(SUBSCRIPTION_PLANS.trial.maxUsers, 1);

  // Starter: 1 property, 30 rooms, 2 users, 199 THB
  assert.equal(SUBSCRIPTION_PLANS.starter.priceMonthly, 199);
  assert.equal(SUBSCRIPTION_PLANS.starter.maxProperties, 1);
  assert.equal(SUBSCRIPTION_PLANS.starter.maxRooms, 30);
  assert.equal(SUBSCRIPTION_PLANS.starter.maxUsers, 2);

  // Growth: 3 properties, 100 rooms, 5 users, 399 THB
  assert.equal(SUBSCRIPTION_PLANS.growth.priceMonthly, 399);
  assert.equal(SUBSCRIPTION_PLANS.growth.maxProperties, 3);
  assert.equal(SUBSCRIPTION_PLANS.growth.maxRooms, 100);
  assert.equal(SUBSCRIPTION_PLANS.growth.maxUsers, 5);
  assert.equal(SUBSCRIPTION_PLANS.growth.popular, true);

  // Pro: 10 properties, 300 rooms, unlimited users (-1), 699 THB
  assert.equal(SUBSCRIPTION_PLANS.pro.priceMonthly, 699);
  assert.equal(SUBSCRIPTION_PLANS.pro.maxProperties, 10);
  assert.equal(SUBSCRIPTION_PLANS.pro.maxRooms, 300);
  assert.equal(SUBSCRIPTION_PLANS.pro.maxUsers, -1);

  // Business: 999 properties, 500 rooms, unlimited users (-1), 1299 THB
  assert.equal(SUBSCRIPTION_PLANS.business.priceMonthly, 1299);
  assert.equal(SUBSCRIPTION_PLANS.business.maxProperties, 999);
  assert.equal(SUBSCRIPTION_PLANS.business.maxRooms, 500);
  assert.equal(SUBSCRIPTION_PLANS.business.maxUsers, -1);
});

test("getPlanByQuota_correctlyMapsRoomCountsToTiers", () => {
  assert.equal(getPlanByQuota(1, 10).code, "trial");
  assert.equal(getPlanByQuota(1, 30).code, "starter");
  assert.equal(getPlanByQuota(3, 100).code, "growth");
  assert.equal(getPlanByQuota(10, 300).code, "pro");
  assert.equal(getPlanByQuota(999, 500).code, "business");
  assert.equal(getPlanByQuota(1, 5).code, "trial");
  assert.equal(getPlanByQuota(1, 25).code, "starter");
});

test("resourceActions_enforcesPropertyRoomAndUserQuotas", () => {
  const code = read("app/(portal)/resource-actions.ts");
  // Check property quota check
  assert.match(code, /maxProperties != null/);
  assert.match(code, /count >= maxProperties/);
  assert.match(code, /กรุณาอัปเกรดแพ็กเกจเพื่อเพิ่มหอพักใหม่/);

  // Check room quota check
  assert.match(code, /maxRooms != null/);
  assert.match(code, /count \+ requestedRooms\.length > maxRooms/);
  assert.match(code, /กรุณาอัปเกรดแพ็กเกจเพื่อเพิ่มห้อง/);

  // Check member quota check
  assert.match(code, /plan\.maxUsers > 0/);
  assert.match(code, /currentMemberCount >= plan\.maxUsers/);
  assert.match(code, /กรุณาอัปเกรดแพ็กเกจเพื่อเพิ่มผู้ใช้งาน/);
});

test("subscriptionPage_rendersGaugesAndPaidTierCards", () => {
  const code = read("components/portal/SubscriptionPage.tsx");
  assert.match(code, /getPlanByQuota/);
  assert.match(code, /SUBSCRIPTION_PLANS/);
  assert.match(code, /จำนวนหอพัก/);
  assert.match(code, /จำนวนห้องพักรวม/);
  assert.match(code, /ผู้ใช้งานในระบบ/);
  assert.match(code, /paidPlans/);
  assert.match(code, /starter/);
  assert.match(code, /growth/);
  assert.match(code, /pro/);
  assert.match(code, /business/);
  assert.match(code, /p\.pond29/);
  assert.match(code, /063-090-7500/);
  assert.match(code, /official\.longtua@gmail\.com/);
});

test("trialApproval_setsDefaultTrialQuotasToOnePropertyAndTenRooms", () => {
  const actionsCode = read("app/(admin)/admin/actions.ts");
  assert.match(actionsCode, /max_properties: 1, max_rooms: 10/);

  const migrationCode = read("supabase/migrations/20260904160000_subscription_tier_defaults.sql");
  assert.match(migrationCode, /max_properties, max_rooms/);
  assert.match(migrationCode, /1, 10/);
});
