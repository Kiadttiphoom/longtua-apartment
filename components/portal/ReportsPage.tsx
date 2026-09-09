"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  DoorOpen,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type { PortalData } from "@/components/portal/types";
import { EmptyState, PageHeader } from "@/components/portal/PortalUI";
import { DateFilterControl, type DateFilterMode } from "@/components/portal/DateFilterControl";
import { money } from "@/lib/format";

export function ReportsPage({ data }: { data: PortalData }) {
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>("month");
  const [dateFilterValue, setDateFilterValue] = useState("");

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<string>([String(currentYear)]);
    for (const p of data.payments) {
      if (p.paid_at) years.add(p.paid_at.slice(0, 4));
    }
    for (const inv of data.invoices) {
      if (inv.issued_at) years.add(inv.issued_at.slice(0, 4));
      if (inv.due_at) years.add(inv.due_at.slice(0, 4));
    }
    return Array.from(years).sort().reverse();
  }, [data.payments, data.invoices]);

  const filteredPayments = useMemo(() => {
    if (!dateFilterValue) return data.payments;
    return data.payments.filter((item) => {
      const paidAt = item.paid_at || "";
      if (dateFilterMode === "date") return paidAt.slice(0, 10) === dateFilterValue;
      if (dateFilterMode === "month") return paidAt.slice(0, 7) === dateFilterValue;
      if (dateFilterMode === "year") return paidAt.slice(0, 4) === dateFilterValue;
      return true;
    });
  }, [data.payments, dateFilterValue, dateFilterMode]);

  const filteredInvoices = useMemo(() => {
    if (!dateFilterValue) return data.invoices;
    return data.invoices.filter((item) => {
      const issued = item.issued_at || "";
      const due = item.due_at || "";
      if (dateFilterMode === "date") return issued.slice(0, 10) === dateFilterValue || due.slice(0, 10) === dateFilterValue;
      if (dateFilterMode === "month") return issued.slice(0, 7) === dateFilterValue || due.slice(0, 7) === dateFilterValue;
      if (dateFilterMode === "year") return issued.slice(0, 4) === dateFilterValue || due.slice(0, 4) === dateFilterValue;
      return true;
    });
  }, [data.invoices, dateFilterValue, dateFilterMode]);

  const revenue = useMemo(
    () =>
      filteredPayments
        .filter((item) => item.status === "confirmed")
        .reduce((sum, item) => sum + Number(item.amount), 0),
    [filteredPayments]
  );

  const outstanding = useMemo(
    () =>
      filteredInvoices
        .filter((item) => item.status !== "void")
        .reduce((sum, item) => sum + Number(item.balance_due), 0),
    [filteredInvoices]
  );

  const totalRoomsCount = data.rooms.length;
  const occupiedRoomsCount = data.rooms.filter((item) => item.status === "occupied").length;
  const occupancy = totalRoomsCount ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0;
  const activeLeasesCount = data.leases.filter((item) => item.status === "active").length;

  const propertyReports = useMemo(() => {
    return data.properties.map((property) => {
      const rooms = data.rooms.filter((room) => room.property_id === property.id);
      const payments = filteredPayments.filter(
        (payment) => payment.property_id === property.id && payment.status === "confirmed"
      );
      const invoices = filteredInvoices.filter(
        (invoice) => invoice.property_id === property.id && invoice.status !== "void"
      );
      const occupied = rooms.filter((room) => room.status === "occupied").length;
      return {
        property,
        rooms: rooms.length,
        occupied,
        revenue: payments.reduce((sum, item) => sum + Number(item.amount), 0),
        outstanding: invoices.reduce((sum, item) => sum + Number(item.balance_due), 0),
      };
    });
  }, [filteredInvoices, filteredPayments, data.properties, data.rooms]);

  return (
    <div className="portal-refined-page space-y-8">
      <PageHeader
        description="ผลการดำเนินงาน อัตราการเข้าพัก และรายรับจากข้อมูลจริงของทุกหอพัก"
        title="รายงานและสถิติภาพรวม"
      />

      {/* Date Filter Toolbar */}
      <section className="p-4 lg:p-5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col min-w-[200px] mr-auto">
          <strong className="text-slate-800 text-[15px] font-bold">ช่วงเวลาสรุปรายงาน</strong>
          <span className="text-slate-500 text-xs mt-0.5">
            {dateFilterValue
              ? `กรองสถิติตาม${dateFilterMode === "date" ? "วันที่" : dateFilterMode === "month" ? "รอบเดือน" : "ปี"} ${dateFilterValue}`
              : "แสดงข้อมูลสะสมภาพรวมทั้งหมด (เลือกวัน/เดือน/ปี เพื่อกรองสถิติ)"}
          </span>
        </div>
        <DateFilterControl
          availableYears={availableYears}
          mode={dateFilterMode}
          onModeChange={setDateFilterMode}
          onValueChange={setDateFilterValue}
          value={dateFilterValue}
          placeholderDate="เลือกวันที่สรุปรายงาน"
          placeholderMonth="เลือกรอบเดือนรายงาน"
        />
      </section>

      {/* 4-Metric Hero Stat Cards */}
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
                {money(revenue)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 2: Outstanding Balance */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all hover:border-rose-200 hover:shadow-md">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/25 flex items-center justify-center shrink-0">
              <CalendarClock size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ยอดค้างชำระปัจจุบัน</span>
              <strong className="text-2xl font-black text-rose-800 tracking-tight tabular-nums mt-0.5 block">
                {money(outstanding)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Occupancy Rate */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all hover:border-blue-200 hover:shadow-md">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0">
              <DoorOpen size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">อัตราเข้าพักเฉลี่ย</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {occupancy}%
              </strong>
            </div>
          </div>
        </div>

        {/* Card 4: Active Leases */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all hover:border-indigo-200 hover:shadow-md">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-700 to-blue-800 text-white shadow-md shadow-slate-500/25 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">สัญญาเช่าที่ใช้งาน</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {activeLeasesCount.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Property Reports Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={18} className="text-blue-600" />
            <span>สถิติรายหอพัก ({propertyReports.length} อาคาร)</span>
          </h2>
        </div>

        {propertyReports.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {propertyReports.map(({ property, rooms, occupied, revenue: propRevenue, outstanding: propOutstanding }) => {
            const propOcc = rooms ? Math.round((occupied / rooms) * 100) : 0;
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
                      <span>มีผู้พัก {occupied} ห้อง</span>
                      <span>ทั้งหมด {rooms} ห้อง</span>
                    </div>
                  </div>

                  {/* Financial Stats Grid */}
                  <dl className="grid grid-cols-2 gap-2.5 mb-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">รายรับสะสม</dt>
                      <dd className="text-sm font-mono font-bold text-slate-900 mt-1">{money(propRevenue)}</dd>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ยอดคงค้าง</dt>
                      <dd
                        className={`text-sm font-mono font-bold mt-1 ${
                          propOutstanding > 0 ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {money(propOutstanding)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </article>
            );
          })}
        </div>
        ) : (
          <EmptyState
            description="เพิ่มหอพักและห้องพักก่อน ระบบจึงจะสรุปอัตราการเข้าพักและผลการดำเนินงานรายอาคารได้"
            title="ยังไม่มีข้อมูลสำหรับรายงาน"
          />
        )}
      </section>
    </div>
  );
}
