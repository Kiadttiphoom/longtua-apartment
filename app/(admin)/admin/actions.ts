"use server";

import { scheduleMonitorEvent } from "@/lib/monitor/events";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSystemAdmin } from "@/lib/auth/system-admin";
import { getRegistrationCapacity, REGISTRATION_CAPACITY_MESSAGE } from "@/lib/auth/registration-capacity";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { IMPERSONATE_ORGANIZATION_COOKIE } from "@/lib/portal/context";
import { adminManagementPaths } from "@/lib/portal/admin-management-paths";

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
  scheduleMonitorEvent(stage, "error", requestId, error);
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

  const capacity = await getRegistrationCapacity();
  if (capacity.full) redirect(`/admin/trial-requests?notice=${encodeURIComponent(REGISTRATION_CAPACITY_MESSAGE)}`);

  const { data: approved, error } = await context.admin.rpc("approve_trial_request", {
    target_request_id: requestId,
    reviewer_user_id: context.userId,
  });
  if (error?.message === "registration_organization_limit_reached") redirect(`/admin/trial-requests?notice=${encodeURIComponent(REGISTRATION_CAPACITY_MESSAGE)}`);
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
  revalidatePath("/register");
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
  const name = formData.has("name") ? text(formData, "name") : before?.name;
  if (!name || name.length < 2 || name.length > 160) failed("organizations", context.requestId, "organization.name_validation", new Error("Invalid organization name"));
  const { data: after, error } = await context.admin.from("organizations").update({ name, status }).eq("id", id).select("id, name, status").single();
  if (error) failed("organizations", context.requestId, "organization.update", error);
  await audit(context, "organization.status_updated", "organization", id, before, after);
  done("organizations", "อัปเดตสถานะกิจการแล้ว");
}

export async function impersonateOrganizationAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "organizationId");
  const section = text(formData, "section");
  const destination = Object.hasOwn(adminManagementPaths, section) ? adminManagementPaths[section] : "/dashboard";
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
  redirect(destination);
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
  if (!UUID_PATTERN.test(id) || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) failed("users", context.requestId, "user.password_validation", new Error("Temporary password is invalid"));
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

// ==================== ORGANIZATIONS ====================
export async function createOrganizationAdminAction(formData: FormData) {
  const context = await adminContext();
  const name = text(formData, "name");
  let slug = text(formData, "slug").toLowerCase();
  const ownerUserId = text(formData, "ownerUserId") || context.userId;
  const status = text(formData, "status") || "active";
  const planCode = text(formData, "planCode") || "starter";

  if (name.length < 2 || name.length > 160) {
    failed("organizations", context.requestId, "organization.name_validation", new Error("ชื่อกิจการต้องมีความยาว 2-160 ตัวอักษร"));
  }

  if (!slug) {
    const base = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "org";
    slug = `${base.slice(0, 20)}-${crypto.randomUUID().slice(0, 8)}`;
  } else if (!/^[a-z0-9][a-z0-9-]{2,62}[a-z0-9]$/.test(slug)) {
    failed("organizations", context.requestId, "organization.slug_validation", new Error("Slug ต้องเป็นภาษาอังกฤษ ตัวเลข และขีดกลาง ความยาว 4-64 ตัวอักษร"));
  }

  const { data: createdOrg, error: orgError } = await context.admin
    .from("organizations")
    .insert({
      name,
      slug,
      owner_user_id: ownerUserId,
      status: ["active", "suspended", "closed"].includes(status) ? status : "active",
    })
    .select("id, name, slug, status")
    .single();

  if (orgError) {
    failed("organizations", context.requestId, "organization.create", orgError);
  }

  await context.admin.from("organization_members").upsert({
    organization_id: createdOrg.id,
    user_id: ownerUserId,
    role_code: "owner",
    status: "active",
  });

  await context.admin.from("subscriptions").insert({
    organization_id: createdOrg.id,
    status: "active",
    max_properties: 10,
    max_rooms: 100,
    plan_code: planCode,
  });

  await audit(context, "organization.created", "organization", createdOrg.id, null, createdOrg);
  done("organizations", `สร้างกิจการ "${name}" เรียบร้อยแล้ว`);
}

export async function deleteOrganizationAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "organizationId");
  if (!UUID_PATTERN.test(id)) failed("organizations", context.requestId, "organization.delete_validation", new Error("Invalid organization id"));

  const { data: before } = await context.admin.from("organizations").select("id, name").eq("id", id).maybeSingle();
  if (!before) failed("organizations", context.requestId, "organization.not_found", new Error("Organization not found"));

  const { error } = await context.admin.from("organizations").delete().eq("id", id);
  if (error) failed("organizations", context.requestId, "organization.delete", error);

  await audit(context, "organization.deleted", "organization", id, before, null);
  done("organizations", `ลบกิจการ "${before.name}" เรียบร้อยแล้ว`);
}

