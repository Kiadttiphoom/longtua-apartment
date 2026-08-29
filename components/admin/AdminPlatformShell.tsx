"use client";

import { usePathname } from "next/navigation";
import { Activity, BookOpenCheck, Building2, CalendarRange, CircleDollarSign, ClipboardCheck, FileText, Gauge, Hotel, KeyRound, LayoutDashboard, LogOut, Menu, MessageCircle, ReceiptText, Settings, ShieldCheck, UserCog, Users, WalletCards } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { logoutAction } from "@/app/auth/actions";
import { AppNavLink } from "@/components/ui/AppNavLink";

const navigation = [
  ["overview", "ภาพรวมระบบ", LayoutDashboard], ["trial-requests", "คำขอทดลองใช้", ClipboardCheck], ["organizations", "กิจการ", Building2], ["properties", "หอพัก", Hotel], ["users", "ผู้ใช้งาน", Users], ["rooms", "ห้องพัก", KeyRound], ["tenants", "ผู้เช่า", Users], ["leases", "สัญญาเช่า", CalendarRange], ["meters", "มิเตอร์", Gauge], ["invoices", "ใบแจ้งหนี้", FileText], ["payments", "รับชำระ", WalletCards], ["receivables", "ยอดค้าง", ReceiptText], ["reports", "รายงาน", BookOpenCheck], ["line", "LINE แจ้งเตือน", MessageCircle], ["subscriptions", "แพ็กเกจและบริการ", CircleDollarSign], ["roles", "Role", UserCog], ["permissions", "Permission", KeyRound], ["menus", "เมนูระบบ", Menu], ["audit", "Audit Log", Activity], ["settings", "ตั้งค่าระบบ", Settings],
] as const;

export function AdminPlatformShell({ profileName, children }: { profileName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return <main className="admin-shell"><aside className="admin-sidebar">
    <div className="admin-brand"><BrandLogo /></div>
    <div className="admin-identity"><span><ShieldCheck size={19} /></span><div><strong>{profileName}</strong><small>Super Admin · Longtua</small></div></div>
    <nav>{navigation.map(([key, label, Icon]) => { const href = key === "overview" ? "/admin" : `/admin/${key}`; const active = key === "overview" ? pathname === "/admin" : pathname.startsWith(href); return <AppNavLink active={active} className={active ? "active" : ""} href={href} key={key}><Icon size={18} />{label}</AppNavLink>; })}</nav>
    <form action={logoutAction}><button type="submit"><LogOut size={18} />ออกจากระบบ</button></form>
  </aside><section className="admin-content">{children}</section></main>;
}
