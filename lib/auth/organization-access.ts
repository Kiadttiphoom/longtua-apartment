import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type MenuActionCode = "menu_view" | "view" | "create" | "update" | "delete" | "report" | "export" | "approve" | "cancel";
export type OrganizationMenu = { code: string; label: string; href: string; icon: string; sortOrder: number };
export type OrganizationAccess = {
  roleCode: string;
  permissions: Set<string>;
  menus: OrganizationMenu[];
  granularReady: boolean;
};

const permissionKey = (menuCode: string, actionCode: string) => `${menuCode}:${actionCode}`;

export async function getOrganizationAccess(userId: string, organizationId: string): Promise<OrganizationAccess | null> {
  const admin = createAdminClient();
  const [membershipResult, profileResult, rolesResult, menusResult, actionsResult, menuActionsResult, roleValuesResult, userValuesResult] = await Promise.all([
    admin.from("organization_members").select("role_code, status").eq("organization_id", organizationId).eq("user_id", userId).maybeSingle(),
    admin.from("profiles").select("status").eq("id", userId).maybeSingle(),
    admin.from("platform_roles").select("id, code, status"),
    admin.from("platform_menus").select("id, code, label, href, icon, sort_order, audience, status").in("audience", ["customer", "all"]).eq("status", "active").order("sort_order"),
    admin.from("platform_permission_actions").select("code, status").eq("status", "active"),
    admin.from("platform_menu_actions").select("menu_id, action_code, is_active").eq("is_active", true),
    admin.from("platform_role_menu_actions").select("role_id, menu_id, action_code, is_allowed"),
    admin.from("platform_user_menu_actions").select("menu_id, action_code, is_allowed").eq("organization_id", organizationId).eq("user_id", userId),
  ]);
  const membership = membershipResult.data;
  if (!membership || membership.status !== "active" || profileResult.data?.status !== "active") return null;

  const granularResults = [actionsResult, menuActionsResult, roleValuesResult, userValuesResult];
  if (granularResults.some((result) => result.error) || menusResult.error || rolesResult.error) {
    return { roleCode: membership.role_code, permissions: new Set(), menus: [], granularReady: false };
  }
  const role = (rolesResult.data ?? []).find((item) => item.code === membership.role_code && item.status === "active");
  if (!role) return null;
  const activeActions = new Set((actionsResult.data ?? []).map((item) => item.code));
  const menuById = new Map((menusResult.data ?? []).map((menu) => [menu.id, menu]));
  const supported = new Set((menuActionsResult.data ?? []).filter((item) => activeActions.has(item.action_code) && menuById.has(item.menu_id)).map((item) => permissionKey(item.menu_id, item.action_code)));
  const roleValues = new Map((roleValuesResult.data ?? []).filter((item) => item.role_id === role.id).map((item) => [permissionKey(item.menu_id, item.action_code), item.is_allowed]));
  const userValues = new Map((userValuesResult.data ?? []).map((item) => [permissionKey(item.menu_id, item.action_code), item.is_allowed]));
  const permissions = new Set<string>();
  for (const combination of supported) {
    const separator = combination.lastIndexOf(":");
    const menuId = combination.slice(0, separator), actionCode = combination.slice(separator + 1);
    const menu = menuById.get(menuId);
    if (!menu) continue;
    const overrideValue = userValues.get(combination);
    const roleValue = roleValues.get(combination);
    const allowed = overrideValue ?? roleValue ?? false;
    if (allowed) permissions.add(permissionKey(menu.code, actionCode));
  }
  const menus = (menusResult.data ?? []).filter((menu) => permissions.has(permissionKey(menu.code, "menu_view")) && permissions.has(permissionKey(menu.code, "view"))).map((menu) => ({ code: menu.code, label: menu.label, href: menu.href, icon: menu.icon, sortOrder: menu.sort_order }));
  return { roleCode: membership.role_code, permissions, menus, granularReady: true };
}

export async function hasOrganizationPermission(userId: string, organizationId: string, menuCode: string, actionCode: MenuActionCode) {
  const access = await getOrganizationAccess(userId, organizationId);
  return access?.granularReady ? access.permissions.has(permissionKey(menuCode, actionCode)) : null;
}