// ==================== PROPERTIES ====================
export async function createPropertyAdminAction(formData: FormData) {
  const context = await adminContext();
  const organizationId = text(formData, "organizationId");
  const name = text(formData, "name");
  const address = text(formData, "address");
  const phone = text(formData, "phone");
  const electricRate = Number(text(formData, "electricRate")) || 8;
  const waterRate = Number(text(formData, "waterRate")) || 100;

  if (!UUID_PATTERN.test(organizationId)) failed("properties", context.requestId, "property.org_validation", new Error("กรุณาเลือกกิจการ"));
  if (name.length < 1 || name.length > 160) failed("properties", context.requestId, "property.name_validation", new Error("กรุณากรอกชื่อหอพัก"));

  const { data: created, error } = await context.admin
    .from("properties")
    .insert({
      organization_id: organizationId,
      name,
      address: address || "",
      phone: phone || null,
      status: "active",
      created_by: context.userId,
    })
    .select("id, name, organization_id")
    .single();

  if (error) failed("properties", context.requestId, "property.create", error);

  await context.admin.from("property_settings").upsert({
    property_id: created.id,
    organization_id: organizationId,
    electric_rate: electricRate,
    water_rate: waterRate,
  });

  await audit(context, "property.created", "property", created.id, null, created);
  done("properties", `เพิ่มหอพัก "${name}" เรียบร้อยแล้ว`);
}

export async function updatePropertyAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "propertyId");
  const name = text(formData, "name");
  const address = text(formData, "address");
  const phone = text(formData, "phone");
  const status = text(formData, "status") || "active";

  if (!UUID_PATTERN.test(id)) failed("properties", context.requestId, "property.update_validation", new Error("Invalid property id"));
  if (name.length < 1 || name.length > 160) failed("properties", context.requestId, "property.name_validation", new Error("กรุณากรอกชื่อหอพัก"));

  const { data: before } = await context.admin.from("properties").select("*").eq("id", id).maybeSingle();
  const { data: after, error } = await context.admin
    .from("properties")
    .update({
      name,
      address: address || "",
      phone: phone || null,
      status: ["active", "inactive"].includes(status) ? status : "active",
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) failed("properties", context.requestId, "property.update", error);
  await audit(context, "property.updated", "property", id, before, after);
  done("properties", `อัปเดตข้อมูลหอพัก "${name}" เรียบร้อยแล้ว`);
}

export async function deletePropertyAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "propertyId");
  if (!UUID_PATTERN.test(id)) failed("properties", context.requestId, "property.delete_validation", new Error("Invalid property id"));

  const { data: before } = await context.admin.from("properties").select("id, name").eq("id", id).maybeSingle();
  const { error } = await context.admin.from("properties").delete().eq("id", id);
  if (error) failed("properties", context.requestId, "property.delete", error);

  await audit(context, "property.deleted", "property", id, before, null);
  done("properties", `ลบหอพัก "${before?.name ?? id}" เรียบร้อยแล้ว`);
}

// ==================== USERS ====================
export async function createUserAdminAction(formData: FormData) {
  const context = await adminContext();
  const username = text(formData, "username").toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  const displayName = text(formData, "displayName") || username;
  const phone = text(formData, "phone");
  const password = text(formData, "password");
  const organizationId = text(formData, "organizationId");
  const roleCode = text(formData, "roleCode") || "staff";
  const isSysAdmin = text(formData, "isSystemAdmin") === "true";

  if (username.length < 3) failed("users", context.requestId, "user.username_validation", new Error("ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร"));
  if (password.length < 8) failed("users", context.requestId, "user.password_validation", new Error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"));

  const isEmail = username.includes("@");
  const emailToUse = isEmail ? username : `${crypto.randomUUID()}@longtua.internal`;

  const { data: created, error: createError } = await context.admin.auth.admin.createUser({
    email: emailToUse,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: displayName },
  });

  if (createError || !created.user) {
    failed("users", context.requestId, "user.create", createError ?? new Error("Failed to create auth user"));
  }

  const authUserId = created.user.id;
  await context.admin.from("profiles").upsert({
    id: authUserId,
    username,
    display_name: displayName,
    phone: phone || null,
    status: "active",
  });

  if (!isEmail) {
    await context.admin.from("auth_login_aliases").upsert({
      username,
      auth_user_id: authUserId,
    });
  }

  if (isSysAdmin) {
    await context.admin.from("system_admins").upsert({
      user_id: authUserId,
      status: "active",
    });
  }

  if (organizationId && UUID_PATTERN.test(organizationId)) {
    await context.admin.from("organization_members").upsert({
      organization_id: organizationId,
      user_id: authUserId,
      role_code: roleCode,
      status: "active",
    });
  }

  await audit(context, "user.created", "user", authUserId, null, { username, displayName, isSysAdmin, organizationId });
  done("users", `สร้างผู้ใช้งาน "${displayName}" (@${username}) เรียบร้อยแล้ว`);
}

export async function updateUserAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "userId");
  const displayName = text(formData, "displayName");
  const phone = text(formData, "phone");
  const status = text(formData, "status") || "active";

  if (!UUID_PATTERN.test(id)) failed("users", context.requestId, "user.update_validation", new Error("Invalid user id"));

  const { data: before } = await context.admin.from("profiles").select("*").eq("id", id).maybeSingle();
  const { data: after, error } = await context.admin
    .from("profiles")
    .update({
      display_name: displayName || before?.display_name,
      phone: phone || null,
      status: ["active", "suspended"].includes(status) ? status : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) failed("users", context.requestId, "user.update", error);
  await audit(context, "user.updated", "user", id, before, after);
  done("users", `อัปเดตข้อมูลผู้ใช้งาน "${displayName}" เรียบร้อยแล้ว`);
}

