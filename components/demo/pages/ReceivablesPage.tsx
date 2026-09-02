"use client";

import { useMemo, useState } from "react";
import { Download, LayoutGrid, List, MessageCircle } from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  PageHeader,
  StatusBadge,
} from "@/components/portal/PortalUI";
import type { PageContentProps } from "../types";
import { downloadCsv } from "../utils";

export function ReceivablesPage({ isLocked, onToast }: PageContentProps) {
  const initialRows = [
    ["102 · อารยา พรดี", "INV-2568-08102", "฿5,050.00", "0 วัน", "รอติดตาม", "overdue", "089-876-5432"],
    ["301 · ปิยะ สุขสวัสดิ์", "INV-2568-08301", "฿6,050.00", "0 วัน", "ส่ง LINE แล้ว", "overdue", "086-554-3321"],
  ];
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [query, setQuery] = useState("");
  const [urgency, setUrgency] = useState("all");

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return initialRows.filter(
      (r) =>
        (urgency === "all" || r[5] === urgency) &&
        (!needle ||
          r[0].toLowerCase().includes(needle) ||
          r[1].toLowerCase().includes(needle))
    );
  }, [initialRows, query, urgency]);

  return (
    <>
      <PageHeader
        description="ติดตามใบแจ้งหนี้ที่ยังมียอดคงเหลือและใกล้ครบกำหนดชำระ"
        title="ยอดค้างชำระ"
      />

      <section className="mb-6 p-4 lg:p-5 flex flex-wrap items-center gap-8 lg:gap-12 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-slate-800 tracking-tight">
            {initialRows.length.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">เอกสารค้างชำระ</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-rose-600 tracking-tight">
            ฿11,100.00
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">ยอดค้างรวม</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-rose-600 tracking-tight">
            {initialRows.length.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">เกินกำหนดชำระ</span>
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
        description={`พบ ${filteredRows.length.toLocaleString("th-TH")} เอกสาร`}
        filter={{
          label: "กรองกำหนดชำระ",
          value: urgency,
          onChange: setUrgency,
          options: [
            { value: "all", label: "ทั้งหมด" },
            { value: "overdue", label: "เกินกำหนด" },
            { value: "upcoming", label: "ยังไม่ถึงกำหนด" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขที่เอกสาร หรือห้องพัก"
        query={query}
        title="ค้นหาและกรอง"
      />

      {viewMode === "table" ? (
        <div className="w-full">
          <DataTable
            emptyDescription="ไม่พบยอดค้างชำระที่ค้นหา"
            emptyTitle="ไม่พบรายการค้างชำระ"
            headers={["เลขที่เอกสาร / ห้อง", "ยอดค้างชำระ", "ค้างมาแล้ว", "สถานะการติดตาม", "สถานะกำหนด", "การจัดการ"]}
            rows={filteredRows.map((row) => [
              <div className="flex items-center gap-2.5" key="doc">
                <span className="inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                  {row[0].split(" · ")[0]}
                </span>
                <div className="flex flex-col text-xs min-w-0">
                  <strong className="text-slate-800 font-bold truncate">{row[1]}</strong>
                  <small className="text-slate-400 mt-0.5">{row[0]}</small>
                </div>
              </div>,
              <strong className="font-mono font-bold text-rose-600 text-xs" key="amt">
                {row[2]}
              </strong>,
              <span className="text-slate-600 text-xs" key="days">
                {row[3]}
              </span>,
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200" key="track">
                {row[4]}
              </span>,
              <StatusBadge key="status" status="overdue" />,
              <button
                key="action"
                className="h-8 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                onClick={() => onToast(`ส่งข้อความทวงถามไปยัง ${row[0]} ทาง LINE แล้ว`)}
                type="button"
              >
                <MessageCircle size={14} />
                <span>ทวงถาม LINE</span>
              </button>,
            ])}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {filteredRows.map((row) => (
            <article
              key={row[1]}
              className="p-5 rounded-2xl bg-white border border-rose-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-[11px] font-bold text-slate-400 block">{row[1]}</span>
                  <strong className="text-base font-bold text-slate-800 mt-1 block">{row[0]}</strong>
                </div>
                <StatusBadge status="overdue" />
              </div>

              <div className="space-y-1.5 py-3 border-t border-b border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">ยอดค้างชำระ:</span>
                  <strong className="font-mono text-rose-600 font-bold">{row[2]}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">สถานะติดตาม:</span>
                  <span className="text-amber-700 font-medium">{row[4]}</span>
                </div>
              </div>

              <button
                className="w-full h-8 px-3 rounded-xl text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                onClick={() => onToast(`ส่งข้อความทวงถามไปยัง ${row[0]} ทาง LINE แล้ว`)}
                type="button"
              >
                <MessageCircle size={14} />
                <span>ทวงถาม LINE</span>
              </button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
