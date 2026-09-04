"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSystemAdmin } from "@/lib/auth/system-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { IMPERSONATE_ORGANIZATION_COOKIE } from "@/lib/portal/context";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODE_PATTERN = /^[a-z][a-z0-9_]{2,49}$/;
const PERMISSION_PATTERN = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;
const ACTION_CODES = new Set(["menu_view", "view", "create", "update", "delete", "report", "export", "approve", "cancel"]);

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }

async function adminContext() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId || !await isSystemAdmin(userId)) redirect("/login");
  return { admin: createAdminClient(), userId, requestId: crypto.randomUUID() };
}

async function audit(context: Awaited<ReturnType<typeof adminContext>>, action: string, entityType: string, entityId: string | null, beforeData: unknown, afterData: unknown) {
  const { error } = await context.admin.from("platform_audit_logs").insert({
    request_id: context.requestId,
    actor_user_id: context.userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_data: beforeData,
    after_data: afterData,
  });
  if (error) console.error(`[admin] ${JSON.stringify({ requestId: context.requestId, stage: "audit.write", code: error.code, message: error.message })}`);
}

function adminPath(view: string) { return view === "overview" ? "/admin" : `/admin/${view}`; }

function done(view: string, message: string): never {
  revalidatePath("/admin");
  revalidatePath(adminPath(view));
  redirect(`${adminPath(view)}?saved=${encodeURIComponent(message)}`);
}

function failed(view: string, requestId: string, stage: string, error: unknown): never {
  const details = error && typeof error === "object" ? error as { code?: string; message?: string } : {};
  console.error(`[admin] ${JSON.stringify({ requestId, stage, code: details.code, message: details.message ?? "Unexpected admin error" })}`);
  redirect(`${adminPath(view)}?error=${requestId}`);
}

export async function setRegistrationEnabledAction(formData: FormData) {
  const context = await adminContext();
  const enabled = text(formData, "enabled") === "true";
  const { data: before } = await context.admin.from("system_settings").select("value").eq("key", "registration_enabled").maybeSingle();
  const { error } = await context.admin.from("system_settings").upsert({ key: "registration_enabled", value: enabled, description: "Controls trial requests submitted by the public marketing website", updated_by: context.userId });
  if (error) failed("settings", context.requestId, "registration_setting.update", error);
  await audit(context, "system.registration.updated", "system_setting", "registration_enabled", before, { value: enabled });
  revalidatePath("/register");
  done("settings", enabled ? "เปิดรับคำขอทดลองใช้แล้ว" : "ปิดรับคำขอทดลองใช้แล้ว");
}

export async function approveTrialRequestAction(formData: FormData) {
  const context = await adminContext();
  const requestId = text(formData, "requestId");
  if (!UUID_PATTERN.test(requestId)) failed("trial-requests", context.requestId, "trial_request.validation", new Error("Invalid trial request id"));

  const { data: before, error: beforeError } = await context.admin
    .from("trial_requests")
    .select("id, auth_user_id, username, operator_name, property_name, contact_email, phone, requested_room_count, status, risk_flags")
    .eq("id", requestId)
    .maybeSingle();
  if (beforeError || !before || before.status !== "pending") failed("trial-requests", context.requestId, "trial_request.pending_lookup", beforeError ?? new Error("Pending request not found"));

  const { data: approved, error } = await context.admin.rpc("approve_trial_request", {
    target_request_id: requestId,
    reviewer_user_id: context.userId,
  });
  if (error) failed("trial-requests", context.requestId, "trial_request.approve", error);

  // Ensure trial subscription quotas adhere to standard Trial tier (1 property, 10 rooms)
  const approvedRecord = Array.isArray(approved) ? approved[0] : approved;
  const createdOrgId = approvedRecord?.organization_id;
  if (createdOrgId) {
    await context.admin
      .from("subscriptions")
      .update({ max_properties: 1, max_rooms: 10 })
      .eq("organization_id", createdOrgId);
  }

  await audit(context, "trial_request.approved", "trial_request", requestId, before, approved);
  revalidatePath("/registration/pending");
  done("trial-requests", "อนุมัติคำขอและเริ่ม Trial 30 วันแล้ว (โควตา 1 หอพัก 10 ห้อง)");
}

