"use server";
import { requireTenantContext } from "@/lib/auth/tenant-access";
import {
  storePrivateSlip,
  deletePrivateSlip,
  createPrivateUploadPresignedUrl,
  checkPrivateObjectExists,
} from "@/lib/storage/private-r2";
import { detectSlipType } from "@/lib/tenant/slip-validation.mjs";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requestContractUploadPresignedUrl({
  leaseId,
  contentType,
}: {
  leaseId: string;
  fileName?: string;
  contentType: string;
}) {
  const context = await requireTenantContext();
  const { data: lease } = await context.supabase
    .from("leases")
    .select("id")
    .eq("id", leaseId)
    .eq("organization_id", context.organizationId)
    .eq("primary_tenant_id", context.tenantId)
    .maybeSingle();

  if (!lease) {
    return { ok: false as const, message: "ไม่พบสัญญาของคุณ" };
  }

  const { count: existingCount } = await context.supabase
    .from("tenant_contract_uploads")
    .select("*", { count: "exact", head: true })
    .eq("lease_id", leaseId)
    .eq("tenant_id", context.tenantId)
    .eq("organization_id", context.organizationId);

  if ((existingCount ?? 0) >= 5) {
    return {
      ok: false as const,
      message: "สัญญานี้แนบภาพรวมของเก่าครบ 5 ภาพแล้ว กรุณาลบภาพเดิมออกก่อนแนบภาพใหม่",
    };
  }

  const extension =
    contentType === "image/png"
      ? "png"
      : contentType === "image/jpeg"
      ? "jpg"
      : null;

  if (!extension) {
    return { ok: false as const, message: "รองรับเฉพาะภาพ PNG และ JPG" };
  }

  try {
    const key = `tenant-contracts/${leaseId}/${crypto.randomUUID()}.${extension}`;
    const { uploadUrl, fileUri } = await createPrivateUploadPresignedUrl(key, contentType, 600);
    return {
      ok: true as const,
      uploadUrl,
      fileUri,
      key,
    };
  } catch {
    return { ok: false as const, message: "ไม่สามารถสร้าง URL สำหรับอัปโหลดได้ กรุณาลองอีกครั้ง" };
  }
}

export async function confirmContractUpload({
  leaseId,
  fileUri,
  fileName,
  contentType,
}: {
  leaseId: string;
  fileUri: string;
  fileName: string;
  contentType: string;
}) {
  const context = await requireTenantContext();
  const { data: lease } = await context.supabase
    .from("leases")
    .select("id")
    .eq("id", leaseId)
    .eq("organization_id", context.organizationId)
    .eq("primary_tenant_id", context.tenantId)
    .maybeSingle();

  if (!lease) {
    return { ok: false, message: "ไม่พบสัญญาของคุณ" };
  }

  const bucket = process.env.R2_PRIVATE_BUCKET_NAME;
  const shortPrefix = `r2://${bucket}/tenant-contracts/${leaseId}/`;
  const legacyPrefix = `r2://${bucket}/tenant-contracts/${context.organizationId}/${context.tenantId}/${leaseId}/`;
  if (!fileUri.startsWith(shortPrefix) && !fileUri.startsWith(legacyPrefix)) {
    return { ok: false, message: "ตำแหน่งไฟล์ไม่ถูกต้อง" };
  }

  const exists = await checkPrivateObjectExists(fileUri);
  if (!exists) {
    return { ok: false, message: "ไม่พบไฟล์ที่อัปโหลดใน Cloudflare R2" };
  }

  const { count: currentCount } = await context.supabase
    .from("tenant_contract_uploads")
    .select("*", { count: "exact", head: true })
    .eq("lease_id", leaseId)
    .eq("tenant_id", context.tenantId)
    .eq("organization_id", context.organizationId);

  if ((currentCount ?? 0) >= 5) {
    await deletePrivateSlip(fileUri);
    return { ok: false, message: "สัญญานี้แนบภาพครบ 5 ภาพแล้ว กรุณาลบภาพเดิมออกก่อน" };
  }

  const { error } = await context.supabase.from("tenant_contract_uploads").insert({
    organization_id: context.organizationId,
    tenant_id: context.tenantId,
    lease_id: leaseId,
    file_uri: fileUri,
    file_name: fileName.slice(0, 200),
    content_type: contentType,
  });

  if (error) {
    await deletePrivateSlip(fileUri);
    return { ok: false, message: "บันทึกไฟล์สัญญาไม่สำเร็จ" };
  }

  revalidatePath("/tenant/lease");
  return { ok: true, message: "แนบภาพสัญญาแล้ว" };
}

export async function uploadTenantContract(data: FormData) {
  const context = await requireTenantContext();
  const file = data.get("file");
  const leaseId = String(data.get("leaseId") ?? "");
  const fail = (message: string) => ({ ok: false, message });
  const { data: lease } = await context.supabase.from("leases").select("id").eq("id",leaseId).eq("organization_id",context.organizationId).eq("primary_tenant_id",context.tenantId).maybeSingle();
  if (!lease) return fail("ไม่พบสัญญาของคุณ");
  if (!(file instanceof File) || !file.size || file.size > 4_500_000) return fail("แนบภาพขนาดไม่เกิน 4.5 MB ต่อไฟล์");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = detectSlipType(bytes);
  if (!format || format.type !== file.type) return fail("รองรับเฉพาะภาพ PNG และ JPG");
  try {
    const uri = await storePrivateSlip(`tenant-contracts/${context.organizationId}/${context.tenantId}/${leaseId}/${crypto.randomUUID()}.${format.extension}`,bytes,format.type);
    const { error } = await context.supabase.from("tenant_contract_uploads").insert({ organization_id:context.organizationId,tenant_id:context.tenantId,lease_id:leaseId,file_uri:uri,file_name:file.name.slice(0,200),content_type:format.type });
    if(error) { await deletePrivateSlip(uri); return fail("บันทึกไฟล์สัญญาไม่สำเร็จ"); }
    revalidatePath("/tenant/lease"); return { ok:true,message:"แนบภาพสัญญาแล้ว" };
  } catch { return fail("อัปโหลดไม่สำเร็จ กรุณาติดต่อหอพักหรือลองอีกครั้ง"); }
}

export async function deleteTenantContract(fileId: string) {
  const context = await requireTenantContext();
  const { data: file } = await context.supabase
    .from("tenant_contract_uploads")
    .select("id, file_uri, tenant_id, organization_id")
    .eq("id", fileId)
    .eq("tenant_id", context.tenantId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (!file) {
    return { ok: false, message: "ไม่พบไฟล์สัญญาของคุณ" };
  }

  try {
    await deletePrivateSlip(file.file_uri);
  } catch (err) {
    console.error("Failed to delete object from R2:", err);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("tenant_contract_uploads")
    .delete()
    .eq("id", fileId)
    .eq("tenant_id", context.tenantId)
    .eq("organization_id", context.organizationId);

  if (error) {
    return { ok: false, message: "ลบข้อมูลสัญญาไม่สำเร็จ" };
  }

  revalidatePath("/tenant/lease");
  return { ok: true, message: "ลบไฟล์สัญญาเรียบร้อยแล้ว" };
}
