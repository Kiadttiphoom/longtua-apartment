"use client";

import { useState } from "react";
import {
  createMeterAdminAction,
  recordMeterReadingAdminAction,
  updateMeterAdminAction,
  deleteMeterAdminAction,
  createInvoiceAdminAction,
  updateInvoiceAdminAction,
  deleteInvoiceAdminAction,
  recordPaymentAdminAction,
  updatePaymentAdminAction,
  deletePaymentAdminAction,
  settleReceivableAdminAction,
} from "@/app/(admin)/admin/actions";
import { AdminManageOrganizationButton } from "@/components/admin/AdminManageOrganization";
import { AdminConfirmDeleteModal, AdminModal, AdminTable, dateInput, money, thaiDate } from "@/components/admin/AdminPrimitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  CheckCircle2,
  CheckSquare,
  FileSpreadsheet,
  Gauge,
  Hotel,
  KeyRound,
  Pencil,
  Plus,
  Receipt,
  ReceiptText,
  Trash2,
  Wallet,
  WalletCards,
  XCircle,
} from "lucide-react";
import type { AdminViewContentProps, Invoice, Meter, Payment } from "@/components/admin/admin-types";

// =========================================================================
// 1. AdminMetersView
// =========================================================================
export function AdminMetersView({
  meters,
  rooms = [],
  properties = [],
  organizations = [],
  organizationMap,
  propertyMap,
  roomMap,
  latestReadingByMeter,
  metersReady,
}: Pick<AdminViewContentProps, "meters" | "organizationMap" | "propertyMap" | "roomMap" | "latestReadingByMeter" | "metersReady"> & {
  rooms?: AdminViewContentProps["rooms"];
  properties?: AdminViewContentProps["properties"];
  organizations?: AdminViewContentProps["organizations"];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [readingTarget, setReadingTarget] = useState<Meter | null>(null);
  const [editTarget, setEditTarget] = useState<Meter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Meter | null>(null);

  // Cascading dropdowns
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedPropId, setSelectedPropId] = useState<string>("");

  const filteredProperties = selectedOrgId
    ? properties.filter((p) => p.organization_id === selectedOrgId)
    : properties;

  const filteredRooms = selectedPropId
    ? rooms.filter((r) => r.property_id === selectedPropId)
    : selectedOrgId
    ? rooms.filter((r) => r.organization_id === selectedOrgId)
    : rooms;

  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ระบบมิเตอร์</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">มิเตอร์น้ำและไฟทั้งหมด ({meters.length})</h2>
          <p className="text-xs text-slate-500 mt-0.5">เพิ่มมิเตอร์ จดเลขมิเตอร์ แก้ไข หรือลบมิเตอร์ได้โดยตรงในฐานะ Super Admin</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedOrgId(organizations[0]?.id ?? "");
            setSelectedPropId("");
            setCreateOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Plus size={16} />
          <span>เพิ่มมิเตอร์ใหม่</span>
        </button>
      </div>

      <AdminTable
        headers={["กิจการ", "หอ/ห้อง", "ประเภท", "เลขล่าสุด", "หน่วยใช้", "วันที่จด", "สถานะ", "จัดการ"]}
        rows={meters.map((item) => {
          const reading = latestReadingByMeter.get(item.id);
          return [
            <div key="organization" className="space-y-1">
              <span className="font-semibold text-slate-800 block text-xs">{organizationMap.get(item.organization_id) ?? "—"}</span>
              <AdminManageOrganizationButton organizationId={item.organization_id} section="meters" />
            </div>,
            `${propertyMap.get(item.property_id) ?? "—"} / ห้อง ${roomMap.get(item.room_id) ?? "—"}`,
            <span
              key="type"
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                item.meter_type === "electric" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-cyan-50 text-cyan-700 border border-cyan-200"
              }`}
            >
              {item.meter_type === "electric" ? "⚡ ไฟฟ้า" : "💧 น้ำประปา"}
            </span>,
            <span key="curr" className="font-mono font-bold text-xs">
              {reading ? Number(reading.current_value).toLocaleString("th-TH") : "—"}
            </span>,
            <span key="usage" className="font-mono text-xs text-slate-600">
              {reading ? Number(reading.usage_value).toLocaleString("th-TH") : "—"}
            </span>,
            thaiDate(reading?.read_at ?? null),
            <StatusBadge compact key="s" status={item.status} />,
            <div key="actions" className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setReadingTarget(item)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                title="จดเลขมิเตอร์"
              >
                <Gauge size={13} />
                <span>จดเลข</span>
              </button>
              <button
                type="button"
                onClick={() => setEditTarget(item)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                title="แก้ไขมิเตอร์"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(item)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="ลบมิเตอร์"
              >
                <Trash2 size={15} />
              </button>
            </div>,
          ];
        })}
        empty={!metersReady ? "ตารางมิเตอร์ยังไม่พร้อม" : "ยังไม่มีมิเตอร์"}
      />

      {/* Create Meter Modal */}
      {createOpen && (
        <AdminModal title="เพิ่มมิเตอร์ใหม่" onClose={() => setCreateOpen(false)} maxWidth={500}>
          <form action={createMeterAdminAction} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">สังกัดกิจการ *</label>
              <select
                name="organizationId"
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value);
                  setSelectedPropId("");
                }}
                required
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- เลือกกิจการ --</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">หอพัก *</label>
                <select
                  name="propertyId"
                  value={selectedPropId}
                  onChange={(e) => setSelectedPropId(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- เลือกหอพัก --</option>
                  {filteredProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ห้องพัก *</label>
                <select
                  name="roomId"
                  required
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- เลือกห้องพัก --</option>
                  {filteredRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      ห้อง {r.room_number}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ประเภทมิเตอร์ *</label>
                <select
                  name="meterType"
                  defaultValue="electric"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="electric">⚡ ไฟฟ้า (Electric)</option>
                  <option value="water">💧 น้ำประปา (Water)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Serial Number</label>
                <input
                  name="serialNumber"
                  placeholder="เช่น EM-102934"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">เลขมิเตอร์เริ่มต้น</label>
              <input
                name="initialValue"
                type="number"
                step="any"
                defaultValue="0"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
              >
                <Gauge size={15} />
                <span>เพิ่มมิเตอร์</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Record Reading Modal */}
      {readingTarget && (
        <AdminModal
          title={`จดเลขมิเตอร์: ${readingTarget.meter_type === "electric" ? "⚡ ไฟฟ้า" : "💧 น้ำ"} ห้อง ${roomMap.get(readingTarget.room_id) ?? ""}`}
          onClose={() => setReadingTarget(null)}
          maxWidth={460}
        >
          <form action={recordMeterReadingAdminAction} className="p-6 space-y-4">
            <input type="hidden" name="meterId" value={readingTarget.id} />

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">เลขมิเตอร์ครั้งก่อน:</span>
                <strong className="font-mono text-slate-800">
                  {latestReadingByMeter.get(readingTarget.id)?.current_value?.toLocaleString("th-TH") ?? "0"}
                </strong>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">เลขมิเตอร์ครั้งนี้ (ปัจจุบัน) *</label>
              <input
                name="currentValue"
                type="number"
                step="any"
                required
                min={latestReadingByMeter.get(readingTarget.id)?.current_value ?? 0}
                placeholder="ระบุเลขที่จดได้..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-semibold font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReadingTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
              >
                <CheckSquare size={15} />
                <span>บันทึกเลขมิเตอร์</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Edit Meter Modal */}
      {editTarget && (
        <AdminModal title="แก้ไขมิเตอร์" onClose={() => setEditTarget(null)} maxWidth={460}>
          <form action={updateMeterAdminAction} className="p-6 space-y-4">
            <input type="hidden" name="meterId" value={editTarget.id} />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Serial Number</label>
              <input
                name="serialNumber"
                defaultValue={editTarget.serial_number ?? ""}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">สถานะ</label>
              <select
                name="status"
                defaultValue={editTarget.status}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="active">ใช้งาน (Active)</option>
                <option value="inactive">ไม่ใช้งาน (Inactive)</option>
                <option value="replaced">เปลี่ยนเครื่องใหม่ (Replaced)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
              >
                <span>บันทึก</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete Meter Modal */}
      {deleteTarget && (
        <AdminConfirmDeleteModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          title="ยืนยันการลบมิเตอร์"
          itemName={`มิเตอร์ ${deleteTarget.meter_type === "electric" ? "ไฟฟ้า" : "น้ำ"} (ห้อง ${roomMap.get(deleteTarget.room_id) ?? ""})`}
          message="การลบมิเตอร์จะลบประวัติการจดเลขมิเตอร์ทั้งหมดของมิเตอร์นี้ด้วย โปรดยืนยัน"
          action={deleteMeterAdminAction}
          idFieldName="meterId"
          idValue={deleteTarget.id}
        />
      )}
    </section>
  );
}

// =========================================================================
// 2. AdminInvoicesView
// =========================================================================
export function AdminInvoicesView({
  invoices,
  rooms = [],
  properties = [],
  organizations = [],
  organizationMap,
  propertyMap,
  roomMap,
  invoicesReady,
}: Pick<AdminViewContentProps, "invoices" | "organizationMap" | "propertyMap" | "roomMap" | "invoicesReady"> & {
  rooms?: AdminViewContentProps["rooms"];
  properties?: AdminViewContentProps["properties"];
  organizations?: AdminViewContentProps["organizations"];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  // Cascading dropdowns
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedPropId, setSelectedPropId] = useState<string>("");

  const filteredProperties = selectedOrgId
    ? properties.filter((p) => p.organization_id === selectedOrgId)
    : properties;

  const filteredRooms = selectedPropId
    ? rooms.filter((r) => r.property_id === selectedPropId)
    : selectedOrgId
    ? rooms.filter((r) => r.organization_id === selectedOrgId)
    : rooms;

  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ใบแจ้งหนี้</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">ใบแจ้งหนี้ทั้งหมดในระบบ ({invoices.length})</h2>
          <p className="text-xs text-slate-500 mt-0.5">ออกใบแจ้งหนี้ใหม่ ปรับปรุงยอด หรือยกเลิกใบแจ้งหนี้ได้โดยตรงในฐานะ Super Admin</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedOrgId(organizations[0]?.id ?? "");
            setSelectedPropId("");
            setCreateOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Plus size={16} />
          <span>ออกใบแจ้งหนี้ใหม่</span>
        </button>
      </div>

      <AdminTable
        headers={["กิจการ", "เลขที่ใบแจ้งหนี้", "หอ/ห้อง", "วันที่ออก", "ครบกำหนด", "ยอดรวม", "คงเหลือ", "สถานะ", "จัดการ"]}
        rows={invoices.map((item) => [
          <div key="organization" className="space-y-1">
            <span className="font-semibold text-slate-800 block text-xs">{organizationMap.get(item.organization_id) ?? "—"}</span>
            <AdminManageOrganizationButton organizationId={item.organization_id} section="invoices" />
          </div>,
          <strong key="inv" className="text-xs font-bold text-slate-800 block">{item.invoice_number}</strong>,
          `${propertyMap.get(item.property_id) ?? "—"} / ห้อง ${roomMap.get(item.room_id) ?? "—"}`,
          thaiDate(item.issued_at),
          thaiDate(item.due_at),
          <span key="tot" className="font-semibold text-xs">{money(Number(item.total))}</span>,
          <strong key="bal" className={Number(item.balance_due) > 0 ? "text-rose-600 font-bold text-xs" : "text-emerald-600 text-xs"}>
            {money(Number(item.balance_due))}
          </strong>,
          <StatusBadge compact key="s" status={item.status} />,
          <div key="actions" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditTarget(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              title="แก้ไขใบแจ้งหนี้"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="ยกเลิกหรือลบใบแจ้งหนี้"
            >
              <Trash2 size={15} />
            </button>
          </div>,
        ])}
        empty={!invoicesReady ? "ตารางใบแจ้งหนี้ยังไม่พร้อม" : "ยังไม่มีใบแจ้งหนี้"}
      />

      {/* Create Invoice Modal */}
      {createOpen && (
        <AdminModal title="ออกใบแจ้งหนี้ใหม่" onClose={() => setCreateOpen(false)} maxWidth={560}>
          <form action={createInvoiceAdminAction} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">สังกัดกิจการ *</label>
              <select
                name="organizationId"
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value);
                  setSelectedPropId("");
                }}
                required
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- เลือกกิจการ --</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">หอพัก *</label>
                <select
                  name="propertyId"
                  value={selectedPropId}
                  onChange={(e) => setSelectedPropId(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- เลือกหอพัก --</option>
                  {filteredProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ห้องพัก *</label>
                <select
                  name="roomId"
                  required
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- เลือกห้องพัก --</option>
                  {filteredRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      ห้อง {r.room_number} (ค่าเช่า: ฿{Number(r.base_rent).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">เลขที่ใบแจ้งหนี้ (เว้นว่างเพื่อสร้างอัตโนมัติ)</label>
                <input
                  name="invoiceNumber"
                  placeholder="เช่น INV-202609-001"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">วันครบกำหนดชำระ</label>
                <input
                  name="dueAt"
                  type="date"
                  defaultValue={dateInput(new Date(Date.now() + 7 * 86400000).toISOString())}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">ค่าเช่าห้อง</label>
                <input
                  name="rentAmount"
                  type="number"
                  step="any"
                  placeholder="3500"
                  defaultValue="3500"
                  className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">ค่าไฟ</label>
                <input
                  name="electricAmount"
                  type="number"
                  step="any"
                  placeholder="0"
                  defaultValue="0"
                  className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">ค่าน้ำ</label>
                <input
                  name="waterAmount"
                  type="number"
                  step="any"
                  placeholder="0"
                  defaultValue="0"
                  className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">ค่าบริการอื่นๆ</label>
                <input
                  name="otherAmount"
                  type="number"
                  step="any"
                  placeholder="0"
                  defaultValue="0"
                  className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">หมายเหตุ</label>
              <input
                name="note"
                placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)..."
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>ออกใบแจ้งหนี้</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Edit Invoice Modal */}
      {editTarget && (
        <AdminModal title={`แก้ไขใบแจ้งหนี้: ${editTarget.invoice_number}`} onClose={() => setEditTarget(null)} maxWidth={500}>
          <form action={updateInvoiceAdminAction} className="p-6 space-y-4">
            <input type="hidden" name="invoiceId" value={editTarget.id} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ยอดรวมทั้งสิ้น (บาท)</label>
                <input
                  name="total"
                  type="number"
                  step="any"
                  defaultValue={editTarget.total}
                  required
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ยอดคงเหลือที่ต้องชำระ (บาท)</label>
                <input
                  name="balanceDue"
                  type="number"
                  step="any"
                  defaultValue={editTarget.balance_due}
                  required
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">วันครบกำหนด</label>
                <input
                  name="dueAt"
                  type="date"
                  defaultValue={dateInput(editTarget.due_at)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">สถานะ</label>
                <select
                  name="status"
                  defaultValue={editTarget.status}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="issued">รอชำระ (Issued)</option>
                  <option value="partial">ชำระบางส่วน (Partial)</option>
                  <option value="paid">ชำระครบแล้ว (Paid)</option>
                  <option value="overdue">เกินกำหนด (Overdue)</option>
                  <option value="void">ยกเลิก (Void)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
              >
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete/Void Invoice Modal */}
      {deleteTarget && (
        <AdminModal title="ยกเลิกหรือลบใบแจ้งหนี้" onClose={() => setDeleteTarget(null)} maxWidth={460}>
          <form action={deleteInvoiceAdminAction} className="p-6 space-y-4">
            <input type="hidden" name="invoiceId" value={deleteTarget.id} />
            <p className="text-xs text-slate-600">
              คุณต้องการดำเนินการอย่างไรกับใบแจ้งหนี้ <strong>{deleteTarget.invoice_number}</strong>?
            </p>
            <div className="space-y-2">
              <label className="flex items-start gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input type="radio" name="actionType" value="void" defaultChecked className="mt-0.5" />
                <div>
                  <strong className="text-xs text-slate-800 block">ยกเลิกใบแจ้งหนี้ (Void - แนะนำ)</strong>
                  <span className="text-[11px] text-slate-500">ปรับยอดคงเหลือเป็น 0 และคงประวัติใบแจ้งหนี้ไว้เพื่อการตรวจสอบ</span>
                </div>
              </label>
              <label className="flex items-start gap-2 p-3 rounded-xl border border-rose-200 cursor-pointer hover:bg-rose-50/50">
                <input type="radio" name="actionType" value="delete" className="mt-0.5" />
                <div>
                  <strong className="text-xs text-rose-800 block">ลบถาวร (Hard Delete)</strong>
                  <span className="text-[11px] text-rose-600">ลบรายการใบแจ้งหนี้และรายการย่อยออกจากฐานข้อมูลอย่างถาวร</span>
                </div>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                <Trash2 size={14} />
                <span>ยืนยันดำเนินการ</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </section>
  );
}

// =========================================================================
// 3. AdminPaymentsView
// =========================================================================
export function AdminPaymentsView({
  payments,
  invoices = [],
  properties = [],
  organizations = [],
  organizationMap,
  propertyMap,
  paymentsReady,
}: Pick<AdminViewContentProps, "payments" | "organizationMap" | "propertyMap" | "paymentsReady"> & {
  invoices?: AdminViewContentProps["invoices"];
  properties?: AdminViewContentProps["properties"];
  organizations?: AdminViewContentProps["organizations"];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);

  // Cascading dropdowns
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const filteredProperties = selectedOrgId
    ? properties.filter((p) => p.organization_id === selectedOrgId)
    : properties;

  const filteredInvoices = selectedOrgId
    ? invoices.filter((i) => i.organization_id === selectedOrgId && Number(i.balance_due) > 0 && i.status !== "void")
    : invoices.filter((i) => Number(i.balance_due) > 0 && i.status !== "void");

  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายการรับชำระ</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">ประวัติรับชำระเงินทั้งหมด ({payments.length})</h2>
          <p className="text-xs text-slate-500 mt-0.5">บันทึกรับชำระเงิน แก้ไขข้อมูล หรือลบรายการชำระได้โดยตรงในฐานะ Super Admin</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedOrgId(organizations[0]?.id ?? "");
            setCreateOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Plus size={16} />
          <span>บันทึกรับชำระใหม่</span>
        </button>
      </div>

      <AdminTable
        headers={["กิจการ", "เลขที่ใบเสร็จ", "หอพัก", "วันที่รับ", "ยอดเงิน", "ช่องทาง", "อ้างอิง", "สถานะ", "จัดการ"]}
        rows={payments.map((item) => [
          <div key="organization" className="space-y-1">
            <span className="font-semibold text-slate-800 block text-xs">{organizationMap.get(item.organization_id) ?? "—"}</span>
            <AdminManageOrganizationButton organizationId={item.organization_id} section="payments" />
          </div>,
          <strong key="rec" className="text-xs font-bold text-slate-800 block">{item.receipt_number}</strong>,
          propertyMap.get(item.property_id) ?? "—",
          thaiDate(item.paid_at),
          <strong key="amt" className="text-emerald-700 font-bold text-xs">{money(Number(item.amount))}</strong>,
          <span key="m" className="text-xs text-slate-600 capitalize">{item.method}</span>,
          item.reference || "—",
          <StatusBadge compact key="s" status={item.status} />,
          <div key="actions" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditTarget(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              title="แก้ไขรายการชำระ"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="ลบรายการชำระ"
            >
              <Trash2 size={15} />
            </button>
          </div>,
        ])}
        empty={!paymentsReady ? "ตารางรับชำระยังไม่พร้อม" : "ยังไม่มีรายการรับชำระ"}
      />

      {/* Create Payment Modal */}
      {createOpen && (
        <AdminModal title="บันทึกรับชำระเงินใหม่" onClose={() => setCreateOpen(false)} maxWidth={520}>
          <form action={recordPaymentAdminAction} className="p-6 space-y-4">
            <input type="hidden" name="returnView" value="payments" />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">สังกัดกิจการ *</label>
              <select
                name="organizationId"
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- เลือกกิจการ --</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">หอพัก *</label>
              <select
                name="propertyId"
                required
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- เลือกหอพัก --</option>
                {filteredProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ตัดยอดใบแจ้งหนี้ (ถ้ามี)</label>
              <select
                name="invoiceId"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- ไม่ตัดใบแจ้งหนี้เฉพาะเจาะจง --</option>
                {filteredInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} (ค้างชำระ: ฿{Number(inv.balance_due).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ยอดเงินที่รับชำระ (บาท) *</label>
                <input
                  name="amount"
                  type="number"
                  step="any"
                  required
                  placeholder="เช่น 3500"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ช่องทางชำระเงิน</label>
                <select
                  name="method"
                  defaultValue="transfer"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="transfer">โอนเงินเข้าบัญชี (Transfer)</option>
                  <option value="cash">เงินสด (Cash)</option>
                  <option value="promptpay">พร้อมเพย์ (PromptPay)</option>
                  <option value="card">บัตรเครดิต/เดบิต (Card)</option>
                  <option value="other">อื่นๆ (Other)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">เลขที่ใบเสร็จ (เว้นว่างเพื่อสร้างอัตโนมัติ)</label>
                <input
                  name="receiptNumber"
                  placeholder="เช่น REC-202609-001"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ข้อมูลอ้างอิง/สลิป</label>
                <input
                  name="reference"
                  placeholder="เช่น เลขที่สลิปโอนเงิน"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
              >
                <Receipt size={15} />
                <span>บันทึกรับเงิน</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Edit Payment Modal */}
      {editTarget && (
        <AdminModal title={`แก้ไขรายการรับชำระ: ${editTarget.receipt_number}`} onClose={() => setEditTarget(null)} maxWidth={480}>
          <form action={updatePaymentAdminAction} className="p-6 space-y-4">
            <input type="hidden" name="paymentId" value={editTarget.id} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ยอดเงิน (บาท) *</label>
                <input
                  name="amount"
                  type="number"
                  step="any"
                  defaultValue={editTarget.amount}
                  required
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ช่องทาง</label>
                <select
                  name="method"
                  defaultValue={editTarget.method}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="transfer">โอนเงิน (Transfer)</option>
                  <option value="cash">เงินสด (Cash)</option>
                  <option value="promptpay">พร้อมเพย์ (PromptPay)</option>
                  <option value="card">บัตรเครดิต (Card)</option>
                  <option value="other">อื่นๆ (Other)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">เลขอ้างอิง / สลิป</label>
              <input
                name="reference"
                defaultValue={editTarget.reference ?? ""}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">สถานะ</label>
              <select
                name="status"
                defaultValue={editTarget.status}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="confirmed">ยืนยันแล้ว (Confirmed)</option>
                <option value="pending">รอดำเนินการ (Pending)</option>
                <option value="void">ยกเลิก (Void)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
              >
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete Payment Modal */}
      {deleteTarget && (
        <AdminConfirmDeleteModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          title="ยืนยันการลบรายการรับชำระ"
          itemName={`ใบเสร็จ ${deleteTarget.receipt_number} (฿${Number(deleteTarget.amount).toLocaleString()})`}
          message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการรับเงินนี้ออกจากระบบ?"
          action={deletePaymentAdminAction}
          idFieldName="paymentId"
          idValue={deleteTarget.id}
        />
      )}
    </section>
  );
}

// =========================================================================
// 4. AdminReceivablesView
// =========================================================================
export function AdminReceivablesView({
  invoices,
  organizationMap,
  propertyMap,
  roomMap,
}: Pick<AdminViewContentProps, "invoices" | "organizationMap" | "roomMap"> & {
  propertyMap?: AdminViewContentProps["propertyMap"];
}) {
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [voidTarget, setVoidTarget] = useState<Invoice | null>(null);

  const outstandingInvoices = invoices.filter((item) => Number(item.balance_due) > 0 && item.status !== "void");

  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ลูกหนี้คงค้าง</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">รายการค้างชำระทั้งหมด ({outstandingInvoices.length})</h2>
          <p className="text-xs text-slate-500 mt-0.5">ตัดรับชำระหนี้หรือยกเลิกหนี้ได้ทันทีโดยไม่ต้องเปลี่ยนบทบาท</p>
        </div>
        <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
          ยอดค้างรวม {money(outstandingInvoices.reduce((sum, item) => sum + Number(item.balance_due), 0))}
        </span>
      </div>

      <AdminTable
        headers={["กิจการ", "เลขที่ใบแจ้งหนี้", "ห้อง", "ครบกำหนด", "ยอดรวม", "ยอดค้าง", "สถานะ", "ดำเนินการ"]}
        rows={outstandingInvoices.map((item) => [
          <div key="organization" className="space-y-1">
            <span className="font-semibold text-slate-800 block text-xs">{organizationMap.get(item.organization_id) ?? "—"}</span>
            <AdminManageOrganizationButton organizationId={item.organization_id} section="receivables" />
          </div>,
          <strong key="inv" className="text-xs font-bold text-slate-800 block">{item.invoice_number}</strong>,
          roomMap.get(item.room_id) ?? "—",
          thaiDate(item.due_at),
          money(Number(item.total)),
          <strong className="text-rose-600 font-bold text-xs" key="b">
            {money(Number(item.balance_due))}
          </strong>,
          <StatusBadge compact key="s" status={item.status} />,
          <div key="actions" className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPayTarget(item)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
              title="รับชำระยอดค้าง"
            >
              <Wallet size={13} />
              <span>รับชำระ</span>
            </button>
            <button
              type="button"
              onClick={() => setVoidTarget(item)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
              title="ยกหนี้ / ยกเลิกยอดค้าง"
            >
              <XCircle size={13} />
              <span>ยกหนี้</span>
            </button>
          </div>,
        ])}
        empty="ไม่มียอดค้างชำระ"
      />

      {/* Settle / Pay Receivable Modal */}
      {payTarget && (
        <AdminModal title={`รับชำระหนี้: ${payTarget.invoice_number}`} onClose={() => setPayTarget(null)} maxWidth={460}>
          <form action={settleReceivableAdminAction} className="p-6 space-y-4">
            <input type="hidden" name="invoiceId" value={payTarget.id} />
            <input type="hidden" name="actionType" value="pay" />

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">ยอดค้างชำระเดิม:</span>
                <strong className="text-rose-700 font-bold">{money(Number(payTarget.balance_due))}</strong>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ยอดเงินที่รับชำระ (บาท) *</label>
              <input
                name="amount"
                type="number"
                step="any"
                defaultValue={payTarget.balance_due}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ช่องทางรับเงิน</label>
              <select
                name="method"
                defaultValue="transfer"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="transfer">โอนเงินเข้าบัญชี (Transfer)</option>
                <option value="cash">เงินสด (Cash)</option>
                <option value="promptpay">พร้อมเพย์ (PromptPay)</option>
                <option value="card">บัตรเครดิต/เดบิต (Card)</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">หมายเหตุ / อ้างอิง</label>
              <input
                name="reference"
                placeholder="เช่น ชำระปิดยอดหนี้"
                defaultValue={`รับชำระยอดค้าง ${payTarget.invoice_number}`}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>ยืนยันรับชำระ</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Void Receivable Modal */}
      {voidTarget && (
        <AdminModal title="ยืนยันการยกหนี้ / ยกเลิกยอดค้าง" onClose={() => setVoidTarget(null)} maxWidth={460}>
          <form action={settleReceivableAdminAction} className="p-6 space-y-4">
            <input type="hidden" name="invoiceId" value={voidTarget.id} />
            <input type="hidden" name="actionType" value="void" />

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
              <p className="font-semibold">
                คุณแน่ใจหรือไม่ว่าต้องการยกเลิกยอดหนี้ของใบแจ้งหนี้ <strong>{voidTarget.invoice_number}</strong>?
              </p>
              <p className="text-slate-600">
                ระบบจะเปลี่ยนสถานะเป็น ยกเลิก (Void) และปรับยอดคงเหลือให้เป็น 0 บาททันที
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setVoidTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                กลับ
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                <XCircle size={15} />
                <span>ยกเลิกยอดหนี้นี้</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </section>
  );
}

// =========================================================================
// 5. AdminReportsView
// =========================================================================
export function AdminReportsView({
  properties,
  rooms,
  organizations,
  invoices,
  payments,
  totalCollected,
  totalOutstanding,
  totalBilled,
  occupiedRooms,
}: Pick<
  AdminViewContentProps,
  | "properties"
  | "rooms"
  | "organizations"
  | "invoices"
  | "payments"
  | "totalCollected"
  | "totalOutstanding"
  | "totalBilled"
  | "occupiedRooms"
>) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Hotel size={24} />
          </span>
          <div>
            <small className="text-xs text-slate-500 font-medium block">หอพักทั้งหมด</small>
            <strong className="text-2xl font-bold text-slate-800 tracking-tight">{properties.length}</strong>
          </div>
        </article>

        <article className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <KeyRound size={24} />
          </span>
          <div>
            <small className="text-xs text-slate-500 font-medium block">อัตราเข้าพัก</small>
            <strong className="text-2xl font-bold text-slate-800 tracking-tight">
              {rooms.length ? Math.round((occupiedRooms / rooms.length) * 100) : 0}%
            </strong>
          </div>
        </article>

        <article className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <WalletCards size={24} />
          </span>
          <div>
            <small className="text-xs text-slate-500 font-medium block">รับชำระสะสม</small>
            <strong className="text-2xl font-bold text-slate-800 tracking-tight">{money(totalCollected)}</strong>
          </div>
        </article>

        <article className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <ReceiptText size={24} />
          </span>
          <div>
            <small className="text-xs text-slate-500 font-medium block">ยอดค้างทั้งหมด</small>
            <strong className="text-2xl font-bold text-slate-800 tracking-tight">{money(totalOutstanding)}</strong>
          </div>
        </article>
      </section>

      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PLATFORM FINANCE</span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">สรุปรายกิจการ</h2>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            ยอดออกบิลรวม {money(totalBilled)}
          </span>
        </div>

        <AdminTable
          headers={["กิจการ", "หอพัก", "ห้อง", "ออกบิล", "รับชำระ", "ยอดค้าง"]}
          rows={organizations.map((organization) => {
            const orgInvoices = invoices.filter((item) => item.organization_id === organization.id);
            const orgPayments = payments.filter((item) => item.organization_id === organization.id && item.status === "confirmed");
            return [
              organization.name,
              properties.filter((item) => item.organization_id === organization.id).length,
              rooms.filter((item) => item.organization_id === organization.id).length,
              money(orgInvoices.reduce((sum, item) => sum + Number(item.total), 0)),
              money(orgPayments.reduce((sum, item) => sum + Number(item.amount), 0)),
              money(orgInvoices.reduce((sum, item) => sum + Number(item.balance_due), 0)),
            ];
          })}
        />
      </section>
    </div>
  );
}