export async function rejectTrialRequestAction(formData: FormData) {
  const context = await adminContext();
  const requestId = text(formData, "requestId");
  const reason = text(formData, "reason");
  if (!UUID_PATTERN.test(requestId) || reason.length < 3 || reason.length > 500) failed("trial-requests", context.requestId, "trial_request.rejection_validation", new Error("Invalid rejection details"));

  const { data: before, error: beforeError } = await context.admin
    .from("trial_requests")
    .select("id, auth_user_id, username, operator_name, property_name, contact_email, phone, requested_room_count, status, risk_flags")
    .eq("id", requestId)
    .maybeSingle();
  if (beforeError || !before || before.status !== "pending") failed("trial-requests", context.requestId, "trial_request.pending_lookup", beforeError ?? new Error("Pending request not found"));

  const { error } = await context.admin.rpc("reject_trial_request", {
    target_request_id: requestId,
    reviewer_user_id: context.userId,
    reason,
  });
  if (error) failed("trial-requests", context.requestId, "trial_request.reject", error);
  await audit(context, "trial_request.rejected", "trial_request", requestId, before, { status: "rejected", reason });
  revalidatePath("/registration/pending");
  done("trial-requests", "ปฏิเสธคำขอทดลองใช้แล้ว");
}

export async function updateOrganizationAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "organizationId");
  const status = text(formData, "status");
  if (!UUID_PATTERN.test(id) || !["active", "suspended", "closed"].includes(status)) failed("organizations", context.requestId, "organization.validation", new Error("Invalid organization update"));
  const { data: before } = await context.admin.from("organizations").select("id, name, status").eq("id", id).single();
  const { data: after, error } = await context.admin.from("organizations").update({ status }).eq("id", id).select("id, name, status").single();
  if (error) failed("organizations", context.requestId, "organization.update", error);
  await audit(context, "organization.status_updated", "organization", id, before, after);
  done("organizations", "อัปเดตสถานะกิจการแล้ว");
}

export async function impersonateOrganizationAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "organizationId");
  if (!UUID_PATTERN.test(id)) failed("organizations", context.requestId, "organization.impersonate_validation", new Error("Invalid organization id"));
  const { data: org } = await context.admin.from("organizations").select("id, name").eq("id", id).maybeSingle();
  if (!org) failed("organizations", context.requestId, "organization.not_found", new Error("Organization not found"));
  await audit(context, "organization.impersonated", "organization", id, null, { action: "impersonate_start", target_org: org.name });
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_ORGANIZATION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4, // 4 hours
  });
  redirect("/dashboard");
}

export async function updateUserStatusAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "userId");
  const status = text(formData, "status");
  if (!UUID_PATTERN.test(id) || !["active", "suspended"].includes(status)) failed("users", context.requestId, "user.validation", new Error("Invalid user update"));
  if (id === context.userId) failed("users", context.requestId, "user.self_update", new Error("Cannot suspend current admin"));
  const { data: systemAdmin } = await context.admin.from("system_admins").select("user_id").eq("user_id", id).eq("status", "active").maybeSingle();
  if (systemAdmin) failed("users", context.requestId, "user.system_admin_update", new Error("System admins must be managed separately"));
  const { data: before } = await context.admin.from("profiles").select("id, username, status").eq("id", id).single();
  const { data: after, error } = await context.admin.from("profiles").update({ status }).eq("id", id).select("id, username, status").single();
  if (error) failed("users", context.requestId, "user.status_update", error);
  await audit(context, "user.status_updated", "user", id, before, after);
  done("users", "อัปเดตสถานะผู้ใช้งานแล้ว");
}

