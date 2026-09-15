"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity, BookOpenCheck, Building2, CalendarRange, CircleDollarSign,
  ClipboardCheck, FileText, Gauge, Hotel, KeyRound, LayoutDashboard,
  LogOut, Menu, MessageCircle, ReceiptText, Settings, ShieldCheck,
  UserCog, Users, WalletCards, X,
} from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] bg-[#f4f6fa] text-slate-800">
      <aside
        className={`fixed top-0 left-0 z-50 w-[260px] h-dvh flex flex-col bg-[#050f24] text-white shadow-2xl transition-transform lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-[76px] min-h-[76px] px-5 flex items-center justify-between border-b border-white/10 bg-[#030917]">
          <BrandLogo className="max-w-[150px]" variant="inverse" />
          <button
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-white/5 cursor-pointer"
            onClick={() => setMobileOpen(false)}
            aria-label="ปิดเมนู"
            type="button"
          >
            <X size={20} />
          </button>
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
        <nav aria-label="เมนูระบบ" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 space-y-4">
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
                      onClick={() => setMobileOpen(false)}
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
        <form action={logoutAction} className="mt-auto shrink-0 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-3 border-t border-white/10">
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-300 text-xs font-medium hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            type="submit"
          >
            <LogOut size={16} />
            <span>ออกจากระบบ</span>
          </button>
        </form>
      </aside>

      {mobileOpen ? (
        <button
          aria-label="ปิดเมนู"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden cursor-pointer"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      ) : null}

      <div className="min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 min-h-[64px] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
              onClick={() => setMobileOpen(true)}
              aria-label="เปิดเมนู"
              type="button"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                Super Admin
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="relative w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm ring-1 ring-blue-500/20">
              {profileName.trim().slice(0, 1)}
              <i aria-hidden="true" className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>
            <div className="flex flex-col text-right sm:text-left">
              <strong className="text-xs font-semibold text-slate-800 leading-tight">{profileName}</strong>
              <small className="text-[10px] text-slate-500">Super Admin</small>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full flex-1">{children}</main>
      </div>
    </div>
  );
}