export async function deleteUserAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "userId");
  if (!UUID_PATTERN.test(id)) failed("users", context.requestId, "user.delete_validation", new Error("Invalid user id"));
  if (id === context.userId) failed("users", context.requestId, "user.self_delete", new Error("ไม่สามารถลบบัญชี Super Admin ของตนเองได้"));

  const { data: sysAdmin } = await context.admin.from("system_admins").select("user_id").eq("user_id", id).eq("status", "active").maybeSingle();
  if (sysAdmin) failed("users", context.requestId, "user.system_admin_delete", new Error("ไม่สามารถลบ Super Admin ได้"));

  const { data: before } = await context.admin.from("profiles").select("*").eq("id", id).maybeSingle();
  const { error } = await context.admin.auth.admin.deleteUser(id);
  if (error) failed("users", context.requestId, "user.delete", error);

  await audit(context, "user.deleted", "user", id, before, null);
  done("users", `ลบผู้ใช้งาน "${before?.display_name ?? before?.username ?? id}" เรียบร้อยแล้ว`);
}

// ==================== ROOMS ====================
export async function createRoomAdminAction(formData: FormData) {
  const context = await adminContext();
  const organizationId = text(formData, "organizationId");
  const propertyId = text(formData, "propertyId");
  const roomNumber = text(formData, "roomNumber");
  const floor = text(formData, "floor");
  const baseRent = Number(text(formData, "baseRent")) || 0;
  const status = text(formData, "status") || "vacant";

  if (!UUID_PATTERN.test(organizationId) || !UUID_PATTERN.test(propertyId)) {
    failed("rooms", context.requestId, "room.validation", new Error("กรุณาเลือกกิจการและหอพัก"));
  }
  if (!roomNumber) failed("rooms", context.requestId, "room.number_validation", new Error("กรุณาระบุเลขห้อง"));

  const { data: created, error } = await context.admin
    .from("rooms")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      room_number: roomNumber,
      floor: floor || null,
      base_rent: baseRent,
      status: ["vacant", "occupied", "maintenance", "inactive"].includes(status) ? status : "vacant",
      created_by: context.userId,
    })
    .select("*")
    .single();

  if (error) failed("rooms", context.requestId, "room.create", error);

  await context.admin.from("meters").insert([
    { organization_id: organizationId, property_id: propertyId, room_id: created.id, meter_type: "electric", status: "active", created_by: context.userId },
    { organization_id: organizationId, property_id: propertyId, room_id: created.id, meter_type: "water", status: "active", created_by: context.userId },
  ]);

  await audit(context, "room.created", "room", created.id, null, created);
  done("rooms", `เพิ่มห้องพัก "${roomNumber}" เรียบร้อยแล้ว`);
}

export async function updateRoomAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "roomId");
  const roomNumber = text(formData, "roomNumber");
  const floor = text(formData, "floor");
  const baseRent = Number(text(formData, "baseRent")) || 0;
  const status = text(formData, "status") || "vacant";

  if (!UUID_PATTERN.test(id)) failed("rooms", context.requestId, "room.update_validation", new Error("Invalid room id"));

  const { data: before } = await context.admin.from("rooms").select("*").eq("id", id).maybeSingle();
  const { data: after, error } = await context.admin
    .from("rooms")
    .update({
      room_number: roomNumber || before?.room_number,
      floor: floor || null,
      base_rent: baseRent,
      status: ["vacant", "occupied", "maintenance", "inactive"].includes(status) ? status : "vacant",
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) failed("rooms", context.requestId, "room.update", error);
  await audit(context, "room.updated", "room", id, before, after);
  done("rooms", `อัปเดตห้องพัก "${roomNumber}" เรียบร้อยแล้ว`);
}

export async function deleteRoomAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "roomId");
  if (!UUID_PATTERN.test(id)) failed("rooms", context.requestId, "room.delete_validation", new Error("Invalid room id"));

  const { data: before } = await context.admin.from("rooms").select("id, room_number").eq("id", id).maybeSingle();
  const { error } = await context.admin.from("rooms").delete().eq("id", id);
  if (error) failed("rooms", context.requestId, "room.delete", error);

  await audit(context, "room.deleted", "room", id, before, null);
  done("rooms", `ลบห้องพัก "${before?.room_number ?? id}" เรียบร้อยแล้ว`);
}

// ==================== TENANTS ====================
export async function createTenantAdminAction(formData: FormData) {
  const context = await adminContext();
  const organizationId = text(formData, "organizationId");
  const fullName = text(formData, "fullName");
  const phone = text(formData, "phone");
  const email = text(formData, "email");
  const idCardLast4 = text(formData, "idCardLast4");
  const address = text(formData, "address");
  const status = text(formData, "status") || "active";

  if (!UUID_PATTERN.test(organizationId)) failed("tenants", context.requestId, "tenant.org_validation", new Error("กรุณาเลือกกิจการ"));
  if (fullName.length < 2) failed("tenants", context.requestId, "tenant.name_validation", new Error("กรุณากรอกชื่อผู้เช่า"));

  const { data: created, error } = await context.admin
    .from("tenants")
    .insert({
      organization_id: organizationId,
      full_name: fullName,
      phone: phone || null,
      email: email || null,
      id_card_last4: idCardLast4 && idCardLast4.length === 4 ? idCardLast4 : null,
      address: address || null,
      status: ["active", "former", "blocked"].includes(status) ? status : "active",
      created_by: context.userId,
    })
    .select("*")
    .single();

  if (error) failed("tenants", context.requestId, "tenant.create", error);
  await audit(context, "tenant.created", "tenant", created.id, null, created);
  done("tenants", `เพิ่มผู้เช่า "${fullName}" เรียบร้อยแล้ว`);
}

