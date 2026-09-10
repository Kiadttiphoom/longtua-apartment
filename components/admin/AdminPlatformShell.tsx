"use client";

import { usePathname } from "next/navigation";
import { Activity, BookOpenCheck, Building2, CalendarRange, CircleDollarSign, ClipboardCheck, FileText, Gauge, Hotel, KeyRound, LayoutDashboard, LogOut, Menu, MessageCircle, ReceiptText, Settings, ShieldCheck, UserCog, Users, WalletCards } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { logoutAction } from "@/app/auth/actions";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { AdminGlobalSearch } from "@/components/admin/AdminGlobalSearch";

const navigation = [
  ["overview", "ภาพรวมระบบ", LayoutDashboard], ["trial-requests", "คำขอทดลองใช้", ClipboardCheck], ["organizations", "กิจการ", Building2], ["properties", "หอพัก", Hotel], ["users", "ผู้ใช้งาน", Users], ["rooms", "ห้องพัก", KeyRound], ["tenants", "ผู้เช่า", Users], ["leases", "สัญญาเช่า", CalendarRange], ["meters", "มิเตอร์", Gauge], ["invoices", "ใบแจ้งหนี้", FileText], ["payments", "รับชำระ", WalletCards], ["receivables", "ยอดค้าง", ReceiptText], ["reports", "รายงาน", BookOpenCheck], ["line", "LINE แจ้งเตือน", MessageCircle], ["subscriptions", "แพ็กเกจและบริการ", CircleDollarSign], ["roles", "Role", UserCog], ["permissions", "Permission", KeyRound], ["menus", "เมนูระบบ", Menu], ["monitor", "Monitor", Activity], ["audit", "Audit Log", Activity], ["settings", "ตั้งค่าระบบ", Settings],
] as const;

const adminCategories = [
  { label: "ภาพรวม", keys: ["overview", "trial-requests", "organizations", "properties", "users"] },
  { label: "จัดการหอพัก", keys: ["rooms", "tenants", "leases"] },
  { label: "การเงิน", keys: ["meters", "invoices", "payments", "receivables", "reports"] },
  { label: "บริการเสริม", keys: ["line"] },
  { label: "ระบบ", keys: ["subscriptions", "roles", "permissions", "menus", "monitor", "audit", "settings"] },
];

export function AdminPlatformShell({ profileName, children }: { profileName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)] bg-[#f4f6fa] text-slate-800">
      <aside className="sticky top-0 h-screen flex flex-col bg-[#050f24] text-white shadow-xl">
        <div className="h-[76px] px-5 flex items-center border-b border-white/10 bg-[#030917]">
          <BrandLogo className="max-w-[150px]" variant="inverse" />
        </div>
        <div className="mx-3 my-3 p-3 flex items-center gap-3 rounded-xl bg-blue-600/15 border border-blue-500/25">
          <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
            <ShieldCheck size={18} />
          </span>
          <div className="min-w-0 flex flex-col">
            <strong className="text-xs font-bold text-white truncate">{profileName}</strong>
            <small className="text-[10px] text-slate-400">Super Admin · Longtua</small>
          </div>
        </div>
        <div className="px-3 mb-2">
          <AdminGlobalSearch />
        </div>
        <nav aria-label="เมนูระบบ" className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {adminCategories.map((group) => {
            const items = group.keys
              .map((k) => navigation.find(([itemKey]) => itemKey === k))
              .filter((item): item is NonNullable<typeof item> => Boolean(item));
            if (items.length === 0) return null;
            return (
              <section className="space-y-1" key={group.label}>
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
                {items.map(([key, label, Icon]) => {
                  const href = key === "overview" ? "/admin" : `/admin/${key}`;
                  const active = key === "overview" ? pathname === "/admin" : pathname.startsWith(href);
                  return (
                    <AppNavLink
                      active={active}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        active
                          ? "bg-blue-600/30 text-white font-semibold border-l-2 border-blue-400 pl-2.5"
                          : "text-slate-300 hover:text-white hover:bg-white/10"
                      }`}
                      href={href}
                      key={key}
                    >
                      <Icon size={16} />
                      <span className="truncate">{label}</span>
                    </AppNavLink>
                  );
                })}
              </section>
            );
          })}
        </nav>
        <form action={logoutAction} className="mt-auto p-3 border-t border-white/10">
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-300 text-xs font-medium hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            type="submit"
          >
            <LogOut size={16} />
            <span>ออกจากระบบ</span>
          </button>
        </form>
      </aside>
      <section className="p-6 lg:p-8 max-w-[1440px] mx-auto w-full">{children}</section>
    </main>
  );
}