export async function updateMembershipRoleAction(formData: FormData) {
  const context = await adminContext();
  const organizationId = text(formData, "organizationId"), userId = text(formData, "userId"), roleCode = text(formData, "roleCode");
  if (![organizationId, userId].every((id) => UUID_PATTERN.test(id)) || !CODE_PATTERN.test(roleCode)) failed("permissions", context.requestId, "membership_role.validation", new Error("Invalid membership role update"));
  const { data: role } = await context.admin.from("platform_roles").select("code, name, scope_type, status").eq("code", roleCode).maybeSingle();
  if (!role || role.status !== "active" || role.scope_type !== "organization") failed("permissions", context.requestId, "membership_role.invalid_role", new Error("Role must be an active organization role"));
  const { data: before } = await context.admin.from("organization_members").select("organization_id, user_id, role_code, status").eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!before || before.status !== "active") failed("permissions", context.requestId, "membership_role.membership", new Error("Active membership not found"));
  if (before.role_code === "owner" && roleCode !== "owner") failed("permissions", context.requestId, "membership_role.owner_protected", new Error("Use an ownership transfer flow to change the organization owner"));
  if (before.role_code !== "owner" && roleCode === "owner") failed("permissions", context.requestId, "membership_role.owner_transfer_required", new Error("Use an ownership transfer flow to assign the owner role"));
  const { data: after, error } = await context.admin.from("organization_members").update({ role_code: roleCode }).eq("organization_id", organizationId).eq("user_id", userId).select("organization_id, user_id, role_code, status").single();
  if (error) failed("permissions", context.requestId, "membership_role.update", error);
  await audit(context, "membership.role_updated", "organization_member", `${organizationId}:${userId}`, before, after);
  done("permissions", `เปลี่ยน Role เป็น ${role.name} แล้ว`);
}

export async function resetUserPasswordAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "userId");
  const password = text(formData, "temporaryPassword");
  if (!UUID_PATTERN.test(id) || password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) failed("users", context.requestId, "user.password_validation", new Error("Temporary password is invalid"));
  const { error } = await context.admin.auth.admin.updateUserById(id, { password });
  if (error) failed("users", context.requestId, "user.password_reset", error);
  const { error: profileError } = await context.admin.from("profiles").update({ must_change_password: true }).eq("id", id);
  if (profileError) failed("users", context.requestId, "user.password_flag_update", profileError);
  await audit(context, "user.password_reset", "user", id, null, { must_change_password: true });
  done("users", "ตั้งรหัสผ่านชั่วคราวแล้ว");
}

export async function updateSubscriptionAction(formData: FormData) {
  const context = await adminContext();
  const organizationId = text(formData, "organizationId");
  const status = text(formData, "status");
  const accessUntil = text(formData, "accessUntil");
  const maxPropertiesRaw = text(formData, "maxProperties");
  const maxRoomsRaw = text(formData, "maxRooms");
  const allowed = ["trialing", "active", "past_due", "readonly", "paused", "cancelled"];
  if (!UUID_PATTERN.test(organizationId) || !allowed.includes(status)) failed("subscriptions", context.requestId, "subscription.validation", new Error("Invalid subscription update"));
  const { data: before } = await context.admin.from("subscriptions").select("*").eq("organization_id", organizationId).single();
  const updates: Record<string, unknown> = { status, access_until: accessUntil ? new Date(`${accessUntil}T23:59:59+07:00`).toISOString() : null, updated_at: new Date().toISOString() };
  if (status === "trialing" && accessUntil) updates.trial_ends_at = updates.access_until;
  if (maxPropertiesRaw && !isNaN(Number(maxPropertiesRaw))) updates.max_properties = Math.max(1, Math.min(1000, Number(maxPropertiesRaw)));
  if (maxRoomsRaw && !isNaN(Number(maxRoomsRaw))) updates.max_rooms = Math.max(1, Math.min(10000, Number(maxRoomsRaw)));
  const { data: after, error } = await context.admin.from("subscriptions").update(updates).eq("organization_id", organizationId).select("*").single();
  if (error) failed("subscriptions", context.requestId, "subscription.update", error);
  await audit(context, "subscription.updated", "subscription", organizationId, before, after);
  done("subscriptions", "อัปเดต Subscription และโควตาแล้ว");
}

