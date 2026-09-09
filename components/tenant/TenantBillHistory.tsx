"use client";

import { useMemo, useState } from "react";
import { money, thaiDate } from "@/lib/format";
import { formatThaiBillingMonth, getRelatedPeriodMonth } from "@/lib/portal/meter-reading.mjs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TenantSlipHistoryList } from "@/components/tenant/TenantSlipHistoryList";
import { DateFilterControl, type DateFilterMode } from "@/components/portal/DateFilterControl";
import { Calendar, ReceiptText, XCircle } from "lucide-react";

export interface TenantBillHistoryData {
  invoices: Array<{
    id: string;
    lease_id?: string | null;
    property_id?: string;
    room_id?: string;
    invoice_number: string;
    issued_at: string;
    due_at: string;
    total: number | string;
    balance_due: number | string;
    status: string;
    note?: string | null;
    billing_cycles?: { period_month?: string } | { period_month?: string }[] | null;
  }>;
  allocations: Array<{
    rent_payment_id: string;
    rent_invoice_id: string;
    amount: number | string;
  }>;
  payments: Array<{
    id: string;
    receipt_number: string;
    paid_at: string;
    amount: number | string;
    method: string;
    reference: string | null;
    status: string;
  }>;
  submissions: Array<{
    id: string;
    invoice_id: string | null;
    amount: number | string;
    paid_at: string;
    method?: string;
    reference?: string | null;
    slip_path?: string | null;
    note?: string | null;
    status: string;
    rejection_reason?: string | null;
    created_at?: string;
  }>;
  invoiceItems: Array<{
    id: string;
    rent_invoice_id: string;
    item_type: string;
    description: string;
    quantity: number | string;
    unit_price: number | string;
    amount: number | string;
  }>;
}