export async function updateTenantAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "tenantId");
  const fullName = text(formData, "fullName");
  const phone = text(formData, "phone");
  const email = text(formData, "email");
  const idCardLast4 = text(formData, "idCardLast4");
  const address = text(formData, "address");
  const status = text(formData, "status") || "active";

  if (!UUID_PATTERN.test(id)) failed("tenants", context.requestId, "tenant.update_validation", new Error("Invalid tenant id"));

  const { data: before } = await context.admin.from("tenants").select("*").eq("id", id).maybeSingle();
  const { data: after, error } = await context.admin
    .from("tenants")
    .update({
      full_name: fullName || before?.full_name,
      phone: phone || null,
      email: email || null,
      id_card_last4: idCardLast4 && idCardLast4.length === 4 ? idCardLast4 : null,
      address: address || null,
      status: ["active", "former", "blocked"].includes(status) ? status : "active",
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) failed("tenants", context.requestId, "tenant.update", error);
  await audit(context, "tenant.updated", "tenant", id, before, after);
  done("tenants", `อัปเดตข้อมูลผู้เช่า "${fullName}" เรียบร้อยแล้ว`);
}

export async function deleteTenantAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "tenantId");
  if (!UUID_PATTERN.test(id)) failed("tenants", context.requestId, "tenant.delete_validation", new Error("Invalid tenant id"));

  const { data: before } = await context.admin.from("tenants").select("id, full_name").eq("id", id).maybeSingle();
  const { error } = await context.admin.from("tenants").delete().eq("id", id);
  if (error) failed("tenants", context.requestId, "tenant.delete", error);

  await audit(context, "tenant.deleted", "tenant", id, before, null);
  done("tenants", `ลบข้อมูลผู้เช่า "${before?.full_name ?? id}" เรียบร้อยแล้ว`);
}

// ==================== LEASES ====================
export async function createLeaseAdminAction(formData: FormData) {
  const context = await adminContext();
  const organizationId = text(formData, "organizationId");
  const propertyId = text(formData, "propertyId");
  const roomId = text(formData, "roomId");
  const primaryTenantId = text(formData, "primaryTenantId");
  const leaseNumber = text(formData, "leaseNumber") || `L-${Date.now().toString().slice(-6)}`;
  const startDate = text(formData, "startDate");
  const endDate = text(formData, "endDate") || null;
  const rentAmount = Number(text(formData, "rentAmount")) || 0;
  const depositAmount = Number(text(formData, "depositAmount")) || 0;
  const advanceAmount = Number(text(formData, "advanceAmount")) || 0;
  const status = text(formData, "status") || "active";

  if (![organizationId, propertyId, roomId, primaryTenantId].every((id) => UUID_PATTERN.test(id))) {
    failed("leases", context.requestId, "lease.validation", new Error("กรุณากรอกข้อมูลสัญญาให้ครบถ้วน"));
  }
  if (!startDate) failed("leases", context.requestId, "lease.date_validation", new Error("กรุณาระบุวันเริ่มสัญญา"));

  const { data: created, error } = await context.admin
    .from("leases")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      room_id: roomId,
      primary_tenant_id: primaryTenantId,
      lease_number: leaseNumber,
      start_date: startDate,
      end_date: endDate,
      rent_amount: rentAmount,
      deposit_amount: depositAmount,
      advance_amount: advanceAmount,
      status: ["draft", "active", "ended", "cancelled"].includes(status) ? status : "active",
      created_by: context.userId,
    })
    .select("*")
    .single();

  if (error) failed("leases", context.requestId, "lease.create", error);

  if (status === "active") {
    await context.admin.from("rooms").update({ status: "occupied" }).eq("id", roomId);
  }

  await audit(context, "lease.created", "lease", created.id, null, created);
  done("leases", `สร้างสัญญาเช่า "${leaseNumber}" เรียบร้อยแล้ว`);
}

