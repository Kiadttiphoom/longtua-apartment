import { PortalShell } from "@/components/portal/PortalShell";
import { requirePortalContext } from "@/lib/portal/context";
import { loadPortalMenuBadges } from "@/lib/portal/badges";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const context = await requirePortalContext();
  const menuBadges = await loadPortalMenuBadges(context.organization.id, context.isImpersonating);

  return <PortalShell context={{
    userName: context.userName,
    roleLabel: context.roleLabel,
    organization: context.organization,
    organizations: context.organizations,
    menus: context.menus,
    isImpersonating: context.isImpersonating,
    menuBadges,
  }}>{children}</PortalShell>;
}
