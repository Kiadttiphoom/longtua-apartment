import { impersonateOrganizationAction, resetUserPasswordAction, updateOrganizationAction, updateUserStatusAction } from "@/app/(admin)/admin/actions";
import { AdminTable, statusLabel, thaiDate } from "@/components/admin/AdminPrimitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Eye } from "lucide-react";
import type { AdminViewContentProps } from "@/components/admin/admin-types";

const organizationStatuses = ["active", "suspended", "closed"];

export function AdminOrganizationsView({ organizations, profileMap, memberCountByOrganization }: Pick<AdminViewContentProps, "organizations" | "profileMap" | "memberCountByOrganization">) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายชื่อกิจการ</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">กิจการทั้งหมดในระบบ</h2>
      </div>

      <AdminTable
        headers={["ชื่อกิจการ", "เจ้าของ", "สมาชิก", "วันที่สมัคร", "ควบคุมสถานะ", "เข้าดูแทน"]}
        rows={organizations.map((item) => [
          <strong key="n" className="text-xs font-bold text-slate-800 block">{item.name}</strong>,
          profileMap.get(item.owner_user_id) ?? "—",
          memberCountByOrganization.get(item.id) ?? 0,
          thaiDate(item.created_at),
          <form action={updateOrganizationAction} className="inline-flex items-center gap-2" key="f">
            <input name="organizationId" type="hidden" value={item.id} />
            <select
              aria-label={`สถานะ ${item.name}`}
              className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              defaultValue={item.status}
              name="status"
            >
              {organizationStatuses.map((status) => (
                <option key={status} value={status}>{statusLabel(status)}</option>
              ))}
            </select>
            <button
              className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              type="submit"
            >
              บันทึก
            </button>
          </form>,
          <form action={impersonateOrganizationAction} key="imp">
            <input name="organizationId" type="hidden" value={item.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold cursor-pointer transition-colors"
              title={`เข้าดูหน้าจอในฐานะกิจการ ${item.name}`}
            >
              <Eye size={13} className="text-amber-700" />
              <span>เข้าดูแทน</span>
            </button>
          </form>,
        ])}
      />
    </section>
  );
}

export function AdminUsersView({ profiles, systemAdminIds, organizationCountByUser }: Pick<AdminViewContentProps, "profiles" | "systemAdminIds" | "organizationCountByUser">) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายชื่อผู้ใช้</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">ผู้ใช้งานทั้งหมด</h2>
      </div>

      <AdminTable
        headers={["บัญชี", "ประเภท", "กิจการ", "สถานะ", "ตั้งรหัสผ่านชั่วคราว"]}
        rows={profiles.map((item) => [
          <div key="u">
            <strong className="text-xs font-bold text-slate-800 block">{item.username}</strong>
            <small className="text-[11px] text-slate-400 block">{item.display_name} · {item.phone || "ไม่มีเบอร์"}</small>
          </div>,
          systemAdminIds.has(item.id) ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200" key="r">
              SUPER ADMIN
            </span>
          ) : (
            "ผู้ใช้กิจการ"
          ),
          organizationCountByUser.get(item.id) ?? 0,
          systemAdminIds.has(item.id) ? (
            <StatusBadge compact key="s" label="ป้องกันการระงับ" status="active" />
          ) : (
            <form action={updateUserStatusAction} className="inline-flex items-center gap-2" key="f">
              <input name="userId" type="hidden" value={item.id} />
              <select
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue={item.status}
                name="status"
              >
                <option value="active">ใช้งาน</option>
                <option value="suspended">ระงับ</option>
              </select>
              <button
                className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                type="submit"
              >
                บันทึก
              </button>
            </form>
          ),
          <form action={resetUserPasswordAction} className="inline-flex items-center gap-2" key="p">
            <input
              autoComplete="new-password"
              className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[180px]"
              minLength={12}
              name="temporaryPassword"
              pattern="(?=.*[A-Za-z])(?=.*\d).{12,}"
              placeholder="อย่างน้อย 12 ตัว (อักษร+เลข)"
              required
              type="password"
            />
            <button
              className="h-8 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors"
              type="submit"
            >
              รีเซ็ต
            </button>
          </form>,
        ])}
      />
    </section>
  );
}
