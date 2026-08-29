import { TenantShell } from "@/components/tenant/TenantShell";
import { loadTenantPortalData } from "@/lib/tenant/data";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const data = await loadTenantPortalData();
  return <TenantShell organizationName={data.organization.name} tenantName={data.tenant.full_name}>{children}</TenantShell>;
}
