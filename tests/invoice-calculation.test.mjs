import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { calculateInvoiceBreakdown, invoiceMissingMessage } from "../lib/portal/invoice-calculation.mjs";

const read = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

const lease = { room_id: "room-101", rent_amount: 2500, occupant_count: 2 };
const meters = [
  { id: "elec-101", room_id: "room-101", meter_type: "electric", status: "active" },
  { id: "water-101", room_id: "room-101", meter_type: "water", status: "active" },
];
const readings = [
  { meter_id: "elec-101", period_month: "2026-08-01", previous_value: 1200, current_value: 1250, usage_value: 50 },
  { meter_id: "water-101", period_month: "2026-08-01", previous_value: 520, current_value: 530, usage_value: 10 },
];

test("invoiceCalculation_meterWater_addsRentElectricAndMeteredWater", () => {
  const result = calculateInvoiceBreakdown({ lease, meters, readings, periodMonth: "2026-08", settings: { electric_rate: 8, water_rate: 20, water_billing_method: "meter" } });
  assert.equal(result.ready, true);
  assert.deepEqual(result.items.map((item) => [item.itemType, item.amount]), [["rent", 2500], ["electric", 400], ["water", 200]]);
  assert.equal(result.total, 3100);
});

test("invoiceCalculation_perPersonWater_multipliesOccupantsByPropertyRate", () => {
  const result = calculateInvoiceBreakdown({ lease, meters, readings, periodMonth: "2026-08", settings: { electric_rate: 8, water_rate: 100, water_billing_method: "per_person" } });
  assert.equal(result.ready, true);
  assert.equal(result.items.find((item) => item.itemType === "water")?.amount, 200);
  assert.equal(result.items.find((item) => item.itemType === "water")?.metadata.occupant_count, 2);
  assert.equal(result.total, 3100);
});

test("invoiceCalculation_flatRoomWater_chargesOneConfiguredRate", () => {
  const result = calculateInvoiceBreakdown({ lease, meters, readings, periodMonth: "2026-08", settings: { electric_rate: 8, water_rate: 100, water_billing_method: "flat_room" } });
  assert.equal(result.items.find((item) => item.itemType === "water")?.amount, 100);
  assert.equal(result.total, 3000);
});

test("invoiceCalculation_missingRequiredMeter_blocksInvoiceWithSpecificMessage", () => {
  const result = calculateInvoiceBreakdown({ lease, meters, readings: [], periodMonth: "2026-08", settings: { electric_rate: 8, water_rate: 20, water_billing_method: "meter" } });
  assert.equal(result.ready, false);
  assert.deepEqual(result.missing, ["electric", "water"]);
  assert.equal(invoiceMissingMessage(result.missing), "ยังไม่มีเลขมิเตอร์ไฟฟ้าและน้ำของรอบเดือนนี้");
});

test("invoiceCreation_serverCalculatesTrustedBreakdownAndStoresSnapshotItems", () => {
  const actions = read("app/(portal)/resource-actions.ts");
  const start = actions.indexOf("export async function createInvoiceAction");
  const end = actions.indexOf("\nexport async function", start + 10);
  const action = actions.slice(start, end);
  assert.doesNotMatch(action, /numberValue\(formData, "total"\)/);
  assert.match(action, /calculateInvoiceBreakdown/);
  assert.match(action, /billing_cycle_id: cycle\.id/);
  assert.match(action, /metadata: \{ \.\.\.item\.metadata, period_month: monthDate, rate_snapshot: item\.unitPrice \}/);
  assert.match(action, /สัญญานี้มีใบแจ้งหนี้ของรอบเดือนดังกล่าวแล้ว/);
});

test("utilityBillingMigration_configuresWaterMethodAndLeaseOccupants", () => {
  const migration = read("supabase/migrations/20260829050055_configurable_utility_billing.sql");
  assert.match(migration, /water_billing_method[\s\S]*'meter'[\s\S]*'per_person'[\s\S]*'flat_room'/);
  assert.match(migration, /occupant_count smallint not null default 1/);
  assert.match(migration, /occupant_count between 1 and 50/);
});
