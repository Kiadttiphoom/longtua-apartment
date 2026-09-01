"use client";

import { useMemo, useState } from "react";
import { Building2, CalendarClock, FileText, LayoutGrid, ListFilter, Pencil, Printer, ReceiptText, TriangleAlert } from "lucide-react";
import { createInvoiceAction, updateInvoiceAction } from "@/app/(portal)/resource-actions";
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
import { calculateInvoiceBreakdown, invoiceMissingMessage } from "@/lib/portal/invoice-calculation.mjs";
import type { Invoice, Lease, Meter, MeterReading, Property, PropertySettings, Room, Tenant } from "@/components/portal/types";
import { validateInvoice } from "@/lib/portal/validation.mjs";

type InvoicesPageProps = {
  organizationId: string;
  invoices: Invoice[];
  leases: Lease[];
  rooms: Room[];
  tenants: Tenant[];
  settings: PropertySettings[];
  meters: Meter[];
  readings: MeterReading[];
  properties?: Property[];
  canCreate: boolean;
  canEdit: boolean;
};

export function InvoicesPage({
  organizationId,
  invoices,
  leases,
  rooms,
  tenants,
  settings,
  meters,
  readings,
  properties = [],
  canCreate,
  canEdit,
}: InvoicesPageProps) {
  const [selected, setSelected] = useState<Invoice | "create" | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [leaseId, setLeaseId] = useState("");
  const [periodMonth, setPeriodMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const editing = selected && selected !== "create" ? selected : null;
  const roomMap = useMemo(() => new Map(rooms.map((item) => [item.id, item])), [rooms]);
  const tenantMap = useMemo(() => new Map(tenants.map((item) => [item.id, item])), [tenants]);
  const propertyMap = useMemo(() => new Map(properties.map((item) => [item.id, item.name])), [properties]);
  const settingsMap = useMemo(() => new Map(settings.map((item) => [item.property_id, item])), [settings]);
  const activeLeases = useMemo(() => leases.filter((item) => item.status === "active"), [leases]);
  const selectedLease = activeLeases.find((item) => item.id === leaseId);

  const preview = useMemo(
    () =>
      calculateInvoiceBreakdown({
        lease: selectedLease,
        settings: selectedLease ? settingsMap.get(selectedLease.property_id) : undefined,
        meters,
        readings,
        periodMonth,
      }),
    [selectedLease, settingsMap, meters, readings, periodMonth]
  );

  const month = new Date().toISOString().slice(0, 7).replace("-", "");
  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th");
    return invoices.filter(
      (item) =>
        (status === "all" || item.status === status) &&
        (!keyword ||
          [item.invoice_number, roomMap.get(item.room_id)?.room_number, item.note].some((value) =>
            value?.toLocaleLowerCase("th").includes(keyword)
          ))
    );
  }, [invoices, query, roomMap, status]);

  // Data for viewing invoice
  const viewingRoom = viewingInvoice ? roomMap.get(viewingInvoice.room_id) : null;
  const viewingLease = viewingInvoice ? leases.find((l) => l.id === viewingInvoice.lease_id) || leases.find((l) => l.room_id === viewingInvoice.room_id && l.status === "active") : null;
  const viewingTenant = viewingLease ? tenantMap.get(viewingLease.primary_tenant_id) : null;
  const viewingPropName = viewingInvoice ? propertyMap.get(viewingInvoice.property_id) || "ลองตัว อพาร์ตเมนต์" : "ลองตัว อพาร์ตเมนต์";
  const viewingSettings = viewingInvoice ? settingsMap.get(viewingInvoice.property_id) : null;

  return (
    <>
      <PageHeader
        actionLabel={canCreate ? "ออกใบแจ้งหนี้" : undefined}
        description="คำนวณค่าเช่า ค่าน้ำ และค่าไฟจากสัญญาและมิเตอร์ของรอบเดือนโดยอัตโนมัติ"
        onAction={() => {
          setSelected("create");
          setLeaseId("");
          setPeriodMonth(new Date().toISOString().slice(0, 7));
        }}
        title="ใบแจ้งหนี้"
      />

      <section className="portal-summary-strip">
        <div>
          <strong>{invoices.length.toLocaleString("th-TH")}</strong>
          <span>ใบแจ้งหนี้ทั้งหมด</span>
        </div>
        <div>
          <strong>
            {money(invoices.reduce((sum, item) => sum + Number(item.total), 0))}
          </strong>
          <span>ยอดเรียกเก็บรวม</span>
        </div>
        <div>
          <strong>
            {money(invoices.reduce((sum, item) => sum + Number(item.balance_due), 0))}
          </strong>
          <span>ยอดคงเหลือค้างชำระ</span>
        </div>
      </section>

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
        description={`พบ ${filtered.length.toLocaleString("th-TH")} เอกสาร`}
        filter={{
          label: "กรองสถานะใบแจ้งหนี้",
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "ทุกสถานะ" },
            { value: "issued", label: "รอชำระ" },
            { value: "partial", label: "ชำระบางส่วน" },
            { value: "paid", label: "ชำระแล้ว" },
            { value: "overdue", label: "เกินกำหนด" },
            { value: "void", label: "ยกเลิก" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขที่ใบแจ้งหนี้ ห้อง หรือหมายเหตุ"
        query={query}
        title="รายการใบแจ้งหนี้"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <div className="portal-table-wrap">
            <DataTable
              headers={[
                "เลขที่เอกสาร / ห้อง",
                "ผู้เช่า",
                "ยอดรวม",
                "ยอดคงเหลือ",
                "ครบกำหนด",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => {
                const room = roomMap.get(item.room_id);
                const lease = leases.find((l) => l.id === item.lease_id) || leases.find((l) => l.room_id === item.room_id && l.status === "active");
                const tenant = lease ? tenantMap.get(lease.primary_tenant_id) : undefined;

                return [
                  <div className="portal-lease-room-cell" key="inv">
                    <span className="portal-lease-room-pill">{room?.room_number ?? "—"}</span>
                    <div className="portal-lease-tenant-meta">
                      <strong>{item.invoice_number}</strong>
                      <small>ออกเมื่อ {thaiDate(item.issued_at)}</small>
                    </div>
                  </div>,
                  <div className="portal-room-tenant-cell" key="tenant">
                    {tenant ? (
                      <>
                        <strong>{tenant.full_name}</strong>
                        <small>{tenant.phone ? `โทร. ${tenant.phone}` : "—"}</small>
                      </>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>— ไม่ระบุ —</span>
                    )}
                  </div>,
                  <strong key="total">{money(Number(item.total))}</strong>,
                  <strong
                    key="balance"
                    style={{
                      color: Number(item.balance_due) > 0 ? "#e11d48" : "#0d9488",
                    }}
                  >
                    {money(Number(item.balance_due))}
                  </strong>,
                  <div className="portal-lease-date-meta" key="due">
                    <strong>{thaiDate(item.due_at)}</strong>
                  </div>,
                  <StatusBadge key="status" status={item.status} />,
                  <div className="portal-table-actions" key="actions">
                    <button
                      className="portal-table-action-btn view"
                      onClick={() => setViewingInvoice(item)}
                      title="ดูใบแจ้งหนี้"
                      type="button"
                    >
                      <ReceiptText size={14} />
                      <span>ดูบิล</span>
                    </button>
                    <button
                      className="portal-table-action-btn print"
                      onClick={() => {
                        setViewingInvoice(item);
                        setTimeout(() => window.print(), 150);
                      }}
                      title="พิมพ์ใบแจ้งหนี้ A4"
                      type="button"
                    >
                      <Printer size={14} />
                    </button>
                    {canEdit && !["paid", "void"].includes(item.status) ? (
                      <button
                        className="portal-table-action-btn edit"
                        onClick={() => setSelected(item)}
                        title="แก้ไขใบแจ้งหนี้"
                        type="button"
                      >
                        <Pencil size={14} />
                      </button>
                    ) : null}
                  </div>,
                ];
              })}
            />
          </div>
        ) : (
          <section className="portal-collection-grid">
            {filtered.map((item) => {
              const room = roomMap.get(item.room_id);
              const lease = leases.find((l) => l.id === item.lease_id) || leases.find((l) => l.room_id === item.room_id && l.status === "active");
              const tenant = lease ? tenantMap.get(lease.primary_tenant_id) : undefined;

              return (
                <article className="portal-record-card invoice-card" key={item.id}>
                  <header>
                    <span className="portal-record-icon">
                      <ReceiptText aria-hidden="true" size={20} />
                    </span>
                    <div>
                      <h2>{item.invoice_number}</h2>
                      <small>
                        ห้อง {room?.room_number ?? "—"} · ออกเมื่อ {thaiDate(item.issued_at)}
                      </small>
                    </div>
                    <StatusBadge status={item.status} />
                  </header>

                  <div className="portal-invoice-balance">
                    <div>
                      <small>ยอดรวม</small>
                      <strong>{money(Number(item.total))}</strong>
                    </div>
                    <div className={Number(item.balance_due) > 0 ? "outstanding" : ""}>
                      <small>คงเหลือ</small>
                      <strong>{money(Number(item.balance_due))}</strong>
                    </div>
                  </div>

                  <div className="portal-room-tenant-strip" style={{ marginTop: 8 }}>
                    {tenant ? (
                      <span style={{ fontSize: "12px", color: "#334155" }}>
                        ผู้เช่า: <strong>{tenant.full_name}</strong>
                      </span>
                    ) : null}
                  </div>

                  <footer className="portal-lease-card-footer">
                    <div className="portal-lease-card-meta-row">
                      <span>
                        <CalendarClock aria-hidden="true" size={13} style={{ display: "inline", marginRight: 4 }} />
                        ครบกำหนด: {thaiDate(item.due_at)}
                      </span>
                    </div>
                    <div className="portal-lease-card-actions-grid">
                      <button
                        className="portal-lease-card-btn view"
                        onClick={() => setViewingInvoice(item)}
                        title="ดูใบแจ้งหนี้"
                        type="button"
                      >
                        <FileText size={15} />
                        <span>ดูใบแจ้งหนี้</span>
                      </button>
                      <button
                        className="portal-lease-card-btn print"
                        onClick={() => {
                          setViewingInvoice(item);
                          setTimeout(() => window.print(), 150);
                        }}
                        title="พิมพ์ใบแจ้งหนี้ A4"
                        type="button"
                      >
                        <Printer size={15} />
                        <span>พิมพ์บิล A4</span>
                      </button>
                      {canEdit && !["paid", "void"].includes(item.status) ? (
                        <button
                          className="portal-lease-card-btn edit"
                          onClick={() => setSelected(item)}
                          style={{ gridColumn: "span 2" }}
                          title="แก้ไขใบแจ้งหนี้"
                          type="button"
                        >
                          <Pencil size={15} />
                          <span>แก้ไขข้อมูลบิล</span>
                        </button>
                      ) : null}
                    </div>
                  </footer>
                </article>
              );
            })}
          </section>
        )
      ) : (
        <EmptyState
          description={
            invoices.length
              ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ"
              : "สร้างสัญญาและบันทึกมิเตอร์ของรอบเดือน แล้วระบบจะคำนวณรายการให้อัตโนมัติ"
          }
          title={invoices.length ? "ไม่พบใบแจ้งหนี้" : "ยังไม่มีใบแจ้งหนี้"}
        />
      )}

      {/* Official Printable Invoice Modal */}
      {viewingInvoice ? (
        <Modal
          className="contract-modal"
          headerActions={
            <div className="portal-modal-header-actions">
              {canEdit && !["paid", "void"].includes(viewingInvoice.status) ? (
                <button
                  className="portal-secondary"
                  onClick={() => {
                    const target = viewingInvoice;
                    setViewingInvoice(null);
                    setSelected(target);
                  }}
                  type="button"
                >
                  <Pencil size={14} />
                  <span>แก้ไขบิล</span>
                </button>
              ) : null}
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
          onClose={() => setViewingInvoice(null)}
          title={`ใบแจ้งหนี้ · ห้อง ${viewingRoom?.room_number ?? "—"} (${viewingInvoice.invoice_number})`}
        >
          <div className="contract-paper" id="print-area">
            <div className="contract-official-header">
              <div className="contract-official-emblem">🏢</div>
              <h1 className="contract-official-title">{viewingPropName}</h1>
              <p className="contract-official-sub">ใบแจ้งหนี้ / ใบเรียกเก็บเงินประจำเดือน (INVOICE / BILL)</p>
            </div>

            <div className="contract-meta-bar">
              <div>
                <strong>เลขที่เอกสาร:</strong> {viewingInvoice.invoice_number}
              </div>
              <div>
                <strong>ห้องพัก:</strong> ห้อง {viewingRoom?.room_number ?? "—"}
              </div>
              <div>
                <strong>วันที่ออก:</strong> {thaiDate(viewingInvoice.issued_at)}
              </div>
              <div>
                <strong>ครบกำหนด:</strong> {thaiDate(viewingInvoice.due_at)}
              </div>
            </div>

            <div style={{ margin: "14px 0", fontSize: "11pt", lineHeight: 1.6 }}>
              <p style={{ margin: "0 0 4px" }}>
                <strong>ผู้เช่า / ผู้รับบริการ:</strong> {viewingTenant?.full_name ?? "—"}
                {viewingTenant?.phone ? ` (โทร. ${viewingTenant.phone})` : ""}
              </p>
            </div>

            {/* Breakdown Table */}
            <div style={{ margin: "16px 0", border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>ลำดับ</th>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>รายการค่าใช้จ่าย</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 12px" }}>1</td>
                    <td style={{ padding: "8px 12px" }}>
                      <strong>ค่าเช่าห้องพัก</strong> (ห้อง {viewingRoom?.room_number ?? "—"})
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      {money(Number(viewingLease?.rent_amount ?? viewingInvoice.subtotal))}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 12px" }}>2</td>
                    <td style={{ padding: "8px 12px" }}>
                      <strong>ค่าน้ำประปา / ค่าไฟฟ้า</strong> (คำนวณตามมิเตอร์และอัตราที่กำหนด)
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      {money(Math.max(0, Number(viewingInvoice.total) - Number(viewingLease?.rent_amount ?? 0)))}
                    </td>
                  </tr>
                  <tr style={{ background: "#f8fafc", fontWeight: "bold" }}>
                    <td colSpan={2} style={{ padding: "10px 12px", textAlign: "right" }}>
                      ยอดรวมสุทธิ (TOTAL AMOUNT):
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "12pt", color: "#0f172a" }}>
                      {money(Number(viewingInvoice.total))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ margin: "10px 0", padding: "8px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: "10pt" }}>
              <strong>จำนวนเงินตัวอักษร:</strong> {thaiBahtText(Number(viewingInvoice.total))}
            </div>

            {/* Payment & PromptPay info */}
            <div style={{ margin: "16px 0", padding: "12px", border: "1px dashed #94a3b8", borderRadius: 8, fontSize: "9.5pt", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ display: "block", marginBottom: 4, color: "#1e293b" }}>ช่องทางการชำระเงิน:</strong>
                <p style={{ margin: "2px 0" }}>
                  พร้อมเพย์ / บัญชีธนาคาร: <strong>{viewingSettings?.promptpay_id || "ติดต่อเจ้าของหอพัก"}</strong>
                </p>
                <p style={{ margin: "2px 0" }}>
                  ชื่อบัญชี: <strong>{viewingSettings?.account_name || viewingPropName}</strong>
                </p>
                <small style={{ color: "#64748b" }}>
                  * กรุณาชำระเงินภายในวันที่ <strong>{thaiDate(viewingInvoice.due_at)}</strong> และส่งสลิปผ่านระบบ Tenant Portal
                </small>
              </div>
            </div>

            {/* Signatures */}
            <div className="contract-signatures-grid" style={{ marginTop: 24 }}>
              <div className="contract-sig-item">
                <p>ลงชื่อ ............................................................ ผู้แจ้งยอด</p>
                <div className="sig-line" />
                <p>({viewingPropName})</p>
                <p>เจ้าหน้าที่ / ผู้จัดการอาคาร</p>
              </div>
              <div className="contract-sig-item">
                <p>ลงชื่อ ............................................................ ผู้รับใบแจ้งหนี้</p>
                <div className="sig-line" />
                <p>({viewingTenant?.full_name ?? "ผู้เช่าห้องพัก"})</p>
                <p>ผู้เช่าห้องพักหมายเลข {viewingRoom?.room_number ?? "—"}</p>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Add / Edit Invoice Modal */}
      {selected ? (
        <Modal
          description={
            editing
              ? "แก้ไขเลขที่เอกสาร วันครบกำหนด และหมายเหตุ"
              : "ยอดทั้งหมดคำนวณจากข้อมูลจริงและตรวจซ้ำบนเซิร์ฟเวอร์"
          }
          onClose={() => setSelected(null)}
          title={editing ? `แก้ไข ${editing.invoice_number}` : "ออกใบแจ้งหนี้"}
        >
          <PortalForm
            action={editing ? updateInvoiceAction : createInvoiceAction}
            onSuccess={() => setSelected(null)}
            organizationId={organizationId}
            submitDisabled={!editing && !preview.ready}
            submitDisabledReason={!editing ? invoiceMissingMessage(preview.missing) : undefined}
            submitLabel={editing ? "บันทึกการแก้ไข" : "ออกใบแจ้งหนี้"}
            validate={
              editing
                ? (values) => {
                    const errors: Record<string, string> = {};
                    if (!String(values.invoiceNumber ?? "").trim()) {
                      errors.invoiceNumber = "กรุณากรอกเลขที่ใบแจ้งหนี้";
                    }
                    if (!String(values.dueAt ?? "").trim()) {
                      errors.dueAt = "กรุณาเลือกวันครบกำหนด";
                    }
                    return errors;
                  }
                : validateInvoice
            }
          >
            {(errors, clear) =>
              editing ? (
                <>
                  <input name="invoiceId" type="hidden" value={editing.id} />
                  <div className="portal-readonly">
                    <span>ยอดรวม</span>
                    <strong>{money(Number(editing.total))}</strong>
                  </div>
                  <div className="portal-form-grid">
                    <Field
                      clear={clear}
                      defaultValue={editing.invoice_number}
                      error={errors.invoiceNumber}
                      label="เลขที่ใบแจ้งหนี้"
                      name="invoiceNumber"
                      required
                    />
                    <Field
                      clear={clear}
                      defaultValue={editing.due_at}
                      error={errors.dueAt}
                      label="วันครบกำหนด"
                      name="dueAt"
                      required
                      type="date"
                    />
                  </div>
                  <Field
                    clear={clear}
                    defaultValue={editing.note}
                    error={errors.note}
                    label="หมายเหตุ"
                    name="note"
                  />
                </>
              ) : (
                <>
                  <SelectField
                    clear={clear}
                    error={errors.leaseId}
                    label="สัญญาและห้องพัก"
                    name="leaseId"
                    onChange={setLeaseId}
                    options={activeLeases.map((lease) => ({
                      value: lease.id,
                      label: `ห้อง ${roomMap.get(lease.room_id)?.room_number ?? "—"} · ${tenantMap.get(lease.primary_tenant_id)?.full_name ?? "—"} · ${lease.occupant_count} คน`,
                    }))}
                    required
                    value={leaseId}
                  />
                  <Field
                    clear={clear}
                    defaultValue={periodMonth}
                    error={errors.periodMonth}
                    label="รอบเดือน"
                    name="periodMonth"
                    onChange={setPeriodMonth}
                    required
                    type="month"
                  />
                  <section
                    aria-live="polite"
                    className={`invoice-preview ${selectedLease && !preview.ready ? "is-incomplete" : ""}`}
                  >
                    <header>
                      <span>
                        <ReceiptText aria-hidden="true" size={19} />
                      </span>
                      <div>
                        <strong>สรุปรายการอัตโนมัติ</strong>
                        <small>
                          {selectedLease
                            ? `ห้อง ${roomMap.get(selectedLease.room_id)?.room_number ?? "—"} · ${selectedLease.occupant_count} คน`
                            : "เลือกสัญญาเพื่อดูค่าใช้จ่าย"}
                        </small>
                      </div>
                    </header>
                    {selectedLease ? (
                      <>
                        <div className="invoice-preview-lines">
                          {preview.items.map((item) => (
                            <div key={item.itemType}>
                              <span>
                                <strong>
                                  {item.itemType === "rent"
                                    ? "ค่าเช่า"
                                    : item.itemType === "electric"
                                    ? "ค่าไฟ"
                                    : "ค่าน้ำ"}
                                </strong>
                                <small>{item.description}</small>
                              </span>
                              <b>{money(item.amount)}</b>
                            </div>
                          ))}
                        </div>
                        {!preview.ready ? (
                          <div className="invoice-preview-warning" role="alert">
                            <TriangleAlert aria-hidden="true" size={17} />
                            <span>{invoiceMissingMessage(preview.missing)}</span>
                          </div>
                        ) : null}
                        <footer>
                          <span>ยอดรวมสุทธิ</span>
                          <strong>{money(preview.total)}</strong>
                        </footer>
                      </>
                    ) : (
                      <p>ระบบจะดึงค่าเช่า สูตรค่าน้ำ และเลขมิเตอร์ของรอบเดือนมาแสดงตรงนี้</p>
                    )}
                  </section>
                  <div className="portal-form-grid">
                    <Field
                      clear={clear}
                      defaultValue={`INV-${month}-${String(invoices.length + 1).padStart(4, "0")}`}
                      error={errors.invoiceNumber}
                      label="เลขที่ใบแจ้งหนี้"
                      name="invoiceNumber"
                      required
                    />
                    <Field
                      clear={clear}
                      defaultValue={today}
                      error={errors.dueAt}
                      label="วันครบกำหนด"
                      min={today}
                      name="dueAt"
                      required
                      type="date"
                    />
                  </div>
                  <Field clear={clear} error={errors.note} label="หมายเหตุ" name="note" />
                </>
              )
            }
          </PortalForm>
        </Modal>
      ) : null}
    </>
  );
}
