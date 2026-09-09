"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { money, thaiDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Maximize2,
  Download,
  ExternalLink,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  Eye,
} from "lucide-react";
import { cancelPendingPaymentSubmission } from "@/app/(tenant)/tenant/actions";

export interface SlipHistoryItem {
  id: string;
  amount: number | string;
  paid_at: string;
  status: string;
  rejection_reason?: string | null;
}

export function TenantSlipHistoryList({ slips }: { slips: SlipHistoryItem[] }) {
  const router = useRouter();
  const [viewingSlip, setViewingSlip] = useState<SlipHistoryItem | null>(null);
  const [slipToCancel, setSlipToCancel] = useState<SlipHistoryItem | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setViewingSlip(null);
        if (!canceling) setSlipToCancel(null);
      }
    };
    if (viewingSlip || slipToCancel) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [viewingSlip, slipToCancel, canceling]);

  async function handleCancelSubmission() {
    if (!slipToCancel) return;
    setCanceling(true);
    setCancelError("");
    try {
      const res = await cancelPendingPaymentSubmission(slipToCancel.id);
      if (!res.ok) {
        setCancelError(res.message);
        setCanceling(false);
      } else {
        setSlipToCancel(null);
        setViewingSlip(null);
        setCanceling(false);
        router.refresh();
      }
    } catch {
      setCancelError("เกิดข้อผิดพลาดในการยกเลิกสลิป กรุณาลองใหม่อีกครั้ง");
      setCanceling(false);
    }
  }

  if (!slips.length) {
    return <p className="text-xs text-slate-500">ไม่มีสลิปที่แนบผ่านระบบ</p>;
  }

  return (
    <>
      <div className="space-y-2">
        {slips.map((slip) => (
          <div
            key={slip.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-xs border border-slate-100"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewingSlip(slip)}
                className="group relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-200 shadow-2xs"
                title="กดเพื่อดูภาพขยาย"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/payment-slips/${slip.id}`}
                  alt="สลิป"
                  className="h-full w-full object-cover transition group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 opacity-0 transition group-hover:opacity-100">
                  <Maximize2 size={12} className="text-white" />
                </div>
              </button>
              <div>
                <strong className="text-sm font-bold text-slate-800">{money(Number(slip.amount))}</strong>
                <p className="mt-0.5 text-slate-500">แจ้งโอน {thaiDate(slip.paid_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={slip.status} />
              <button
                type="button"
                onClick={() => setViewingSlip(slip)}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                <Eye size={13} />
                <span>ดูสลิป</span>
              </button>
              {slip.status === "pending" && (
                <button
                  type="button"
                  onClick={() => {
                    setCancelError("");
                    setSlipToCancel(slip);
                  }}
                  className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-700 hover:underline cursor-pointer pl-2 border-l border-slate-200"
                  title="ยกเลิกสลิปนี้"
                >
                  <Trash2 size={13} />
                  <span>ยกเลิก</span>
                </button>
              )}
            </div>

            {slip.rejection_reason && (
              <p className="w-full rounded-lg bg-rose-50 p-2 text-rose-700 border border-rose-100">
                สาเหตุที่ปฏิเสธ: {slip.rejection_reason}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {viewingSlip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-6 backdrop-blur-xs"
          onClick={() => setViewingSlip(null)}
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
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-slate-800">
                    หลักฐานการชำระเงิน {money(Number(viewingSlip.amount))}
                  </p>
                  <StatusBadge status={viewingSlip.status} />
                </div>
                <p className="text-xs text-slate-500">
                  แจ้งโอนเมื่อ {thaiDate(viewingSlip.paid_at)} · กด ESC เพื่อปิด
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/payment-slips/${viewingSlip.id}?download`}
                  className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <Download size={13} />
                  <span>ดาวน์โหลด</span>
                </a>
                <a
                  href={`/api/payment-slips/${viewingSlip.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                >
                  <ExternalLink size={13} />
                  <span>เปิดแท็บใหม่</span>
                </a>
                {viewingSlip.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingSlip;
                      setViewingSlip(null);
                      setCancelError("");
                      setSlipToCancel(target);
                    }}
                    className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>ยกเลิกสลิปนี้</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingSlip(null)}
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
                src={`/api/payment-slips/${viewingSlip.id}`}
                alt="สลิปโอนเงิน"
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete / Cancel Confirmation Modal */}
      {slipToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          onClick={() => !canceling && setSlipToCancel(null)}
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
                <span className="font-semibold text-slate-500">ยอดแจ้งชำระ:</span> {money(Number(slipToCancel.amount))}
              </p>
              <p>
                <span className="font-semibold text-slate-500">วันที่โอน:</span> {thaiDate(slipToCancel.paid_at)}
              </p>
            </div>

            {cancelError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle size={15} className="shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                disabled={canceling}
                onClick={() => setSlipToCancel(null)}
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
