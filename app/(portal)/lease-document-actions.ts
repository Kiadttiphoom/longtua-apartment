"use server";

import { can, requirePortalContext } from "@/lib/portal/context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LeaseContent, LeaseDocumentState, LeaseDocumentVersion } from "@/lib/contracts/types";

export async function loadLeaseDocumentAction(leaseId: string): Promise<{ ok: true; state: LeaseDocumentState } | { ok: false; message: string }> {
  const context = await requirePortalContext();
  if (!can(context, "customer_leases", "view")) return { ok: false, message: "คุณไม่มีสิทธิ์ดูสัญญาเช่า" };
  const client = context.isImpersonating ? createAdminClient() : await createClient();
  const { data: lease } = await client.from("leases").select("property_id,created_at").eq("id", leaseId).eq("organization_id", context.organization.id).maybeSingle();
  if (!lease) return { ok: false, message: "ไม่พบสัญญาเช่า" };
  const [versions, template, initialTemplate] = await Promise.all([
    client.from("lease_document_versions").select("id,created_at,content,snapshot").eq("organization_id", context.organization.id).eq("lease_id", leaseId).order("created_at", { ascending: false }).limit(50),
    client.from("property_lease_templates").select("id,content").eq("organization_id", context.organization.id).eq("property_id", lease.property_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    client.from("property_lease_templates").select("content").eq("organization_id", context.organization.id).eq("property_id", lease.property_id).lte("created_at", lease.created_at).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const errors = [versions.error, template.error, initialTemplate.error].filter(Boolean);
  if (errors.length) {
    if (errors.every(error => ["PGRST205", "42P01"].includes(error!.code))) return { ok: true, state: {
      storageReady: false, versions: [], template: null, templateId: null, initialTemplate: null, canSaveTemplate: false,
    } };
    return { ok: false, message: "โหลดข้อความที่บันทึกไม่สำเร็จ กรุณาตรวจการเชื่อมต่อและสิทธิ์เข้าถึง" };
  }
  return { ok: true, state: {
    storageReady: true, versions: versions.data as LeaseDocumentVersion[], template: template.data?.content as LeaseContent ?? null,
    templateId: template.data?.id ?? null, initialTemplate: initialTemplate.data?.content as LeaseContent ?? null,
    canSaveTemplate: can(context, "customer_settings", "update") && can(context, "customer_leases", "update"),
  } };
}
