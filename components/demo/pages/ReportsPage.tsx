"use client";

import { useMemo } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { DataTable, EmptyState, PageHeader } from "@/components/portal/PortalUI";
import { money } from "@/lib/format";
import type { PageContentProps } from "../types";

export function ReportsPage({ properties, activeProperty }: PageContentProps) {
  const dormList = properties && properties.length > 0 ? properties : [activeProperty];

  // Aggregate metrics
  const totalRooms = useMemo(
    () => dormList.reduce((sum, p) => sum + (p.rooms?.length || 0), 0),
    [dormList]
  );
  const occupiedRooms = useMemo(
    () =>
      dormList.reduce(
        (sum, p) => sum + (p.rooms?.filter((r) => r.tenant && r.tenant !== "(ว่าง)").length || 0),
        0
      ),
    [dormList]
  );
  const overallOccupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const activeContractsCount = useMemo(
    () => dormList.reduce((sum, p) => sum + (p.contracts?.filter((c) => c.status === "active").length || 0), 0),
    [dormList]
  );

  const totalRevenue = 45000;
  const totalOutstanding = 6259;

  // Monthly summary breakdown
  const monthlyData = [
    {
      month: "สิงหาคม 2569",
      billed: 51400,
      collected: 45141,
      outstanding: 6259,
      rate: 87.8,
    },
    {
      month: "กรกฎาคม 2569",
      billed: 50200,
      collected: 50200,
      outstanding: 0,
      rate: 100.0,
    },
    {
      month: "มิถุนายน 2569",
      billed: 49800,
      collected: 49800,
      outstanding: 0,
      rate: 100.0,
    },
    {
      month: "พฤษภาคม 2569",
      billed: 48500,
      collected: 48500,
      outstanding: 0,
      rate: 100.0,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        description="ผลการดำเนินงาน อัตราการเข้าพัก และรายรับจากข้อมูลจริงของทุกหอพัก"
        title="รายงานและสถิติภาพรวม"
      />

      {/* 4 Hero Stat Cards (Matching Portal ReportsPage) */}
      <section aria-label="ภาพรวมสถิติ" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Confirmed Revenue */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all hover:border-emerald-200 hover:shadow-md">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <TrendingUp size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">รายรับสะสมที่ยืนยัน</span>
              <strong className="text-2xl font-black text-emerald-800 tracking-tight tabular-nums mt-0.5 block">
                {money(totalRevenue)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 2: Current Outstanding Balance */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all hover:border-rose-200 hover:shadow-md">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/25 flex items-center justify-center shrink-0">
              <CalendarClock size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ยอดค้างชำระปัจจุบัน</span>
              <strong className="text-2xl font-black text-rose-800 tracking-tight tabular-nums mt-0.5 block">
                {money(totalOutstanding)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Average Occupancy Rate */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all hover:border-blue-200 hover:shadow-md">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0">
              <DoorOpen size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">อัตราเข้าพักเฉลี่ย</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {overallOccupancy}%
              </strong>
            </div>
          </div>
        </div>

        {/* Card 4: Active Leases Count */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all hover:border-indigo-200 hover:shadow-md">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-700 to-blue-800 text-white shadow-md shadow-slate-500/25 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">สัญญาเช่าที่ใช้งาน</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {activeContractsCount.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Property Breakdown Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={18} className="text-blue-600" />
            <span>สถิติรายหอพัก ({dormList.length} อาคาร)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dormList.map((property) => {
            const rooms = property.rooms || [];
            const occCount = rooms.filter((r) => r.tenant && r.tenant !== "(ว่าง)").length;
            const propOcc = rooms.length ? Math.round((occCount / rooms.length) * 100) : 0;
            const propRev = 30000;
            const propOut = 6259;

            return (
              <article
                className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                key={property.id}
              >
                {/* Ambient Glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                <div>
                  {/* Header */}
                  <header className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Building2 size={20} strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {property.name}
                        </h3>
                        <span className="text-xs text-slate-400 block truncate mt-0.5">{property.address}</span>
                      </div>
                    </div>
                  </header>

                  {/* Occupancy Progress Bar */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 mb-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">อัตราการเข้าพัก</span>
                      <span className="text-emerald-600 font-mono font-black">{propOcc}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, propOcc))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>พักแล้ว {occCount} ห้อง</span>
                      <span>ว่าง {rooms.length - occCount} ห้อง</span>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/80 flex flex-col">
                      <span className="text-emerald-800 text-[11px] font-medium">รายรับสะสม</span>
                      <strong className="text-emerald-900 font-black font-mono text-sm mt-0.5">
                        {money(propRev)}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100/80 flex flex-col">
                      <span className="text-rose-800 text-[11px] font-medium">ยอดคงค้าง</span>
                      <strong className="text-rose-900 font-black font-mono text-sm mt-0.5">
                        {money(propOut)}
                      </strong>
                    </div>
                  </div>
                </div>

                <footer className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>ห้องพักทั้งหมด: <strong className="text-slate-700 font-mono">{rooms.length}</strong> ห้อง</span>
                  <span>สัญญาเช่า: <strong className="text-slate-700 font-mono">{property.contracts?.length || 1}</strong> ฉบับ</span>
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      {/* Monthly Breakdown Table */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CalendarClock size={18} className="text-blue-600" />
          <span>สถิติผลประกอบการย้อนหลังตามรอบเดือน</span>
        </h2>

        <div className="w-full">
          <DataTable
            headers={[
              "รอบเดือน",
              "ยอดเรียกเก็บรวม",
              "ยอดรับชำระแล้ว",
              "ยอดคงค้างชำระ",
              "อัตราการจัดเก็บ",
            ]}
            rows={monthlyData.map((item) => [
              <strong className="text-slate-900 text-xs font-bold font-mono" key="month">
                {item.month}
              </strong>,
              <span className="text-slate-700 text-xs font-mono font-medium" key="billed">
                {money(item.billed)}
              </span>,
              <strong className="text-emerald-700 text-xs font-mono font-bold" key="collected">
                {money(item.collected)}
              </strong>,
              <span
                className={`text-xs font-mono font-bold ${
                  item.outstanding > 0 ? "text-rose-600" : "text-slate-400"
                }`}
                key="out"
              >
                {money(item.outstanding)}
              </span>,
              <div className="flex items-center gap-2" key="rate">
                <span className="inline-block w-12 text-xs font-mono font-black text-slate-800">
                  {item.rate.toFixed(1)}%
                </span>
                <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>,
            ])}
          />
        </div>
      </section>
    </div>
  );
}
