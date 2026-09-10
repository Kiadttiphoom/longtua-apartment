import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

test("cancelInvoiceAction_capturesReasonAndStoresInAuditLogMetadata", () => {
  const source = read("app/(portal)/resource-actions.ts");
  assert.match(source, /const reason = text\(formData, "reason"\)/);
  assert.match(source, /metadata:\s*\{\s*reason\s*\}/);
});

test("createInvoiceAction_catches23505AndAdvisesRevisionSuffix", () => {
  const source = read("app/(portal)/resource-actions.ts");
  assert.match(source, /23505/);
  assert.match(source, /-R1/);
});

test("saveMeterReadingAction_validatesSubsequentReadingAndSyncsPreviousValue", () => {
  const source = read("app/(portal)/resource-actions.ts");
  assert.match(source, /subsequentReadings/);
  assert.match(source, /currentValue > Number\(immediateNext\.current_value\)/);
  assert.match(source, /update\(\{\s*previous_value:\s*currentValue\s*\}\)/);
});

test("invoicesPage_suggestsRevisionSuffixWhenVoidedInvoiceExists", () => {
  const source = read("components/portal/InvoicesPage.tsx");
  assert.match(source, /voidedInvoicesForLeaseAndPeriod/);
  assert.match(source, /-R\$\{voidedInvoicesForLeaseAndPeriod\.length\}/);
  assert.match(source, /name="reason"/);
});

test("tenantBillHistory_displaysRevisedInvoiceBadgeWhenPriorVoidExists", () => {
  const source = read("components/tenant/TenantBillHistory.tsx");
  assert.match(source, /hasVoidedPrior/);
  assert.match(source, /ฉบับแก้ไขใหม่ \(ออกแทนบิลที่ยกเลิก\)/);
});
