"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/auth/tenant-access";
import {
  storePrivateSlip,
  deletePrivateSlip,
  createPrivateUploadPresignedUrl,
  checkPrivateObjectExists,
} from "@/lib/storage/private-r2";
import { detectSlipType, MAX_SLIP_BYTES } from "@/lib/tenant/slip-validation.mjs";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requestPaymentSlipUploadPresignedUrl({
  invoiceId,
  contentType,
}: {
  invoiceId: string;
  contentType: string;
}) {
  const context = await requireTenantContext();
  if (!/^[0-9a-f-]{36}$/i.test(invoiceId)) {
    return { ok: false as const, message: "รหัสใบแจ้งหนี้ไม่ถูกต้อง" };
  }

  const extension =
    contentType === "image/png"
      ? "png"
      : contentType === "image/jpeg"
      ? "jpg"
      : null;

  if (!extension) {
    return { ok: false as const, message: "รองรับเฉพาะไฟล์ JPG หรือ PNG ที่ถูกต้อง" };
  }

  const { data: invoice } = await context.supabase
    .from("rent_invoices")
    .select("id, organization_id, property_id, lease_id, balance_due, status")
    .eq("id", invoiceId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (!invoice) {
    return { ok: false as const, message: "ไม่พบข้อมูลใบแจ้งหนี้" };
  }
  if (invoice.status === "void") {
    return { ok: false as const, message: "ใบแจ้งหนี้นี้ถูกยกเลิกไปแล้ว" };
  }
  if (invoice.status === "paid") {
    return { ok: false as const, message: "ใบแจ้งหนี้นี้ได้รับการชำระเงินเรียบร้อยแล้ว" };
  }
  if (!invoice.lease_id) {
    return { ok: false as const, message: "ใบแจ้งหนี้นี้ไม่พร้อมรับชำระ" };
  }

  const { data: lease } = await context.supabase
    .from("leases")
    .select("id, primary_tenant_id")
    .eq("id", invoice.lease_id)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (!lease || lease.primary_tenant_id !== context.tenantId) {
    return { ok: false as const, message: "คุณไม่มีสิทธิ์ส่งหลักฐานสำหรับใบแจ้งหนี้นี้" };
  }

  const { data: pending } = await context.supabase
    .from("payment_submissions")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("tenant_id", context.tenantId)
    .eq("status", "pending")
    .limit(1);

  if (pending?.length) {
    return { ok: false as const, message: "มีหลักฐานรอตรวจสอบแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบหรือยกเลิกสลิปเดิมก่อน" };
  }

  try {
    const key = `payment-slips/${context.organizationId}/${context.tenantId}/${invoiceId}/${crypto.randomUUID()}.${extension}`;
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

export async function confirmPaymentSubmissionWithR2({
  invoiceId,
  fileUri,
  amount,
  paidAt,
  method,
  reference,
  note,
}: {
  invoiceId: string;
  fileUri: string;
  amount: number;
  paidAt: string;
  method: string;
  reference?: string | null;
  note?: string | null;
}) {
  const context = await requireTenantContext();
  const fail = (message: string) => ({ ok: false, message });

  if (!/^[0-9a-f-]{36}$/i.test(invoiceId) || !Number.isFinite(amount) || amount <= 0) {
    return fail("กรุณาตรวจสอบใบแจ้งหนี้และยอดชำระ");
  }

  const parsedDate = new Date(paidAt);
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.getTime() > Date.now() + 60000 || !["transfer", "promptpay"].includes(method)) {
    return fail("กรุณาตรวจสอบวันที่และช่องทางชำระ");
  }

  const bucket = process.env.R2_PRIVATE_BUCKET_NAME;
  const expectedPrefix = `r2://${bucket}/payment-slips/${context.organizationId}/${context.tenantId}/${invoiceId}/`;
  if (!fileUri.startsWith(expectedPrefix)) {
    return fail("ตำแหน่งไฟล์ไม่ถูกต้อง");
  }

  const exists = await checkPrivateObjectExists(fileUri);
  if (!exists) {
    return fail("ไม่พบไฟล์สลิปที่อัปโหลดในระบบ กรุณาลองใหม่อีกครั้ง");
  }

  const { data: invoice } = await context.supabase
    .from("rent_invoices")
    .select("id, organization_id, property_id, lease_id, balance_due, status")
    .eq("id", invoiceId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (!invoice) {
    await deletePrivateSlip(fileUri);
    return fail("ไม่พบข้อมูลใบแจ้งหนี้");
  }
  if (invoice.status === "void") {
    await deletePrivateSlip(fileUri);
    return fail("ใบแจ้งหนี้นี้ถูกยกเลิกไปแล้ว");
  }
  if (invoice.status === "paid") {
    await deletePrivateSlip(fileUri);
    return fail("ใบแจ้งหนี้นี้ได้รับการชำระเงินเรียบร้อยแล้ว");
  }
  if (!invoice.lease_id || amount > Number(invoice.balance_due)) {
    await deletePrivateSlip(fileUri);
    return fail("ใบแจ้งหนี้นี้ไม่พร้อมรับชำระ หรือยอดเกินยอดคงเหลือ");
  }

  const { data: lease } = await context.supabase
    .from("leases")
    .select("id, primary_tenant_id")
    .eq("id", invoice.lease_id)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (!lease || lease.primary_tenant_id !== context.tenantId) {
    await deletePrivateSlip(fileUri);
    return fail("คุณไม่มีสิทธิ์ส่งหลักฐานสำหรับใบแจ้งหนี้นี้");
  }

  const { data: pending } = await context.supabase
    .from("payment_submissions")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("tenant_id", context.tenantId)
    .eq("status", "pending")
    .limit(1);

  if (pending?.length) {
    await deletePrivateSlip(fileUri);
    return fail("มีหลักฐานรอตรวจสอบแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบ");
  }

  const { error } = await context.supabase.from("payment_submissions").insert({
    organization_id: context.organizationId,
    property_id: invoice.property_id,
    tenant_id: context.tenantId,
    lease_id: lease.id,
    invoice_id: invoice.id,
    amount,
    paid_at: parsedDate.toISOString(),
    method,
    reference: reference?.trim() || null,
    slip_path: fileUri,
    note: note?.trim() || null,
    status: "pending",
  });

  if (error) {
    await deletePrivateSlip(fileUri);
    return fail("ส่งหลักฐานไม่สำเร็จ กรุณาลองอีกครั้ง");
  }

  revalidatePath("/tenant");
  revalidatePath("/tenant/bills");
  revalidatePath("/payments");
  return { ok: true, message: "ส่งหลักฐานแล้ว รอเจ้าหน้าที่ตรวจสอบก่อนยืนยันยอดชำระ" };
}

export async function cancelPendingPaymentSubmission(submissionId: string) {
  const context = await requireTenantContext();
  if (!/^[0-9a-f-]{36}$/i.test(submissionId)) {
    return { ok: false, message: "รหัสหลักฐานไม่ถูกต้อง" };
  }

  const { data: submission } = await context.supabase
    .from("payment_submissions")
    .select("id, slip_path, status, tenant_id, organization_id")
    .eq("id", submissionId)
    .eq("tenant_id", context.tenantId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (!submission) {
    return { ok: false, message: "ไม่พบหลักฐานการชำระเงินของคุณ" };
  }

  if (submission.status !== "pending") {
    return {
      ok: false,
      message: "ไม่สามารถลบสลิปนี้ได้ เนื่องจากเจ้าของหอพักได้ตรวจสอบหรืออนุมัติแล้ว (ต้องติดต่อเจ้าของหอพักเพื่อดำเนินการ)",
    };
  }

  if (submission.slip_path && submission.slip_path.startsWith("r2://")) {
    try {
      await deletePrivateSlip(submission.slip_path);
    } catch (err) {
      console.error("Failed to delete payment slip from R2:", err);
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("payment_submissions")
    .delete()
    .eq("id", submissionId)
    .eq("tenant_id", context.tenantId)
    .eq("organization_id", context.organizationId);

  if (error) {
    return { ok: false, message: "ลบหลักฐานการชำระเงินไม่สำเร็จ กรุณาลองอีกครั้ง" };
  }

  revalidatePath("/tenant");
  revalidatePath("/tenant/bills");
  revalidatePath("/payments");
  return { ok: true, message: "ยกเลิกและลบสลิปเรียบร้อยแล้ว คุณสามารถแจ้งชำระใหม่ได้ทันที" };
}

export async function submitPaymentEvidenceAction(data: FormData) {
  const context = await requireTenantContext();
  const invoiceId = String(data.get("invoiceId") ?? "");
  const amount = Number(data.get("amount"));
  const method = String(data.get("method"));
  const paidAt = new Date(String(data.get("paidAt")));
  const file = data.get("slip");
  const fail = (message: string) => ({ ok: false, message });
  if (!/^[0-9a-f-]{36}$/i.test(invoiceId) || !Number.isFinite(amount) || amount <= 0) return fail("กรุณาตรวจสอบใบแจ้งหนี้และยอดชำระ");
  if (!Number.isFinite(paidAt.getTime()) || paidAt.getTime() > Date.now() + 60000 || !["transfer", "promptpay"].includes(method)) return fail("กรุณาตรวจสอบวันที่และช่องทางชำระ");
  if (!(file instanceof File) || !file.size || file.size > MAX_SLIP_BYTES) return fail("กรุณาแนบสลิปขนาดไม่เกิน 4.5 MB");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = detectSlipType(bytes);
  if (!format || format.type !== file.type) return fail("รองรับเฉพาะไฟล์ JPG หรือ PNG ที่ถูกต้อง");
  const { data: invoice } = await context.supabase.from("rent_invoices").select("id, organization_id, property_id, lease_id, balance_due, status").eq("id", invoiceId).eq("organization_id", context.organizationId).maybeSingle();
  if (!invoice) return fail("ไม่พบข้อมูลใบแจ้งหนี้");
  if (invoice.status === "void") return fail("ใบแจ้งหนี้นี้ถูกยกเลิกไปแล้ว");
  if (invoice.status === "paid") return fail("ใบแจ้งหนี้นี้ได้รับการชำระเงินเรียบร้อยแล้ว");
  if (!invoice.lease_id || amount > Number(invoice.balance_due)) return fail("ใบแจ้งหนี้นี้ไม่พร้อมรับชำระ หรือยอดเกินยอดคงเหลือ");
  const { data: lease } = await context.supabase.from("leases").select("id, primary_tenant_id").eq("id", invoice.lease_id).eq("organization_id", context.organizationId).maybeSingle();
  if (!lease || lease.primary_tenant_id !== context.tenantId) return fail("คุณไม่มีสิทธิ์ส่งหลักฐานสำหรับใบแจ้งหนี้นี้");
  const { data: pending, error: pendingError } = await context.supabase.from("payment_submissions").select("id").eq("invoice_id", invoiceId).eq("tenant_id", context.tenantId).eq("status", "pending").limit(1);
  if (pendingError) return fail("ตรวจสอบหลักฐานเดิมไม่สำเร็จ");
  if (pending?.length) return fail("มีหลักฐานรอตรวจสอบแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบ");
  try {
    const key = `payment-slips/${context.organizationId}/${context.tenantId}/${invoiceId}/${crypto.randomUUID()}.${format.extension}`;
    const slipPath = await storePrivateSlip(key, bytes, format.type);
    const { error } = await context.supabase.from("payment_submissions").insert({
      organization_id: context.organizationId, property_id: invoice.property_id, tenant_id: context.tenantId,
      lease_id: lease.id, invoice_id: invoice.id, amount, paid_at: paidAt.toISOString(), method,
      reference: String(data.get("reference") ?? "").trim() || null,
      slip_path: slipPath, note: String(data.get("note") ?? "").trim() || null, status: "pending",
    });
    if (error) { await deletePrivateSlip(slipPath); return fail("ส่งหลักฐานไม่สำเร็จ กรุณาลองอีกครั้ง"); }
  } catch { return fail("อัปโหลดหลักฐานไม่สำเร็จ กรุณาลองใหม่หรือติดต่อเจ้าหน้าที่"); }
  revalidatePath("/tenant"); revalidatePath("/tenant/bills"); revalidatePath("/payments");
  return { ok: true, message: "ส่งหลักฐานแล้ว รอเจ้าหน้าที่ตรวจสอบก่อนยืนยันยอดชำระ" };
}

