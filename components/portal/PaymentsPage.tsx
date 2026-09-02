"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Eye,
  FileText,
  Hash,
  LayoutGrid,
  List,
  Printer,
  Receipt,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { recordPaymentAction, reviewPaymentSubmissionAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  EmptyState,
  Modal,
  PageHeader,
  PortalForm,
  StatusBadge,
} from "@/components/portal/PortalUI";
import { SelectControl } from "@/components/ui/SelectControl";
import { money, thaiBahtText, thaiDate } from "@/lib/format";
import type { Invoice, Payment, Property, Tenant } from "@/components/portal/types";
import { validatePayment } from "@/lib/portal/validation.mjs";

type PaymentSubmission = {
  id: string;
  tenant_id: string;
  invoice_id: string;
  amount: number;
  paid_at: string;
  method: string;
  reference: string | null;
  slip_path: string | null;
  note: string | null;
  status: string;
  created_at: string;
  slipUrl: string | null;
};

export function PaymentsPage({
  organizationId,
  payments,
  invoices,
  tenants,
  properties,
  submissions = [],
  canCreate,
}: {
  organizationId: string;
  payments: Payment[];
  invoices: Invoice[];
  tenants: Tenant[];
  properties: Property[];
  submissions?: PaymentSubmission[];
  canCreate: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [formInvoiceId, setFormInvoiceId] = useState("");
  const [formMethod, setFormMethod] = useState("transfer");
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("all");

  const propertyMap = useMemo(() => new Map(properties.map((item) => [item.id, item.name])), [properties]);
  const tenantMap = useMemo(() => new Map(tenants.map((item) => [item.id, item.full_name])), [tenants]);
  const invoiceMap = useMemo(() => new Map(invoices.map((item) => [item.id, item.invoice_number])), [invoices]);
  const openInvoices = invoices.filter((item) => Number(item.balance_due) > 0 && item.status !== "void");
  const selectedOpenInvoice = openInvoices.find((item) => item.id === formInvoiceId);
  const month = new Date().toISOString().slice(0, 7).replace("-", "");

  const totalVerifiedAmount = useMemo(
    () =>
      payments
        .filter((item) => item.status === "confirmed")
        .reduce((sum, item) => sum + Number(item.amount), 0),
    [payments]
  );
  const totalTransactionsCount = payments.length;
  const pendingSubmissionsCount = submissions.length;
  const openInvoicesCount = openInvoices.length;

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th-TH");
    return payments.filter((item) => {
      const matchesProperty = propertyFilter === "all" || item.property_id === propertyFilter;
      const matchesMethod = method === "all" || item.method === method;
      const matchesSearch =
        !keyword ||
        [item.receipt_number, propertyMap.get(item.property_id), item.reference].some((value) =>
          value?.toLocaleLowerCase("th-TH").includes(keyword)
        );

      return matchesProperty && matchesMethod && matchesSearch;
    });
  }, [method, payments, propertyFilter, propertyMap, query]);

  const viewingPropName = viewingPayment ? propertyMap.get(viewingPayment.property_id) || "หอพัก" : "หอพัก";

  const methodLabel = (m: string) => {
    switch (m) {
      case "cash": return "เงินสด";
      case "transfer": return "โอนธนาคาร";
      case "promptpay": return "พร้อมเพย์";
      case "card": return "บัตรเครดิต/เดบิต";
      default: return m;
    }
  };

  return (
    <div className="portal-refined-page space-y-8">
      <PageHeader
        actionLabel={canCreate ? "บันทึกรับชำระ" : undefined}
        description="บันทึกยอดรับเงินจริงและตัดยอดคงเหลือของใบแจ้งหนี้อัตโนมัติ"
        onAction={() => {
          setFormInvoiceId(openInvoices[0]?.id ?? "");
          setOpen(true);
        }}
        title="รับชำระเงิน"
      />

      <section aria-label="ภาพรวมการรับชำระ" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">รับชำระยืนยันแล้ว</span>
              <strong className="text-2xl font-black text-emerald-800 tracking-tight tabular-nums mt-0.5 block">
                {money(totalVerifiedAmount)}
              </strong>
            </div>
          </div>
        </div>

        <button
          aria-pressed={method === "all"}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${
            method === "all"
              ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setMethod("all")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0">
              <Receipt size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">รายการทั้งหมด</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {totalTransactionsCount.toLocaleString("th-TH")} รายการ
              </strong>
            </div>
          </div>
        </button>

        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
              <Clock3 size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">สลิปรอตรวจสอบ</span>
              <strong className="text-2xl font-black text-amber-800 tracking-tight tabular-nums mt-0.5 block">
                {pendingSubmissionsCount.toLocaleString("th-TH")} รายการ
              </strong>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/25 flex items-center justify-center shrink-0">
              <CreditCard size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ใบแจ้งหนี้รอชำระ</span>
              <strong className="text-2xl font-black text-rose-800 tracking-tight tabular-nums mt-0.5 block">
                {openInvoicesCount.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </div>
      </section>

      {properties.length > 1 ? (
        <section aria-label="เลือกหอพัก" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Building2 aria-hidden="true" className="text-blue-600" size={16} strokeWidth={2.2} />
              <span>เลือกหอพักเพื่อกรองรายการรับชำระ</span>
            </div>
            <small className="text-xs font-semibold text-slate-500">
              {properties.length.toLocaleString("th-TH")} หอพัก · {payments.length.toLocaleString("th-TH")} รายการ
            </small>
          </header>
          <div aria-label="รายชื่อหอพัก" className="flex gap-2.5 overflow-x-auto p-3" role="group">
            <button
              aria-pressed={propertyFilter === "all"}
              className={`min-w-[168px] rounded-xl border px-4 py-3 text-left text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${
                propertyFilter === "all"
                  ? "border-blue-500 bg-blue-50/70 text-blue-950 shadow-xs ring-2 ring-blue-500/15"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
              onClick={() => setPropertyFilter("all")}
              type="button"
            >
              <span className="flex items-center gap-2">
                <Building2 aria-hidden="true" size={15} />
                ทุกหอพัก
              </span>
              <span className="mt-1 block text-[11px] font-medium text-slate-500">{payments.length.toLocaleString("th-TH")} รายการในระบบ</span>
            </button>
            {properties.map((prop) => {
              const propPaymentCount = payments.filter((p) => p.property_id === prop.id).length;
              const isSelected = propertyFilter === prop.id;
              return (
                <button
                  aria-pressed={isSelected}
                  className={`min-w-[190px] rounded-xl border px-4 py-3 text-left text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/70 text-blue-950 shadow-xs ring-2 ring-blue-500/15"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                  key={prop.id}
                  onClick={() => setPropertyFilter(prop.id)}
                  type="button"
                >
                  <span className="block truncate">{prop.name}</span>
                  <span className="mt-1 block text-[11px] font-medium text-slate-500">{propPaymentCount.toLocaleString("th-TH")} รายการรับชำระ</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {submissions.length ? (
        <section className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-sm space-y-4">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Clock3 size={16} strokeWidth={2.2} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-amber-950">หลักฐานรอตรวจสอบ (สลิปโอนเงิน)</h2>
                <p className="text-xs text-amber-800/80">ตรวจยอดและชื่อบัญชีก่อนกดยืนยัน ระบบจะตัดยอดใบแจ้งหนี้ทันที</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-amber-200/80 text-amber-900 text-xs font-bold shrink-0">
              {submissions.length.toLocaleString("th-TH")} รายการ
            </span>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions.map((item) => (
              <article className="p-4 rounded-xl bg-white border border-amber-200 shadow-xs flex flex-col gap-3" key={item.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="text-xs font-bold text-slate-800 block truncate">{tenantMap.get(item.tenant_id) ?? "ผู้เช่า"}</strong>
                    <small className="text-[11px] text-slate-400 block truncate">
                      {invoiceMap.get(item.invoice_id) ?? "ใบแจ้งหนี้"} · โอนเมื่อ {thaiDate(item.paid_at)}
                    </small>
                  </div>
                  <strong className="text-sm font-bold text-emerald-600 shrink-0">{money(Number(item.amount))}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-lg bg-slate-50 text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block">ช่องทาง</span>
                    <span className="font-medium text-slate-800">{methodLabel(item.method)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">อ้างอิง</span>
                    <span className="font-medium text-slate-800 truncate block">{item.reference || "—"}</span>
                  </div>
                </div>
                {item.slipUrl ? (
                  <a
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    href={item.slipUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink size={13} /> ดูภาพสลิปโอนเงิน
                  </a>
                ) : null}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <form action={async (formData: FormData) => { await reviewPaymentSubmissionAction(formData); }}>
                    <input name="submissionId" type="hidden" value={item.id} />
                    <input name="decision" type="hidden" value="approved" />
                    <button
                      className="w-full h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-all"
                      type="submit"
                    >
                      <CheckCircle2 size={14} /> อนุมัติ
                    </button>
                  </form>
                  <form action={async (formData: FormData) => { await reviewPaymentSubmissionAction(formData); }}>
                    <input name="submissionId" type="hidden" value={item.id} />
                    <input name="decision" type="hidden" value="rejected" />
                    <button
                      className="w-full h-8.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-all"
                      type="submit"
                    >
                      <XCircle size={14} /> ไม่อนุมัติ
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <CollectionToolbar
        actions={
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
            <button
              aria-label="มุมมองตาราง"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("table")}
              type="button"
            >
              <List size={14} />
              <span>ตาราง</span>
            </button>
            <button
              aria-label="มุมมองการ์ด"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              <LayoutGrid size={14} />
              <span>การ์ด</span>
            </button>
          </div>
        }
        description={`แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${payments.length.toLocaleString("th-TH")} รายการ`}
        filter={{
          label: "กรองช่องทาง",
          value: method,
          onChange: setMethod,
          options: [
            { value: "all", label: "ทุกช่องทางชำระ" },
            { value: "transfer", label: "โอนผ่านธนาคาร" },
            { value: "promptpay", label: "พร้อมเพย์ (PromptPay)" },
            { value: "cash", label: "เงินสด" },
            { value: "card", label: "บัตรเครดิต/เดบิต" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขที่ใบเสร็จ, หอพัก หรือเลขอ้างอิง..."
        query={query}
        title="ประวัติการรับชำระเงิน"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full">
            <DataTable
              headers={[
                "เลขที่ใบเสร็จ / หอพัก",
                "วันที่ชำระ",
                "จำนวนเงิน",
                "ช่องทางชำระ",
                "เลขอ้างอิง",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => {
                const propName = propertyMap.get(item.property_id);
                return [
                  <div className="flex items-center gap-2.5" key="rec">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
                      <Receipt size={15} strokeWidth={2.2} />
                    </span>
                    <div className="flex flex-col text-xs min-w-0">
                      <strong className="text-slate-900 font-mono font-bold block">{item.receipt_number}</strong>
                      <small className="text-slate-400">{propName ?? "หอพัก"}</small>
                    </div>
                  </div>,
                  <span className="text-xs font-semibold text-slate-700" key="date">
                    {thaiDate(item.paid_at)}
                  </span>,
                  <strong className="text-xs font-mono font-bold text-emerald-600" key="amount">
                    {money(Number(item.amount))}
                  </strong>,
                  <span className="text-xs text-slate-600 font-medium" key="method">
                    {methodLabel(item.method)}
                  </span>,
                  <span className="text-xs font-mono text-slate-500 truncate max-w-xs block" key="ref">
                    {item.reference || "—"}
                  </span>,
                  <StatusBadge key="status" status={item.status} />,
                  <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                    <button
                      className="h-8.5 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs"
                      onClick={() => setViewingPayment(item)}
                      title="ดูใบเสร็จรับเงิน"
                      type="button"
                    >
                      <Eye size={14} strokeWidth={2.2} />
                      <span>ดูใบเสร็จ</span>
                    </button>
                    <button
                      className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs shrink-0"
                      onClick={() => {
                        setViewingPayment(item);
                        setTimeout(() => window.print(), 150);
                      }}
                      title="พิมพ์ใบเสร็จรับเงิน A4"
                      type="button"
                    >
                      <Printer size={14} strokeWidth={2.2} />
                    </button>
                  </div>,
                ];
              })}
            />
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => {
              const propName = propertyMap.get(item.property_id);
              return (
                <article
                  className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  key={item.id}
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                  <div>
                    <header className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-sm shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Receipt size={20} strokeWidth={2.2} />
                        </span>
                        <div className="min-w-0">
                          <h2 className="text-sm font-bold text-slate-900 font-mono truncate group-hover:text-emerald-600 transition-colors">
                            {item.receipt_number}
                          </h2>
                          <span className="text-xs text-slate-400 block truncate mt-0.5">
                            {propName ?? "หอพัก"} · {thaiDate(item.paid_at)}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </header>
                    <dl className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                        <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ยอดชำระจริง</dt>
                        <dd className="text-base font-mono font-black text-emerald-600 mt-1">{money(Number(item.amount))}</dd>
                        <span className="text-[10px] text-slate-400 block mt-0.5">ช่องทาง: {methodLabel(item.method)}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                        <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">เลขอ้างอิง</dt>
                        <dd className="text-xs font-mono font-bold text-slate-800 mt-1 truncate">{item.reference || "—"}</dd>
                        <span className="text-[10px] text-slate-400 block mt-0.5">ยืนยันแล้ว</span>
                      </div>
                    </dl>
                  </div>
                  <footer className="pt-4 border-t border-slate-100 flex items-center gap-2">
                    <button
                      className="flex-1 h-9.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all shadow-2xs cursor-pointer"
                      onClick={() => setViewingPayment(item)}
                      title="ดูใบเสร็จรับเงิน"
                      type="button"
                    >
                      <Eye size={15} strokeWidth={2.2} />
                      <span>ดูใบเสร็จ</span>
                    </button>
                    <button
                      className="h-9.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                      onClick={() => {
                        setViewingPayment(item);
                        setTimeout(() => window.print(), 150);
                      }}
                      title="พิมพ์ใบเสร็จ"
                      type="button"
                    >
                      <Printer size={15} strokeWidth={2.2} />
                      <span>พิมพ์</span>
                    </button>
                  </footer>
                </article>
              );
            })}
          </section>
        )
      ) : (
        <EmptyState
          description="บันทึกการรับชำระเงินเมื่อผู้เช่าโอนหรือชำระเงินสดเรียบร้อยแล้ว"
          title="ยังไม่มีรายการรับชำระเงิน"
        />
      )}

      {viewingPayment ? (
        <Modal
          className="contract-modal portal-refined-modal"
          headerActions={
            <button
              className="h-8.5 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs print:hidden"
              onClick={() => window.print()}
              type="button"
            >
              <Printer size={14} strokeWidth={2.2} />
              <span>พิมพ์ใบเสร็จ A4</span>
            </button>
          }
          maxWidth={800}
          onClose={() => setViewingPayment(null)}
          title={`ใบเสร็จรับเงิน ${viewingPayment.receipt_number}`}
        >
          <div className="p-6 sm:p-10 overflow-y-auto text-slate-800 text-xs sm:text-[13px] leading-relaxed space-y-5 font-sans" id="print-area">
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-xl font-black text-slate-900">{viewingPropName}</h1>
                <p className="text-xs text-slate-500 mt-1">ใบเสร็จรับเงินค่าเช่าและบริการ</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 font-extrabold text-sm rounded-lg border border-emerald-100">
                  ใบเสร็จรับเงิน / RECEIPT
                </span>
                <p className="text-xs font-mono font-bold text-slate-900 mt-2">เลขที่: {viewingPayment.receipt_number}</p>
                <p className="text-[11px] text-slate-400">วันที่รับเงิน: {thaiDate(viewingPayment.paid_at)}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span>ช่องทางการชำระเงิน:</span>
                <strong className="text-slate-900 font-bold">{methodLabel(viewingPayment.method)}</strong>
              </div>
              <div className="flex justify-between">
                <span>เลขอ้างอิง / สลิปโอน:</span>
                <strong className="text-slate-900 font-mono font-bold">{viewingPayment.reference || "—"}</strong>
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 p-3 font-bold text-slate-800 flex justify-between border-b border-slate-200">
                <span>รายการรับชำระ</span>
                <span>จำนวนเงิน (บาท)</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between py-1">
                  <span>ชำระยอดตามใบแจ้งหนี้</span>
                  <strong className="font-mono text-slate-900">{money(Number(viewingPayment.amount))}</strong>
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                <span>รวมทั้งสิ้น ({thaiBahtText(Number(viewingPayment.amount))})</span>
                <span className="text-emerald-600 font-mono font-black text-base">{money(Number(viewingPayment.amount))}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
              <div className="space-y-8">
                <div className="border-b border-slate-300 w-48 mx-auto" />
                <p>ลงชื่อ ........................................................... ผู้รับเงิน</p>
              </div>
              <div className="space-y-8">
                <div className="border-b border-slate-300 w-48 mx-auto" />
                <p>ลงชื่อ ........................................................... ผู้ชำระเงิน</p>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {open ? (
        <Modal
          className="portal-refined-modal"
          description="เลือกใบแจ้งหนี้ที่ต้องการตัดยอด และระบุจำนวนเงินที่ได้รับจริง"
          maxWidth={600}
          onClose={() => setOpen(false)}
          title="บันทึกการรับชำระเงิน"
        >
          <PortalForm
            action={recordPaymentAction}
            onCancel={() => setOpen(false)}
            onSuccess={() => setOpen(false)}
            organizationId={organizationId}
            submitLabel="บันทึกรับเงินและตัดหนี้"
            submitDisabled={!openInvoices.length}
            submitDisabledReason={!openInvoices.length ? "ยังไม่มีใบแจ้งหนี้ที่มียอดค้างชำระ" : undefined}
            validate={validatePayment}
          >
            {(errors, clear) => (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles size={13} strokeWidth={2.2} />
                  </span>
                  <div className="leading-relaxed">
                    <strong className="font-bold block text-blue-950">บันทึกรับชำระเงินและออกใบเสร็จ</strong>
                    <span className="text-[11px] text-blue-800/80">
                      ระบบจะตัดยอดคงค้างในใบแจ้งหนี้ให้อัตโนมัติทันทีที่บันทึกสำเร็จ
                    </span>
                  </div>
                </div>
                <input name="invoiceId" type="hidden" value={formInvoiceId} />
                <input name="method" type="hidden" value={formMethod} />
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText size={14} className="text-slate-500" />
                      <span>เลือกใบแจ้งหนี้ที่ค้างชำระ <span className="text-rose-500">*</span></span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">เฉพาะบิลที่ค้าง</span>
                  </label>
                  <SelectControl
                    ariaLabel="ใบแจ้งหนี้"
                    onValueChange={(val) => {
                      setFormInvoiceId(val);
                      clear("invoiceId");
                    }}
                    options={openInvoices.map((item) => ({
                      value: item.id,
                      label: `${item.invoice_number} — ยอดค้าง ${money(Number(item.balance_due))}`,
                    }))}
                    placeholder="เลือกใบแจ้งหนี้"
                    value={formInvoiceId}
                  />
                  {errors.invoiceId ? (
                    <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.invoiceId}</p>
                  ) : null}
                  {selectedOpenInvoice ? (
                    <div aria-live="polite" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-3">
                      <div>
                        <span className="block text-[11px] font-medium text-emerald-700">ยอดคงเหลือของบิลที่เลือก</span>
                        <strong className="mt-0.5 block font-mono text-sm font-black text-emerald-900">
                          {money(Number(selectedOpenInvoice.balance_due))}
                        </strong>
                      </div>
                      <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-800 shadow-xs">
                        {propertyMap.get(selectedOpenInvoice.property_id) ?? "หอพัก"}
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-500" />
                        <span>วันที่รับเงินจริง <span className="text-rose-500">*</span></span>
                      </span>
                    </label>
                    <input
                      aria-invalid={Boolean(errors.paidAt)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      name="paidAt"
                      onChange={() => clear("paidAt")}
                      type="date"
                    />
                    {errors.paidAt ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.paidAt}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Banknote size={14} className="text-slate-500" />
                        <span>จำนวนเงินที่รับจริง (บาท) <span className="text-rose-500">*</span></span>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Banknote size={16} strokeWidth={2.2} />
                      </span>
                      <input
                        aria-invalid={Boolean(errors.amount)}
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                        min={0.01}
                        name="amount"
                        onChange={() => clear("amount")}
                        placeholder="เช่น 3500.00"
                        step="0.01"
                        type="number"
                      />
                    </div>
                    {errors.amount ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.amount}</p>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CreditCard size={14} className="text-slate-500" />
                        <span>ช่องทางการชำระ <span className="text-rose-500">*</span></span>
                      </span>
                    </label>
                    <SelectControl
                      ariaLabel="วิธีชำระเงิน"
                      onValueChange={(val) => {
                        setFormMethod(val);
                        clear("method");
                      }}
                      options={[
                        { value: "transfer", label: "โอนผ่านธนาคาร" },
                        { value: "promptpay", label: "พร้อมเพย์" },
                        { value: "cash", label: "เงินสด" },
                        { value: "card", label: "บัตรเครดิต/เดบิต" },
                      ]}
                      value={formMethod}
                    />
                    {errors.method ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.method}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Hash size={14} className="text-slate-500" />
                        <span>เลขอ้างอิง / สลิปโอน</span>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Hash size={16} strokeWidth={2.2} />
                      </span>
                      <input
                        aria-invalid={Boolean(errors.reference)}
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all placeholder:text-slate-400"
                        name="reference"
                        onChange={() => clear("reference")}
                        placeholder="เช่น 202603019842"
                      />
                    </div>
                    {errors.reference ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.reference}</p>
                    ) : null}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Receipt size={14} className="text-slate-500" />
                      <span>เลขที่ใบเสร็จรับเงิน <span className="text-rose-500">*</span></span>
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Receipt size={16} strokeWidth={2.2} />
                    </span>
                    <input
                      aria-invalid={Boolean(errors.receiptNumber)}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all placeholder:text-slate-400"
                      defaultValue={`REC-${month}-${String(payments.length + 1).padStart(3, "0")}`}
                      name="receiptNumber"
                      onChange={() => clear("receiptNumber")}
                      placeholder="ระบุเลขที่ใบเสร็จ"
                    />
                  </div>
                  {errors.receiptNumber ? (
                    <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.receiptNumber}</p>
                  ) : null}
                </div>
              </div>
            )}
          </PortalForm>
        </Modal>
      ) : null}
    </div>
  );
}
