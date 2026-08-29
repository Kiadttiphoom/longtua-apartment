"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2, CalendarRange, CircleDollarSign, FileText, Gauge, Home, KeyRound,
  LayoutDashboard, LogOut, Menu, ReceiptText, Settings, Users, WalletCards, X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { logoutAction } from "@/app/auth/actions";
import { switchOrganizationAction } from "@/app/(portal)/actions";
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
  };
};

const icons: Record<string, typeof Home> = {
  customer_overview: LayoutDashboard, customer_properties: Building2, customer_rooms: KeyRound,
  customer_tenants: Users, customer_leases: CalendarRange, customer_meters: Gauge,
  customer_invoices: FileText, customer_payments: WalletCards, customer_receivables: ReceiptText,
  customer_reports: CircleDollarSign, customer_settings: Settings, customer_subscription: CircleDollarSign,
};

export function PortalShell({ children, context }: ShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return <div className="portal-shell">
    <aside className={`portal-sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="portal-brand"><BrandLogo className="portal-brand-logo" variant="inverse" /></div>
      <button className="portal-sidebar-close" onClick={() => setMobileOpen(false)} aria-label="ปิดเมนู"><X size={20} /></button>
      <div className="portal-nav-label">จัดการกิจการ</div>
      <nav>{context.menus.map((item) => {
        const Icon = icons[item.code] ?? Home;
        const active = pathname === item.href;
        return <AppNavLink active={active} className={active ? "active" : ""} href={item.href} key={item.code} onClick={() => setMobileOpen(false)}><Icon size={18} /><span>{item.label}</span></AppNavLink>;
      })}</nav>
      <form action={logoutAction} className="portal-logout-form"><button className="portal-logout" type="submit"><LogOut size={18} />ออกจากระบบ</button></form>
    </aside>
    {mobileOpen ? <button aria-label="ปิดเมนู" className="portal-sidebar-scrim" onClick={() => setMobileOpen(false)} /> : null}
    <div className="portal-main">
      <header className="portal-topbar">
        <button className="portal-menu-button" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู"><Menu size={21} /></button>
        {context.organizations.length > 1 ? <form action={switchOrganizationAction} className="portal-org-switch">
          <input name="returnPath" type="hidden" value={pathname} />
          <SelectControl ariaLabel="เลือกกิจการ" name="organizationId" onValueChange={(_, form) => form?.requestSubmit()} options={context.organizations.map((item) => ({ value: item.id, label: item.name }))} value={context.organization.id} />
        </form> : null}
        <div className="portal-user"><span>{context.userName.trim().slice(0, 1)}<i aria-hidden="true" /></span><div><strong>{context.userName}</strong><small>{context.roleLabel}</small></div></div>
      </header>
      <main className="portal-content">{children}</main>
    </div>
  </div>;
}
