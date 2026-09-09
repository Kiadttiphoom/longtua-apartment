"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { money, thaiDate } from "@/lib/format";
import {
  Clock3,
  Maximize2,
  Trash2,
  Loader2,
  X,
  ExternalLink,
  Download,
  AlertCircle,
} from "lucide-react";
import { cancelPendingPaymentSubmission } from "@/app/(tenant)/tenant/actions";

export interface PendingSubmission {
  id: string;
  invoice_id: string;
  amount: number | string;
  paid_at: string;
  method: string;
  reference?: string | null;
  note?: string | null;
  status: string;
}

export function TenantPendingSlipCard({
  submission,
}: {
  submission: PendingSubmission;
}) {
  const router = useRouter();
  const [viewingModal, setViewingModal] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setViewingModal(false);
        if (!canceling) setConfirmingCancel(false);
      }
    };
    if (viewingModal || confirmingCancel) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [viewingModal, confirmingCancel, canceling]);

  async function handleCancelSubmission() {
    setCanceling(true);
    setErrorMessage("");
    try {
      const res = await cancelPendingPaymentSubmission(submission.id);
      if (!res.ok) {
        setErrorMessage(res.message);
        setCanceling(false);
      } else {
        setConfirmingCancel(false);
        setViewingModal(false);
        router.refresh();
      }
    } catch {
      setErrorMessage("เกิดข้อผิดพลาดในการยกเลิกสลิป กรุณาลองใหม่อีกครั้ง");
      setCanceling(false);
    }
  }

  const slipUrl = `/api/payment-slips/${submission.id}`;

  return (
    <>
      <div className="mt-5 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs transition sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-amber-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-xs">
              <Clock3 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-sm font-bold text-amber-950">ส่งหลักฐานแล้ว</strong>
                <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  รอตรวจสอบ
                </span>
              </div>
              <p className="mt-0.5 text-xs text-amber-800">
                รอเจ้าของหอพักตรวจสอบยอดและยืนยันการชำระเงิน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setErrorMessage("");
              setConfirmingCancel(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-2xs hover:bg-rose-50 hover:border-rose-300 transition cursor-pointer"
          >
            <Trash2 size={13} />
            <span>ยกเลิกสลิปนี้</span>
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Slip Thumbnail with Click to Lightbox */}
          <div
            onClick={() => setViewingModal(true)}
            className="group relative h-40 w-32 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-amber-200 bg-amber-100/50 shadow-xs"
            title="คลิกเพื่อดูภาพขยาย"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slipUrl}
              alt="หลักฐานการชำระเงินที่ส่ง"
              className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/35 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-1 rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                <Maximize2 size={12} />
                ดูสลิป
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col justify-between space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/70 p-3.5 border border-amber-200/60 sm:grid-cols-3">
              <div>
                <span className="text-amber-800/80">ยอดแจ้งชำระ</span>
                <strong className="mt-0.5 block text-base font-bold text-amber-950">
                  {money(Number(submission.amount))}
                </strong>
              </div>
              <div>
                <span className="text-amber-800/80">ช่องทาง</span>
                <p className="mt-0.5 font-semibold text-amber-950">
                  {submission.method === "promptpay" ? "PromptPay" : "โอนธนาคาร"}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-amber-800/80">แจ้งโอนเมื่อ</span>
                <p className="mt-0.5 font-semibold text-amber-950">
                  {thaiDate(submission.paid_at)}
                </p>
              </div>
            </div>

            {submission.reference && (
              <p className="text-amber-900">
                <span className="font-semibold text-amber-800/80">เลขอ้างอิง:</span> {submission.reference}
              </p>
            )}

            {submission.note && (
              <p className="text-amber-900">
                <span className="font-semibold text-amber-800/80">หมายเหตุ:</span> {submission.note}
              </p>
            )}

            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewingModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-2xs hover:bg-amber-50 transition cursor-pointer"
              >
                <Maximize2 size={13} />
                <span>กดดูภาพขยาย</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {viewingModal && (
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
                <p className="truncate text-sm font-bold text-slate-800">
                  หลักฐานการชำระเงิน ({money(Number(submission.amount))})
                </p>
                <p className="text-xs text-slate-500">
                  แจ้งโอน {thaiDate(submission.paid_at)} · กด ESC เพื่อปิด
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`${slipUrl}?download`}
                  className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <Download size={13} />
                  <span>ดาวน์โหลด</span>
                </a>
                <a
                  href={slipUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                >
                  <ExternalLink size={13} />
                  <span>เปิดแท็บใหม่</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setViewingModal(false);
                    setErrorMessage("");
                    setConfirmingCancel(true);
                  }}
                  className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>ยกเลิกสลิปนี้</span>
                </button>
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
                src={slipUrl}
                alt="สลิปโอนเงิน"
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete / Cancel Confirmation Modal */}
      {confirmingCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          onClick={() => !canceling && setConfirmingCancel(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยกเลิกและลบสลิปนี้?</h3>
                <p className="text-xs text-slate-500">
                  สลิปจะถูกลบออกจากระบบ และคุณสามารถส่งหลักฐานใหม่ได้ทันที
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
              <p>
                <span className="font-semibold text-slate-500">ยอดแจ้งชำระ:</span> {money(Number(submission.amount))}
              </p>
              <p>
                <span className="font-semibold text-slate-500">วันที่โอน:</span> {thaiDate(submission.paid_at)}
              </p>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                disabled={canceling}
                onClick={() => setConfirmingCancel(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                disabled={canceling}
                onClick={handleCancelSubmission}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {canceling ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>กำลังยกเลิก...</span>
                  </>
                ) : (
                  <span>ยืนยันยกเลิกสลิป</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