export function TenantBillHistory({ data }: { data: TenantBillHistoryData }) {
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>("month");
  const [dateFilterValue, setDateFilterValue] = useState("");

  const invoices = useMemo(() => {
    return [...data.invoices].sort(
      (a, b) =>
        (getRelatedPeriodMonth(b.billing_cycles) || b.issued_at.slice(0, 7)).localeCompare(
          getRelatedPeriodMonth(a.billing_cycles) || a.issued_at.slice(0, 7)
        ) || b.issued_at.localeCompare(a.issued_at)
    );
  }, [data.invoices]);

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<string>([String(currentYear)]);
    for (const inv of invoices) {
      const period = getRelatedPeriodMonth(inv.billing_cycles);
      if (period) years.add(period.slice(0, 4));
      if (inv.issued_at) years.add(inv.issued_at.slice(0, 4));
      if (inv.due_at) years.add(inv.due_at.slice(0, 4));
    }
    return Array.from(years).sort().reverse();
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    if (!dateFilterValue) return invoices;
    return invoices.filter((invoice) => {
      const period =
        getRelatedPeriodMonth(invoice.billing_cycles) ||
        (invoice.issued_at ? invoice.issued_at.slice(0, 7) : "");
      const issued = invoice.issued_at || "";
      const due = invoice.due_at || "";

      if (dateFilterMode === "month") {
        return (
          period.slice(0, 7) === dateFilterValue ||
          issued.slice(0, 7) === dateFilterValue ||
          due.slice(0, 7) === dateFilterValue
        );
      }
      if (dateFilterMode === "year") {
        return (
          period.slice(0, 4) === dateFilterValue ||
          issued.slice(0, 4) === dateFilterValue ||
          due.slice(0, 4) === dateFilterValue
        );
      }
      if (dateFilterMode === "date") {
        return (
          issued.slice(0, 10) === dateFilterValue ||
          due.slice(0, 10) === dateFilterValue
        );
      }
      return true;
    });
  }, [invoices, dateFilterValue, dateFilterMode]);

  return (
    <section className="space-y-4">
      {/* Section Header with Responsive Month/Year Filter */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900">ประวัติบิลและการชำระย้อนหลัง</h2>
            {dateFilterValue ? (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                {filteredInvoices.length} รายการ
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            ตรวจสอบยอดเรียกเก็บ ยอดรับชำระ และหลักฐานของแต่ละรอบเดือน
          </p>
        </div>

        {/* Filter Month/Year: Fits neatly on desktop right side, stacks nicely on mobile */}
        <div className="w-full sm:w-auto shrink-0">
          <DateFilterControl
            mode={dateFilterMode}
            onModeChange={setDateFilterMode}
            value={dateFilterValue}
            onValueChange={setDateFilterValue}
            availableYears={availableYears}
            allowedModes={["month", "year"]}
            placeholderMonth="เลือกรอบเดือน (ด/ป)"
            className="w-full sm:w-auto justify-start sm:justify-end"
          />
        </div>
      </header>

      {/* When no invoices exist at all */}
      {!invoices.length && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-2">
            <ReceiptText size={24} />
          </div>
          <p className="text-sm font-bold text-slate-700">ยังไม่มีประวัติใบแจ้งหนี้</p>
          <p className="mt-1 text-xs text-slate-400">เมื่อมีบิลในระบบ ข้อมูลจะปรากฏที่นี่</p>
        </div>
      )}

      {/* When invoices exist but none match filter */}
      {invoices.length > 0 && !filteredInvoices.length && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-2">
            <Calendar size={24} />
          </div>
          <strong className="text-sm font-bold text-slate-800">
            ไม่พบบิลในรอบ{dateFilterMode === "month" ? "เดือน" : "ปี"}ที่เลือก
          </strong>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            คุณสามารถเปลี่ยนรอบเดือน/ปี หรือกดปุ่มด้านล่างเพื่อแสดงประวัติบิลทั้งหมด
          </p>
          <button
            type="button"
            onClick={() => setDateFilterValue("")}
            className="mt-3.5 rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 active:scale-98 transition cursor-pointer"
          >
            แสดงประวัติบิลทั้งหมด ({invoices.length})
          </button>
        </div>
      )}

      {/* Invoices List */}
      {filteredInvoices.map((invoice) => {
        const period =
          getRelatedPeriodMonth(invoice.billing_cycles) ||
          (invoice.issued_at ? invoice.issued_at.slice(0, 7) : "");
        const receipts = data.allocations
          .filter((a) => a.rent_invoice_id === invoice.id)
          .flatMap((a) => {
            const payment = data.payments.find(
              (p) => p.id === a.rent_payment_id && p.status === "confirmed"
            );
            return payment ? [{ ...payment, allocatedAmount: Number(a.amount) }] : [];
          });
        const paid = receipts.reduce((sum, receipt) => sum + receipt.allocatedAmount, 0);
        const slips = data.submissions
          .filter((s) => s.invoice_id === invoice.id)
          .map((s) => ({
            id: s.id,
            amount: s.amount,
            paid_at: s.paid_at,
            status: s.status,
            rejection_reason: s.rejection_reason,
          }));
        const lines = data.invoiceItems.filter((i) => i.rent_invoice_id === invoice.id);

        const isVoid = invoice.status === "void";

        return (
          <article
            key={invoice.id}
            className={`space-y-4 rounded-3xl border p-5 sm:p-6 shadow-xs transition-all ${
              isVoid ? "border-rose-200 bg-slate-50/70 opacity-90" : "border-slate-200/90 bg-white"
            }`}
          >
            {isVoid && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-900">
                <XCircle size={16} className="shrink-0 text-rose-600" />
                <span>
                  ใบแจ้งหนี้ฉบับนี้ถูกยกเลิกแล้ว (Void) — หากมีใบแจ้งหนี้ใหม่สำหรับรอบเดือนนี้ กรุณาดูรายการล่าสุด
                </span>
              </div>
            )}

            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className={`text-base font-bold ${isVoid ? "text-slate-600 line-through" : "text-slate-900"}`}>
                  {period ? formatThaiBillingMonth(period.slice(0, 7)) : "ไม่ระบุรอบเดือน"}
                </h3>
                <p className="mt-1 break-all text-xs font-medium text-slate-500">
                  {invoice.invoice_number} · ครบกำหนด {thaiDate(invoice.due_at)}
                </p>
              </div>
              <StatusBadge status={invoice.status} />
            </header>

            <dl className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50/80 p-3.5 text-xs">
              <div>
                <dt className="font-semibold text-slate-500">ยอดเรียกเก็บ</dt>
                <dd className={`mt-1 font-bold tabular-nums ${isVoid ? "line-through text-slate-400" : "text-slate-900"}`}>
                  {money(Number(invoice.total))}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">รับชำระแล้ว</dt>
                <dd className="mt-1 font-bold text-emerald-700 tabular-nums">
                  {money(paid)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">คงเหลือ</dt>
                <dd
                  className={`mt-1 font-bold tabular-nums ${
                    isVoid
                      ? "text-slate-400 line-through"
                      : Number(invoice.balance_due) > 0
                      ? "text-rose-600"
                      : "text-slate-800"
                  }`}
                >
                  {isVoid ? "฿0.00" : money(Number(invoice.balance_due))}
                </dd>
                {isVoid && <span className="text-[10px] font-bold text-rose-600 block mt-0.5">ยกเลิกแล้ว</span>}
              </div>
            </dl>

            <details className="group">
              <summary className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-700">
                ▸ รายละเอียดค่าใช้จ่ายและใบเสร็จ
              </summary>
              <div className="mt-3 space-y-2 rounded-2xl bg-slate-50/50 p-3.5 text-xs">
                {lines.map((line) => (
                  <div key={line.id} className="flex justify-between gap-3 text-slate-700">
                    <span>{line.description}</span>
                    <strong className="font-bold tabular-nums">{money(Number(line.amount))}</strong>
                  </div>
                ))}
                {receipts.map((receipt) => (
                  <p key={receipt.id} className="border-t border-slate-200/60 pt-2 font-medium text-emerald-800">
                    รับชำระ {thaiDate(receipt.paid_at)} · {money(receipt.allocatedAmount)} · ใบเสร็จ{" "}
                    {receipt.receipt_number}
                  </p>
                ))}
              </div>
            </details>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <h4 className="text-xs font-bold text-slate-800">สลิปที่แนบ ({slips.length})</h4>
              <TenantSlipHistoryList slips={slips} />
            </div>
          </article>
        );
      })}
    </section>
  );
}
