import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOrganizationAccess } from "@/lib/auth/organization-access";
import { isSystemAdmin } from "@/lib/auth/system-admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const ACTIVE_ORGANIZATION_COOKIE = "longtua_active_organization";

const menuPaths: Record<string, string> = {
  customer_overview: "/dashboard",
  customer_properties: "/dormitories",
  customer_users: "/users",
  customer_rooms: "/guestrooms",
  customer_tenants: "/tenants",
  customer_leases: "/leases",
  customer_meters: "/meters",
  customer_invoices: "/invoices",
  customer_payments: "/payments",
  customer_receivables: "/receivables",
  customer_reports: "/reports",
  customer_settings: "/settings",
  customer_subscription: "/subscription",
};

const fallbackMenus = [
  ["customer_overview", "แดชบอร์ด"], ["customer_properties", "หอพัก"],
  ["customer_users", "ผู้ใช้งาน"], ["customer_rooms", "ห้องพัก"],
  ["customer_tenants", "ผู้เช่า"], ["customer_leases", "สัญญาเช่า"],
  ["customer_meters", "มิเตอร์"], ["customer_invoices", "ใบแจ้งหนี้"],
  ["customer_payments", "รับชำระ"], ["customer_receivables", "ยอดค้าง"],
  ["customer_reports", "รายงาน"], ["customer_settings", "ตั้งค่าหอพัก"],
  ["customer_subscription", "แพ็กเกจและบริการ"],
] as const;

function roleLabel(role: string) {
  return ({ owner: "เจ้าของกิจการ", manager: "ผู้จัดการ", accounting: "ฝ่ายบัญชี", staff: "พนักงาน" } as Record<string, string>)[role] ?? role;
}

export type PortalContext = {
  userId: string;
  userName: string;
  roleCode: string;
  roleLabel: string;
  organization: { id: string; name: string };
  organizations: Array<{ id: string; name: string }>;
  subscription: { status: string; trial_ends_at: string | null };
  permissions: string[];
  granularReady: boolean;
  menus: Array<{ code: string; label: string; href: string }>;
};

export const requirePortalContext = cache(async (): Promise<PortalContext> => {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (authError || !userId) redirect("/login");
  if (await isSystemAdmin(userId)) redirect("/admin");

  const [{ data: profile }, { data: memberships, error: membershipError }] = await Promise.all([
    supabase.from("profiles").select("display_name, status").eq("id", userId).maybeSingle(),
    supabase.from("organization_members").select("organization_id, role_code").eq("user_id", userId).eq("status", "active").order("created_at"),
  ]);
  if (profile?.status === "pending") redirect("/registration/pending");
  if (!profile || profile.status !== "active" || membershipError || !memberships?.length) redirect("/login");

  const { data: organizations, error: organizationError } = await supabase
    .from("organizations")
    .select("id, name")
    .in("id", memberships.map((membership) => membership.organization_id))
    .order("created_at");
  if (organizationError || !organizations?.length) redirect("/login");

  const cookieStore = await cookies();
  const requestedOrganizationId = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value;
  const membership = memberships.find((item) => item.organization_id === requestedOrganizationId) ?? memberships[0];
  const organization = organizations.find((item) => item.id === membership.organization_id);
  if (!organization) redirect("/login");

  const [access, subscriptionResult] = await Promise.all([
    getOrganizationAccess(userId, organization.id),
    supabase.from("subscriptions").select("status, trial_ends_at").eq("organization_id", organization.id).single(),
  ]);
  if (!access || subscriptionResult.error || !subscriptionResult.data) redirect("/login");

  const menus = access.granularReady
    ? access.menus.flatMap((menu) => menuPaths[menu.code] ? [{ code: menu.code, label: menu.label, href: menuPaths[menu.code] }] : [])
    : fallbackMenus.map(([code, label]) => ({ code, label, href: menuPaths[code] }));

  return {
    userId,
    userName: profile.display_name,
    roleCode: membership.role_code,
    roleLabel: roleLabel(membership.role_code),
    organization,
    organizations,
    subscription: subscriptionResult.data,
    permissions: Array.from(access.permissions),
    granularReady: access.granularReady,
    menus,
  };
});

export function can(context: PortalContext, menuCode: string, action: string) {
  return !context.granularReady || context.permissions.includes(`${menuCode}:${action}`);
}