export async function saveSubscriptionPlanAction(formData: FormData) {
  const context = await adminContext();
  const code = text(formData, "code").toLowerCase();
  const name = text(formData, "name");
  const priceMonthlyRaw = text(formData, "priceMonthly");
  const period = text(formData, "period") || "เดือน";
  const targetAudience = text(formData, "targetAudience");
  const badge = text(formData, "badge") || null;
  const popular = text(formData, "popular") === "true";
  const maxPropertiesRaw = text(formData, "maxProperties");
  const maxPropertiesLabel = text(formData, "maxPropertiesLabel");
  const maxRoomsRaw = text(formData, "maxRooms");
  const maxRoomsLabel = text(formData, "maxRoomsLabel");
  const maxUsersRaw = text(formData, "maxUsers");
  const maxUsersLabel = text(formData, "maxUsersLabel");
  const maxSlipVerificationsRaw = text(formData, "maxSlipVerifications");
  const maxSlipVerificationsLabel = text(formData, "maxSlipVerificationsLabel");
  const featuresRaw = text(formData, "features");
  const ctaLabel = text(formData, "ctaLabel") || "เลือกแพ็กเกจ";
  const ctaHref = text(formData, "ctaHref") || "/contact";
  const ctaVariant = text(formData, "ctaVariant") || "secondary";
  const isActive = text(formData, "isActive") !== "false";

  if (!CODE_PATTERN.test(code) || name.length < 2) {
    failed("subscriptions", context.requestId, "subscription_plan.validation", new Error("Invalid plan code or name"));
  }

  let parsedFeatures: string[] = [];
  if (featuresRaw) {
    try {
      if (featuresRaw.startsWith("[")) {
        parsedFeatures = JSON.parse(featuresRaw);
      } else {
        parsedFeatures = featuresRaw.split("\n").map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      parsedFeatures = featuresRaw.split("\n").map((s) => s.trim()).filter(Boolean);
    }
  }

  const payload: Record<string, unknown> = {
    name,
    badge,
    popular,
    price_monthly: Math.max(0, Number(priceMonthlyRaw) || 0),
    period,
    target_audience: targetAudience,
    max_properties: Number(maxPropertiesRaw) || 1,
    max_properties_label: maxPropertiesLabel || `${maxPropertiesRaw || 1} หอพัก`,
    max_rooms: Number(maxRoomsRaw) || 10,
    max_rooms_label: maxRoomsLabel || `สูงสุด ${maxRoomsRaw || 10} ห้อง`,
    max_users: Number(maxUsersRaw) || 1,
    max_users_label: maxUsersLabel || (Number(maxUsersRaw) === -1 ? "ผู้ใช้งานไม่จำกัด" : `ผู้ใช้งาน ${maxUsersRaw || 1} คน`),
    max_slip_verifications: Number(maxSlipVerificationsRaw) || 15,
    max_slip_verifications_label: maxSlipVerificationsLabel || `ตรวจสลิป ${maxSlipVerificationsRaw || 15} ครั้ง`,
    features: parsedFeatures,
    cta_label: ctaLabel,
    cta_href: ctaHref,
    cta_variant: ctaVariant,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  const { data: before } = await context.admin.from("subscription_plans").select("*").eq("code", code).maybeSingle();
  const { data: after, error } = await context.admin
    .from("subscription_plans")
    .upsert({ ...payload, code })
    .select("*")
    .single();

  if (error) failed("subscriptions", context.requestId, "subscription_plan.save", error);
  await audit(context, before ? "subscription_plan.updated" : "subscription_plan.created", "subscription_plan", code, before, after);
  revalidatePath("/admin/subscriptions");
  done("subscriptions", `บันทึกข้อมูลแพ็กเกจ ${name} เรียบร้อยแล้ว`);
}

export async function saveRoleAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "roleId");
  const code = text(formData, "code").toLowerCase();
  const name = text(formData, "name");
  const scopeType = text(formData, "scopeType");
  const status = text(formData, "status") || "active";
  if ((!id && !CODE_PATTERN.test(code)) || name.length < 2 || !["platform", "organization", "property"].includes(scopeType) || !["active", "inactive"].includes(status)) failed("roles", context.requestId, "role.validation", new Error("Invalid role"));
  const payload = { name, scope_type: scopeType, description: text(formData, "description") || null, status, updated_by: context.userId };
  if (id) {
    if (!UUID_PATTERN.test(id)) failed("roles", context.requestId, "role.id_validation", new Error("Invalid role id"));
    const { data: before } = await context.admin.from("platform_roles").select("*").eq("id", id).single();
    if (before?.code === "super_admin" && status !== "active") failed("roles", context.requestId, "role.super_admin_protection", new Error("Super Admin role cannot be disabled"));
    const { data: after, error } = await context.admin.from("platform_roles").update(payload).eq("id", id).select("*").single();
    if (error) failed("roles", context.requestId, "role.update", error);
    await audit(context, "role.updated", "platform_role", id, before, after);
  } else {
    const { data: after, error } = await context.admin.from("platform_roles").insert({ ...payload, code, is_system: false, created_by: context.userId }).select("*").single();
    if (error) failed("roles", context.requestId, "role.create", error);
    await audit(context, "role.created", "platform_role", after.id, null, after);
  }
  done("roles", "บันทึก Role แล้ว");
}

