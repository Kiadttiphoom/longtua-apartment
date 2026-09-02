"use client";

import { useMemo, useState } from "react";
import { Banknote, CreditCard, FileText, LayoutGrid, List, Printer, Receipt } from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  SelectField,
  StatusBadge,
} from "@/components/portal/PortalUI";
import type { PageContentProps } from "../types";

export function PaymentsPage({
  isLocked,
  onToast,
  meterRooms,
  activeProperty,
}: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("all");
  const [showPayModal, setShowPayModal] = useState(false);

  const initialPayments = useMemo(() => {
    return [
      {
        id: "REC-2568-08101",
        invoiceId: "INV-2568-08101",
        room: "101",
        tenant: "สมมุต ศรีสระเกษ",
        amount: 2930,
        paidAt: "1 ส.ค. 2568",
        method: "transfer",
        status: "confirmed" as const,
      },
    ];
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return initialPayments.filter((item) => {
      const matchesSearch =
        !needle ||
        `${item.id} ${item.invoiceId} ${item.room} ${item.tenant}`.toLowerCase().includes(needle);
      const matchesMethod = method === "all" || item.method === method;
      return matchesSearch && matchesMethod;
    });
  }, [initialPayments, query, method]);

  const confirmedSum = initialPayments
    .filter((p) => p.status === "confirmed")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeader
        actionLabel={!isLocked ? "รับชำระเงิน" : undefined}
        description="บันทึกยอดรับเงินจริงและตัดยอดคงเหลือของใบแจ้งหนี้"
        onAction={() => setShowPayModal(true)}
        title="รับชำระ"
      />

      <section className="mb-6 p-4 lg:p-5 flex flex-wrap items-center gap-8 lg:gap-12 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-emerald-600 tracking-tight">
            ฿{confirmedSum.toLocaleString("th-TH")}.00
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">รับชำระยืนยันแล้ว</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-slate-800 tracking-tight">
            {initialPayments.length.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">รายการทั้งหมด</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-amber-600 tracking-tight">1</strong>
          <span className="text-xs text-slate-500 mt-0.5">ใบแจ้งหนี้รอชำระ</span>
        </div>
      </section>

      <CollectionToolbar
        actions={
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
            <button
              aria-label="มุมมองตาราง"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("table")}
              type="button"
            >
              <List size={15} />
              <span>ตาราง</span>
            </button>
            <button
              aria-label="มุมมองการ์ด"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              <LayoutGrid size={15} />
              <span>การ์ด</span>
            </button>
          </div>
        }
        description={`พบ ${filtered.length.toLocaleString("th-TH")} รายการ`}
        filter={{
          label: "กรองช่องทางชำระ",
          value: method,
          onChange: setMethod,
          options: [
            { value: "all", label: "ทุกช่องทาง" },
            { value: "transfer", label: "โอนธนาคาร" },
            { value: "promptpay", label: "พร้อมเพย์" },
            { value: "cash", label: "เงินสด" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขที่ใบเสร็จ ใบแจ้งหนี้ หรือผู้เช่า"
        query={query}
        title="ประวัติการรับชำระ"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full mb-6">
            <DataTable
              headers={[
                "เลขที่ใบเสร็จ / วันที่",
                "อ้างอิงบิล / ห้อง",
                "ผู้ชำระ",
                "ยอดชำระ",
                "ช่องทาง",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => [
                <div className="flex flex-col text-xs min-w-0" key="rec">
                  <strong className="text-slate-800 font-bold truncate">{item.id}</strong>
                  <small className="text-slate-400 mt-0.5">{item.paidAt}</small>
                </div>,
                <div className="flex items-center gap-2" key="ref">
                  <span className="inline-flex items-center justify-center min-w-8 h-6 px-1.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
                    {item.room}
                  </span>
                  <span className="text-slate-600 text-xs font-mono">{item.invoiceId}</span>
                </div>,
                <strong className="text-slate-800 text-xs font-semibold" key="payer">{item.tenant}</strong>,
                <strong className="font-mono font-bold text-emerald-600 text-xs" key="amt">
                  ฿{item.amount.toLocaleString("th-TH")}.00
                </strong>,
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200" key="method">
                  <CreditCard size={12} />
                  โอนเงิน
                </span>,
                <StatusBadge key="status" status="paid" />,
                <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                  <button
                    className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs"
                    onClick={() => onToast(`เปิดดูใบเสร็จ ${item.id}`)}
                    title="ดูใบเสร็จ"
                    type="button"
                  >
                    <Receipt size={14} />
                    <span>ดูใบเสร็จ</span>
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-2xs shrink-0"
                    onClick={() => {
                      onToast(`พิมพ์ใบเสร็จ ${item.id}`);
                      setTimeout(() => window.print(), 150);
                    }}
                    title="พิมพ์ใบเสร็จ"
                    type="button"
                  >
                    <Printer size={14} />
                  </button>
                </div>,
              ])}
            />
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {filtered.map((item) => (
              <article
                className="p-5 flex flex-col gap-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all"
                key={item.id}
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Receipt aria-hidden="true" size={20} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-slate-800 truncate">{item.id}</h2>
                      <small className="text-[11px] text-slate-400 block truncate">
                        ชำระเมื่อ {item.paidAt}
                      </small>
                    </div>
                  </div>
                  <StatusBadge status="paid" />
                </header>

                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">อ้างอิงใบแจ้งหนี้</span>
                    <strong className="text-slate-800 font-bold block mt-0.5">{item.invoiceId} (ห้อง {item.room})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">ยอดรับชำระ</span>
                    <strong className="text-emerald-600 font-bold block mt-0.5">฿{item.amount.toLocaleString("th-TH")}.00</strong>
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  ผู้ชำระ: <strong className="text-slate-800">{item.tenant}</strong>
                </div>

                <footer className="mt-auto pt-3.5 border-t border-slate-100 flex items-center gap-2">
                  <button
                    className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all shadow-2xs cursor-pointer"
                    onClick={() => onToast(`เปิดดูใบเสร็จ ${item.id}`)}
                    type="button"
                  >
                    <Receipt size={15} />
                    <span>ดูใบเสร็จ</span>
                  </button>
                  <button
                    className="h-9 px-3 rounded-xl flex items-center justify-center gap-1 text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                    onClick={() => {
                      onToast(`พิมพ์ใบเสร็จ ${item.id}`);
                      setTimeout(() => window.print(), 150);
                    }}
                    type="button"
                  >
                    <Printer size={15} />
                    <span>พิมพ์</span>
                  </button>
                </footer>
              </article>
            ))}
          </section>
        )
      ) : null}

      {showPayModal ? (
        <Modal
          description="เลือกใบแจ้งหนี้และบันทึกยอดเงินที่ได้รับจริงเพื่อตัดยอดคงเหลือ"
          onClose={() => setShowPayModal(false)}
          title="บันทึกรับชำระเงิน"
        >
          <div className="p-6 flex flex-col gap-4 text-left">
            <SelectField
              clear={() => {}}
              label="เลือกใบแจ้งหนี้ที่ค้างชำระ"
              name="invoice_id"
              options={[{ value: "INV-2568-08101", label: "INV-2568-08101 (ห้อง 101 - สมมุต ศรีสระเกษ) ยอด ฿2,930.00" }]}
              value="INV-2568-08101"
            />
            <Field
              clear={() => {}}
              defaultValue="2930.00"
              label="จำนวนเงินที่รับชำระ (บาท)"
              name="amount"
              required
              step="0.01"
              type="number"
            />
            <SelectField
              clear={() => {}}
              label="ช่องทางการชำระ"
              name="method"
              options={[
                { value: "transfer", label: "โอนเงินผ่านธนาคาร" },
                { value: "promptpay", label: "สแกน QR PromptPay" },
                { value: "cash", label: "เงินสด" },
              ]}
              value="transfer"
            />
            <footer className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer"
                onClick={() => setShowPayModal(false)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 cursor-pointer"
                onClick={() => {
                  setShowPayModal(false);
                  onToast("บันทึกรับชำระเงินเรียบร้อยแล้ว");
                }}
                type="button"
              >
                บันทึกรับชำระ
              </button>
            </footer>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
