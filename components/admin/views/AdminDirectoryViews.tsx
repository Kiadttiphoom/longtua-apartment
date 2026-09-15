"use client";

import { useState } from "react";
import {
  createOrganizationAdminAction,
  createUserAdminAction,
  deleteOrganizationAdminAction,
  deleteUserAdminAction,
  impersonateOrganizationAction,
  resetUserPasswordAction,
  updateOrganizationAction,
  updateUserAdminAction,
  updateUserStatusAction,
} from "@/app/(admin)/admin/actions";
import { AdminConfirmDeleteModal, AdminModal, AdminTable, statusLabel, thaiDate } from "@/components/admin/AdminPrimitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Building2, Eye, Pencil, Plus, Trash2, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import type { AdminViewContentProps, Organization, Profile } from "@/components/admin/admin-types";

const organizationStatuses = ["active", "suspended", "closed"];

export function AdminOrganizationsView({
  organizations,
  profileMap,
  profiles,
  memberCountByOrganization,
}: Pick<AdminViewContentProps, "organizations" | "profileMap" | "profiles" | "memberCountByOrganization">) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null);

  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายชื่อกิจการ</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">กิจการทั้งหมดในระบบ ({organizations.length})</h2>
          <p className="text-xs text-slate-500 mt-0.5">เพิ่ม แก้ไข หรือลบกิจการได้โดยตรงในฐานะ Super Admin</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Plus size={16} />
          <span>เพิ่มกิจการใหม่</span>
        </button>
      </div>

      <AdminTable
        headers={["ชื่อกิจการ", "เจ้าของ", "สมาชิก", "วันที่สมัคร", "ควบคุมสถานะ", "จัดการ"]}
        rows={organizations.map((item) => [
          <div key="n">
            <strong className="text-xs font-bold text-slate-800 block">{item.name}</strong>
          </div>,
          profileMap.get(item.owner_user_id) ?? "—",
          memberCountByOrganization.get(item.id) ?? 0,
          thaiDate(item.created_at),
          <form action={updateOrganizationAction} className="inline-flex items-center gap-2" key="f">
            <input name="organizationId" type="hidden" value={item.id} />
            <input name="name" aria-label={`ชื่อกิจการ ${item.name}`} defaultValue={item.name} required minLength={2} maxLength={160} className="h-8 w-36 rounded-lg border border-slate-200 px-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <select
              aria-label={`สถานะ ${item.name}`}
              className="h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              defaultValue={item.status}
              name="status"
            >
              {organizationStatuses.map((status) => (
                <option key={status} value={status}>{statusLabel(status)}</option>
              ))}
            </select>
            <button
              className="h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              type="submit"
              title="บันทึกชื่อและสถานะ"
            >
              บันทึก
            </button>
          </form>,
          <div key="actions" className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(item)}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors"
              title={`ลบกิจการ ${item.name}`}
            >
              <Trash2 size={13} />
              <span>ลบ</span>
            </button>
            <form action={impersonateOrganizationAction}>
              <input name="organizationId" type="hidden" value={item.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
                title={`เข้าดูหน้าจอในฐานะกิจการ ${item.name}`}
              >
                <Eye size={13} />
                <span>เข้าดูแทน</span>
              </button>
            </form>
          </div>,
        ])}
      />

      {/* Create Organization Modal */}
      {createOpen && (
        <AdminModal title="เพิ่มกิจการใหม่" onClose={() => setCreateOpen(false)} maxWidth={500}>
          <form action={createOrganizationAdminAction} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ชื่อกิจการ *</label>
              <input
                name="name"
                required
                minLength={2}
                maxLength={160}
                placeholder="เช่น หอพักสุขใจ คอนโดมิเนียม"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Slug (URL ประจำกิจการ, ภาษาอังกฤษและขีดกลาง)</label>
              <input
                name="slug"
                placeholder="เช่น sukhjai-residence (เว้นว่างเพื่อสร้างอัตโนมัติ)"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">เจ้าของกิจการ (Owner Profile)</label>
              <select
                name="ownerUserId"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {profiles?.map((p) => (
                  <option key={p.id} value={p.id}>{p.display_name} (@{p.username})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">สถานะ</label>
                <select
                  name="status"
                  defaultValue="active"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="active">เปิดใช้งาน (Active)</option>
                  <option value="suspended">ระงับชั่วคราว (Suspended)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">แพ็กเกจเริ่มต้น</label>
                <select
                  name="planCode"
                  defaultValue="starter"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="starter">Starter (1 หอ / 10 ห้อง)</option>
                  <option value="growth">Growth (3 หอ / 50 ห้อง)</option>
                  <option value="pro">Pro (10 หอ / 200 ห้อง)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Building2 size={14} />
                <span>สร้างกิจการ</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <AdminConfirmDeleteModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="ยืนยันการลบกิจการ"
          itemName={deleteTarget.name}
          message="การลบกิจการจะส่งผลต่อหอพัก ห้องพัก และข้อมูลทั้งหมดในกิจการนี้ คุณแน่ใจหรือไม่?"
          action={deleteOrganizationAdminAction}
          idFieldName="organizationId"
          idValue={deleteTarget.id}
        />
      )}
    </section>
  );
}

export function AdminUsersView({
  profiles,
  systemAdminIds,
  organizationCountByUser,
  memberships,
  organizationMap,
  organizations,
  roles,
}: Pick<AdminViewContentProps, "profiles" | "systemAdminIds" | "organizationCountByUser" | "memberships" | "organizationMap" | "organizations" | "roles">) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);

  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายชื่อผู้ใช้</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">ผู้ใช้งานทั้งหมด ({profiles.length})</h2>
          <p className="mt-0.5 text-xs text-slate-500">สร้าง แก้ไขข้อมูล หรือลบบัญชีผู้ใช้งานโดยตรงในฐานะ Super Admin</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <UserPlus size={16} />
          <span>เพิ่มผู้ใช้งานใหม่</span>
        </button>
      </div>

      <AdminTable
        headers={["บัญชี", "ประเภท", "กิจการ", "สิทธิ์การใช้งาน", "สถานะ", "การจัดการ"]}
        rows={profiles.map((item) => {
          const isSys = systemAdminIds.has(item.id);
          return [
            <div key="u">
              <strong className="text-xs font-bold text-slate-800 block">{item.username}</strong>
              <small className="text-[11px] text-slate-400 block">{item.display_name} · {item.phone || "ไม่มีเบอร์"}</small>
            </div>,
            isSys ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200" key="r">
                SUPER ADMIN
              </span>
            ) : (
              "ผู้ใช้กิจการ"
            ),
            organizationCountByUser.get(item.id) ?? 0,
            <div key="permissions" className="space-y-2 min-w-[160px]">
              {isSys ? (
                <span className="text-xs text-slate-500">สิทธิ์ผู้ดูแลระบบสูงสุด</span>
              ) : memberships.some((membership) => membership.user_id === item.id && membership.status === "active") ? (
                memberships.filter((membership) => membership.user_id === item.id && membership.status === "active").map((membership) => (
                  <Link
                    key={membership.organization_id}
                    href={{ pathname: "/admin/permissions", query: { mode: "user", organization: membership.organization_id, user: item.id } }}
                    className="block rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs text-blue-700 hover:bg-blue-100"
                  >
                    <span className="block font-semibold">ปรับสิทธิ์ · {organizationMap.get(membership.organization_id) ?? "กิจการ"}</span>
                    <span className="block text-[11px] text-blue-600">บทบาท: {membership.role_code}</span>
                  </Link>
                ))
              ) : <span className="text-xs text-slate-500">ยังไม่มีสมาชิกกิจการที่ใช้งาน</span>}
            </div>,
            isSys ? (
              <StatusBadge compact key="s" label="ป้องกันการระงับ" status="active" />
            ) : (
              <form action={updateUserStatusAction} className="inline-flex items-center gap-1.5" key="f">
                <input name="userId" type="hidden" value={item.id} />
                <select
                  className="h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  defaultValue={item.status}
                  name="status"
                >
                  <option value="active">ใช้งาน</option>
                  <option value="suspended">ระงับ</option>
                </select>
                <button
                  className="h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                  type="submit"
                  title="บันทึกสถานะ"
                >
                  บันทึก
                </button>
              </form>
            ),
            <div key="acts" className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setEditTarget(item)}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                title="แก้ไขข้อมูลผู้ใช้"
              >
                <Pencil size={12} />
                <span>แก้ไข</span>
              </button>

              {!isSys && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors"
                  title="ลบผู้ใช้"
                >
                  <Trash2 size={12} />
                  <span>ลบ</span>
                </button>
              )}

              <details className="relative">
                <summary className="h-8 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold cursor-pointer flex items-center gap-1 list-none select-none">
                  <span>รีเซ็ตรหัส</span>
                </summary>
                <form action={resetUserPasswordAction} className="absolute right-0 top-9 z-20 p-3 bg-white rounded-xl shadow-xl border border-slate-200 w-64 space-y-2">
                  <input name="userId" type="hidden" value={item.id} />
                  <span className="text-[11px] font-bold text-slate-600 block">ตั้งรหัสผ่านใหม่:</span>
                  <input
                    autoComplete="new-password"
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    minLength={8}
                    name="temporaryPassword"
                    pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
                    placeholder="อย่างน้อย 8 ตัว (อักษร+เลข)"
                    required
                    type="password"
                  />
                  <button
                    className="w-full h-8 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                    type="submit"
                  >
                    ยืนยันรีเซ็ตรหัส
                  </button>
                </form>
              </details>
            </div>,
          ];
        })}
      />

      {/* Create User Modal */}
      {createOpen && (
        <AdminModal title="เพิ่มผู้ใช้งานใหม่" onClose={() => setCreateOpen(false)} maxWidth={500}>
          <form action={createUserAdminAction} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Username / อีเมล *</label>
                <input
                  name="username"
                  required
                  minLength={3}
                  placeholder="เช่น admin_pond หรือ user@mail.com"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ชื่อที่แสดง (Display Name) *</label>
                <input
                  name="displayName"
                  required
                  placeholder="เช่น ปอนด์ (ผู้จัดการ)"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
                <input
                  name="phone"
                  placeholder="08xxxxxxxx"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">รหัสผ่านเริ่มต้น *</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">การกำหนดสิทธิ์และกิจการ</span>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ผูกกับกิจการ</label>
                <select
                  name="organizationId"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- ไม่ผูกกิจการตอนนี้ --</option>
                  {organizations?.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">บทบาท (Role)</label>
                  <select
                    name="roleCode"
                    defaultValue="staff"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="owner">Owner (เจ้าของ)</option>
                    <option value="manager">Manager (ผู้จัดการ)</option>
                    <option value="accounting">Accounting (การเงิน)</option>
                    <option value="staff">Staff (เจ้าหน้าที่)</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-blue-700 cursor-pointer">
                    <input type="checkbox" name="isSystemAdmin" value="true" className="rounded text-blue-600 focus:ring-blue-500" />
                    <span>เป็น Super Admin</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Users size={14} />
                <span>สร้างผู้ใช้งาน</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Edit User Modal */}
      {editTarget && (
        <AdminModal title={`แก้ไขข้อมูลผู้ใช้: @${editTarget.username}`} onClose={() => setEditTarget(null)} maxWidth={460}>
          <form action={updateUserAdminAction} className="p-6 space-y-4">
            <input type="hidden" name="userId" value={editTarget.id} />
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ชื่อที่แสดง (Display Name) *</label>
              <input
                name="displayName"
                required
                defaultValue={editTarget.display_name}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
              <input
                name="phone"
                defaultValue={editTarget.phone ?? ""}
                placeholder="08xxxxxxxx"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">สถานะการใช้งาน</label>
              <select
                name="status"
                defaultValue={editTarget.status}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="active">เปิดใช้งาน (Active)</option>
                <option value="suspended">ระงับการใช้งาน (Suspended)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <span>บันทึกข้อมูล</span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete User Confirmation */}
      {deleteTarget && (
        <AdminConfirmDeleteModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="ยืนยันการลบผู้ใช้งาน"
          itemName={`${deleteTarget.display_name} (@${deleteTarget.username})`}
          message="คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้นี้ออกจากระบบอย่างถาวร?"
          action={deleteUserAdminAction}
          idFieldName="userId"
          idValue={deleteTarget.id}
        />
      )}
    </section>
  );
}