export async function savePermissionAction(formData: FormData) {
  const context = await adminContext();
  const code = text(formData, "code").toLowerCase();
  const moduleName = text(formData, "module").toLowerCase();
  const actionName = text(formData, "action").toLowerCase();
  const name = text(formData, "name");
  const status = text(formData, "status") || "active";
  if (!PERMISSION_PATTERN.test(code) || !CODE_PATTERN.test(moduleName) || !CODE_PATTERN.test(actionName) || code !== `${moduleName}.${actionName}` || name.length < 2 || !["active", "inactive"].includes(status)) failed("permissions", context.requestId, "permission.validation", new Error("Invalid permission"));
  const { data: before } = await context.admin.from("platform_permissions").select("*").eq("code", code).maybeSingle();
  const { data: after, error } = await context.admin.from("platform_permissions").upsert({ code, module: moduleName, action: actionName, name, description: text(formData, "description") || null, status, updated_by: context.userId }).select("*").single();
  if (error) failed("permissions", context.requestId, "permission.save", error);
  await audit(context, before ? "permission.updated" : "permission.created", "platform_permission", code, before, after);
  done("permissions", "บันทึก Permission แล้ว");
}

export async function setRolePermissionAction(formData: FormData) {
  const context = await adminContext();
  const roleId = text(formData, "roleId");
  const permissionCode = text(formData, "permissionCode");
  const allowed = text(formData, "allowed") === "true";
  if (!UUID_PATTERN.test(roleId) || !PERMISSION_PATTERN.test(permissionCode)) failed("permissions", context.requestId, "role_permission.validation", new Error("Invalid role permission"));
  const { data: role } = await context.admin.from("platform_roles").select("code").eq("id", roleId).single();
  if (role?.code === "super_admin" && permissionCode === "platform.manage" && !allowed) failed("permissions", context.requestId, "role_permission.protection", new Error("Cannot remove platform.manage from Super Admin"));
  const { data: before } = await context.admin.from("platform_role_permissions").select("*").eq("role_id", roleId).eq("permission_code", permissionCode).maybeSingle();
  const { data: after, error } = await context.admin.from("platform_role_permissions").upsert({ role_id: roleId, permission_code: permissionCode, allowed, updated_by: context.userId }).select("*").single();
  if (error) failed("permissions", context.requestId, "role_permission.update", error);
  await audit(context, "role_permission.updated", "platform_role_permission", `${roleId}:${permissionCode}`, before, after);
  done("permissions", "อัปเดตสิทธิ์ Role แล้ว");
}

