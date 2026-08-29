import Link from "next/link";
import { Building2, ShieldCheck, UserRoundCheck, Users } from "lucide-react";
import { AdminTable, thaiDate } from "@/components/admin/AdminPrimitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminViewContentProps } from "@/components/admin/admin-types";

type Props = Pick<AdminViewContentProps, "organizationCount" | "profileCount" | "subscriptions" | "organizations" | "memberCountByOrganization">;

export function AdminOverviewView({ organizationCount, profileCount, subscriptions, organizations, memberCountByOrganization }: Props) {
  return <><section className="admin-stats">
    <article><span><Building2 size={20} /></span><div><small>กิจการทั้งหมด</small><strong>{organizationCount}</strong></div></article>
    <article><span><Users size={20} /></span><div><small>ผู้ใช้งานทั้งหมด</small><strong>{profileCount}</strong></div></article>
    <article><span><UserRoundCheck size={20} /></span><div><small>ทดลองใช้ฟรี</small><strong>{subscriptions.filter((item) => item.status === "trialing").length}</strong></div></article>
    <article><span><ShieldCheck size={20} /></span><div><small>สมาชิก Active</small><strong>{subscriptions.filter((item) => item.status === "active").length}</strong></div></article>
  </section><section className="admin-card"><div className="admin-card-head"><div><small>ลูกค้าระบบจริง</small><h2>กิจการล่าสุด</h2></div><Link href="/admin/organizations">จัดการทั้งหมด</Link></div><AdminTable headers={["ชื่อกิจการ", "สถานะ", "ผู้ใช้งาน", "วันที่สมัคร"]} rows={organizations.slice(0, 10).map((item) => [item.name, <StatusBadge compact key="s" status={item.status} />, memberCountByOrganization.get(item.id) ?? 0, thaiDate(item.created_at)])} /></section></>;
}
