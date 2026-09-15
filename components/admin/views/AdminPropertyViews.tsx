"use client";

import { useState } from "react";
import {
  createPropertyAdminAction,
  updatePropertyAdminAction,
  deletePropertyAdminAction,
  createRoomAdminAction,
  updateRoomAdminAction,
  deleteRoomAdminAction,
} from "@/app/(admin)/admin/actions";
import { AdminManageOrganizationButton } from "@/components/admin/AdminManageOrganization";
import { AdminConfirmDeleteModal, AdminModal, AdminTable, money } from "@/components/admin/AdminPrimitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Building2, DoorOpen, Pencil, Plus, Trash2 } from "lucide-react";
import type { AdminViewContentProps, Property, Room } from "@/components/admin/admin-types";

// =========================================================================
// 1. AdminPropertiesView
// =========================================================================
export function AdminPropertiesView({
  properties,
  rooms,
  organizations = [],
  organizationMap,
  propertiesReady,
}: Pick<AdminViewContentProps, "properties" | "rooms" | "organizationMap" | "propertiesReady"> & {
  organizations?: AdminViewContentProps["organizations"];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายชื่อหอพัก</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">หอพักทั้งหมดในระบบ ({properties.length})</h2>
          <p className="text-xs text-slate-500 mt-0.5">เพิ่ม แก้ไข หรือลบหอพักได้โดยตรงในฐานะ Super Admin</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Plus size={16} />
          <span>เพิ่มหอพักใหม่</span>
        </button>
      </div>

      <AdminTable
        headers={["กิจการ", "ชื่อหอพัก", "ที่อยู่", "โทรศัพท์", "จำนวนห้อง", "สถานะ", "จัดการ"]}
        rows={properties.map((item) => [
          <div key="organization" className="space-y-1">
            <span className="font-semibold text-slate-800 block text-xs">{organizationMap.get(item.organization_id) ?? "—"}</span>
            <AdminManageOrganizationButton organizationId={item.organization_id} section="properties" />
          </div>,
          <strong key="n" className="text-xs font-bold text-slate-800 block">{item.name}</strong>,
          item.address || "—",
          item.phone || "—",
          rooms.filter((room) => room.property_id === item.id).length,
          <StatusBadge compact key="s" status={item.status} />,
          <div key="actions" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditTarget(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              title="แก้ไขหอพัก"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="ลบหอพัก"
            >
              <Trash2 size={15} />
            </button>
          </div>,
        ])}
        empty={!propertiesReady ? "ตารางหอพักยังไม่พร้อม" : "ยังไม่มีหอพักในระบบ"}
      />

      {/* Create Property Modal */}
      {createOpen && (
        <AdminModal title="เพิ่มหอพักใหม่" onClose={() => setCreateOpen(false)} maxWidth={500}>
          <form action={createPropertyAdminAction} className="p-6 space-y-4">
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">ชื่อหอพัก *</label>
              <input
                name="name"
                required
                placeholder="เช่น หอพักสุขใจ อาคาร A"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ที่อยู่</label>
              <textarea
                name="address"
                rows={2}
                placeholder="ที่อยู่หอพัก..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">ค่าไฟ (บาท/หน่วย)</label>
                <input
                  name="electricRate"
                  type="number"
                  step="any"
                  defaultValue="8"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ค่าน้ำ (บาท/หน่วย หรือ เหมาจ่าย)</label>
              <input
                name="waterRate"
                type="number"
                step="any"
                defaultValue="100"
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
                <Building2 size={15} />
                <span>สร้างหอพัก</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Edit Property Modal */}
      {editTarget && (
        <AdminModal title={`แก้ไขหอพัก: ${editTarget.name}`} onClose={() => setEditTarget(null)} maxWidth={500}>
          <form action={updatePropertyAdminAction} className="p-6 space-y-4">
            <input type="hidden" name="propertyId" value={editTarget.id} />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ชื่อหอพัก *</label>
              <input
                name="name"
                defaultValue={editTarget.name}
                required
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ที่อยู่</label>
              <textarea
                name="address"
                defaultValue={editTarget.address ?? ""}
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">สถานะ</label>
                <select
                  name="status"
                  defaultValue={editTarget.status}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="active">ใช้งาน (Active)</option>
                  <option value="inactive">ปิดใช้งาน (Inactive)</option>
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

      {/* Delete Property Modal */}
      {deleteTarget && (
        <AdminConfirmDeleteModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          title="ยืนยันการลบหอพัก"
          itemName={deleteTarget.name}
          message="การลบหอพักจะลบข้อมูลที่เกี่ยวข้อง เช่น ห้องพัก มิเตอร์ และสัญญาเช่า โปรดตรวจสอบก่อนยืนยัน"
          action={deletePropertyAdminAction}
          idFieldName="propertyId"
          idValue={deleteTarget.id}
        />
      )}
    </section>
  );
}

// =========================================================================
// 2. AdminRoomsView
// =========================================================================
export function AdminRoomsView({
  rooms,
  properties = [],
  organizations = [],
  organizationMap,
  propertyMap,
  roomsReady,
}: Pick<AdminViewContentProps, "rooms" | "organizationMap" | "propertyMap" | "roomsReady"> & {
  properties?: AdminViewContentProps["properties"];
  organizations?: AdminViewContentProps["organizations"];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  // Filter properties when organization selected in create form
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const filteredProperties = selectedOrgId
    ? properties.filter((p) => p.organization_id === selectedOrgId)
    : properties;

  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายชื่อห้องพัก</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">ห้องพักทั้งหมดในระบบ ({rooms.length})</h2>
          <p className="text-xs text-slate-500 mt-0.5">เพิ่ม แก้ไข หรือลบห้องพักได้โดยตรงในฐานะ Super Admin</p>
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
          <span>เพิ่มห้องพักใหม่</span>
        </button>
      </div>

      <AdminTable
        headers={["กิจการ", "หอพัก", "ห้อง", "ชั้น", "ค่าเช่า", "สถานะ", "จัดการ"]}
        rows={rooms.map((item) => [
          <div key="organization" className="space-y-1">
            <span className="font-semibold text-slate-800 block text-xs">{organizationMap.get(item.organization_id) ?? "—"}</span>
            <AdminManageOrganizationButton organizationId={item.organization_id} section="rooms" />
          </div>,
          propertyMap.get(item.property_id) ?? "—",
          <strong key="rn" className="text-xs font-bold text-slate-800 block">{item.room_number}</strong>,
          item.floor || "—",
          money(Number(item.base_rent)),
          <StatusBadge compact key="s" status={item.status} />,
          <div key="actions" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditTarget(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              title="แก้ไขห้องพัก"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="ลบห้องพัก"
            >
              <Trash2 size={15} />
            </button>
          </div>,
        ])}
        empty={!roomsReady ? "ตารางห้องพักยังไม่พร้อม" : "ยังไม่มีห้องพัก"}
      />

      {/* Create Room Modal */}
      {createOpen && (
        <AdminModal title="เพิ่มห้องพักใหม่" onClose={() => setCreateOpen(false)} maxWidth={500}>
          <form action={createRoomAdminAction} className="p-6 space-y-4">
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">เลือกหอพัก *</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">เลขห้องพัก *</label>
                <input
                  name="roomNumber"
                  required
                  placeholder="เช่น 101, A203"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ชั้น</label>
                <input
                  name="floor"
                  placeholder="เช่น 1, 2, G"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ค่าเช่าพื้นฐาน (บาท/เดือน)</label>
                <input
                  name="baseRent"
                  type="number"
                  step="any"
                  placeholder="เช่น 3500"
                  defaultValue="3500"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">สถานะห้อง</label>
                <select
                  name="status"
                  defaultValue="vacant"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="vacant">ห้องว่าง (Vacant)</option>
                  <option value="occupied">มีผู้เช่า (Occupied)</option>
                  <option value="maintenance">ปิดปรับปรุง (Maintenance)</option>
                  <option value="inactive">ไม่พร้อมใช้งาน (Inactive)</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg">
              * เมื่อเพิ่มห้องพัก ระบบจะสร้างมิเตอร์น้ำและมิเตอร์ไฟฟ้าอัตโนมัติสำหรับห้องนี้
            </p>

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
                <DoorOpen size={15} />
                <span>สร้างห้องพัก</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Edit Room Modal */}
      {editTarget && (
        <AdminModal title={`แก้ไขห้องพัก: ${editTarget.room_number}`} onClose={() => setEditTarget(null)} maxWidth={500}>
          <form action={updateRoomAdminAction} className="p-6 space-y-4">
            <input type="hidden" name="roomId" value={editTarget.id} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">เลขห้องพัก *</label>
                <input
                  name="roomNumber"
                  defaultValue={editTarget.room_number}
                  required
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ชั้น</label>
                <input
                  name="floor"
                  defaultValue={editTarget.floor ?? ""}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ค่าเช่าพื้นฐาน (บาท)</label>
                <input
                  name="baseRent"
                  type="number"
                  step="any"
                  defaultValue={editTarget.base_rent}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">สถานะห้อง</label>
                <select
                  name="status"
                  defaultValue={editTarget.status}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="vacant">ห้องว่าง (Vacant)</option>
                  <option value="occupied">มีผู้เช่า (Occupied)</option>
                  <option value="maintenance">ปิดปรับปรุง (Maintenance)</option>
                  <option value="inactive">ไม่พร้อมใช้งาน (Inactive)</option>
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

      {/* Delete Room Modal */}
      {deleteTarget && (
        <AdminConfirmDeleteModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          title="ยืนยันการลบห้องพัก"
          itemName={`ห้อง ${deleteTarget.room_number}`}
          message="การลบห้องพักจะลบข้อมูลมิเตอร์และการเชื่อมโยงของห้องนี้ โปรดตรวจสอบว่าไม่มีสัญญาเช่าค้างอยู่"
          action={deleteRoomAdminAction}
          idFieldName="roomId"
          idValue={deleteTarget.id}
        />
      )}
    </section>
  );
}