export async function updateLeaseAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "leaseId");
  const leaseNumber = text(formData, "leaseNumber");
  const startDate = text(formData, "startDate");
  const endDate = text(formData, "endDate") || null;
  const rentAmount = Number(text(formData, "rentAmount")) || 0;
  const depositAmount = Number(text(formData, "depositAmount")) || 0;
  const advanceAmount = Number(text(formData, "advanceAmount")) || 0;
  const status = text(formData, "status") || "active";

  if (!UUID_PATTERN.test(id)) failed("leases", context.requestId, "lease.update_validation", new Error("Invalid lease id"));

  const { data: before } = await context.admin.from("leases").select("*").eq("id", id).maybeSingle();
  const { data: after, error } = await context.admin
    .from("leases")
    .update({
      lease_number: leaseNumber || before?.lease_number,
      start_date: startDate || before?.start_date,
      end_date: endDate,
      rent_amount: rentAmount,
      deposit_amount: depositAmount,
      advance_amount: advanceAmount,
      status: ["draft", "active", "ended", "cancelled"].includes(status) ? status : "active",
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) failed("leases", context.requestId, "lease.update", error);

  if (before?.room_id) {
    if (status === "active") {
      await context.admin.from("rooms").update({ status: "occupied" }).eq("id", before.room_id);
    } else if (["ended", "cancelled"].includes(status)) {
      await context.admin.from("rooms").update({ status: "vacant" }).eq("id", before.room_id);
    }
  }

  await audit(context, "lease.updated", "lease", id, before, after);
  done("leases", `อัปเดตสัญญาเช่า "${after.lease_number}" เรียบร้อยแล้ว`);
}

export async function deleteLeaseAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "leaseId");
  if (!UUID_PATTERN.test(id)) failed("leases", context.requestId, "lease.delete_validation", new Error("Invalid lease id"));

  const { data: before } = await context.admin.from("leases").select("id, room_id, lease_number").eq("id", id).maybeSingle();
  const { error } = await context.admin.from("leases").delete().eq("id", id);
  if (error) failed("leases", context.requestId, "lease.delete", error);

  if (before?.room_id) {
    await context.admin.from("rooms").update({ status: "vacant" }).eq("id", before.room_id);
  }

  await audit(context, "lease.deleted", "lease", id, before, null);
  done("leases", `ลบสัญญาเช่า "${before?.lease_number ?? id}" เรียบร้อยแล้ว`);
}

// ==================== METERS ====================
export async function createMeterAdminAction(formData: FormData) {
  const context = await adminContext();
  const organizationId = text(formData, "organizationId");
  const propertyId = text(formData, "propertyId");
  const roomId = text(formData, "roomId");
  const meterType = text(formData, "meterType") || "electric";
  const serialNumber = text(formData, "serialNumber");
  const initialValue = Number(text(formData, "initialValue")) || 0;

  if (![organizationId, propertyId, roomId].every((id) => UUID_PATTERN.test(id))) {
    failed("meters", context.requestId, "meter.validation", new Error("กรุณาเลือกกิจการ หอพัก และห้องพัก"));
  }

  const { data: created, error } = await context.admin
    .from("meters")
    .upsert(
      {
        organization_id: organizationId,
        property_id: propertyId,
        room_id: roomId,
        meter_type: ["electric", "water"].includes(meterType) ? meterType : "electric",
        serial_number: serialNumber || null,
        status: "active",
        created_by: context.userId,
      },
      { onConflict: "room_id,meter_type" }
    )
    .select("*")
    .single();

  if (error) failed("meters", context.requestId, "meter.create", error);

  if (initialValue > 0) {
    const periodMonth = new Date().toISOString().slice(0, 7) + "-01";
    let { data: cycle } = await context.admin
      .from("billing_cycles")
      .select("id")
      .eq("property_id", propertyId)
      .eq("period_month", periodMonth)
      .maybeSingle();

    if (!cycle) {
      const { data: newCycle } = await context.admin
        .from("billing_cycles")
        .insert({ organization_id: organizationId, property_id: propertyId, period_month: periodMonth })
        .select("id")
        .single();
      cycle = newCycle;
    }

    if (cycle) {
      await context.admin.from("meter_readings").upsert(
        {
          organization_id: organizationId,
          meter_id: created.id,
          billing_cycle_id: cycle.id,
          previous_value: initialValue,
          current_value: initialValue,
          read_by: context.userId,
        },
        { onConflict: "meter_id,billing_cycle_id" }
      );
    }
  }

  await audit(context, "meter.created", "meter", created.id, null, created);
  done("meters", `เพิ่มมิเตอร์เรียบร้อยแล้ว`);
}

