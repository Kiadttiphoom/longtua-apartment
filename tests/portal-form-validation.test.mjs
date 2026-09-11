import test from "node:test";
import assert from "node:assert/strict";
import { validateDormitory, validateGuestroom, validateTenant, validateLease, validateMeter, validateInvoice, validatePayment, validateSettings } from "../lib/portal/validation.mjs";

const id = "11111111-1111-4111-8111-111111111111";
const lease = { leaseNumber: "L-101", startDate: "2026-09-09", rentAmount: "3000", depositAmount: "0", advanceAmount: "0", occupantCount: "1" };
const cases = [
  ["dormitories", validateDormitory, { name: "หอพัก" }],
  ["guestrooms", validateGuestroom, { propertyId: id, baseRent: "3000", floor: "1" }],
  ["tenants", validateTenant, { fullName: "ผู้เช่าทดสอบ" }],
  ["leases create", validateLease, { ...lease, propertyId: id, roomId: id, tenantId: id }],
  ["leases edit without hidden creation fields", validateLease, { ...lease, leaseId: id }],
  ["meters", validateMeter, { propertyId: id, roomId: id, meterType: "electric", periodMonth: "2026-09", recordedAt: "2026-09-11", previousValue: "0", currentValue: "300" }],
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

test("guestroom floor accepts real labels and rejects unrelated symbols", () => {
  for (const floor of ["1", "G", "B1", "B1/2", "1 ครึ่ง", "ชั้นลอย", "1-2"]) {
    assert.equal(validateGuestroom({ propertyId: id, baseRent: "3000", floor }).floor, undefined);
  }
  assert.match(validateGuestroom({ propertyId: id, baseRent: "3000", floor: "B1$%" }).floor, /ภาษาไทย/);
});

test("tenant accepts the complete optional profile", () => {
  assert.deepEqual(validateTenant({
    fullName: "ผู้เช่าทดสอบ",
    phone: "0812345678",
    email: "tenant@example.com",
    idCardLast4: "1234",
    address: "123 ถนนสุขุมวิท กรุงเทพมหานคร",
    birthDate: "1990-06-15",
    emergencyContactName: "ผู้ติดต่อทดสอบ",
    emergencyContactRelationship: "พี่สาว",
    emergencyContactPhone: "0891112222",
    vehiclePlate: "กข 1234 กรุงเทพมหานคร",
    lineId: "tenant.line",
    notes: "เลี้ยงแมว 1 ตัว",
  }), {});
});

test("tenant emergency contact must be complete when partially entered", () => {
  const errors = validateTenant({ fullName: "ผู้เช่าทดสอบ", emergencyContactName: "ผู้ติดต่อทดสอบ" });
  assert.ok(errors.emergencyContactRelationship);
  assert.ok(errors.emergencyContactPhone);
});

test("tenant rejects invalid and future birth dates", () => {
  assert.ok(validateTenant({ fullName: "ผู้เช่าทดสอบ", birthDate: "2026-02-31" }).birthDate);
  assert.ok(validateTenant({ fullName: "ผู้เช่าทดสอบ", birthDate: "2999-01-01" }).birthDate);
});

test("tenant phone fields accept digits only", () => {
  assert.ok(validateTenant({ fullName: "ผู้เช่าทดสอบ", phone: "081-234-5678" }).phone);
  assert.ok(validateTenant({
    fullName: "ผู้เช่าทดสอบ",
    emergencyContactName: "ผู้ติดต่อทดสอบ",
    emergencyContactRelationship: "มารดา",
    emergencyContactPhone: "089-111-2222",
  }).emergencyContactPhone);
  assert.equal(validateTenant({ fullName: "ผู้เช่าทดสอบ", phone: "0812345678" }).phone, undefined);
});
