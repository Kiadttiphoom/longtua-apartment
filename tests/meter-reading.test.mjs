import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { formatThaiBillingMonth, getBangkokPeriodMonth, getBangkokToday, getMeterReadingDefaults, getRelatedPeriodMonth } from "../lib/portal/meter-reading.mjs";
import { validateMeter } from "../lib/portal/validation.mjs";

test("meterReading_formatsDatabaseDateAndMonthForDisplay", () => {
  assert.equal(formatThaiBillingMonth("2026-09-01"), formatThaiBillingMonth("2026-09"));
  assert.match(formatThaiBillingMonth("2026-09-01"), /2569/);
  assert.equal(formatThaiBillingMonth(""), "");
});

test("meterReading_usesBangkokDateForCurrentDayAndMonth", () => {
  const nearMidnightUtc = new Date("2026-09-10T18:30:00.000Z");
  assert.equal(getBangkokToday(nearMidnightUtc), "2026-09-11");
  assert.equal(getBangkokPeriodMonth(nearMidnightUtc), "2026-09");
});

test("meterReading_rejectsFuturePeriodAndReadingDate", () => {
  const base = { propertyId: "11111111-1111-4111-8111-111111111111", roomId: "22222222-2222-4222-8222-222222222222", previousValue: "100", currentValue: "120" };
  assert.equal(validateMeter({ ...base, periodMonth: "2026-10", recordedAt: "2026-09-11" }, "2026-09-11").periodMonth, "ไม่สามารถจดมิเตอร์ล่วงหน้าเกินเดือนปัจจุบันได้");
  assert.equal(validateMeter({ ...base, periodMonth: "2026-09", recordedAt: "2026-09-12" }, "2026-09-11").recordedAt, "วันที่จดจริงต้องไม่เกินวันนี้");
  assert.deepEqual(validateMeter({ ...base, periodMonth: "2026-09", recordedAt: "2026-09-11" }, "2026-09-11"), {});
});

const read = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
const readings = [
  { meter_id: "electric-101", period_month: "2026-06-01", previous_value: 100, current_value: 140 },
  { meter_id: "electric-101", period_month: "2026-07-01", previous_value: 140, current_value: 190 },
  { meter_id: "water-101", period_month: "2026-07-01", previous_value: 20, current_value: 25 },
];

test("meterReading_firstEntry_usesZeroAsLockedPreviousValue", () => {
  assert.deepEqual(getMeterReadingDefaults([], "electric-101", "2026-08"), {
    mode: "first", previousValue: "0", currentValue: "", sourcePeriod: null,
  });
  assert.match(read("components/portal/MetersPage.tsx"), /name="previousValue"[^>]*readOnly/);
});

test("meterReading_secondEntry_usesLatestCurrentValueAsPreviousValue", () => {
  assert.deepEqual(getMeterReadingDefaults(readings, "electric-101", "2026-08"), {
    mode: "next", previousValue: "190", currentValue: "", sourcePeriod: "2026-07",
  });
});

test("meterReading_existingMonth_loadsStoredValuesForEditing", () => {
  assert.deepEqual(getMeterReadingDefaults(readings, "electric-101", "2026-07"), {
    mode: "edit", previousValue: "140", currentValue: "190", recordedAt: "", sourcePeriod: "2026-07",
  });
});

test("meterReading_existingMonth_keepsActualReadingDate", () => {
  const result = getMeterReadingDefaults([{ ...readings[1], read_at: "2026-07-28T18:00:00.000Z" }], "electric-101", "2026-07");
  assert.equal(result.recordedAt, "2026-07-29");
});

test("meterReading_billingCycleRelation_acceptsObjectAndArrayShapes", () => {
  assert.equal(getRelatedPeriodMonth({ period_month: "2026-08-01" }), "2026-08-01");
  assert.equal(getRelatedPeriodMonth([{ period_month: "2026-08-01" }]), "2026-08-01");
  assert.equal(getRelatedPeriodMonth(null), "");
});

test("meterReading_serverDerivesPreviousValueAndRejectsLowerCurrentValue", () => {
  const actions = read("app/(portal)/resource-actions.ts");
  const start = actions.indexOf("export async function saveMeterReadingAction");
  const end = actions.indexOf("\nexport async function", start + 10);
  const action = actions.slice(start, end);
  assert.doesNotMatch(action, /numberValue\(formData, "previousValue"\)/);
  assert.match(action, /billing_cycles!inner\(period_month\)/);
  assert.match(action, /currentValue < previousValue/);
  assert.match(action, /periodMonth > getBangkokPeriodMonth\(\)/);
  assert.match(action, /recordedAt > getBangkokToday\(\)/);
  assert.match(action, /read_at: `\$\{recordedAt\}T12:00:00\+07:00`/);
});

test("meterReading_serverBlocksEditingWhenInvoiceIsActiveOrPaidOrPendingSlip", () => {
  const actions = read("app/(portal)/resource-actions.ts");
  const start = actions.indexOf("export async function saveMeterReadingAction");
  const end = actions.indexOf("\nexport async function", start + 10);
  const action = actions.slice(start, end);
  assert.match(action, /from\("rent_invoices"\)/);
  assert.match(action, /activeInvoice\.status === "paid"/);
  assert.match(action, /from\("payment_submissions"\)/);
  assert.match(action, /neq\(["']status["'],\s*["']void["']\)/);
});

test("meterReading_deleteRequiresPermissionAndBlocksAnActiveInvoice", () => {
  const actions = read("app/(portal)/resource-actions.ts");
  const start = actions.indexOf("export async function deleteMeterReadingAction");
  const end = actions.indexOf("\nexport async function", start + 10);
  const action = actions.slice(start, end);
  assert.match(action, /actionContext\(formData, "customer_meters", "delete"\)/);
  assert.match(action, /from\("rent_invoices"\)/);
  assert.match(action, /neq\("status", "void"\)/);
  assert.match(action, /from\("meter_readings"\)[\s\S]*\.delete\(\)/);

  const migration = read("supabase/migrations/20260911040255_allow_safe_meter_reading_delete.sql");
  assert.match(migration, /customer_meters/);
  assert.match(migration, /prevent_invoiced_meter_reading_delete/);
  assert.match(migration, /invoice\.status <> 'void'/);
});
