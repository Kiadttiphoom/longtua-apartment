"use client";

import { useState } from "react";
import { parsePaymentSettings, type PaymentSettingsInput } from "@/lib/constants/banks";
import { AlertCircle, Check, Copy, CreditCard, Landmark } from "lucide-react";
import { PromptPayQRCode } from "@/components/tenant/PromptPayQRCode";
import { formatPromptPayDisplay } from "@/lib/constants/promptpay";

export function TenantPaymentAccountCard({
  setting,
  amount,
}: {
  setting?: PaymentSettingsInput | null;
  amount?: number | null;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const paymentInfo = parsePaymentSettings(setting);

  async function handleCopy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text.replace(/-/g, ""));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  }

  // If landlord configured neither Bank nor PromptPay
  if (!paymentInfo.hasAny) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-800 shadow-xs sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertCircle size={20} />
        </div>
        <div>
          <strong className="block text-xs font-bold text-amber-950">-- ไม่พบบัญชีของเจ้าของ --</strong>
          <p className="mt-0.5 text-xs text-amber-800/90">
            เจ้าของหอยังไม่ได้กำหนดบัญชีธนาคารหรือพร้อมเพย์ กรุณาติดต่อเจ้าของหอพักโดยตรง
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/90 via-blue-50/50 to-indigo-50/40 p-4 shadow-xs sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Landmark size={18} />
          </div>
          <div>
            <strong className="block text-xs font-bold text-blue-950">ช่องทางชำระเงิน</strong>
            <span className="text-[11px] text-blue-800/80">
              โอนชำระยอดตามบัญชีด้านล่าง แล้วแนบสลิปในแบบฟอร์ม
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {paymentInfo.hasBank && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs border border-blue-100">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: paymentInfo.bank?.color || "#2563eb" }}
              />
              {paymentInfo.bank?.shortName || "โอนธนาคาร"}
            </span>
          )}
          {paymentInfo.hasPromptpay && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs border border-blue-100">
              <span className="h-2 w-2 rounded-full bg-[#003d6b]" />
              พร้อมเพย์
            </span>
          )}
        </div>
      </div>

      <div className={`mt-3.5 grid gap-4 ${paymentInfo.hasBank && paymentInfo.hasPromptpay ? "sm:grid-cols-2" : "grid-cols-1"}`}>
        {/* Bank Account Card */}
        {paymentInfo.hasBank && (
          <div className="flex items-start gap-3.5 rounded-xl border border-blue-100/80 bg-white/80 p-3.5 shadow-2xs">
            <div className="relative flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-xs">
              {paymentInfo.bank ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={paymentInfo.bank.image}
                  alt={paymentInfo.bank.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <CreditCard size={24} className="text-blue-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-blue-800/80 block truncate">
                {paymentInfo.bank?.name || "บัญชีธนาคาร"}
              </span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <strong className="text-lg font-bold font-mono tracking-wide text-blue-950">
                  {paymentInfo.bankAccountNo}
                </strong>
                <button
                  type="button"
                  onClick={() => handleCopy(paymentInfo.bankAccountNo, "bank")}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition cursor-pointer ${
                    copiedKey === "bank"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-blue-200 bg-white text-blue-700 hover:bg-blue-100/70"
                  }`}
                  title="คัดลอกเลขบัญชี"
                >
                  {copiedKey === "bank" ? (
                    <>
                      <Check size={11} className="text-emerald-600" />
                      <span>คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>คัดลอก</span>
                    </>
                  )}
                </button>
              </div>
              {paymentInfo.bankAccountName ? (
                <p className="mt-1 text-xs text-slate-600 truncate">
                  <span className="text-slate-400">ชื่อบัญชี:</span>{" "}
                  <span className="font-semibold text-slate-800">{paymentInfo.bankAccountName}</span>
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">กรุณาตรวจสอบชื่อบัญชีก่อนโอน</p>
              )}
            </div>
          </div>
        )}

        {/* PromptPay Card with QR Code */}
        {paymentInfo.hasPromptpay && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-blue-100/80 bg-white/80 p-3.5 shadow-2xs">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className="relative flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-white p-1 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/bank/พร้อมเพย์.png"
                  alt="พร้อมเพย์"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-blue-800/80 block">
                  พร้อมเพย์ (PromptPay)
                </span>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <strong className="text-lg font-bold font-mono tracking-wide text-blue-950">
                    {formatPromptPayDisplay(paymentInfo.promptpayId)}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentInfo.promptpayId, "promptpay")}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition cursor-pointer ${
                      copiedKey === "promptpay"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-blue-200 bg-white text-blue-700 hover:bg-blue-100/70"
                    }`}
                    title="คัดลอกเลขพร้อมเพย์"
                  >
                    {copiedKey === "promptpay" ? (
                      <>
                        <Check size={11} className="text-emerald-600" />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>คัดลอก</span>
                      </>
                    )}
                  </button>
                </div>
                {paymentInfo.promptpayName ? (
                  <p className="mt-1 text-xs text-slate-600 truncate">
                    <span className="text-slate-400">ชื่อบัญชี:</span>{" "}
                    <span className="font-semibold text-slate-800">{paymentInfo.promptpayName}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400">กรุณาตรวจสอบชื่อบัญชีก่อนโอน</p>
                )}
              </div>
            </div>

            {/* PromptPay QR Code with Logo */}
            <div className="flex shrink-0 justify-center border-t sm:border-t-0 sm:border-l border-blue-100/80 pt-3 sm:pt-0 sm:pl-3.5">
              <PromptPayQRCode
                promptpayId={paymentInfo.promptpayId}
                amount={amount}
                accountName={paymentInfo.promptpayName}
                size={130}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