export async function recordMeterReadingAdminAction(formData: FormData) {
  const context = await adminContext();
  const meterId = text(formData, "meterId");
  const currentValue = Number(text(formData, "currentValue"));

  if (!UUID_PATTERN.test(meterId) || isNaN(currentValue)) {
    failed("meters", context.requestId, "meter_reading.validation", new Error("ข้อมูลการจดมิเตอร์ไม่ถูกต้อง"));
  }

  const { data: meter } = await context.admin.from("meters").select("*").eq("id", meterId).maybeSingle();
  if (!meter) failed("meters", context.requestId, "meter.not_found", new Error("ไม่พบมิเตอร์"));

  const periodMonth = new Date().toISOString().slice(0, 7) + "-01";
  let { data: cycle } = await context.admin
    .from("billing_cycles")
    .select("id")
    .eq("property_id", meter.property_id)
    .eq("period_month", periodMonth)
    .maybeSingle();

  if (!cycle) {
    const { data: newCycle, error: cycleError } = await context.admin
      .from("billing_cycles")
      .insert({ organization_id: meter.organization_id, property_id: meter.property_id, period_month: periodMonth })
      .select("id")
      .single();
    if (cycleError) failed("meters", context.requestId, "meter_reading.cycle", cycleError);
    cycle = newCycle;
  }

  const { data: latestReading } = await context.admin
    .from("meter_readings")
    .select("current_value")
    .eq("meter_id", meterId)
    .order("read_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prev = latestReading?.current_value ? Number(latestReading.current_value) : 0;
  if (currentValue < prev) {
    failed("meters", context.requestId, "meter_reading.value", new Error(`เลขมิเตอร์ใหม่ (${currentValue}) ต้องไม่น้อยกว่าเลขเดิม (${prev})`));
  }

  const { data: reading, error } = await context.admin
    .from("meter_readings")
    .upsert(
      {
        organization_id: meter.organization_id,
        meter_id: meterId,
        billing_cycle_id: cycle.id,
        previous_value: prev,
        current_value: currentValue,
        read_by: context.userId,
        read_at: new Date().toISOString(),
      },
      { onConflict: "meter_id,billing_cycle_id" }
    )
    .select("*")
    .single();

  if (error) failed("meters", context.requestId, "meter_reading.save", error);
  await audit(context, "meter_reading.recorded", "meter_reading", reading.id, null, reading);
  done("meters", `บันทึกค่ามิเตอร์ ${currentValue} เรียบร้อยแล้ว`);
}

export async function updateMeterAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "meterId");
  const serialNumber = text(formData, "serialNumber");
  const status = text(formData, "status") || "active";

  if (!UUID_PATTERN.test(id)) failed("meters", context.requestId, "meter.update_validation", new Error("Invalid meter id"));

  const { data: before } = await context.admin.from("meters").select("*").eq("id", id).maybeSingle();
  const { data: after, error } = await context.admin
    .from("meters")
    .update({
      serial_number: serialNumber || null,
      status: ["active", "inactive", "replaced"].includes(status) ? status : "active",
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) failed("meters", context.requestId, "meter.update", error);
  await audit(context, "meter.updated", "meter", id, before, after);
  done("meters", `อัปเดตมิเตอร์เรียบร้อยแล้ว`);
}

export async function deleteMeterAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "meterId");
  if (!UUID_PATTERN.test(id)) failed("meters", context.requestId, "meter.delete_validation", new Error("Invalid meter id"));

  const { data: before } = await context.admin.from("meters").select("*").eq("id", id).maybeSingle();
  await context.admin.from("meter_readings").delete().eq("meter_id", id);
  const { error } = await context.admin.from("meters").delete().eq("id", id);
  if (error) failed("meters", context.requestId, "meter.delete", error);

  await audit(context, "meter.deleted", "meter", id, before, null);
  done("meters", `ลบมิเตอร์เรียบร้อยแล้ว`);
}

// ==================== INVOICES ====================
export async function createInvoiceAdminAction(formData: FormData) {
  const context = await adminContext();
  const organizationId = text(formData, "organizationId");
  const propertyId = text(formData, "propertyId");
  const roomId = text(formData, "roomId");
  const leaseId = text(formData, "leaseId") || null;
  const invoiceNumber = text(formData, "invoiceNumber") || `INV-${Date.now().toString().slice(-6)}`;
  const issuedAt = text(formData, "issuedAt") || new Date().toISOString().slice(0, 10);
  const dueAt = text(formData, "dueAt");
  const rentAmount = Number(text(formData, "rentAmount")) || 0;
  const electricAmount = Number(text(formData, "electricAmount")) || 0;
  const waterAmount = Number(text(formData, "waterAmount")) || 0;
  const otherAmount = Number(text(formData, "otherAmount")) || 0;
  const note = text(formData, "note");

  if (![organizationId, propertyId, roomId].every((id) => UUID_PATTERN.test(id))) {
    failed("invoices", context.requestId, "invoice.validation", new Error("กรุณากรอกข้อมูลใบแจ้งหนี้ให้ครบ"));
  }
  if (!dueAt) failed("invoices", context.requestId, "invoice.due_validation", new Error("กรุณาระบุวันครบกำหนดชำระ"));

  const total = rentAmount + electricAmount + waterAmount + otherAmount;
  const balanceDue = total;

  const { data: created, error } = await context.admin
    .from("rent_invoices")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      room_id: roomId,
      lease_id: leaseId && UUID_PATTERN.test(leaseId) ? leaseId : null,
      invoice_number: invoiceNumber,
      issued_at: issuedAt,
      due_at: dueAt,
      subtotal: total,
      total,
      balance_due: balanceDue,
      status: "issued",
      note: note || null,
      created_by: context.userId,
    })
    .select("*")
    .single();

  if (error) failed("invoices", context.requestId, "invoice.create", error);

  const items = [];
  if (rentAmount > 0) items.push({ organization_id: organizationId, rent_invoice_id: created.id, item_type: "rent", description: "ค่าเช่าห้องพัก", unit_price: rentAmount, amount: rentAmount, created_by: context.userId });
  if (electricAmount > 0) items.push({ organization_id: organizationId, rent_invoice_id: created.id, item_type: "electric", description: "ค่าไฟฟ้า", unit_price: electricAmount, amount: electricAmount, created_by: context.userId });
  if (waterAmount > 0) items.push({ organization_id: organizationId, rent_invoice_id: created.id, item_type: "water", description: "ค่าน้ำประปา", unit_price: waterAmount, amount: waterAmount, created_by: context.userId });
  if (otherAmount > 0) items.push({ organization_id: organizationId, rent_invoice_id: created.id, item_type: "other", description: "ค่าบริการอื่นๆ", unit_price: otherAmount, amount: otherAmount, created_by: context.userId });

  if (items.length > 0) {
    await context.admin.from("rent_invoice_items").insert(items);
  }

  await audit(context, "invoice.created", "rent_invoice", created.id, null, created);
  done("invoices", `ออกใบแจ้งหนี้ "${invoiceNumber}" ยอดรวม ฿${total.toLocaleString()} เรียบร้อยแล้ว`);
}

