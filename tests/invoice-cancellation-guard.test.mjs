import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

function isInvoiceCancellable({
  invoice,
  submissions = [],
  canEdit = true,
}) {
  const submissionStatusMap = new Map();
  for (const s of submissions) {
    if (s.invoice_id) {
      if (s.status === "pending") {
        submissionStatusMap.set(s.invoice_id, "pending");
      } else if (s.status === "approved" && !submissionStatusMap.has(s.invoice_id)) {
        submissionStatusMap.set(s.invoice_id, "approved");
      }
    }
  }

  const subStatus = submissionStatusMap.get(invoice.id);
  const hasPendingSubmission = subStatus === "pending";
  const hasApprovedSubmission = subStatus === "approved";
  const isPaidOrPartial = invoice.status === "paid" || invoice.status === "partial" || Number(invoice.balance_due) < Number(invoice.total);

  // ไม่สามารถยกเลิกได้ ถ้ามีสถานะ รออนุมัติ หรืออนุมัติผ่าน
  if (hasPendingSubmission || hasApprovedSubmission || isPaidOrPartial) {
    return false;
  }
  return canEdit && ["draft", "issued", "overdue"].includes(invoice.status) && Number(invoice.balance_due) === Number(invoice.total);
}

test("invoiceCancellation_pendingSubmission_blocksCancellation", () => {
  const invoice = { id: "inv-1", status: "issued", balance_due: 14900, total: 14900 };
  const submissions = [{ id: "sub-1", invoice_id: "inv-1", status: "pending" }];
  assert.equal(isInvoiceCancellable({ invoice, submissions }), false);
});

test("invoiceCancellation_approvedSubmission_blocksCancellation", () => {
  const invoice = { id: "inv-1", status: "issued", balance_due: 14900, total: 14900 };
  const submissions = [{ id: "sub-1", invoice_id: "inv-1", status: "approved" }];
  assert.equal(isInvoiceCancellable({ invoice, submissions }), false);
});

test("invoiceCancellation_paidOrPartial_blocksCancellation", () => {
  assert.equal(isInvoiceCancellable({ invoice: { id: "inv-1", status: "paid", balance_due: 0, total: 14900 } }), false);
  assert.equal(isInvoiceCancellable({ invoice: { id: "inv-1", status: "partial", balance_due: 5000, total: 14900 } }), false);
  assert.equal(isInvoiceCancellable({ invoice: { id: "inv-1", status: "issued", balance_due: 10000, total: 14900 } }), false);
});

test("invoiceCancellation_noSubmissionAndUnpaid_allowsCancellation", () => {
  const invoice = { id: "inv-1", status: "issued", balance_due: 14900, total: 14900 };
  assert.equal(isInvoiceCancellable({ invoice, submissions: [] }), true);
});

test("invoiceCancellation_rejectedSubmission_allowsCancellation", () => {
  const invoice = { id: "inv-1", status: "issued", balance_due: 14900, total: 14900 };
  const submissions = [{ id: "sub-1", invoice_id: "inv-1", status: "rejected" }];
  assert.equal(isInvoiceCancellable({ invoice, submissions }), true);
});

test("resourceActions_cancelInvoiceAction_guardsPendingAndApprovedSubmissions", () => {
  const source = read("app/(portal)/resource-actions.ts");
  assert.match(source, /payment_submissions/);
  assert.match(source, /["']pending["'],\s*["']approved["']/);
  assert.match(source, /ไม่สามารถยกเลิกใบแจ้งหนี้ที่มีรายการชำระเงินรออนุมัติได้/);
});

test("tenantActions_voidInvoice_returnsFriendlyCancelledMessage", () => {
  const source = read("app/(tenant)/tenant/actions.ts");
  assert.match(source, /invoice\.status === ["']void["']/);
  assert.match(source, /ใบแจ้งหนี้นี้ถูกยกเลิกไปแล้ว/);
});
