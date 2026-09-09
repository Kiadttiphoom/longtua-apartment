import test from "node:test";
import assert from "node:assert/strict";
import { validateDormitory, validateGuestroom, validateTenant, validateLease, validateMeter, validateInvoice, validatePayment, validateSettings } from "../lib/portal/validation.mjs";

const id = "11111111-1111-4111-8111-111111111111";
const lease = { leaseNumber: "L-101", startDate: "2026-09-09", rentAmount: "3000", depositAmount: "0", advanceAmount: "0", occupantCount: "1" };
const cases = [
  ["dormitories", validateDormitory, { name: "หอพัก" }],
  ["guestrooms", validateGuestroom, { propertyId: id, baseRent: "3000" }],
  ["tenants", validateTenant, { fullName: "ผู้เช่าทดสอบ" }],
  ["leases create", validateLease, { ...lease, propertyId: id, roomId: id, tenantId: id }],
  ["leases edit without hidden creation fields", validateLease, { ...lease, leaseId: id }],
  ["meters", validateMeter, { propertyId: id, roomId: id, meterType: "electric", periodMonth: "2026-09", previousValue: "0", currentValue: "300" }],
  ["invoices create", validateInvoice, { leaseId: id, periodMonth: "2026-09", invoiceNumber: "INV-101", dueAt: "2026-09-30" }],
  ["invoices edit without creation fields", validateInvoice, { invoiceId: id, invoiceNumber: "INV-101", dueAt: "2026-09-30", note: "แก้ไข" }],
  ["payments", validatePayment, { invoiceId: id, receiptNumber: "REC-101", amount: "300" }],
  ["settings", validateSettings, { propertyId: id, waterBillingMethod: "meter", electricRate: "8", waterRate: "18", lateFee: "0", billDay: "1", dueDay: "5" }],
];
for (const [name, validate, values] of cases) {
  test(`${name}: complete submitted values pass validation`, () => assert.deepEqual(validate(values), {}));
}
test("creation still requires related records and document numbers", () => {
  assert.ok(validateLease(lease).propertyId);
  assert.ok(validateInvoice({ invoiceNumber: "INV-101", dueAt: "2026-09-30" }).leaseId);
  assert.deepEqual(validateInvoice({ leaseId: id, periodMonth: "2026-09", dueAt: "2026-09-30" }), {});
});