export async function updateInvoiceAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "invoiceId");
  const dueAt = text(formData, "dueAt");
  const total = Number(text(formData, "total"));
  const balanceDue = Number(text(formData, "balanceDue"));
  const status = text(formData, "status");
  const note = text(formData, "note");

  if (!UUID_PATTERN.test(id)) failed("invoices", context.requestId, "invoice.update_validation", new Error("Invalid invoice id"));

  const { data: before } = await context.admin.from("rent_invoices").select("*").eq("id", id).maybeSingle();
  const { data: after, error } = await context.admin
    .from("rent_invoices")
    .update({
      due_at: dueAt || before?.due_at,
      total: !isNaN(total) && total >= 0 ? total : before?.total,
      balance_due: !isNaN(balanceDue) && balanceDue >= 0 ? balanceDue : before?.balance_due,
      status: ["draft", "issued", "partial", "paid", "overdue", "void"].includes(status) ? status : before?.status,
      note: note ?? before?.note,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) failed("invoices", context.requestId, "invoice.update", error);
  await audit(context, "invoice.updated", "rent_invoice", id, before, after);
  done("invoices", `อัปเดตใบแจ้งหนี้ "${after.invoice_number}" เรียบร้อยแล้ว`);
}

export async function deleteInvoiceAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "invoiceId");
  const actionType = text(formData, "actionType") || "void";

  if (!UUID_PATTERN.test(id)) failed("invoices", context.requestId, "invoice.delete_validation", new Error("Invalid invoice id"));

  const { data: before } = await context.admin.from("rent_invoices").select("*").eq("id", id).maybeSingle();

  if (actionType === "delete") {
    await context.admin.from("rent_invoice_items").delete().eq("rent_invoice_id", id);
    const { error } = await context.admin.from("rent_invoices").delete().eq("id", id);
    if (error) failed("invoices", context.requestId, "invoice.delete", error);
    await audit(context, "invoice.deleted", "rent_invoice", id, before, null);
    done("invoices", `ลบใบแจ้งหนี้ "${before?.invoice_number ?? id}" เรียบร้อยแล้ว`);
  } else {
    const { error } = await context.admin.from("rent_invoices").update({ status: "void", balance_due: 0 }).eq("id", id);
    if (error) failed("invoices", context.requestId, "invoice.void", error);
    await audit(context, "invoice.voided", "rent_invoice", id, before, { status: "void", balance_due: 0 });
    done("invoices", `ยกเลิกใบแจ้งหนี้ "${before?.invoice_number ?? id}" เรียบร้อยแล้ว`);
  }
}

// ==================== PAYMENTS ====================
export async function recordPaymentAdminAction(formData: FormData) {
  const context = await adminContext();
  const organizationId = text(formData, "organizationId");
  const propertyId = text(formData, "propertyId");
  const receiptNumber = text(formData, "receiptNumber") || `REC-${Date.now().toString().slice(-6)}`;
  const amount = Number(text(formData, "amount"));
  const method = text(formData, "method") || "transfer";
  const reference = text(formData, "reference");
  const paidAt = text(formData, "paidAt") || new Date().toISOString();
  const invoiceId = text(formData, "invoiceId");
  const returnView = text(formData, "returnView") || "payments";

  if (![organizationId, propertyId].every((id) => UUID_PATTERN.test(id)) || isNaN(amount) || amount <= 0) {
    failed(returnView, context.requestId, "payment.validation", new Error("กรุณาระบุข้อมูลการรับชำระให้ถูกต้องและยอดเงินมากกว่า 0"));
  }

  const { data: created, error } = await context.admin
    .from("rent_payments")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      receipt_number: receiptNumber,
      amount,
      method: ["cash", "transfer", "promptpay", "card", "other"].includes(method) ? method : "transfer",
      reference: reference || null,
      paid_at: paidAt,
      status: "confirmed",
      created_by: context.userId,
    })
    .select("*")
    .single();

  if (error) failed(returnView, context.requestId, "payment.record", error);

  if (invoiceId && UUID_PATTERN.test(invoiceId)) {
    const { data: invoice } = await context.admin.from("rent_invoices").select("balance_due, status").eq("id", invoiceId).maybeSingle();
    if (invoice) {
      const currentDue = Number(invoice.balance_due);
      const newDue = Math.max(0, currentDue - amount);
      const newStatus = newDue <= 0 ? "paid" : "partial";
      await context.admin.from("rent_invoices").update({
        balance_due: newDue,
        status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", invoiceId);
    }
  }

  await audit(context, "payment.recorded", "rent_payment", created.id, null, created);
  done(returnView, `บันทึกรับชำระเงิน "${receiptNumber}" จำนวน ฿${amount.toLocaleString()} เรียบร้อยแล้ว`);
}

export async function updatePaymentAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "paymentId");
  const amount = Number(text(formData, "amount"));
  const method = text(formData, "method");
  const reference = text(formData, "reference");
  const status = text(formData, "status") || "confirmed";

  if (!UUID_PATTERN.test(id)) failed("payments", context.requestId, "payment.update_validation", new Error("Invalid payment id"));

  const { data: before } = await context.admin.from("rent_payments").select("*").eq("id", id).maybeSingle();
  const { data: after, error } = await context.admin
    .from("rent_payments")
    .update({
      amount: !isNaN(amount) && amount > 0 ? amount : before?.amount,
      method: ["cash", "transfer", "promptpay", "card", "other"].includes(method) ? method : before?.method,
      reference: reference ?? before?.reference,
      status: ["pending", "confirmed", "void"].includes(status) ? status : "confirmed",
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) failed("payments", context.requestId, "payment.update", error);
  await audit(context, "payment.updated", "rent_payment", id, before, after);
  done("payments", `อัปเดตรายการรับชำระ "${after.receipt_number}" เรียบร้อยแล้ว`);
}

