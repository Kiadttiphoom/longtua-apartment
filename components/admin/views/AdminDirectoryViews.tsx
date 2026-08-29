import { resetUserPasswordAction, updateOrganizationAction, updateUserStatusAction } from "@/app/(admin)/admin/actions";
import { AdminTable, statusLabel, thaiDate } from "@/components/admin/AdminPrimitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminViewContentProps } from "@/components/admin/admin-types";

const organizationStatuses = ["active", "suspended", "closed"];

export function AdminOrganizationsView({ organizations, profileMap, memberCountByOrganization }: Pick<AdminViewContentProps, "organizations" | "profileMap" | "memberCountByOrganization">) {
  return <section className="admin-card"><AdminTable headers={["ชื่อกิจการ", "เจ้าของ", "สมาชิก", "วันที่สมัคร", "ควบคุมสถานะ"]} rows={organizations.map((item) => [item.name, profileMap.get(item.owner_user_id) ?? "—", memberCountByOrganization.get(item.id) ?? 0, thaiDate(item.created_at), <form action={updateOrganizationAction} className="admin-inline-form" key="f"><input name="organizationId" type="hidden" value={item.id} /><select aria-label={`สถานะ ${item.name}`} defaultValue={item.status} name="status">{organizationStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select><button type="submit">บันทึก</button></form>])} /></section>;
}

export function AdminUsersView({ profiles, systemAdminIds, organizationCountByUser }: Pick<AdminViewContentProps, "profiles" | "systemAdminIds" | "organizationCountByUser">) {
  return <section className="admin-card"><AdminTable headers={["บัญชี", "ประเภท", "กิจการ", "สถานะ", "ตั้งรหัสผ่านชั่วคราว"]} rows={profiles.map((item) => [<div key="u"><strong>{item.username}</strong><small className="admin-cell-note">{item.display_name} · {item.phone || "ไม่มีเบอร์"}</small></div>, systemAdminIds.has(item.id) ? <span className="admin-role-badge" key="r">SUPER ADMIN</span> : "ผู้ใช้กิจการ", organizationCountByUser.get(item.id) ?? 0, systemAdminIds.has(item.id) ? <StatusBadge compact key="s" label="ป้องกันการระงับ" status="active" /> : <form action={updateUserStatusAction} className="admin-inline-form" key="f"><input name="userId" type="hidden" value={item.id} /><select defaultValue={item.status} name="status"><option value="active">ใช้งาน</option><option value="suspended">ระงับ</option></select><button type="submit">บันทึก</button></form>, <form action={resetUserPasswordAction} className="admin-inline-form" key="p"><input autoComplete="new-password" minLength={12} name="temporaryPassword" pattern="(?=.*[A-Za-z])(?=.*\d).{12,}" placeholder="อย่างน้อย 12 ตัว มีอักษร/เลข" required type="password" /><button className="danger" type="submit">รีเซ็ต</button></form>])} /></section>;
}
