"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewPaymentSubmissionAction } from "@/app/(portal)/resource-actions";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { alertConfirm, alertSuccess, alertError } from "@/lib/sweetalert";

const REJECTION_PRESETS = [
  "ยอดเงินไม่ตรงตามบิล",
  "ภาพสลิปไม่ชัดเจน / อ่านไม่ออก",
  "โอนผิดบัญชีหอพัก",
];

export function PaymentReviewControls({
  submissionId,
  organizationId,
}: {
  submissionId: string;
  organizationId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [processing, setProcessing] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();
  const isBusy = pending || processing;

  async function review(decision: "approve" | "reject") {
    if (decision === "approve") {
      const confirm = await alertConfirm({
        title: "ยืนยันการอนุมัติการชำระเงิน?",
        text: "ระบบจะทำการตัดยอดบิลใบแจ้งหนี้ และออกใบเสร็จรับเงินทันที",
        icon: "question",
        confirmText: "ยืนยันอนุมัติ",
        cancelText: "ยกเลิก",
        confirmColor: "#059669",
      });
      if (!confirm.isConfirmed) return;
    }

    setProcessing(true);
    const data = new FormData();
    data.set("organizationId", organizationId);
    data.set("submissionId", submissionId);
    data.set("decision", decision);
    data.set("rejectionReason", reason);
    data.set("evidenceChecked", "true");

    startTransition(async () => {
      try {
        const result = await reviewPaymentSubmissionAction(data);
        if (result.ok) {
          setShowReject(false);
          await alertSuccess(
            decision === "approve" ? "อนุมัติการชำระเงินสำเร็จ!" : "ปฏิเสธสลิปเรียบร้อยแล้ว",
            result.message || (decision === "approve" ? "ยืนยันยอดและตัดใบแจ้งหนี้เรียบร้อยแล้ว" : "ส่งผลการตรวจสอบไปยังผู้เช่าแล้ว")
          );
          router.refresh();
        } else {
          await alertError("ไม่สามารถทำรายการได้", result.message);
        }
      } catch {
        await alertError("เกิดข้อผิดพลาด", "บันทึกผลตรวจสอบไม่สำเร็จ กรุณาลองอีกครั้ง");
      } finally {
        setProcessing(false);
      }
    });
  }

  return (
    <div className="space-y-2.5 border-t border-slate-100 pt-3">
      {/* Primary Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => review("approve")}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
          title="ยืนยันการรับชำระเงินและตัดยอดบิลใบแจ้งหนี้ทันที"
        >
          {isBusy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
          <span>{isBusy ? "กำลังบันทึก..." : "อนุมัติการชำระเงิน"}</span>
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => {
            if (isBusy) return;
            setShowReject(!showReject);
          }}
          className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer ${
            showReject
              ? "border-rose-300 bg-rose-100 text-rose-800"
              : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100/70"
          }`}
          title="ปฏิเสธสลิปเพื่อให้ผู้เช่าส่งหลักฐานใหม่"
        >
          <XCircle size={15} />
          <span>ปฏิเสธ</span>
        </button>
      </div>

      {/* Reject Drawer */}
      {showReject && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 space-y-2 animate-in fade-in duration-150">
          <label className="block text-[11px] font-bold text-rose-900">
            ระบุเหตุผลที่ไม่อนุมัติ (ผู้เช่าจะเห็นข้อความนี้):
          </label>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1">
            {REJECTION_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={isBusy}
                onClick={() => setReason(preset)}
                className="rounded-lg border border-rose-200/90 bg-white px-2 py-1 text-[10px] font-medium text-rose-800 hover:bg-rose-100 transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                {preset}
              </button>
            ))}
          </div>

          <input
            className="w-full rounded-lg border border-rose-300 bg-white p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="เหตุผลที่ไม่อนุมัติ"
            placeholder="ระบุเหตุผลที่ไม่อนุมัติ เช่น ยอดเงินไม่ตรงตามบิล..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isBusy}
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                setShowReject(false);
                setReason("");
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={isBusy || reason.trim().length < 3}
              onClick={() => review("reject")}
              className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
            >
              {isBusy ? "กำลังส่ง..." : "ยืนยันปฏิเสธ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
