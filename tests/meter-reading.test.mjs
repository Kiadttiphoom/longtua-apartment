import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getMeterReadingDefaults, getRelatedPeriodMonth } from "../lib/portal/meter-reading.mjs";

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
    mode: "edit", previousValue: "140", currentValue: "190", sourcePeriod: "2026-07",
  });
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
});
