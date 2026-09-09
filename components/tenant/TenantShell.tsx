"use client";

import { FileText, Home, LogOut, ReceiptText, Wrench } from "lucide-react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AppNavLink } from "@/components/ui/AppNavLink";

const nav = [
  ["/tenant", "หน้าหลัก", Home],
  ["/tenant/bills", "บิลและชำระ", ReceiptText],
  ["/tenant/repairs", "แจ้งซ่อม", Wrench],
  ["/tenant/lease", "สัญญา", FileText],
] as const;

export function TenantShell({
  tenantName,
  organizationName,
  children,
}: {
  tenantName: string;
  organizationName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-[#f8fafc] text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/20 bg-gradient-to-r from-[#0b1d39] via-[#0d2243] to-[#091830] text-white shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo
              className="flex w-28 shrink-0 flex-col object-contain text-white [&_strong]:text-lg [&_small]:text-[10px] [&_small]:tracking-widest"
              variant="inverse"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <strong className="block truncate text-sm font-bold text-white leading-tight">
                {tenantName}
              </strong>
              <span className="block truncate text-xs text-blue-200/80">
                {organizationName}
              </span>
            </div>
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-bold text-xs text-white shadow-sm ring-2 ring-white/10">
              {tenantName.trim().slice(0, 1)}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b1d39]" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-6 px-4 pt-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-7">
        {children}
      </main>

      {/* Flutter/iOS Style Bottom Navigation Bar */}
      <nav
        aria-label="เมนูผู้เช่า"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-3 pt-2 pb-[calc(0.6rem+env(safe-area-inset-bottom))] shadow-xl shadow-slate-900/10 backdrop-blur-md sm:left-1/2 sm:max-w-xl sm:-translate-x-1/2 sm:rounded-t-3xl sm:border-x"
      >
        <div className="grid grid-cols-5 items-center gap-1">
          {nav.map(([href, label, Icon]) => {
            const active = href === "/tenant" ? pathname === href : pathname.startsWith(href);
            return (
              <AppNavLink
                active={active}
                className={`relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition-all active:scale-95 ${
                  active
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
                href={href}
                key={href}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="tracking-tight">{label}</span>
                {active && (
                  <span className="absolute bottom-1 h-1 w-4 rounded-full bg-blue-600" />
                )}
              </AppNavLink>
            );
          })}

          <form action={logoutAction} className="flex">
            <button
              type="submit"
              className="flex min-h-[52px] w-full flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95 cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut size={19} strokeWidth={2} />
              <span className="tracking-tight">ออกระบบ</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
  );
}
