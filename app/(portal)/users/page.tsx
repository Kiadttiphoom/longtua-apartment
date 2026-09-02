import { can, requirePortalContext } from "@/lib/portal/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersPage, type PortalMember } from "@/components/portal/UsersPage";
import { thaiDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PortalUsersRoute() {
  const context = await requirePortalContext();
  const admin = createAdminClient();

  const [membersResult, profilesResult, rolesResult, propertiesResult] = await Promise.all([
    admin
      .from("organization_members")
      .select("organization_id, user_id, role_code, status, created_at")
      .eq("organization_id", context.organization.id)
      .order("created_at"),
    admin
      .from("profiles")
      .select("id, username, display_name, status"),
    admin
      .from("platform_roles")
      .select("code, name"),
    admin
      .from("properties")
      .select("id, name")
      .eq("organization_id", context.organization.id)
      .order("name"),
  ]);

  const profileMap = new Map((profilesResult.data ?? []).map((p) => [p.id, p]));
  const roleMap = new Map((rolesResult.data ?? []).map((r) => [r.code, r.name]));
  const properties = propertiesResult.data ?? [];

  const members: PortalMember[] = (membersResult.data ?? []).map((m) => {
    const profile = profileMap.get(m.user_id);
    return {
      id: m.user_id,
      userId: m.user_id,
      name: profile?.display_name || profile?.username || "ผู้ใช้งาน",
      username: profile?.username || "—",
      roleCode: m.role_code,
      roleName: roleMap.get(m.role_code) || m.role_code,
      scope: "ทุกหอพัก",
      status: m.status as "active" | "pending" | "inactive",
      joinedAt: thaiDate(m.created_at),
    };
  });

  return (
    <UsersPage
      organizationId={context.organization.id}
      members={members}
      properties={properties}
      canCreate={can(context, "customer_users", "create")}
      canEdit={can(context, "customer_users", "update")}
    />
  );
}
