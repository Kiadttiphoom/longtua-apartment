import Link from "next/link";
import { Building2, ShieldCheck, UserRoundCheck, Users, ArrowRight } from "lucide-react";
import { AdminTable, thaiDate } from "@/components/admin/AdminPrimitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminViewContentProps } from "@/components/admin/admin-types";

type Props = Pick<AdminViewContentProps, "organizationCount" | "profileCount" | "subscriptions" | "organizations" | "memberCountByOrganization">;

export function AdminOverviewView({ organizationCount, profileCount, subscriptions, organizations, memberCountByOrganization }: Props) {
  const trialingCount = subscriptions.filter((item) => item.status === "trialing").length;
  const activeCount = subscriptions.filter((item) => item.status === "active").length;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </span>
          <div>
            <small className="text-xs text-slate-500 font-medium block">กิจการทั้งหมด</small>
            <strong className="text-2xl font-bold text-slate-800 tracking-tight">{organizationCount}</strong>
          </div>
        </article>

        <article className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <Users size={24} />
          </span>
          <div>
            <small className="text-xs text-slate-500 font-medium block">ผู้ใช้งานทั้งหมด</small>
            <strong className="text-2xl font-bold text-slate-800 tracking-tight">{profileCount}</strong>
          </div>
        </article>

        <article className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <UserRoundCheck size={24} />
          </span>
          <div>
            <small className="text-xs text-slate-500 font-medium block">ทดลองใช้ฟรี</small>
            <strong className="text-2xl font-bold text-slate-800 tracking-tight">{trialingCount}</strong>
          </div>
        </article>

        <article className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </span>
          <div>
            <small className="text-xs text-slate-500 font-medium block">สมาชิก Active</small>
            <strong className="text-2xl font-bold text-slate-800 tracking-tight">{activeCount}</strong>
          </div>
        </article>
      </section>

      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ลูกค้าระบบจริง</span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">กิจการล่าสุด</h2>
          </div>
          <Link
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            href="/admin/organizations"
          >
            <span>จัดการทั้งหมด</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <AdminTable
          headers={["ชื่อกิจการ", "สถานะ", "ผู้ใช้งาน", "วันที่สมัคร"]}
          rows={organizations.slice(0, 10).map((item) => [
            item.name,
            <StatusBadge compact key="s" status={item.status} />,
            memberCountByOrganization.get(item.id) ?? 0,
            thaiDate(item.created_at),
          ])}
        />
      </section>
    </div>
  );
}
