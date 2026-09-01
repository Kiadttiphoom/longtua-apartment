"use client";

import { useMemo, useState } from "react";
import { Banknote, CalendarCheck, Clock3, CreditCard, ExternalLink, FileText, LayoutGrid, ListFilter, Printer, Receipt } from "lucide-react";
import { recordPaymentAction, reviewPaymentSubmissionAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  PortalForm,
  SelectField,
  StatusBadge,
} from "@/components/portal/PortalUI";
import { money, thaiBahtText, thaiDate } from "@/lib/format";
import type { Invoice, Payment, Property, Tenant } from "@/components/portal/types";
import { validatePayment } from "@/lib/portal/validation.mjs";

type PaymentSubmission = {
  id: string;
  tenant_id: string;
  invoice_id: string;
  amount: number;
  paid_at: string;
  method: string;
  reference: string | null;
  slip_path: string;
  note: string | null;
  status: string;
  created_at: string;
  slipUrl: string | null;
};

export function PaymentsPage({
  organizationId,
  payments,
  invoices,
  properties,
  tenants,
  submissions,
  canCreate,
}: {
  organizationId: string;
  payments: Payment[];
  invoices: Invoice[];
  properties: Property[];
  tenants: Tenant[];
  submissions: PaymentSubmission[];
  canCreate: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("all");

  const propertyMap = useMemo(() => new Map(properties.map((item) => [item.id, item.name])), [properties]);
  const tenantMap = useMemo(() => new Map(tenants.map((item) => [item.id, item.full_name])), [tenants]);
  const invoiceMap = useMemo(() => new Map(invoices.map((item) => [item.id, item.invoice_number])), [invoices]);
  const openInvoices = invoices.filter((item) => Number(item.balance_due) > 0 && item.status !== "void");
  const month = new Date().toISOString().slice(0, 7).replace("-", "");

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th");
    return payments.filter(
      (item) =>
        (method === "all" || item.method === method) &&
        (!keyword ||
          [item.receipt_number, propertyMap.get(item.property_id), item.reference].some((value) =>
            value?.toLocaleLowerCase("th").includes(keyword)
          ))
    );
  }, [method, payments, propertyMap, query]);

  const viewingPropName = viewingPayment ? propertyMap.get(viewingPayment.property_id) || "ลองตัว อพาร์ตเมนต์" : "ลองตัว อพาร์ตเมนต์";

  const methodLabel = (m: string) => {
    switch (m) {
      case "cash": return "เงินสด";
      case "transfer": return "โอนธนาคาร";
      case "promptpay": return "พร้อมเพย์ (PromptPay)";
      case "card": return "บัตรเครดิต/เดบิต";
      default: return m;
    }
  };

  return (
    <>
      <PageHeader
        actionLabel={canCreate ? "รับชำระเงิน" : undefined}
        description="บันทึกยอดรับเงินจริงและตัดยอดคงเหลือของใบแจ้งหนี้"
        onAction={() => setOpen(true)}
        title="รับชำระ"
      />

      <section className="portal-summary-strip">
        <div>
          <strong>
            {money(
              payments
                .filter((item) => item.status === "confirmed")
                .reduce((sum, item) => sum + Number(item.amount), 0)
            )}
          </strong>
          <span>รับชำระยืนยันแล้ว</span>
        </div>
        <div>
          <strong>{payments.length.toLocaleString("th-TH")}</strong>
          <span>รายการทั้งหมด</span>
        </div>
        <div>
          <strong>{openInvoices.length.toLocaleString("th-TH")}</strong>
          <span>ใบแจ้งหนี้รอชำระ</span>
        </div>
      </section>

      {submissions.length ? (
        <section className="portal-payment-review">
          <header>
            <div>
              <h2>หลักฐานรอตรวจสอบ (สลิปโอนเงิน)</h2>
              <p>ตรวจยอดและชื่อบัญชีก่อนกดยืนยัน ระบบจะตัดยอดใบแจ้งหนี้ทันที</p>
            </div>
            <span>{submissions.length.toLocaleString("th-TH")} รายการ</span>
          </header>
          <div>
            {submissions.map((item) => (
              <article key={item.id}>
                <div className="portal-review-main">
                  <span>
                    <Clock3 size={19} />
                  </span>
                  <div>
                    <strong>{tenantMap.get(item.tenant_id) ?? "ผู้เช่า"}</strong>
                    <small>
                      {invoiceMap.get(item.invoice_id) ?? "ใบแจ้งหนี้"} · โอนเมื่อ {thaiDate(item.paid_at)}
                    </small>
                  </div>
                  <b>{money(Number(item.amount))}</b>
                </div>
                <dl>
                  <div>
                    <dt>ช่องทาง</dt>
                    <dd>{methodLabel(item.method)}</dd>
                  </div>
                  <div>
                    <dt>อ้างอิง</dt>
                    <dd>{item.reference || "—"}</dd>
                  </div>
                </dl>
                {item.note ? <p>{item.note}</p> : null}
                <footer>
                  {item.slipUrl ? (
                    <a href={item.slipUrl} rel="noreferrer" target="_blank">
                      <ExternalLink size={15} /> เปิดหลักฐานสลิป
                    </a>
                  ) : (
                    <span>ไม่สามารถเปิดไฟล์ได้</span>
                  )}
                  <form
                    action={async (formData) => {
                      await reviewPaymentSubmissionAction(formData);
                    }}
                  >
                    <input name="organizationId" type="hidden" value={organizationId} />
                    <input name="submissionId" type="hidden" value={item.id} />
                    <input name="decision" type="hidden" value="reject" />
                    <input aria-label="เหตุผลที่ส่งกลับ" name="rejectionReason" placeholder="เหตุผลที่ส่งกลับ" required />
                    <button className="portal-secondary" type="submit">
                      ส่งกลับ
                    </button>
                  </form>
                  <form
                    action={async (formData) => {
                      await reviewPaymentSubmissionAction(formData);
                    }}
                  >
                    <input name="organizationId" type="hidden" value={organizationId} />
                    <input name="submissionId" type="hidden" value={item.id} />
                    <input name="decision" type="hidden" value="approve" />
                    <button className="portal-primary" type="submit">
                      ยืนยันยอด
                    </button>
                  </form>
                </footer>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <CollectionToolbar
        actions={
          <div className="portal-view-toggle">
            <button
              aria-label="มุมมองตาราง"
              className={`portal-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              type="button"
            >
              <ListFilter size={15} />
              <span>ตาราง</span>
            </button>
            <button
              aria-label="มุมมองการ์ด"
              className={`portal-view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              <LayoutGrid size={15} />
              <span>การ์ด</span>
            </button>
          </div>
        }
        description={`พบ ${filtered.length.toLocaleString("th-TH")} รายการ`}
        filter={{
          label: "กรองช่องทางชำระ",
          value: method,
          onChange: setMethod,
          options: [
            { value: "all", label: "ทุกช่องทาง" },
            { value: "cash", label: "เงินสด" },
            { value: "transfer", label: "โอนธนาคาร" },
            { value: "promptpay", label: "PromptPay" },
            { value: "card", label: "บัตร" },
            { value: "other", label: "อื่น ๆ" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขที่ใบเสร็จ หอพัก หรือเลขอ้างอิง"
        query={query}
        title="ประวัติรับชำระ"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <div className="portal-table-wrap">
            <DataTable
              headers={[
                "เลขที่ใบเสร็จ",
                "หอพัก / อาคาร",
                "ยอดรับชำระ",
                "ช่องทาง",
                "เลขอ้างอิง",
                "วันที่รับเงิน",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => [
                <div className="portal-lease-room-cell" key="rec">
                  <span className="portal-dormitory-icon-pill" style={{ background: "#ecfdf5", color: "#059669" }}>
                    <Receipt size={16} />
                  </span>
                  <div>
                    <strong>{item.receipt_number}</strong>
                  </div>
                </div>,
                <span key="prop">{propertyMap.get(item.property_id) ?? "—"}</span>,
                <strong key="amount" style={{ color: "#0d9488" }}>
                  {money(Number(item.amount))}
                </strong>,
                <span key="method">{methodLabel(item.method)}</span>,
                <span key="ref" style={{ color: "#64748b", fontSize: "12px" }}>
                  {item.reference || "—"}
                </span>,
                <span key="date">{thaiDate(item.paid_at)}</span>,
                <StatusBadge key="status" status={item.status} />,
                <div className="portal-table-actions" key="actions">
                  <button
                    className="portal-table-action-btn view"
                    onClick={() => setViewingPayment(item)}
                    title="ดูใบเสร็จรับเงิน"
                    type="button"
                  >
                    <FileText size={14} />
                    <span>ดูใบเสร็จ</span>
                  </button>
                  <button
                    className="portal-table-action-btn print"
                    onClick={() => {
                      setViewingPayment(item);
                      setTimeout(() => window.print(), 150);
                    }}
                    title="พิมพ์ใบเสร็จ A4"
                    type="button"
                  >
                    <Printer size={14} />
                  </button>
                </div>,
              ])}
            />
          </div>
        ) : (
          <section className="portal-collection-grid">
            {filtered.map((item) => (
              <article className="portal-record-card payment-card" key={item.id}>
                <header>
                  <span className="portal-record-icon success">
                    <Banknote aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <h2>{item.receipt_number}</h2>
                    <small>{propertyMap.get(item.property_id) ?? "ไม่พบหอพัก"}</small>
                  </div>
                  <StatusBadge status={item.status} />
                </header>

                <div className="portal-payment-amount">
                  <small>ยอดรับชำระ</small>
                  <strong>{money(Number(item.amount))}</strong>
                </div>

                <dl className="portal-record-metrics">
                  <div>
                    <dt>ช่องทาง</dt>
                    <dd>
                      <CreditCard aria-hidden="true" size={14} /> {methodLabel(item.method)}
                    </dd>
                  </div>
                  <div>
                    <dt>เลขอ้างอิง</dt>
                    <dd>{item.reference || "—"}</dd>
                  </div>
                </dl>

                <footer className="portal-lease-card-footer">
                  <div className="portal-lease-card-meta-row">
                    <span>
                      <CalendarCheck aria-hidden="true" size={14} style={{ display: "inline", marginRight: 4 }} />
                      รับชำระเมื่อ {thaiDate(item.paid_at)}
                    </span>
                  </div>
                  <div className="portal-lease-card-actions-grid">
                    <button
                      className="portal-lease-card-btn view"
                      onClick={() => setViewingPayment(item)}
                      title="ดูใบเสร็จรับเงิน"
                      type="button"
                    >
                      <FileText size={15} />
                      <span>ดูใบเสร็จ</span>
                    </button>
                    <button
                      className="portal-lease-card-btn print"
                      onClick={() => {
                        setViewingPayment(item);
                        setTimeout(() => window.print(), 150);
                      }}
                      title="พิมพ์ใบเสร็จ A4"
                      type="button"
                    >
                      <Printer size={15} />
                      <span>พิมพ์ใบเสร็จ</span>
                    </button>
                  </div>
                </footer>
              </article>
            ))}
          </section>
        )
      ) : (
        <EmptyState
          description={
            payments.length
              ? "ลองเปลี่ยนคำค้นหาหรือช่องทางชำระ"
              : "เมื่อรับชำระจากใบแจ้งหนี้ รายการจะปรากฏที่นี่"
          }
          title={payments.length ? "ไม่พบรายการรับชำระ" : "ยังไม่มีรายการรับชำระ"}
        />
      )}

      {/* Official Printable Receipt Modal */}
      {viewingPayment ? (
        <Modal
          className="contract-modal"
          headerActions={
            <div className="portal-modal-header-actions">
              <button
                className="portal-primary"
                onClick={() => window.print()}
                type="button"
              >
                <Printer size={14} />
                <span>พิมพ์ / บันทึก PDF</span>
              </button>
            </div>
          }
          maxWidth={840}
          onClose={() => setViewingPayment(null)}
          title={`ใบเสร็จรับเงิน (${viewingPayment.receipt_number})`}
        >
          <div className="contract-paper" id="print-area">
            <div className="contract-official-header">
              <div className="contract-official-emblem">🏢</div>
              <h1 className="contract-official-title">{viewingPropName}</h1>
              <p className="contract-official-sub">ใบเสร็จรับเงิน / ใบรับฝากชำระ (RECEIPT)</p>
            </div>

            <div className="contract-meta-bar">
              <div>
                <strong>เลขที่ใบเสร็จ:</strong> {viewingPayment.receipt_number}
              </div>
              <div>
                <strong>วันที่รับเงิน:</strong> {thaiDate(viewingPayment.paid_at)}
              </div>
              <div>
                <strong>ช่องทางชำระ:</strong> {methodLabel(viewingPayment.method)}
              </div>
              <div>
                <strong>เลขอ้างอิง:</strong> {viewingPayment.reference || "—"}
              </div>
            </div>

            {/* Receipt Table */}
            <div style={{ margin: "16px 0", border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>ลำดับ</th>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>รายการรับชำระ</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>จำนวนเงินที่ชำระ (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 12px" }}>1</td>
                    <td style={{ padding: "8px 12px" }}>
                      <strong>ชำระเงินค่าห้องพักและสาธารณูปโภค</strong> ({viewingPropName})
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      {money(Number(viewingPayment.amount))}
                    </td>
                  </tr>
                  <tr style={{ background: "#f8fafc", fontWeight: "bold" }}>
                    <td colSpan={2} style={{ padding: "10px 12px", textAlign: "right" }}>
                      ยอดเงินที่รับชำระสุทธิ (PAID TOTAL):
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "12pt", color: "#059669" }}>
                      {money(Number(viewingPayment.amount))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ margin: "10px 0", padding: "8px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: "10pt" }}>
              <strong>จำนวนเงินตัวอักษร:</strong> {thaiBahtText(Number(viewingPayment.amount))}
            </div>

            <p style={{ fontSize: "9.5pt", color: "#64748b", margin: "14px 0 0" }}>
              * ใบเสร็จรับเงินนี้ออกโดยระบบอัตโนมัติของ {viewingPropName} และมีผลสมบูรณ์เมื่อตัดยอดสำเร็จ
            </p>

            {/* Signatures */}
            <div className="contract-signatures-grid" style={{ marginTop: 24 }}>
              <div className="contract-sig-item">
                <p>ลงชื่อ ............................................................ ผู้รับเงิน</p>
                <div className="sig-line" />
                <p>({viewingPropName})</p>
                <p>ผู้มีอำนาจลงนาม / ฝ่ายการเงิน</p>
              </div>
              <div className="contract-sig-item">
                <p>ลงชื่อ ............................................................ ผู้ชำระเงิน</p>
                <div className="sig-line" />
                <p>(............................................................)</p>
                <p>ผู้ชำระเงิน</p>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Record Payment Modal */}
      {open ? (
        <Modal
          description="เลือกใบแจ้งหนี้และระบุยอดที่รับจริง ระบบรองรับการชำระบางส่วน"
          onClose={() => setOpen(false)}
          title="รับชำระเงิน"
        >
          <PortalForm
            action={recordPaymentAction}
            onSuccess={() => setOpen(false)}
            organizationId={organizationId}
            submitLabel="ยืนยันรับชำระ"
            validate={validatePayment}
          >
            {(errors, clear) => (
              <>
                <SelectField
                  clear={clear}
                  error={errors.invoiceId}
                  label="ใบแจ้งหนี้"
                  name="invoiceId"
                  onChange={(value, form) => {
                    const invoice = openInvoices.find((item) => item.id === value);
                    if (invoice && form) {
                      (form.elements.namedItem("amount") as HTMLInputElement).value = String(
                        invoice.balance_due
                      );
                    }
                  }}
                  options={openInvoices.map((item) => ({
                    value: item.id,
                    label: `${item.invoice_number} · คงเหลือ ${money(Number(item.balance_due))}`,
                  }))}
                  required
                />
                <div className="portal-form-grid">
                  <Field
                    clear={clear}
                    defaultValue={`REC-${month}-${String(payments.length + 1).padStart(4, "0")}`}
                    error={errors.receiptNumber}
                    label="เลขที่ใบเสร็จ"
                    name="receiptNumber"
                    required
                  />
                  <Field
                    clear={clear}
                    error={errors.amount}
                    label="ยอดรับชำระ"
                    min="0.01"
                    name="amount"
                    required
                    step="0.01"
                    type="number"
                  />
                </div>
                <SelectField
                  clear={clear}
                  defaultValue="transfer"
                  error={errors.method}
                  label="ช่องทาง"
                  name="method"
                  options={[
                    { value: "cash", label: "เงินสด" },
                    { value: "transfer", label: "โอนธนาคาร" },
                    { value: "promptpay", label: "PromptPay" },
                    { value: "card", label: "บัตร" },
                    { value: "other", label: "อื่น ๆ" },
                  ]}
                  required
                />
                <Field clear={clear} error={errors.reference} label="เลขอ้างอิง" name="reference" />
              </>
            )}
          </PortalForm>
        </Modal>
      ) : null}
    </>
  );
}
