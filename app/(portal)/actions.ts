"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "@/lib/portal/context";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function switchOrganizationAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const returnPathValue = String(formData.get("returnPath") ?? "/dashboard");
  const portalPaths = new Set(["/dashboard", "/dormitories", "/guestrooms", "/tenants", "/leases", "/meters", "/invoices", "/payments", "/receivables", "/reports", "/settings", "/subscription"]);
  const returnPath = portalPaths.has(returnPathValue) ? returnPathValue : "/dashboard";
  if (!UUID_PATTERN.test(organizationId)) return;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORGANIZATION_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect(returnPath);
}