export async function saveMenuAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "menuId");
  const code = text(formData, "code").toLowerCase();
  const label = text(formData, "label");
  const href = text(formData, "href");
  const audience = text(formData, "audience");
  const status = text(formData, "status") || "active";
  const sortOrder = Number(text(formData, "sortOrder"));
  const requiredPermission = text(formData, "requiredPermission") || null;
  if ((!id && !CODE_PATTERN.test(code)) || label.length < 1 || !href.startsWith("/") || !["admin", "customer", "all"].includes(audience) || !["active", "inactive"].includes(status) || !Number.isInteger(sortOrder)) failed("menus", context.requestId, "menu.validation", new Error("Invalid menu"));
  const payload = { label, href, icon: text(formData, "icon") || "Circle", sort_order: sortOrder, required_permission: requiredPermission, audience, status, updated_by: context.userId };
  if (id) {
    if (!UUID_PATTERN.test(id)) failed("menus", context.requestId, "menu.id_validation", new Error("Invalid menu id"));
    const { data: before } = await context.admin.from("platform_menus").select("*").eq("id", id).single();
    const protectedRoutes: Record<string, string> = { admin_overview: "/admin", admin_menus: "/admin/menus", admin_settings: "/admin/settings" };
    if (before?.code && protectedRoutes[before.code] && (status !== "active" || audience !== "admin" || href !== protectedRoutes[before.code])) {
      failed("menus", context.requestId, "menu.lockout_protection", new Error("Critical admin menus must remain active on their canonical routes"));
    }
    const { data: after, error } = await context.admin.from("platform_menus").update(payload).eq("id", id).select("*").single();
    if (error) failed("menus", context.requestId, "menu.update", error);
    await audit(context, "menu.updated", "platform_menu", id, before, after);
  } else {
    const { data: after, error } = await context.admin.from("platform_menus").insert({ ...payload, code }).select("*").single();
    if (error) failed("menus", context.requestId, "menu.create", error);
    await audit(context, "menu.created", "platform_menu", after.id, null, after);
  }
  done("menus", "บันทึกเมนูแล้ว");
}

type RoleMenuActionValue = { menuId: string; actionCode: string; isAllowed: boolean };

function parseJsonArray<T>(raw: string): T[] | null {
  try { const value = JSON.parse(raw); return Array.isArray(value) ? value as T[] : null; } catch { return null; }
}

export async function saveRoleMenuActionsAction(formData: FormData) {
  const context = await adminContext();
  const roleId = text(formData, "roleId");
  const values = parseJsonArray<RoleMenuActionValue>(text(formData, "values"));
  if (!UUID_PATTERN.test(roleId) || !values || values.some((item) => !UUID_PATTERN.test(item.menuId) || !ACTION_CODES.has(item.actionCode) || typeof item.isAllowed !== "boolean")) failed("permissions", context.requestId, "role_menu_actions.validation", new Error("Invalid role permission matrix"));
  const { data: role } = await context.admin.from("platform_roles").select("code").eq("id", roleId).single();
  if (!role || role.code === "super_admin") failed("permissions", context.requestId, "role_menu_actions.protected_role", new Error("Super Admin permissions are automatic"));
  const normalized = values.map((item) => ({ ...item }));
  const grouped = new Map<string, RoleMenuActionValue[]>();
  for (const item of normalized) grouped.set(item.menuId, [...(grouped.get(item.menuId) ?? []), item]);
  for (const rows of grouped.values()) if (rows.some((item) => item.isAllowed)) for (const item of rows) if (["menu_view", "view"].includes(item.actionCode)) item.isAllowed = true;
  const { data: supported, error: supportedError } = await context.admin.from("platform_menu_actions").select("menu_id, action_code").eq("is_active", true);
  if (supportedError) failed("permissions", context.requestId, "role_menu_actions.supported_load", supportedError);
  const supportedKeys = new Set((supported ?? []).map((item) => `${item.menu_id}:${item.action_code}`));
  if (normalized.some((item) => !supportedKeys.has(`${item.menuId}:${item.actionCode}`))) failed("permissions", context.requestId, "role_menu_actions.unsupported", new Error("Unsupported menu/action combination"));
  const { error } = await context.admin.from("platform_role_menu_actions").upsert(normalized.map((item) => ({ role_id: roleId, menu_id: item.menuId, action_code: item.actionCode, is_allowed: item.isAllowed, updated_by: context.userId })), { onConflict: "role_id,menu_id,action_code" });
  if (error) failed("permissions", context.requestId, "role_menu_actions.save", error);
  await audit(context, "role.menu_actions_updated", "platform_role", roleId, null, { values: normalized });
  done("permissions", "บันทึกสิทธิ์ตาม Role แล้ว");
}

