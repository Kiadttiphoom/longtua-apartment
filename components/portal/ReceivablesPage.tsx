"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  Clock3,
  CreditCard,
  LayoutGrid,
  List,
  ReceiptText,
  ShieldAlert,
} from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import { DataTable, EmptyState, PageHeader, StatusBadge } from "@/components/portal/PortalUI";
import type { Invoice, Room } from "@/components/portal/types";
import { money, thaiDate } from "@/lib/format";

export function ReceivablesPage({ invoices, rooms }: { invoices: Invoice[]; rooms: Room[] }) {
  const [query, setQuery] = useState("");
  const [urgency, setUrgency] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const roomMap = useMemo(() => new Map(rooms.map((item) => [item.id, item.room_number])), [rooms]);
  const outstanding = useMemo(
    () => invoices.filter((item) => Number(item.balance_due) > 0 && item.status !== "void"),
    [invoices]
  );
  const today = new Date().toISOString().slice(0, 10);

  const overdueInvoices = useMemo(() => outstanding.filter((item) => item.due_at < today), [outstanding, today]);
  const upcomingInvoices = useMemo(() => outstanding.filter((item) => item.due_at >= today), [outstanding, today]);

  const totalOutstandingBalance = useMemo(
    () => outstanding.reduce((sum, item) => sum + Number(item.balance_due), 0),
    [outstanding]
  );
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th-TH");
    return outstanding.filter((item) => {
      const overdue = item.due_at < today;
      const matchesUrgency = urgency === "all" || (urgency === "overdue" ? overdue : !overdue);
      const matchesSearch =
        !keyword ||
        [item.invoice_number, roomMap.get(item.room_id), item.note].some((value) =>
          value?.toLocaleLowerCase("th-TH").includes(keyword)
        );

      return matchesUrgency && matchesSearch;
    });
  }, [outstanding, query, roomMap, today, urgency]);

  return (
    <div className="portal-refined-page space-y-8">
      <PageHeader
        description="ติดตามใบแจ้งหนี้ที่ยังมียอดคงเหลือและเกินกำหนดชำระแบบเรียลไทม์"
        title="ยอดค้างชำระ"
      />

      {/* 4-Metric Hero Stat Cards */}
      <section aria-label="ภาพรวมยอดค้างชำระ" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Outstanding Documents */}
        <button
          aria-pressed={urgency === "all"}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/20 ${
            urgency === "all"
              ? "bg-white border-rose-500 shadow-md ring-2 ring-rose-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setUrgency("all")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/25 flex items-center justify-center shrink-0">
              <ReceiptText size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">เอกสารค้างชำระ</span>
              <strong className="text-2xl font-black text-rose-800 tracking-tight tabular-nums mt-0.5 block">
                {outstanding.length.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 2: Total Outstanding Balance */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-red-600 to-rose-700 text-white shadow-md shadow-rose-500/25 flex items-center justify-center shrink-0">
              <CalendarClock size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ยอดค้างรวมทั้งหมด</span>
              <strong className="text-2xl font-black text-rose-900 tracking-tight tabular-nums mt-0.5 block">
                {money(totalOutstandingBalance)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Overdue Count & Balance */}
        <button
          aria-pressed={urgency === "overdue"}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 ${
            urgency === "overdue"
              ? "bg-white border-red-500 shadow-md ring-2 ring-red-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setUrgency("overdue")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-red-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-red-700 to-rose-800 text-white shadow-md shadow-red-500/25 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">เกินกำหนดชำระ</span>
              <strong className="text-2xl font-black text-red-700 tracking-tight tabular-nums mt-0.5 block">
                {overdueInvoices.length.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 4: Upcoming within due date */}
        <button
          aria-pressed={urgency === "upcoming"}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 ${
            urgency === "upcoming"
              ? "bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setUrgency("upcoming")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
              <Clock3 size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ยังไม่ถึงกำหนด</span>
              <strong className="text-2xl font-black text-amber-800 tracking-tight tabular-nums mt-0.5 block">
                {upcomingInvoices.length.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>
      </section>

      {/* Collection Toolbar */}
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
        description={`พบ ${filtered.length.toLocaleString("th-TH")} จาก ${outstanding.length.toLocaleString("th-TH")} รายการค้าง`}
        filter={{
          label: "กรองสถานะกำหนดชำระ",
          value: urgency,
          onChange: setUrgency,
          options: [
            { value: "all", label: "ทุกรายการค้างชำระ" },
            { value: "overdue", label: "เฉพาะที่เกินกำหนดชำระ" },
            { value: "upcoming", label: "ยังไม่ถึงกำหนดชำระ" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขที่ใบแจ้งหนี้ หรือห้องพัก..."
        query={query}
        title="รายการติดตามหนี้"
      />

      {/* Content: Table or Grid */}
      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full">
            <DataTable
              headers={[
                "เลขที่เอกสาร / ห้อง",
                "ยอดค้างชำระ",
                "ยอดเรียกเก็บรวม",
                "กำหนดชำระ",
                "สถานะกำหนด",
                "สถานะเอกสาร",
                "การดำเนินการ",
              ]}
              rows={filtered.map((item) => {
                const overdue = item.due_at < today;
                return [
                  // 1. เอกสาร / ห้อง
                  <div className="flex items-center gap-2.5" key="inv">
                    <span
                      className={`inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-lg text-xs font-black border ${
                        overdue
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-blue-50 text-blue-900 border-blue-200"
                      }`}
                    >
                      {roomMap.get(item.room_id) ?? "—"}
                    </span>
                    <div className="flex flex-col text-xs min-w-0">
                      <strong className="text-slate-900 font-mono font-bold block">{item.invoice_number}</strong>
                      <small className="text-slate-400">ห้อง {roomMap.get(item.room_id) ?? "—"}</small>
                    </div>
                  </div>,

                  // 2. ยอดค้างชำระ
                  <strong className="text-xs font-mono font-black text-rose-600" key="bal">
                    {money(Number(item.balance_due))}
                  </strong>,

                  // 3. ยอดเรียกเก็บรวม
                  <span className="text-xs font-mono text-slate-500" key="tot">
                    {money(Number(item.total))}
                  </span>,

                  // 4. กำหนดชำระ
                  <span className="text-xs text-slate-700 font-medium" key="due">
                    {thaiDate(item.due_at)}
                  </span>,

                  // 5. สถานะกำหนด
                  overdue ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg" key="status-urgency">
                      <AlertTriangle size={12} strokeWidth={2.2} /> เกินกำหนด
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg" key="status-urgency">
                      <Clock3 size={12} strokeWidth={2.2} /> ปกติ
                    </span>
                  ),

                  // 6. สถานะเอกสาร
                  <StatusBadge key="status" status={item.status} />,

                  // 7. การดำเนินการ
                  <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                    <Link
                      className="h-8.5 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-2xs cursor-pointer"
                      href="/payments"
                      title="ไปหน้าบันทึกรับเงิน"
                    >
                      <CreditCard size={13} strokeWidth={2.2} />
                      <span>รับชำระ</span>
                    </Link>
                  </div>,
                ];
              })}
            />
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => {
              const overdue = item.due_at < today;
              return (
                <article
                  className={`relative overflow-hidden p-6 rounded-2xl bg-white border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 ${
                    overdue ? "border-rose-200 hover:border-rose-300" : "border-slate-200/90 hover:border-blue-300"
                  }`}
                  key={item.id}
                >
                  {/* Ambient Glow */}
                  <div
                    className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500 ${
                      overdue
                        ? "bg-gradient-to-bl from-rose-500/15 via-red-500/5 to-transparent"
                        : "bg-gradient-to-bl from-amber-500/10 via-orange-500/5 to-transparent"
                    }`}
                  />

                  <div>
                    {/* Header */}
                    <header className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-12 h-12 rounded-xl text-white font-black text-sm shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                            overdue
                              ? "bg-gradient-to-tr from-rose-600 to-red-600 shadow-rose-500/25"
                              : "bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/25"
                          }`}
                        >
                          {roomMap.get(item.room_id) ?? "—"}
                        </span>
                        <div className="min-w-0">
                          <h2 className="text-sm font-bold text-slate-900 font-mono truncate group-hover:text-rose-600 transition-colors">
                            {item.invoice_number}
                          </h2>
                          <span className="text-xs text-slate-400 block truncate mt-0.5">
                            ห้อง {roomMap.get(item.room_id) ?? "—"}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </header>

                    {/* Numbers Grid */}
                    <dl className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                        <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ยอดเรียกเก็บ</dt>
                        <dd className="text-base font-mono font-bold text-slate-800 mt-1">{money(Number(item.total))}</dd>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                        <dt className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">ยอดค้างชำระ</dt>
                        <dd className="text-base font-mono font-black text-rose-600 mt-1">{money(Number(item.balance_due))}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Footer */}
                  <footer className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 block">ครบกำหนด</span>
                      <strong className="text-xs font-medium text-slate-800">{thaiDate(item.due_at)}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      {overdue ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl text-[11px] border border-rose-200 shrink-0">
                          <AlertTriangle size={12} strokeWidth={2.2} /> เกินกำหนด
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl text-[11px] border border-amber-200 shrink-0">
                          <Clock3 size={12} strokeWidth={2.2} /> ปกติ
                        </span>
                      )}
                      <Link
                        className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 shadow-2xs transition-all hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
                        href="/payments"
                      >
                        <CreditCard aria-hidden="true" size={13} strokeWidth={2.2} />
                        รับชำระ
                      </Link>
                    </div>
                  </footer>
                </article>
              );
            })}
          </section>
        )
      ) : (
        <EmptyState
          description="ยอดค้างชำระจะปรากฏเมื่อมีการออกใบแจ้งหนี้และยังไม่ได้รับชำระเต็มจำนวน"
          title="ไม่มียอดค้างชำระ"
        />
      )}
    </div>
  );
}
