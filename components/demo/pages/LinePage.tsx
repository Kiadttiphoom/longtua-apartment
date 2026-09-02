"use client";

import { MessageCircle, Send } from "lucide-react";
import {
  DataTable,
  PageHeader,
} from "@/components/portal/PortalUI";
import type { PageContentProps } from "../types";
import { useDemoCollection } from "../utils";

export function LinePage({ role, lineEnabled, onLineChange, onToast, isLocked }: PageContentProps) {
  const initialCampaigns = [
    ["แจ้งเตือนบิลรอบ 1 ส.ค.", "ผู้เช่าทั้งหมด (6 ห้อง)", "1 ส.ค. 2568 09:00", "ส่งแล้ว 6/6"],
    ["แจ้งยอดค้างชำระ", "ห้องค้างชำระ (2 ห้อง)", "6 ส.ค. 2568 10:30", "ส่งแล้ว 2/2"],
    ["แจ้งปิดปรับปรุงมิเตอร์น้ำ", "ผู้เช่าทั้งหมด (6 ห้อง)", "15 ส.ค. 2568 14:00", "ส่งแล้ว 6/6"],
  ];
  const collection = useDemoCollection(initialCampaigns, onToast);

  if (!lineEnabled && role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-white border border-slate-200 shadow-xs text-center max-w-xl mx-auto my-12">
        <span className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 border border-purple-100">
          <MessageCircle size={32} />
        </span>
        <h2 className="text-xl font-bold text-slate-800">บริการเสริม LINE แจ้งเตือน</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
          ส่งใบแจ้งหนี้ แจ้งยอดค้างชำระ และประชาสัมพันธ์ข่าวสารผ่าน LINE Official Account โดยตรงถึงผู้เช่า
          เพิ่มความสะดวกรวดเร็วและลดโอกาสค้างชำระ
        </p>
        <div className="flex items-baseline gap-1 my-6">
          <strong className="text-3xl font-bold text-slate-800">฿299</strong>
          <span className="text-xs text-slate-400">/ เดือน</span>
        </div>
        <button
          className="h-11 px-8 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-md shadow-blue-500/10"
          onClick={() => {
            onLineChange(true);
            onToast("เปิดใช้งาน LINE แจ้งเตือนเรียบร้อยแล้ว");
          }}
          type="button"
        >
          เปิดใช้งานบริการเสริม
        </button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        actionLabel={!isLocked ? "ส่งข้อความใหม่" : undefined}
        description="บรอดแคสต์บิลและแจ้งเตือนผู้เช่าผ่าน LINE Official Account"
        onAction={() => onToast("เปิดหน้าต่างสร้างแคมเปญ LINE แล้ว")}
        title="LINE แจ้งเตือน"
      />

      <section className="mb-6 p-4 lg:p-5 flex items-center justify-between rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <MessageCircle size={20} />
          </span>
          <div>
            <strong className="text-xs font-bold text-slate-800 block">LINE Official Account เชื่อมต่ออยู่</strong>
            <small className="text-[11px] text-slate-400">@somchai-mansion (Verified)</small>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          พร้อมใช้งาน
        </span>
      </section>

      <div className="w-full">
        <DataTable
          headers={["แคมเปญ", "ผู้รับ", "วันที่ส่ง", "ผลลัพธ์"]}
          rows={collection.items.map((row, idx) => [
            <strong key="name" className="text-slate-800 font-bold text-xs">{row[0]}</strong>,
            <span key="rec" className="text-slate-600 text-xs">{row[1]}</span>,
            <span key="date" className="text-slate-500 text-xs">{row[2]}</span>,
            <span key="res" className="inline-flex items-center gap-1 font-semibold text-emerald-600 text-xs">
              <Send size={12} />
              {row[3]}
            </span>,
          ])}
        />
      </div>
    </>
  );
}
