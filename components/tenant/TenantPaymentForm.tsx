"use client";

import { useEffect, useRef, useState } from "react";
import { DateTimeControl } from "@/components/ui/DateTimeControl";
import { SelectControl } from "@/components/ui/SelectControl";
import { prepareSlipImage } from "@/lib/tenant/prepare-slip-image";
import {
  CheckCircle2,
  UploadCloud,
  Maximize2,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parsePaymentSettings, type PaymentSettingsInput } from "@/lib/constants/banks";
import {
  requestPaymentSlipUploadPresignedUrl,
  confirmPaymentSubmissionWithR2,
} from "@/app/(tenant)/tenant/actions";
import { alertSuccess, alertError, alertWarning } from "@/lib/sweetalert";

function getNowLocalIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(Math.floor(now.getMinutes() / 5) * 5)}`;
}

export function TenantPaymentForm({
  invoice,
  setting,
}: {
  userId: string;
  invoice: { id: string; invoice_number: string; balance_due: number };
  setting?: PaymentSettingsInput | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [controlVersion, setControlVersion] = useState(0);
  const [defaultPaidAt] = useState(() => getNowLocalIso());
  const [dateInvalid, setDateInvalid] = useState(false);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [prepared, setPrepared] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [viewingModal, setViewingModal] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const selection = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewingModal(false);
    };
    if (viewingModal) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [viewingModal]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFileSelected(file?: File) {
    const token = ++selection.current;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPrepared(null);
    setPreviewUrl("");
    setRawFile(null);
    setMessage(null);

    if (!file) {
      setPreparing(false);
      return;
    }

    const isHeic = /\.(heic|heif)$/i.test(file.name) || ["image/heic", "image/heif"].includes(file.type);
    const isImage = isHeic || file.type.startsWith("image/");
    if (!isImage) {
      setMessage({ ok: false, text: "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG หรือภาพ iPhone) เท่านั้น" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setRawFile(file);
    setPreparing(true);

    try {
      const processed = await prepareSlipImage(file);
      setPrepared(processed);
      setPreviewUrl(URL.createObjectURL(processed));
    } catch (error) {
      if (token === selection.current) {
        setMessage({ ok: false, text: error instanceof Error ? error.message : "ประมวลผลภาพไม่สำเร็จ" });
        setRawFile(null);
      }
    } finally {
      if (token === selection.current) setPreparing(false);
    }
  }

  function removeSelectedFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPrepared(null);
    setPreviewUrl("");
    setRawFile(null);
    setViewingModal(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const paidAt = String(data.get("paidAt") ?? "");
    if (!paidAt || !Number.isFinite(new Date(paidAt).getTime())) {
      setDateInvalid(true);
      setMessage({ ok: false, text: "กรุณาเลือกวันที่และเวลาโอน" });
      await alertWarning("ข้อมูลไม่ครบถ้วน", "กรุณาเลือกวันที่และเวลาโอน");
      return;
    }

    const fileToUpload = prepared;
    if (!fileToUpload) {
      setMessage({ ok: false, text: "กรุณาแนบสลิปหรือหลักฐานการชำระ" });
      await alertWarning("ข้อมูลไม่ครบถ้วน", "กรุณาแนบสลิปหรือหลักฐานการชำระ");
      return;
    }

    const paymentInfo = parsePaymentSettings(setting);
    if (!paymentInfo.hasAny) {
      setMessage({ ok: false, text: "ไม่พบบัญชีของเจ้าของ ไม่สามารถส่งข้อมูลการชำระได้" });
      await alertError("ไม่พบข้อมูลบัญชี", "ไม่พบบัญชีของเจ้าของ ไม่สามารถส่งข้อมูลการชำระได้");
      return;
    }

    const amount = Number(data.get("amount"));
    const method = String(data.get("method") || (paymentInfo.hasBank ? "transfer" : "promptpay"));
    const reference = String(data.get("reference") ?? "");
    const note = String(data.get("note") ?? "");

    setPending(true);
    setMessage(null);

    try {
      const presigned = await requestPaymentSlipUploadPresignedUrl({
        invoiceId: invoice.id,
        contentType: fileToUpload.type,
      });

      if (!presigned.ok) {
        if (presigned.message.includes("ยกเลิก")) {
          setMessage({ ok: false, text: presigned.message });
          router.refresh();
          await alertWarning("ใบแจ้งหนี้ถูกยกเลิกแล้ว", presigned.message);
          return;
        }
        throw new Error(presigned.message);
      }

      let uploadRes: Response;
      try {
        uploadRes = await fetch(presigned.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": fileToUpload.type,
          },
          body: fileToUpload,
        });
      } catch {
        throw new Error("ไม่สามารถอัปโหลดสลิปได้ กรุณาลองใหม่อีกครั้ง");
      }

      if (!uploadRes.ok) {
        throw new Error(`อัปโหลดสลิปไม่สำเร็จ (${uploadRes.status}) กรุณาลองใหม่อีกครั้ง`);
      }

      const confirmRes = await confirmPaymentSubmissionWithR2({
        invoiceId: invoice.id,
        fileUri: presigned.fileUri,
        amount,
        paidAt: new Date(paidAt).toISOString(),
        method,
        reference,
        note,
      });

      if (!confirmRes.ok) {
        if (confirmRes.message.includes("ยกเลิก")) {
          setMessage({ ok: false, text: confirmRes.message });
          router.refresh();
          await alertWarning("ใบแจ้งหนี้ถูกยกเลิกแล้ว", confirmRes.message);
          return;
        }
        throw new Error(confirmRes.message);
      }

      setMessage({ ok: true, text: confirmRes.message });
      removeSelectedFile();
      form.reset();
      setControlVersion((v) => v + 1);
      setDateInvalid(false);
      router.refresh();
      await alertSuccess("ส่งหลักฐานสำเร็จ", confirmRes.message || "ระบบบันทึกหลักฐานการชำระเงินเรียบร้อยแล้ว");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "ส่งหลักฐานไม่สำเร็จ กรุณาลองอีกครั้ง";
      if (errorMsg.includes("ยกเลิก")) {
        router.refresh();
        await alertWarning("ใบแจ้งหนี้ถูกยกเลิกแล้ว", errorMsg);
      } else {
        await alertError("ส่งหลักฐานไม่สำเร็จ", errorMsg);
      }
      setMessage({
        ok: false,
        text: errorMsg,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-5 space-y-4 border-t border-slate-200 pt-5" onSubmit={handleSubmit}>
      <header>
        <div>
          <strong className="block text-sm font-bold text-slate-800">แจ้งชำระ {invoice.invoice_number}</strong>
          <span className="text-xs text-slate-500">
            ยอดคงเหลือ {Number(invoice.balance_due).toLocaleString("th-TH", { style: "currency", currency: "THB" })}
          </span>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-700">
          <div className="flex items-center justify-between">
            <span>ยอดที่ชำระ *</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              <Lock size={10} />
              <span>ชำระเต็มจำนวน</span>
            </span>
          </div>
          <div className="relative">
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-100/90 px-3.5 pr-10 text-sm font-bold font-mono text-slate-800 cursor-not-allowed select-none outline-none"
              defaultValue={invoice.balance_due}
              readOnly
              name="amount"
              required
              step="0.01"
              type="number"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              บาท
            </span>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-700">
          <span>วันที่และเวลาโอน *</span>
          <DateTimeControl
            key={`date-${controlVersion}`}
            name="paidAt"
            mode="datetime-local"
            defaultValue={defaultPaidAt}
            ariaLabel="วันที่และเวลาโอน"
            placeholder="เลือกวันที่และเวลาโอน"
            disabled={pending}
            invalid={dateInvalid}
            onValueChange={(val) => {
              if (val) setDateInvalid(false);
            }}
          />
          {dateInvalid && <p role="alert" className="text-rose-600 text-xs">กรุณาเลือกวันที่และเวลาโอน</p>}
        </div>
      </div>

      {/* Payment methods and reference */}
      {(() => {
        const paymentInfo = parsePaymentSettings(setting);
        const methodOptions: { value: string; label: string }[] = [];
        if (paymentInfo.hasBank) {
          methodOptions.push({
            value: "transfer",
            label: paymentInfo.bank?.shortName ? `โอนธนาคาร (${paymentInfo.bank.shortName})` : "โอนธนาคาร",
          });
        }
        if (paymentInfo.hasPromptpay) {
          methodOptions.push({
            value: "promptpay",
            label: "พร้อมเพย์ (PromptPay)",
          });
        }

        const defaultMethod = methodOptions[0]?.value ?? "transfer";

        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-700">
              <span>ช่องทาง *</span>
              {methodOptions.length > 0 ? (
                <SelectControl
                  key={`method-${controlVersion}-${defaultMethod}`}
                  name="method"
                  ariaLabel="ช่องทางชำระเงิน"
                  triggerClassName="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-medium text-slate-800"
                  defaultValue={defaultMethod}
                  disabled={pending}
                  searchable={false}
                  options={methodOptions}
                />
              ) : (
                <div className="flex h-11 w-full items-center rounded-xl border border-amber-300 bg-amber-50 px-3.5 text-xs font-semibold text-amber-800">
                  <span>-- ไม่พบบัญชีของเจ้าของ --</span>
                  <input type="hidden" name="method" value="" />
                </div>
              )}
            </div>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              <span>เลขอ้างอิง</span>
              <input
                className="h-11 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
                name="reference"
                placeholder="ถ้ามี"
                disabled={pending}
              />
            </label>
          </div>
        );
      })()}

      {/* Slip Upload & Drop Area */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">แนบภาพสลิป *</label>

        {!previewUrl ? (
          <div
            onClick={() => {
              if (pending || preparing) return;
              fileInputRef.current?.click();
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/70 p-5 text-center transition hover:bg-blue-50 ${
              pending || preparing ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              {preparing ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
            </div>
            <div className="text-xs text-slate-600">
              {preparing ? (
                <span className="font-semibold text-blue-700">กำลังเตรียมรูปภาพ...</span>
              ) : (
                <>
                  <span className="font-semibold text-blue-700">คลิกเพื่อเลือกภาพสลิป</span> หรือลากไฟล์มาวางที่นี่
                </>
              )}
              <p className="mt-1 text-[11px] text-slate-400">
                รองรับไฟล์ภาพ JPG, PNG หรือภาพถ่ายจาก iPhone (HEIC) ระบบจะย่อขนาดให้อัตโนมัติ
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif"
              className="hidden"
              disabled={pending || preparing}
              onChange={(e) => handleFileSelected(e.target.files?.[0])}
            />
          </div>
        ) : (
          /* Preview Selected Slip Card */
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700">ตรวจสอบภาพสลิปก่อนส่ง</span>
              {!pending && (
                <button
                  type="button"
                  onClick={removeSelectedFile}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  <X size={14} />
                  <span>เปลี่ยนภาพ</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Thumbnail with click to open Lightbox */}
              <div
                onClick={() => setViewingModal(true)}
                className="group relative h-44 w-36 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xs"
                title="คลิกเพื่อดูภาพขนาดใหญ่"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="ตัวอย่างสลิปที่จะส่ง"
                  className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/35 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <span className="flex items-center gap-1 rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs backdrop-blur-xs">
                    <Maximize2 size={12} />
                    ดูภาพขยาย
                  </span>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="flex flex-1 flex-col justify-center text-xs text-slate-600 w-full">
                <p className="font-semibold text-slate-800 truncate" title={rawFile?.name}>
                  {rawFile?.name}
                </p>
                <p className="mt-1 text-slate-400">
                  {prepared?.type === "image/png" ? "PNG" : "JPG"} ·{" "}
                  {prepared ? (prepared.size / (1024 * 1024)).toFixed(2) : "0"} MB (พร้อมส่ง)
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingModal(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Maximize2 size={13} />
                    <span>กดดูภาพขยาย</span>
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                  >
                    <span>เลือกไฟล์อื่น</span>
                  </button>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif"
              className="hidden"
              disabled={pending}
              onChange={(e) => handleFileSelected(e.target.files?.[0])}
            />
          </div>
        )}
      </div>

      <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
        <span>หมายเหตุ</span>
        <textarea
          className="w-full rounded-xl border border-slate-300 p-3 text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
          name="note"
          placeholder="รายละเอียดเพิ่มเติมถึงเจ้าของหอ (ถ้ามี)"
          rows={2}
          disabled={pending}
        />
      </label>

      {/* Message alert */}
      {message && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
            message.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : message.text.includes("ยกเลิก")
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {message.ok ? (
            <CheckCircle2 size={16} />
          ) : message.text.includes("ยกเลิก") ? (
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="shrink-0" />
          )}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* Submit button */}
      {(() => {
        const paymentInfo = parsePaymentSettings(setting);
        const canSubmit = paymentInfo.hasAny && !pending && !preparing && Boolean(prepared);

        return (
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {pending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>กำลังส่งหลักฐานการชำระ...</span>
              </>
            ) : !paymentInfo.hasAny ? (
              "ไม่พบบัญชีของเจ้าของ (ไม่สามารถชำระผ่านระบบได้)"
            ) : (
              "ส่งหลักฐานการชำระ"
            )}
          </button>
        );
      })()}

      {/* Lightbox Modal */}
      {viewingModal && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-6 backdrop-blur-xs"
          onClick={() => setViewingModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative flex max-h-[92vh] max-w-[95vw] sm:max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="min-w-0 pr-3">
                <p className="truncate text-sm font-bold text-slate-800" title={rawFile?.name}>
                  {rawFile?.name}
                </p>
                <p className="text-xs text-slate-500">ตัวอย่างภาพสลิปที่จะส่ง · กด ESC เพื่อปิด</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                >
                  <ExternalLink size={13} />
                  <span>เปิดแท็บใหม่</span>
                </a>
                <button
                  type="button"
                  onClick={() => setViewingModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
                  title="ปิด"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Image display */}
            <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-900/5 p-3 sm:p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="สลิปโอนเงิน"
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
