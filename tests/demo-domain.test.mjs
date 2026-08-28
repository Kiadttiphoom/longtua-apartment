import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateInvoice,
  filterRows,
  toCsv,
  validateLogin,
  validateRegistration,
} from "../components/demo/demo-domain.mjs";

test("calculateInvoice_meterToInvoice_calculatesEveryChargeAndTotal", () => {
  const result = calculateInvoice(
    { tenant: "สมชาย ใจดี", rent: 4500, prevElec: 1000, newElec: 1025 },
    { electricRate: 8, waterRate: 100 },
  );

  assert.deepEqual(result, { units: 25, electricCost: 200, waterCost: 100, total: 4800 });
});

test("calculateInvoice_missingOrBackwardsMeter_doesNotCreateInvoice", () => {
  const settings = { electricRate: 8, waterRate: 100 };
  assert.equal(calculateInvoice({ tenant: "สมชาย ใจดี", rent: 4500, prevElec: 1000, newElec: null }, settings), null);
  assert.equal(calculateInvoice({ tenant: "สมชาย ใจดี", rent: 4500, prevElec: 1000, newElec: 999 }, settings), null);
});

test("calculateInvoice_vacantRoom_neverCreatesTenantInvoice", () => {
  assert.equal(calculateInvoice(
    { tenant: "(ว่าง)", rent: 3500, prevElec: 1000, newElec: 1020 },
    { electricRate: 8, waterRate: 100 },
  ), null);
});

test("filterRows_searchAndColumnFilter_returnsOnlyMatchingPayment", () => {
  const rows = [
    ["27 ส.ค. 2569", "201 · ธนกร", "INV-003", "฿5,315", "โอนเงิน"],
    ["26 ส.ค. 2569", "101 · สมชาย", "INV-001", "฿4,788", "เงินสด"],
  ];

  assert.deepEqual(filterRows(rows, "201", [{ column: 4, value: "โอนเงิน" }]), [rows[0]]);
  assert.deepEqual(filterRows(rows, "201", [{ column: 4, value: "เงินสด" }]), []);
});

test("validateLogin_invalidCredentials_returnsActionableFieldErrors", () => {
  assert.deepEqual(validateLogin({ email: "owner", password: "short" }), {
    email: "กรุณากรอกอีเมลให้ถูกต้อง",
    password: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
  });
});

test("validateRegistration_mismatchedPasswordsAndMissingConsent_blocksSubmission", () => {
  const errors = validateRegistration({
    firstName: "สมชาย",
    lastName: "ใจดี",
    phone: "081-234-5678",
    email: "owner@example.com",
    password: "longtua-demo",
    confirmPassword: "different",
    accepted: false,
  });

  assert.deepEqual(errors, {
    confirmPassword: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
    accepted: "กรุณายอมรับเงื่อนไขการใช้งาน",
  });
});

test("toCsv_quotesThaiTextCommasAndEmbeddedQuotes", () => {
  assert.equal(
    toCsv(["ห้อง", "หมายเหตุ"], [["101", 'ชำระแล้ว, เลขที่ "RCP-001"']]),
    '"ห้อง","หมายเหตุ"\r\n"101","ชำระแล้ว, เลขที่ ""RCP-001"""',
  );
});
