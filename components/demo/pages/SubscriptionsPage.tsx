"use client";

import { CheckCircle2, Crown, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { PageHeader } from "@/components/portal/PortalUI";
import type { PageContentProps } from "../types";

export function SubscriptionsPage({ onToast }: PageContentProps) {
  const statusConfig = {
    active: {
      label: "เปิดใช้งานแล้ว (Active)",
      badgeBg: "bg-emerald-50 border-emerald-200",
      badgeText: "text-emerald-700",
      desc: "แพ็กเกจของท่านเปิดใช้งานสมบูรณ์และพร้อมใช้งานได้ต่อเนื่อง",
    },
    trialing: {
      label: "ช่วงทดลองใช้ฟรี (Trial)",
      badgeBg: "bg-blue-50 border-blue-200",
      badgeText: "text-blue-700",
      desc: "ท่านกำลังใช้งานระบบในช่วงทดลองใช้งาน 30 วัน พร้อมฟังก์ชันเต็มรูปแบบ",
    },
  };

  const current = statusConfig.active;

  const features = [
    "จัดการหอพักและห้องพักได้สูงสุด 100 ห้อง",
    "ออกสัญญาเช่าและใบเสร็จรับเงิน",
    "บันทึกมิเตอร์น้ำ-ไฟ คำนวณหน่วยอัตโนมัติ",
    "ออกใบแจ้งหนี้พร้อม QR PromptPay รับเงิน",
    "ระบบตรวจสอบสลิปโอนเงินของผู้เช่า",
    "พอร์ทัลผู้เช่า (Tenant Portal) ดูบิลและแจ้งชำระ",
    "รายงานสถิติรายรับและอัตราการเข้าพัก",
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        description="ตรวจสอบสถานะบริการ สิทธิ์การใช้งาน และแพ็กเกจของกิจการ"
        title="แพ็กเกจและบริการ"
      />

      <div className="space-y-6">
        {/* Main Status Hero Card (Matching Portal SubscriptionPage) */}
        <section className="p-6 lg:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Crown size={28} />
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Standard Package</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${current.badgeBg} ${current.badgeText}`}>
                  {current.label}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">{current.desc}</p>
              <p className="text-xs font-medium text-slate-700 pt-1">
                รอบถัดไปวันที่: <strong className="text-blue-600 font-bold">25 กันยายน 2569</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
            <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
            <span>ข้อมูลกิจการได้รับการปกป้องและแยกตามองค์กร</span>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-800 font-bold">
              <Sparkles className="text-blue-600" size={20} />
              <h3 className="text-base">ฟังก์ชันที่รวมในแพ็กเกจ</h3>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              {features.map((feat) => (
                <li className="flex items-center gap-2.5" key={feat}>
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0c1a30] text-white shadow-md flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs font-semibold text-blue-300">
                <Zap size={14} />
                <span>ติดต่อทีมงาน</span>
              </div>
              <h3 className="text-lg font-bold">ต้องการเพิ่มจำนวนห้อง หรือปรับแต่งระบบ?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                หากท่านต้องการปลดล็อกโควตาห้องพักมากกว่า 100 ห้อง หรือต้องการติดตั้ง LINE Notify แจ้งเตือนยอดชำระแบบอัตโนมัติ ติดต่อฝ่ายบริการลูกค้าได้ตลอด 24 ชั่วโมง
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span>โทร: 063-090-7500 · LINE: p.pond29</span>
              <span className="font-semibold text-white">official.longtua@gmail.com</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
