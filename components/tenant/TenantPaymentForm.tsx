"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitPaymentEvidenceAction } from "@/app/(tenant)/tenant/actions";
import { createClient } from "@/lib/supabase/client";

export function TenantPaymentForm({ userId, invoice }: { userId: string; invoice: { id: string; invoice_number: string; balance_due: number } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  return <form className="tenant-payment-form" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const file = data.get("slip"); if (!(file instanceof File) || !file.size) { setMessage({ ok: false, text: "กรุณาแนบสลิปหรือหลักฐานการชำระ" }); return; } if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) { setMessage({ ok: false, text: "รองรับ JPG, PNG, WebP หรือ PDF ขนาดไม่เกิน 5MB" }); return; } startTransition(async () => { setMessage(null); const extension = file.name.split(".").at(-1)?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin"; const path = `${userId}/${invoice.id}/${crypto.randomUUID()}.${extension}`; const supabase = createClient(); const upload = await supabase.storage.from("payment-slips").upload(path, file, { contentType: file.type, upsert: false }); if (upload.error) { setMessage({ ok: false, text: "อัปโหลดหลักฐานไม่สำเร็จ กรุณาลองใหม่" }); return; } const result = await submitPaymentEvidenceAction({ invoiceId: invoice.id, amount: Number(data.get("amount")), paidAt: String(data.get("paidAt")), method: String(data.get("method")) as "transfer" | "promptpay", reference: String(data.get("reference") ?? ""), note: String(data.get("note") ?? ""), slipPath: path }); if (!result.ok) await supabase.storage.from("payment-slips").remove([path]); setMessage({ ok: result.ok, text: result.message }); if (result.ok) { form.reset(); router.refresh(); } }); }}>
    <header><div><strong>แจ้งชำระ {invoice.invoice_number}</strong><span>ยอดคงเหลือ {Number(invoice.balance_due).toLocaleString("th-TH", { style: "currency", currency: "THB" })}</span></div></header>
    <div className="tenant-form-grid"><label><span>ยอดที่ชำระ *</span><input defaultValue={invoice.balance_due} max={invoice.balance_due} min="0.01" name="amount" required step="0.01" type="number" /></label><label><span>วันที่และเวลาโอน *</span><input name="paidAt" required type="datetime-local" /></label></div>
    <div className="tenant-form-grid"><label><span>ช่องทาง *</span><select defaultValue="transfer" name="method"><option value="transfer">โอนธนาคาร</option><option value="promptpay">PromptPay</option></select></label><label><span>เลขอ้างอิง</span><input name="reference" placeholder="ถ้ามี" /></label></div>
    <label className="tenant-upload"><UploadCloud size={22} /><span><strong>แนบสลิปหรือ PDF *</strong><small>JPG, PNG, WebP หรือ PDF ไม่เกิน 5MB</small></span><input accept="image/jpeg,image/png,image/webp,application/pdf" name="slip" required type="file" /></label>
    <label><span>หมายเหตุ</span><textarea name="note" placeholder="รายละเอียดเพิ่มเติมถึงเจ้าของหอ" rows={2} /></label>
    {message ? <p className={message.ok ? "success" : "error"} role="status">{message.ok ? <CheckCircle2 size={17} /> : null}{message.text}</p> : null}
    <button disabled={pending} type="submit">{pending ? "กำลังส่งหลักฐาน..." : "ส่งหลักฐานการชำระ"}</button>
  </form>;
}