type UserMenuActionValue = { menuId: string; actionCode: string; mode: "inherit" | "allow" | "deny" };

export async function saveUserMenuActionsAction(formData: FormData) {
  const context = await adminContext();
  const organizationId = text(formData, "organizationId"), userId = text(formData, "userId");
  const values = parseJsonArray<UserMenuActionValue>(text(formData, "values"));
  if (![organizationId, userId].every((id) => UUID_PATTERN.test(id)) || !values || values.some((item) => !UUID_PATTERN.test(item.menuId) || !ACTION_CODES.has(item.actionCode) || !["inherit", "allow", "deny"].includes(item.mode))) failed("permissions", context.requestId, "user_menu_actions.validation", new Error("Invalid user override matrix"));
  const { data: membership } = await context.admin.from("organization_members").select("user_id").eq("organization_id", organizationId).eq("user_id", userId).eq("status", "active").maybeSingle();
  if (!membership) failed("permissions", context.requestId, "user_menu_actions.membership", new Error("User is not an active organization member"));
  const { data: supported, error: supportedError } = await context.admin.from("platform_menu_actions").select("menu_id, action_code").eq("is_active", true);
  if (supportedError) failed("permissions", context.requestId, "user_menu_actions.supported_load", supportedError);
  const supportedKeys = new Set((supported ?? []).map((item) => `${item.menu_id}:${item.action_code}`));
  if (values.some((item) => !supportedKeys.has(`${item.menuId}:${item.actionCode}`))) failed("permissions", context.requestId, "user_menu_actions.unsupported", new Error("Unsupported menu/action combination"));
  const inherited = values.filter((item) => item.mode === "inherit"), explicit = values.filter((item) => item.mode !== "inherit");
  const deleteResults = await Promise.all(inherited.map((item) => context.admin.from("platform_user_menu_actions").delete().eq("organization_id", organizationId).eq("user_id", userId).eq("menu_id", item.menuId).eq("action_code", item.actionCode)));
  if (deleteResults.some((result) => result.error)) failed("permissions", context.requestId, "user_menu_actions.clear", deleteResults.find((result) => result.error)?.error);
  if (explicit.length) {
    const { error } = await context.admin.from("platform_user_menu_actions").upsert(explicit.map((item) => ({ organization_id: organizationId, user_id: userId, menu_id: item.menuId, action_code: item.actionCode, is_allowed: item.mode === "allow", updated_by: context.userId })), { onConflict: "organization_id,user_id,menu_id,action_code" });
    if (error) failed("permissions", context.requestId, "user_menu_actions.save", error);
  }
  await audit(context, "user.menu_actions_updated", "organization_member", `${organizationId}:${userId}`, null, { values });
  done("permissions", "บันทึก Override รายบุคคลแล้ว");
}
