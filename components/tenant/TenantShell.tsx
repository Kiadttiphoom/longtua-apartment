"use client";

import { FileText, Home, LogOut, ReceiptText } from "lucide-react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AppNavLink } from "@/components/ui/AppNavLink";

const nav = [["/tenant", "หน้าหลัก", Home], ["/tenant/lease", "สัญญา", FileText], ["/tenant/bills", "บิลและชำระ", ReceiptText]] as const;

export function TenantShell({ tenantName, organizationName, children }: { tenantName: string; organizationName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className="tenant-shell">
    <header className="tenant-topbar">
      <div className="tenant-topbar-inner">
        <BrandLogo className="tenant-brand-logo" variant="inverse" />
        <div className="tenant-account-summary"><strong>{tenantName}</strong><span>{organizationName}</span></div>
      </div>
    </header>
    <main className="tenant-content">{children}</main>
    <nav aria-label="เมนูผู้เช่า" className="tenant-bottom-nav">
      {nav.map(([href, label, Icon]) => {
        const active = href === "/tenant" ? pathname === href : pathname.startsWith(href);
        return <AppNavLink active={active} className={active ? "active" : ""} href={href} key={href}><Icon size={20} /><span>{label}</span></AppNavLink>;
      })}
      <form action={logoutAction} className="tenant-nav-logout"><button type="submit"><LogOut aria-hidden="true" size={20} /><span>ออกระบบ</span></button></form>
    </nav>
  </div>;
}
