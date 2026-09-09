"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2, CalendarRange, CircleDollarSign, FileText, Gauge, Home, KeyRound,
  LayoutDashboard, LogOut, Menu, ReceiptText, Settings, Users, WalletCards, X,
  AlertTriangle, ArrowLeft,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { logoutAction } from "@/app/auth/actions";
import { switchOrganizationAction, stopImpersonatingAction } from "@/app/(portal)/actions";
import { SelectControl } from "@/components/ui/SelectControl";
import { AppNavLink } from "@/components/ui/AppNavLink";

type ShellProps = {
  children: React.ReactNode;
  context: {
    userName: string;
    roleLabel: string;
    organization: { id: string; name: string };
    organizations: Array<{ id: string; name: string }>;
    menus: Array<{ code: string; label: string; href: string }>;
    isImpersonating?: boolean;
    menuBadges?: Record<string, number>;
  };
};

const icons: Record<string, typeof Home> = {
  customer_overview: LayoutDashboard, customer_properties: Building2, customer_users: Users,
  customer_rooms: KeyRound, customer_tenants: Users, customer_leases: CalendarRange,
  customer_meters: Gauge, customer_invoices: FileText, customer_payments: WalletCards,
  customer_receivables: ReceiptText, customer_reports: CircleDollarSign,
  customer_settings: Settings, customer_subscription: CircleDollarSign,
};

const menuCategoryOrder = [
  { label: "ภาพรวม", codes: ["customer_overview", "customer_properties", "customer_users"] },
  { label: "จัดการหอพัก", codes: ["customer_rooms", "customer_tenants", "customer_leases"] },
  { label: "การเงิน", codes: ["customer_meters", "customer_invoices", "customer_payments", "customer_receivables", "customer_reports"] },
  { label: "บริการเสริม", codes: ["customer_line"] },
  { label: "ระบบ", codes: ["customer_subscription", "customer_settings"] },
];

export function PortalShell({ children, context }: ShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const totalBadgeCount = Object.values(context.menuBadges ?? {}).reduce((sum, val) => sum + val, 0);

  // Group context.menus by category
  const knownCodes = new Set(menuCategoryOrder.flatMap((g) => g.codes));
  const groupedMenus = menuCategoryOrder
    .map((group) => ({
      label: group.label,
      items: group.codes
        .map((code) => context.menus.find((m) => m.code === code))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    }))
    .filter((group) => group.items.length > 0);

  const leftoverMenus = context.menus.filter((m) => !knownCodes.has(m.code));
  if (leftoverMenus.length > 0) {
    groupedMenus.push({ label: "อื่นๆ", items: leftoverMenus });
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[272px_minmax(0,1fr)] bg-[#f5f7fb] text-[#15233b]">
      <aside className={`fixed top-0 left-0 z-50 w-[272px] h-dvh flex flex-col bg-gradient-to-b from-[#0b1d39] via-[#091830] to-[#071428] text-white shadow-2xl transition-transform lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-[96px] min-h-[96px] p-4 flex items-center justify-center border-b border-white/10 bg-[#06152d]">
          <BrandLogo className="w-full max-h-[70px] object-contain" variant="inverse" />
        </div>
        <button
          className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-white/5"
          onClick={() => setMobileOpen(false)}
          aria-label="ปิดเมนู"
          type="button"
        >
          <X size={20} />
        </button>
        <nav aria-label="เมนูหลัก" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-4">
          {groupedMenus.map((group) => (
            <section className="space-y-1" key={group.label}>
              <p className="px-3 py-1 text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = icons[item.code] ?? Home;
                const active = pathname === item.href;
                const badge = context.menuBadges?.[item.code] ?? 0;
                return (
                  <AppNavLink
                    active={active}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all ${
                      active
                        ? "bg-[#2457e6] text-white shadow-md shadow-blue-700/40 font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                    href={item.href}
                    key={item.code}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={18} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {badge > 0 && (
                      <span
                        className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10.5px] font-black text-white bg-rose-500 rounded-full shadow-xs ring-2 ring-rose-500/30 shrink-0"
                        title={`มี ${badge} รายการที่ต้องดำเนินการ`}
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </AppNavLink>
                );
              })}
            </section>
          ))}
        </nav>
        <form action={logoutAction} className="mt-auto shrink-0 p-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:pb-3 border-t border-white/10">
          <button
            className="w-full min-h-11 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-300 text-[13px] font-medium hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            type="submit"
          >
            <LogOut size={18} />
            <span>ออกจากระบบ</span>
          </button>
        </form>
      </aside>
      {mobileOpen ? (
        <button
          aria-label="ปิดเมนู"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      ) : null}
      <div className="min-w-0 flex flex-col">
        {context.isImpersonating && (
          <div className="bg-amber-500 text-slate-950 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm border-b border-amber-600/30">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wide">
              <AlertTriangle size={16} className="text-slate-950 shrink-0" />
              <span>โหมดเข้าดูแทนลูกค้า (Impersonation Mode) — กิจการ: <strong className="underline font-extrabold">{context.organization.name}</strong></span>
            </div>
            <form action={stopImpersonatingAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 text-white hover:bg-black text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              >
                <ArrowLeft size={13} />
                <span>กลับสู่หน้า Super Admin</span>
              </button>
            </form>
          </div>
        )}
        <header className="sticky top-0 z-30 min-h-[70px] px-6 lg:px-8 flex items-center gap-4 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
          <button
            className="relative lg:hidden p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
            onClick={() => setMobileOpen(true)}
            aria-label="เปิดเมนู"
            type="button"
          >
            <Menu size={20} />
            {totalBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>
          {context.organizations.length > 1 ? (
            <form action={switchOrganizationAction} className="flex items-center gap-2">
              <input name="returnPath" type="hidden" value={pathname} />
              <SelectControl
                ariaLabel="เลือกกิจการ"
                name="organizationId"
                onValueChange={(_, form) => form?.requestSubmit()}
                options={context.organizations.map((item) => ({ value: item.id, label: item.name }))}
                value={context.organization.id}
              />
            </form>
          ) : null}
          <div className="ml-auto flex items-center gap-3">
            <span className="relative w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
              {context.userName.trim().slice(0, 1)}
              <i aria-hidden="true" className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>
            <div className="flex flex-col">
              <strong className="text-sm font-semibold text-slate-800 leading-tight">{context.userName}</strong>
              <small className="text-xs text-slate-500">{context.roleLabel}</small>
            </div>
          </div>
        </header>
        <main className="w-full max-w-[1460px] mx-auto p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
