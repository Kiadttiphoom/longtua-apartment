"use client";

import { useMemo, useState } from "react";
import { CalendarClock, ReceiptText, TriangleAlert } from "lucide-react";
import { createInvoiceAction, updateInvoiceAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import { EditButton, EmptyState, Field, Modal, PageHeader, PortalForm, SelectField, StatusBadge } from "@/components/portal/PortalUI";
import { money, thaiDate } from "@/lib/format";
import { calculateInvoiceBreakdown, invoiceMissingMessage } from "@/lib/portal/invoice-calculation.mjs";
import type { Invoice, Lease, Meter, MeterReading, PropertySettings, Room, Tenant } from "@/components/portal/types";
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
  canCreate: boolean;
  canEdit: boolean;
};

export function InvoicesPage({ organizationId, invoices, leases, rooms, tenants, settings, meters, readings, canCreate, canEdit }: InvoicesPageProps) {
  const [selected, setSelected] = useState<Invoice | "create" | null>(null);
  const [leaseId, setLeaseId] = useState("");
  const [periodMonth, setPeriodMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const editing = selected && selected !== "create" ? selected : null;
  const roomMap = useMemo(() => new Map(rooms.map((item) => [item.id, item])), [rooms]);
  const tenantMap = useMemo(() => new Map(tenants.map((item) => [item.id, item.full_name])), [tenants]);
  const settingsMap = useMemo(() => new Map(settings.map((item) => [item.property_id, item])), [settings]);
  const activeLeases = useMemo(() => leases.filter((item) => item.status === "active"), [leases]);
  const selectedLease = activeLeases.find((item) => item.id === leaseId);
  const preview = useMemo(() => calculateInvoiceBreakdown({ lease: selectedLease, settings: selectedLease ? settingsMap.get(selectedLease.property_id) : undefined, meters, readings, periodMonth }), [selectedLease, settingsMap, meters, readings, periodMonth]);
  const month = new Date().toISOString().slice(0, 7).replace("-", "");
  const today = new Date().toISOString().slice(0, 10);
  const filtered = useMemo(() => { const keyword = query.trim().toLocaleLowerCase("th"); return invoices.filter((item) => (status === "all" || item.status === status) && (!keyword || [item.invoice_number, roomMap.get(item.room_id)?.room_number, item.note].some((value) => value?.toLocaleLowerCase("th").includes(keyword)))); }, [invoices, query, roomMap, status]);

  return <>
    <PageHeader title="ใบแจ้งหนี้" description="คำนวณค่าเช่า ค่าน้ำ และค่าไฟจากสัญญาและมิเตอร์ของรอบเดือนโดยอัตโนมัติ" actionLabel={canCreate ? "ออกใบแจ้งหนี้" : undefined} onAction={() => { setSelected("create"); setLeaseId(""); setPeriodMonth(new Date().toISOString().slice(0, 7)); }} />
    <section className="portal-summary-strip"><div><strong>{invoices.length.toLocaleString("th-TH")}</strong><span>ใบแจ้งหนี้ทั้งหมด</span></div><div><strong>{money(invoices.reduce((sum, item) => sum + Number(item.total), 0))}</strong><span>ยอดเรียกเก็บ</span></div><div><strong>{money(invoices.reduce((sum, item) => sum + Number(item.balance_due), 0))}</strong><span>ยอดคงเหลือ</span></div></section>
    <CollectionToolbar title="รายการใบแจ้งหนี้" description={`พบ ${filtered.length.toLocaleString("th-TH")} เอกสาร`} query={query} onQueryChange={setQuery} placeholder="ค้นหาเลขที่ใบแจ้งหนี้ ห้อง หรือหมายเหตุ" filter={{ label: "กรองสถานะใบแจ้งหนี้", value: status, onChange: setStatus, options: [{ value: "all", label: "ทุกสถานะ" }, { value: "issued", label: "ออกแล้ว" }, { value: "partial", label: "ชำระบางส่วน" }, { value: "paid", label: "ชำระแล้ว" }, { value: "overdue", label: "เกินกำหนด" }, { value: "void", label: "ยกเลิก" }] }} />
    {filtered.length ? <section className="portal-collection-grid">{filtered.map((item) => <article className="portal-record-card invoice-card" key={item.id}><header><span className="portal-record-icon"><ReceiptText aria-hidden="true" size={20} /></span><div><h2>{item.invoice_number}</h2><small>ห้อง {roomMap.get(item.room_id)?.room_number ?? "—"} · ออกเมื่อ {thaiDate(item.issued_at)}</small></div><StatusBadge status={item.status} /></header><div className="portal-invoice-balance"><div><small>ยอดรวม</small><strong>{money(Number(item.total))}</strong></div><div className={Number(item.balance_due) > 0 ? "outstanding" : ""}><small>คงเหลือ</small><strong>{money(Number(item.balance_due))}</strong></div></div><footer><span><CalendarClock aria-hidden="true" size={14} /> ครบกำหนด {thaiDate(item.due_at)}</span>{canEdit && !["paid", "void"].includes(item.status) ? <EditButton label={item.invoice_number} onClick={() => setSelected(item)} /> : null}</footer></article>)}</section> : <EmptyState title={invoices.length ? "ไม่พบใบแจ้งหนี้" : "ยังไม่มีใบแจ้งหนี้"} description={invoices.length ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ" : "สร้างสัญญาและบันทึกมิเตอร์ของรอบเดือน แล้วระบบจะคำนวณรายการให้อัตโนมัติ"} />}
    {selected ? <Modal title={editing ? `แก้ไข ${editing.invoice_number}` : "ออกใบแจ้งหนี้"} description={editing ? "แก้ไขเลขที่เอกสาร วันครบกำหนด และหมายเหตุ" : "ยอดทั้งหมดคำนวณจากข้อมูลจริงและตรวจซ้ำบนเซิร์ฟเวอร์"} onClose={() => setSelected(null)}>
      <PortalForm action={editing ? updateInvoiceAction : createInvoiceAction} organizationId={organizationId} onSuccess={() => setSelected(null)} submitLabel={editing ? "บันทึกการแก้ไข" : "ออกใบแจ้งหนี้"} submitDisabled={!editing && !preview.ready} submitDisabledReason={!editing ? invoiceMissingMessage(preview.missing) : undefined} validate={editing ? (values) => { const errors: Record<string, string> = {}; if (!String(values.invoiceNumber ?? "").trim()) errors.invoiceNumber = "กรุณากรอกเลขที่ใบแจ้งหนี้"; if (!String(values.dueAt ?? "").trim()) errors.dueAt = "กรุณาเลือกวันครบกำหนด"; return errors; } : validateInvoice}>
        {(errors, clear) => editing ? <>
          <input name="invoiceId" type="hidden" value={editing.id} />
          <div className="portal-readonly"><span>ยอดรวม</span><strong>{money(Number(editing.total))}</strong></div>
          <div className="portal-form-grid"><Field label="เลขที่ใบแจ้งหนี้" name="invoiceNumber" required defaultValue={editing.invoice_number} error={errors.invoiceNumber} clear={clear} /><Field label="วันครบกำหนด" name="dueAt" required type="date" defaultValue={editing.due_at} error={errors.dueAt} clear={clear} /></div>
          <Field label="หมายเหตุ" name="note" defaultValue={editing.note} error={errors.note} clear={clear} />
        </> : <>
          <SelectField label="สัญญาและห้องพัก" name="leaseId" required value={leaseId} error={errors.leaseId} clear={clear} options={activeLeases.map((lease) => ({ value: lease.id, label: `ห้อง ${roomMap.get(lease.room_id)?.room_number ?? "—"} · ${tenantMap.get(lease.primary_tenant_id) ?? "—"} · ${lease.occupant_count} คน` }))} onChange={setLeaseId} />
          <Field label="รอบเดือน" name="periodMonth" required type="month" defaultValue={periodMonth} error={errors.periodMonth} clear={clear} onChange={setPeriodMonth} />
          <section className={`invoice-preview ${selectedLease && !preview.ready ? "is-incomplete" : ""}`} aria-live="polite">
            <header><span><ReceiptText aria-hidden="true" size={19} /></span><div><strong>สรุปรายการอัตโนมัติ</strong><small>{selectedLease ? `ห้อง ${roomMap.get(selectedLease.room_id)?.room_number ?? "—"} · ${selectedLease.occupant_count} คน` : "เลือกสัญญาเพื่อดูค่าใช้จ่าย"}</small></div></header>
            {selectedLease ? <>
              <div className="invoice-preview-lines">{preview.items.map((item) => <div key={item.itemType}><span><strong>{item.itemType === "rent" ? "ค่าเช่า" : item.itemType === "electric" ? "ค่าไฟ" : "ค่าน้ำ"}</strong><small>{item.description}</small></span><b>{money(item.amount)}</b></div>)}</div>
              {!preview.ready ? <div className="invoice-preview-warning" role="alert"><TriangleAlert aria-hidden="true" size={17} /><span>{invoiceMissingMessage(preview.missing)}</span></div> : null}
              <footer><span>ยอดรวมสุทธิ</span><strong>{money(preview.total)}</strong></footer>
            </> : <p>ระบบจะดึงค่าเช่า สูตรค่าน้ำ และเลขมิเตอร์ของรอบเดือนมาแสดงตรงนี้</p>}
          </section>
          <div className="portal-form-grid"><Field label="เลขที่ใบแจ้งหนี้" name="invoiceNumber" required defaultValue={`INV-${month}-${String(invoices.length + 1).padStart(4, "0")}`} error={errors.invoiceNumber} clear={clear} /><Field label="วันครบกำหนด" name="dueAt" required type="date" min={today} defaultValue={today} error={errors.dueAt} clear={clear} /></div>
          <Field label="หมายเหตุ" name="note" error={errors.note} clear={clear} />
        </>}
      </PortalForm>
    </Modal> : null}
  </>;
}
