import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function source(relativePath) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const telegramLib = source("../lib/telegram/notifications.ts");
const adminActions = source("../app/(admin)/admin/actions.ts");
const adminViews = source("../components/admin/views/AdminManagementViews.tsx");
const createTrialRequest = source("../lib/auth/create-trial-request.ts");
const adminSectionPage = source("../components/admin/AdminSectionPage.tsx");

test("telegram_module_isServerOnlyAndHasRequiredHandlers", () => {
  assert.match(telegramLib, /import "server-only";/);
  assert.match(telegramLib, /export async function getTelegramSettings/);
  assert.match(telegramLib, /export async function sendTelegramMessage/);
  assert.match(telegramLib, /export async function testTelegramMessage/);
  assert.match(telegramLib, /export async function notifyNewTrialRequest/);
  assert.match(telegramLib, /export async function notifyNewPaymentSubmission/);
  assert.match(telegramLib, /export async function notifyNewRepairRequest/);
});

test("telegram_adminActions_saveAndTestTelegramSettings", () => {
  assert.match(adminActions, /export async function saveTelegramSettingsAction/);
  assert.match(adminActions, /export async function testTelegramSettingsAction/);
  assert.match(adminActions, /key: "telegram_settings"/);
  assert.match(adminActions, /testTelegramMessage\(/);
});

test("telegram_adminViews_hasTelegramFormAndControls", () => {
  assert.match(adminViews, /saveTelegramSettingsAction/);
  assert.match(adminViews, /testTelegramSettingsAction/);
  assert.match(adminViews, /name="botToken"/);
  assert.match(adminViews, /name="chatId"/);
  assert.match(adminViews, /name="notifyTrialRequests"/);
  assert.match(adminViews, /name="notifyPaymentSubmissions"/);
  assert.match(adminViews, /name="notifyRepairRequests"/);
});

test("telegram_trialRequest_triggersNotification", () => {
  assert.match(createTrialRequest, /notifyNewTrialRequest\(/);
});

test("telegram_adminSectionPage_loadsTelegramSettings", () => {
  assert.match(adminSectionPage, /getTelegramSettings\(\)/);
  assert.match(adminSectionPage, /telegramSettings={telegramSettings}/);
});

test("telegram_trialRequest_deduplicatesAndPreventsRepeatedNotifications", () => {
  assert.match(telegramLib, /export function isDuplicateNotification/);
  assert.match(telegramLib, /export function markNotified/);
  assert.match(telegramLib, /isDuplicateNotification\(dedupKeys\)/);
  assert.match(telegramLib, /Duplicate trial notification skipped/);
  assert.match(createTrialRequest, /requestId: trialRequestId/);
});
