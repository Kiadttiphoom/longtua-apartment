import { TenantBillHistory } from "@/components/tenant/TenantBillHistory";
import {
  Calendar,
  Droplets,
  FileCheck2,
  Home,
  Layers,
  ReceiptText,
  Zap,
} from "lucide-react";
import { TenantPaymentForm } from "@/components/tenant/TenantPaymentForm";
import { TenantPendingSlipCard } from "@/components/tenant/TenantPendingSlipCard";
import { TenantPaymentAccountCard } from "@/components/tenant/TenantPaymentAccountCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { money, thaiDate } from "@/lib/format";
import { getRelatedPeriodMonth } from "@/lib/portal/meter-reading.mjs";
import { loadTenantPortalData } from "@/lib/tenant/data";

export default async function TenantBillsPage() {
  const data = await loadTenantPortalData();
  const payable = data.invoices.filter(
    (item) => Number(item.balance_due) > 0 && !["paid", "void"].includes(item.status)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            การเงินและบิล
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            บิลและการชำระเงิน
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ดูรายละเอียดค่าใช้จ่าย แจกแจงยูนิตน้ำ-ไฟ โอนชำระ และส่งหลักฐานสลิป
          </p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          <ReceiptText size={24} />
        </span>
      </header>

      {/* Payable Invoices List */}
      {payable.map((invoice) => {
        const items = data.invoiceItems.filter((item) => item.rent_invoice_id === invoice.id);
        const pending = data.submissions.find(
          (item) => item.invoice_id === invoice.id && item.status === "pending"
        );
        const setting = data.settings.find((item) => item.property_id === invoice.property_id);

        return (
          <article
            key={invoice.id}
            className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs"
          >
            {/* Invoice Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-5 sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-base font-black font-mono text-slate-900">
                    {invoice.invoice_number}
                  </strong>
                  {getRelatedPeriodMonth(invoice.billing_cycles) && (
                    <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold">
                      รอบบิล {getRelatedPeriodMonth(invoice.billing_cycles)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <Calendar size={13} className="text-slate-400" />
                  <span>
                    ออกเมื่อ {thaiDate(invoice.issued_at)} · ครบกำหนด{" "}
                    <strong className="text-slate-700">{thaiDate(invoice.due_at)}</strong>
                  </span>
                </div>
              </div>
              <StatusBadge status={invoice.status} />
            </div>

            {/* Invoice Items Breakdown */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="divide-y divide-slate-100 rounded-2xl bg-slate-50/60 p-4 border border-slate-100">
                {items.map((item) => {
                  const isRent = item.item_type === "rent";
                  const isElectric = item.item_type === "electric";
                  const isWater = item.item_type === "water";

                  const Icon = isRent ? Home : isElectric ? Zap : isWater ? Droplets : Layers;
                  const iconColor = isRent
                    ? "bg-blue-100 text-blue-700"
                    : isElectric
                    ? "bg-amber-100 text-amber-700"
                    : isWater
                    ? "bg-cyan-100 text-cyan-700"
                    : "bg-slate-200 text-slate-700";

                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
                          <Icon size={17} strokeWidth={2.2} />
                        </span>
                        <div className="min-w-0">
                          <strong className="block text-xs sm:text-sm font-bold text-slate-800 truncate">
                            {isRent
                              ? "ค่าเช่าห้องพัก"
                              : isElectric
                              ? "ค่าไฟฟ้า"
                              : isWater
                              ? "ค่าน้ำประปา"
                              : item.description}
                          </strong>
                          <span className="block text-[11px] text-slate-500 truncate">
                            {item.quantity && Number(item.quantity) > 1
                              ? `${item.quantity} หน่วย × ฿${Number(item.unit_price).toFixed(2)} (${item.description})`
                              : item.description}
                          </span>
                        </div>
                      </div>
                      <b className="text-sm sm:text-base font-bold text-slate-900 tabular-nums shrink-0">
                        {money(Number(item.amount))}
                      </b>
                    </div>
                  );
                })}
              </div>

              {/* Total Balance Due Banner */}
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-50 via-blue-50/80 to-indigo-50 p-4 border border-blue-100">
                <div>
                  <span className="text-xs font-bold text-blue-700 block">ยอดค้างชำระสุทธิ</span>
                  <span className="text-[11px] text-blue-600">กรุณาชำระเต็มจำนวน</span>
                </div>
                <strong className="text-2xl sm:text-3xl font-black text-blue-700 tabular-nums">
                  {money(Number(invoice.balance_due))}
                </strong>
              </div>

              {/* Bank & PromptPay Card */}
              <div className="pt-2">
                <TenantPaymentAccountCard
                  setting={setting}
                  amount={Number(invoice.balance_due)}
                />
              </div>

              {/* Pending Slip status or Upload Form */}
              {pending ? (
                <div className="pt-2">
                  <TenantPendingSlipCard submission={pending} />
                </div>
              ) : (
                <TenantPaymentForm
                  invoice={{
                    id: invoice.id,
                    invoice_number: invoice.invoice_number,
                    balance_due: Number(invoice.balance_due),
                  }}
                  userId={data.context.userId}
                  setting={setting}
                />
              )}
            </div>
          </article>
        );
      })}

      {/* When no payable bills */}
      {!payable.length ? (
        <section className="flex flex-col items-center gap-3 rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/70 to-emerald-50/30 p-8 sm:p-10 text-center text-emerald-900 shadow-xs">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-inner">
            <FileCheck2 size={28} strokeWidth={2.2} />
          </span>
          <div className="space-y-1">
            <strong className="text-lg sm:text-xl font-bold block">ไม่มีบิลที่ต้องชำระในขณะนี้</strong>
            <p className="text-xs sm:text-sm text-emerald-700 max-w-md mx-auto">
              คุณชำระค่าใช้จ่ายครบถ้วนแล้ว เมื่อมีบิลรอบใหม่ระบบจะแสดงที่นี่โดยอัตโนมัติ
            </p>
          </div>
        </section>
      ) : null}

      {/* Bill History Accordion/List */}
        <TenantBillHistory
          data={{
            invoices: data.invoices,
            allocations: data.allocations,
            payments: data.payments,
            submissions: data.submissions,
            invoiceItems: data.invoiceItems,
          }}
        />
    </div>
  );
}