export async function deletePaymentAdminAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "paymentId");
  if (!UUID_PATTERN.test(id)) failed("payments", context.requestId, "payment.delete_validation", new Error("Invalid payment id"));

  const { data: before } = await context.admin.from("rent_payments").select("*").eq("id", id).maybeSingle();
  const { error } = await context.admin.from("rent_payments").delete().eq("id", id);
  if (error) failed("payments", context.requestId, "payment.delete", error);

  await audit(context, "payment.deleted", "rent_payment", id, before, null);
  done("payments", `ลบรายการรับชำระ "${before?.receipt_number ?? id}" เรียบร้อยแล้ว`);
}

// ==================== RECEIVABLES ====================
export async function settleReceivableAdminAction(formData: FormData) {
  const context = await adminContext();
  const invoiceId = text(formData, "invoiceId");
  const actionType = text(formData, "actionType") || "pay";
  const amount = Number(text(formData, "amount"));
  const method = text(formData, "method") || "transfer";
  const reference = text(formData, "reference");

  if (!UUID_PATTERN.test(invoiceId)) failed("receivables", context.requestId, "receivable.validation", new Error("Invalid invoice id"));

  const { data: invoice } = await context.admin.from("rent_invoices").select("*").eq("id", invoiceId).maybeSingle();
  if (!invoice) failed("receivables", context.requestId, "receivable.not_found", new Error("Invoice not found"));

  if (actionType === "void") {
    await context.admin.from("rent_invoices").update({ status: "void", balance_due: 0 }).eq("id", invoiceId);
    await audit(context, "receivable.voided", "rent_invoice", invoiceId, invoice, { status: "void", balance_due: 0 });
    done("receivables", `ยกเลิกหนี้ใบแจ้งหนี้ "${invoice.invoice_number}" เรียบร้อยแล้ว`);
  } else {
    const payAmount = isNaN(amount) || amount <= 0 ? Number(invoice.balance_due) : amount;
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;

    await context.admin.from("rent_payments").insert({
      organization_id: invoice.organization_id,
      property_id: invoice.property_id,
      receipt_number: receiptNumber,
      amount: payAmount,
      method: ["cash", "transfer", "promptpay", "card", "other"].includes(method) ? method : "transfer",
      reference: reference || `รับชำระยอดค้าง ${invoice.invoice_number}`,
      status: "confirmed",
      created_by: context.userId,
    });

    const newDue = Math.max(0, Number(invoice.balance_due) - payAmount);
    await context.admin.from("rent_invoices").update({
      balance_due: newDue,
      status: newDue <= 0 ? "paid" : "partial",
      updated_at: new Date().toISOString(),
    }).eq("id", invoiceId);

    await audit(context, "receivable.settled", "rent_invoice", invoiceId, invoice, { balance_due: newDue, paid_amount: payAmount });
    done("receivables", `รับชำระยอดค้าง ${invoice.invoice_number} จำนวน ฿${payAmount.toLocaleString()} แล้ว`);
  }
}

// ==================== ROLES ====================
export async function deleteRoleAction(formData: FormData) {
  const context = await adminContext();
  const id = text(formData, "roleId");
  if (!UUID_PATTERN.test(id)) failed("roles", context.requestId, "role.delete_validation", new Error("Invalid role id"));

  const { data: before } = await context.admin.from("platform_roles").select("*").eq("id", id).maybeSingle();
  if (!before) failed("roles", context.requestId, "role.not_found", new Error("Role not found"));
  if (before.is_system || before.code === "super_admin") {
    failed("roles", context.requestId, "role.protected", new Error("ไม่สามารถลบบทบาทของระบบ (System Role) ได้"));
  }

  const { error } = await context.admin.from("platform_roles").delete().eq("id", id);
  if (error) failed("roles", context.requestId, "role.delete", error);

  await audit(context, "role.deleted", "platform_role", id, before, null);
  done("roles", `ลบบทบาท "${before.name}" เรียบร้อยแล้ว`);
}
