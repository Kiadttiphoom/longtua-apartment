"use client";

import { useState } from "react";
import {
  createTenantAdminAction,
  updateTenantAdminAction,
  deleteTenantAdminAction,
  createLeaseAdminAction,
  updateLeaseAdminAction,
  deleteLeaseAdminAction,
} from "@/app/(admin)/admin/actions";
import { AdminManageOrganizationButton } from "@/components/admin/AdminManageOrganization";
import { AdminConfirmDeleteModal, AdminModal, AdminTable, dateInput, money, thaiDate } from "@/components/admin/AdminPrimitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FileText, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import type { AdminViewContentProps, Lease, Tenant } from "@/components/admin/admin-types";

// =========================================================================
// 1. AdminTenantViews
// =========================================================================
export function AdminTenantViews({
  tenants,
  organizations = [],
  organizationMap,
  tenantsReady,
}: Pick<AdminViewContentProps, "tenants" | "organizationMap" | "tenantsReady"> & {
  organizations?: AdminViewContentProps["organizations"];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tenant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);

  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายชื่อผู้เช่า</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">ผู้เช่าทั้งหมดในระบบ ({tenants.length})</h2>
          <p className="text-xs text-slate-500 mt-0.5">เพิ่ม แก้ไข หรือลบข้อมูลผู้เช่าได้โดยตรงในฐานะ Super Admin</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Plus size={16} />
          <span>เพิ่มผู้เช่าใหม่</span>
        </button>
      </div>

      <AdminTable
        headers={["กิจการ", "ชื่อผู้เช่า", "โทรศัพท์", "อีเมล", "สถานะ", "วันที่สร้าง", "จัดการ"]}
        rows={tenants.map((item) => [
          <div key="organization" className="space-y-1">
            <span className="font-semibold text-slate-800 block text-xs">{organizationMap.get(item.organization_id) ?? "—"}</span>
            <AdminManageOrganizationButton organizationId={item.organization_id} section="tenants" />
          </div>,
          <strong key="fn" className="text-xs font-bold text-slate-800 block">{item.full_name}</strong>,
          item.phone || "—",
          item.email || "—",
          <StatusBadge compact key="s" status={item.status} />,
          thaiDate(item.created_at),
          <div key="actions" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditTarget(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              title="แก้ไขข้อมูลผู้เช่า"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="ลบผู้เช่า"
            >
              <Trash2 size={15} />
            </button>
          </div>,
        ])}
        empty={!tenantsReady ? "ตารางผู้เช่ายังไม่พร้อม" : "ยังไม่มีผู้เช่า"}
      />

      {/* Create Tenant Modal */}
      {createOpen && (
        <AdminModal title="เพิ่มผู้เช่าใหม่" onClose={() => setCreateOpen(false)} maxWidth={500}>
          <form action={createTenantAdminAction} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">สังกัดกิจการ *</label>
              <select
                name="organizationId"
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">ชื่อ-นามสกุล *</label>
              <input
                name="fullName"
                required
                placeholder="เช่น นายสมชาย ใจดี"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
                <input
                  name="phone"
                  placeholder="08X-XXX-XXXX"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">อีเมล</label>
                <input
                  name="email"
                  type="email"
                  placeholder="tenant@example.com"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">เลข ปชช. 4 หลักท้าย</label>
                <input
                  name="idCardLast4"
                  maxLength={4}
                  placeholder="1234"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">สถานะผู้เช่า</label>
                <select
                  name="status"
                  defaultValue="active"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="active">ผู้เช่าปัจจุบัน (Active)</option>
                  <option value="former">ผู้เช่าเดิม (Former)</option>
                  <option value="blocked">ระงับ/แบล็คลิสต์ (Blocked)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ที่อยู่ตามบัตรประชาชน / ติดต่อ</label>
              <textarea
                name="address"
                rows={2}
                placeholder="ที่อยู่ผู้เช่า..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <UserPlus size={15} />
                <span>บันทึกผู้เช่า</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Edit Tenant Modal */}
      {editTarget && (
        <AdminModal title={`แก้ไขข้อมูลผู้เช่า: ${editTarget.full_name}`} onClose={() => setEditTarget(null)} maxWidth={500}>
          <form action={updateTenantAdminAction} className="p-6 space-y-4">
            <input type="hidden" name="tenantId" value={editTarget.id} />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ชื่อ-นามสกุล *</label>
              <input
                name="fullName"
                defaultValue={editTarget.full_name}
                required
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
                <input
                  name="phone"
                  defaultValue={editTarget.phone ?? ""}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">อีเมล</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editTarget.email ?? ""}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">เลข ปชช. 4 หลักท้าย</label>
                <input
                  name="idCardLast4"
                  maxLength={4}
                  defaultValue=""
                  placeholder="แก้ไขเฉพาะเมื่อต้องการเปลี่ยน"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">สถานะผู้เช่า</label>
                <select
                  name="status"
                  defaultValue={editTarget.status}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="active">ผู้เช่าปัจจุบัน (Active)</option>
                  <option value="former">ผู้เช่าเดิม (Former)</option>
                  <option value="blocked">ระงับ/แบล็คลิสต์ (Blocked)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ที่อยู่</label>
              <textarea
                name="address"
                defaultValue=""
                rows={2}
                placeholder="ที่อยู่ผู้เช่า..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
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

      {/* Delete Tenant Modal */}
      {deleteTarget && (
        <AdminConfirmDeleteModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          title="ยืนยันการลบผู้เช่า"
          itemName={deleteTarget.full_name}
          message="การลบข้อมูลผู้เช่าจะไม่สามารถกู้คืนได้ โปรดตรวจสอบให้แน่ใจว่าไม่มีสัญญาเช่าหรือใบแจ้งหนี้ผูกอยู่"
          action={deleteTenantAdminAction}
          idFieldName="tenantId"
          idValue={deleteTarget.id}
        />
      )}
    </section>
  );
}

// =========================================================================
// 2. AdminLeasesView
// =========================================================================
export function AdminLeasesView({
  leases,
  rooms = [],
  tenants = [],
  properties = [],
  organizations = [],
  organizationMap,
  propertyMap,
  roomMap,
  tenantMap,
  leasesReady,
}: Pick<AdminViewContentProps, "leases" | "organizationMap" | "propertyMap" | "roomMap" | "tenantMap" | "leasesReady"> & {
  rooms?: AdminViewContentProps["rooms"];
  tenants?: AdminViewContentProps["tenants"];
  properties?: AdminViewContentProps["properties"];
  organizations?: AdminViewContentProps["organizations"];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Lease | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lease | null>(null);

  // Filter cascading in create form
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

  const filteredTenants = selectedOrgId
    ? tenants.filter((t) => t.organization_id === selectedOrgId)
    : tenants;

  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">สัญญาเช่า</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">สัญญาเช่าทั้งหมดในระบบ ({leases.length})</h2>
          <p className="text-xs text-slate-500 mt-0.5">ทำสัญญาเช่าใหม่ แก้ไข หรือยกเลิกสัญญาได้โดยตรงในฐานะ Super Admin</p>
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
          <span>ทำสัญญาเช่าใหม่</span>
        </button>
      </div>

      <AdminTable
        headers={["กิจการ", "เลขที่สัญญา", "หอ/ห้อง", "ผู้เช่า", "ระยะเวลา", "ค่าเช่า", "สถานะ", "จัดการ"]}
        rows={leases.map((item) => [
          <div key="organization" className="space-y-1">
            <span className="font-semibold text-slate-800 block text-xs">{organizationMap.get(item.organization_id) ?? "—"}</span>
            <AdminManageOrganizationButton organizationId={item.organization_id} section="leases" />
          </div>,
          <strong key="ln" className="text-xs font-bold text-slate-800 block">{item.lease_number}</strong>,
          `${propertyMap.get(item.property_id) ?? "—"} / ห้อง ${roomMap.get(item.room_id) ?? "—"}`,
          tenantMap.get(item.primary_tenant_id) ?? "—",
          `${thaiDate(item.start_date)} – ${thaiDate(item.end_date)}`,
          money(Number(item.rent_amount)),
          <StatusBadge compact key="s" status={item.status} />,
          <div key="actions" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditTarget(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              title="แก้ไขสัญญาเช่า"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="ลบสัญญาเช่า"
            >
              <Trash2 size={15} />
            </button>
          </div>,
        ])}
        empty={!leasesReady ? "ตารางสัญญาเช่ายังไม่พร้อม" : "ยังไม่มีสัญญาเช่า"}
      />

      {/* Create Lease Modal */}
      {createOpen && (
        <AdminModal title="ทำสัญญาเช่าใหม่" onClose={() => setCreateOpen(false)} maxWidth={560}>
          <form action={createLeaseAdminAction} className="p-6 space-y-4">
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
                      ห้อง {r.room_number} {r.status === "occupied" ? "(มีผู้เช่าแล้ว)" : "(ว่าง)"} - ฿{Number(r.base_rent).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ผู้เช่าหลัก *</label>
              <select
                name="primaryTenantId"
                required
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- เลือกผู้เช่า --</option>
                {filteredTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} {t.phone ? `(${t.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">เลขที่สัญญา (เว้นว่างเพื่อสร้างอัตโนมัติ)</label>
                <input
                  name="leaseNumber"
                  placeholder="เช่น L-202609-001"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">สถานะสัญญา</label>
                <select
                  name="status"
                  defaultValue="active"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="active">มีผลใช้งาน (Active - อัปเดตห้องเป็นมีผู้เช่า)</option>
                  <option value="draft">ฉบับร่าง (Draft)</option>
                  <option value="ended">สิ้นสุดสัญญา (Ended)</option>
                  <option value="cancelled">ยกเลิก (Cancelled)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">วันเริ่มสัญญา *</label>
                <input
                  name="startDate"
                  type="date"
                  required
                  defaultValue={dateInput(new Date().toISOString())}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">วันสิ้นสุดสัญญา</label>
                <input
                  name="endDate"
                  type="date"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ค่าเช่า/เดือน (บาท) *</label>
                <input
                  name="rentAmount"
                  type="number"
                  step="any"
                  required
                  placeholder="3500"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">เงินประกัน (บาท)</label>
                <input
                  name="depositAmount"
                  type="number"
                  step="any"
                  placeholder="0"
                  defaultValue="0"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">จ่ายล่วงหน้า (บาท)</label>
                <input
                  name="advanceAmount"
                  type="number"
                  step="any"
                  placeholder="0"
                  defaultValue="0"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
              >
                <FileText size={15} />
                <span>สร้างสัญญาเช่า</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Edit Lease Modal */}
      {editTarget && (
        <AdminModal title={`แก้ไขสัญญาเช่า: ${editTarget.lease_number}`} onClose={() => setEditTarget(null)} maxWidth={560}>
          <form action={updateLeaseAdminAction} className="p-6 space-y-4">
            <input type="hidden" name="leaseId" value={editTarget.id} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">เลขที่สัญญา *</label>
                <input
                  name="leaseNumber"
                  defaultValue={editTarget.lease_number}
                  required
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">สถานะสัญญา</label>
                <select
                  name="status"
                  defaultValue={editTarget.status}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="active">มีผลใช้งาน (Active)</option>
                  <option value="draft">ฉบับร่าง (Draft)</option>
                  <option value="ended">สิ้นสุดสัญญา (Ended - คืนสถานะห้องเป็นว่าง)</option>
                  <option value="cancelled">ยกเลิก (Cancelled - คืนสถานะห้องเป็นว่าง)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">วันเริ่มสัญญา *</label>
                <input
                  name="startDate"
                  type="date"
                  defaultValue={dateInput(editTarget.start_date)}
                  required
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">วันสิ้นสุดสัญญา</label>
                <input
                  name="endDate"
                  type="date"
                  defaultValue={dateInput(editTarget.end_date)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ค่าเช่า/เดือน (บาท)</label>
                <input
                  name="rentAmount"
                  type="number"
                  step="any"
                  defaultValue={editTarget.rent_amount}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">เงินประกัน (บาท)</label>
                <input
                  name="depositAmount"
                  type="number"
                  step="any"
                  defaultValue="0"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">จ่ายล่วงหน้า (บาท)</label>
                <input
                  name="advanceAmount"
                  type="number"
                  step="any"
                  defaultValue="0"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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

      {/* Delete Lease Modal */}
      {deleteTarget && (
        <AdminConfirmDeleteModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          title="ยืนยันการลบสัญญาเช่า"
          itemName={`สัญญา ${deleteTarget.lease_number}`}
          message="การลบสัญญาเช่าจะปลดห้องพักกลับเป็นสถานะ 'ว่าง' อัตโนมัติ โปรดตรวจสอบก่อนยืนยัน"
          action={deleteLeaseAdminAction}
          idFieldName="leaseId"
          idValue={deleteTarget.id}
        />
      )}
    </section>
  );
}
