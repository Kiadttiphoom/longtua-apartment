import { PortalShell } from "@/components/portal/PortalShell";
import { requirePortalContext } from "@/lib/portal/context";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const context = await requirePortalContext();
  return <PortalShell context={{
    userName: context.userName,
    roleLabel: context.roleLabel,
    organization: context.organization,
    organizations: context.organizations,
    menus: context.menus,
  }}>{children}</PortalShell>;
}
