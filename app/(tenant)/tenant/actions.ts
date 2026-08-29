"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/auth/tenant-access";
import { createAdminClient } from "@/lib/supabase/admin";

type SubmissionInput = { invoiceId: string; amount: number; paidAt: string; method: "transfer" | "promptpay"; reference?: string; slipPath: string; note?: string };

export async function submitPaymentEvidenceAction(input: SubmissionInput) {
  const context = await requireTenantContext();
  const amount = Number(input.amount);
  if (!/^[0-9a-f-]{36}$/i.test(input.invoiceId) || !Number.isFinite(amount) || amount <= 0) return { ok: false, message: "กรุณาตรวจสอบใบแจ้งหนี้และยอดชำระ" };
  if (!input.paidAt || !["transfer", "promptpay"].includes(input.method)) return { ok: false, message: "กรุณาระบุวันที่และช่องทางชำระ" };
  if (!input.slipPath.startsWith(`${context.userId}/${input.invoiceId}/`)) return { ok: false, message: "ตำแหน่งไฟล์หลักฐานไม่ถูกต้อง" };

  const { data: invoice } = await context.supabase.from("rent_invoices").select("id, organization_id, property_id, lease_id, balance_due, status").eq("id", input.invoiceId).maybeSingle();
  if (!invoice || invoice.organization_id !== context.organizationId || !invoice.lease_id || ["paid", "void"].includes(invoice.status) || amount > Number(invoice.balance_due)) return { ok: false, message: "ใบแจ้งหนี้นี้ไม่พร้อมรับชำระ หรือยอดเกินยอดคงเหลือ" };

  const { data: lease } = await context.supabase.from("leases").select("id, primary_tenant_id").eq("id", invoice.lease_id).maybeSingle();
  if (!lease || lease.primary_tenant_id !== context.tenantId) return { ok: false, message: "คุณไม่มีสิทธิ์ส่งหลักฐานสำหรับใบแจ้งหนี้นี้" };

  const fileName = input.slipPath.split("/").at(-1) ?? "";
  const admin = createAdminClient();
  const { data: storedFiles } = await admin.storage.from("payment-slips").list(`${context.userId}/${input.invoiceId}`, { search: fileName, limit: 1 });
  if (!storedFiles?.some((file) => file.name === fileName)) return { ok: false, message: "ไม่พบไฟล์หลักฐาน กรุณาอัปโหลดใหม่" };

  const { error } = await context.supabase.from("payment_submissions").insert({
    organization_id: context.organizationId, property_id: invoice.property_id, tenant_id: context.tenantId,
    lease_id: lease.id, invoice_id: invoice.id, amount, paid_at: new Date(input.paidAt).toISOString(), method: input.method,
    reference: input.reference?.trim() || null, slip_path: input.slipPath, note: input.note?.trim() || null,
  });
  if (error) return { ok: false, message: "ส่งหลักฐานไม่สำเร็จ กรุณาตรวจข้อมูลแล้วลองอีกครั้ง" };
  revalidatePath("/tenant");
  revalidatePath("/tenant/bills");
  return { ok: true, message: "ส่งหลักฐานแล้ว เจ้าของหอจะตรวจสอบก่อนตัดยอด" };
}
