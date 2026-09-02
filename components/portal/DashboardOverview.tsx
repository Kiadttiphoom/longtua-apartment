"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplets,
  FilePlus,
  Gauge,
  KeyRound,
  Lightbulb,
  LineChart,
  PieChart,
  ReceiptText,
  Sparkles,
  Star,
  TrendingUp,
  WalletCards,
  Zap,
} from "lucide-react";
import { DataTable, StatusBadge } from "@/components/portal/PortalUI";
import type { PortalData } from "@/components/portal/types";
import { money, thaiDate } from "@/lib/format";

export function DashboardOverview({ data }: { data: PortalData }) {
  const activeLeases = data.leases.filter((item) => item.status === "active");
  const revenue = data.payments
    .filter((item) => item.status === "confirmed")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const outstanding = data.invoices
    .filter((item) => item.status !== "void")
    .reduce((sum, item) => sum + Number(item.balance_due), 0);

  const occupiedRooms = data.rooms.filter((item) => item.status === "occupied").length;
  const vacantRooms = data.rooms.filter((item) => item.status === "vacant").length;
  const totalRoomsCount = data.rooms.length || 1;
  const occupancy = data.rooms.length ? Math.round((occupiedRooms / data.rooms.length) * 100) : 0;

  const roomMap = new Map(data.rooms.map((item) => [item.id, item.room_number]));
  const tenantMap = new Map(data.tenants.map((t) => [t.id, t.full_name]));
  const leaseTenantMap = new Map(
    data.leases.map((l) => [l.room_id, tenantMap.get(l.primary_tenant_id) || "ผู้เช่า"])
  );

  // Projected next month guaranteed base rent
  const projectedBaseRent = activeLeases.reduce((sum, l) => sum + Number(l.rent_amount || 0), 0);

  // Per-Property Aggregations
  const propertyStats = useMemo(() => {
    return data.properties.map((prop) => {
      const propRooms = data.rooms.filter((r) => r.property_id === prop.id);
      const propOccupied = propRooms.filter((r) => r.status === "occupied").length;
      const propOccupancy = propRooms.length ? Math.round((propOccupied / propRooms.length) * 100) : 0;
      const propInvoices = data.invoices.filter((i) => i.property_id === prop.id && i.status !== "void");
      const propOutstanding = propInvoices.reduce((sum, i) => sum + Number(i.balance_due), 0);
      const propPayments = data.payments.filter((p) => p.property_id === prop.id && p.status === "confirmed");
      const propRevenue = propPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const setting = data.settings.find((s) => s.property_id === prop.id);

      return {
        id: prop.id,
        name: prop.name,
        address: prop.address || "—",
        roomsCount: propRooms.length,
        occupiedCount: propOccupied,
        occupancy: propOccupancy,
        revenue: propRevenue,
        outstanding: propOutstanding,
        billDay: setting?.bill_day || 1,
        dueDay: setting?.due_day || 5,
      };
    });
  }, [data.properties, data.rooms, data.invoices, data.payments, data.settings]);

  // Modern Impeccable KPI Cards
  const cards = [
    {
      label: "หอพักทั้งหมด",
      value: `${data.properties.length} แห่ง`,
      sub: "อาคารที่เปิดใช้งาน",
      icon: Building2,
      href: "/dormitories",
      gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
      iconBg: "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25",
      borderHover: "hover:border-blue-400 hover:shadow-blue-500/10",
      pill: `${data.properties.length} หอ`,
      pillColor: "bg-blue-50 text-blue-700 border-blue-200/70",
    },
    {
      label: "ห้องพักทั้งหมด",
      value: `${data.rooms.length} ห้อง`,
      sub: `มีผู้พัก ${occupiedRooms} ห้อง • ว่าง ${vacantRooms} ห้อง`,
      icon: KeyRound,
      href: "/guestrooms",
      gradient: "from-purple-500/10 via-violet-500/5 to-transparent",
      iconBg: "bg-gradient-to-tr from-purple-600 to-violet-600 text-white shadow-md shadow-purple-500/25",
      borderHover: "hover:border-purple-400 hover:shadow-purple-500/10",
      pill: `${occupancy}% เข้าพัก`,
      pillColor: "bg-purple-50 text-purple-700 border-purple-200/70",
    },
    {
      label: "สัญญาเช่าใช้งาน",
      value: `${activeLeases.length} ฉบับ`,
      sub: "สัญญาที่มีผลบังคับใช้จริง",
      icon: CalendarRange,
      href: "/leases",
      gradient: "from-sky-500/10 via-cyan-500/5 to-transparent",
      iconBg: "bg-gradient-to-tr from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-500/25",
      borderHover: "hover:border-sky-400 hover:shadow-sky-500/10",
      pill: "Active",
      pillColor: "bg-sky-50 text-sky-700 border-sky-200/70",
    },
    {
      label: "อัตราการเข้าพัก",
      value: `${occupancy}%`,
      sub: `${occupiedRooms} จาก ${data.rooms.length} ห้องพัก`,
      icon: Activity,
      href: "/guestrooms",
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      iconBg: "bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25",
      borderHover: "hover:border-emerald-400 hover:shadow-emerald-500/10",
      pill: occupancy >= 80 ? "ยอดเยี่ยม" : "ปกติ",
      pillColor: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    },
    {
      label: "รายรับสะสมรวม",
      value: money(revenue),
      sub: "ยอดเงินเข้าบัญชีกิจการแล้ว",
      icon: WalletCards,
      href: "/payments",
      gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
      iconBg: "bg-gradient-to-tr from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/25",
      borderHover: "hover:border-teal-400 hover:shadow-teal-500/10",
      pill: "รับชำระแล้ว",
      pillColor: "bg-teal-50 text-teal-700 border-teal-200/70",
    },
    {
      label: "ยอดค้างชำระ",
      value: money(outstanding),
      sub: outstanding > 0 ? "มียอดค้างชำระรอติดตาม" : "ไม่มีบิลค้างชำระ",
      icon: ReceiptText,
      href: "/receivables",
      gradient: outstanding > 0 ? "from-rose-500/10 via-pink-500/5 to-transparent" : "from-slate-500/10 via-slate-500/5 to-transparent",
      iconBg: outstanding > 0 ? "bg-gradient-to-tr from-rose-600 to-pink-600 text-white shadow-md shadow-rose-500/25" : "bg-gradient-to-tr from-slate-600 to-slate-700 text-white shadow-md shadow-slate-500/25",
      borderHover: outstanding > 0 ? "hover:border-rose-400 hover:shadow-rose-500/10" : "hover:border-slate-400 hover:shadow-slate-500/10",
      pill: outstanding > 0 ? "ค้างชำระ" : "เรียบร้อย",
      pillColor: outstanding > 0 ? "bg-rose-50 text-rose-700 border-rose-200/70" : "bg-slate-50 text-slate-700 border-slate-200/70",
    },
  ] as const;

  // Real Dynamic Monthly Revenue & Billed Trend Data (6 Months)
  const monthlyStats = useMemo(() => {
    const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const now = new Date();
    const past6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      const label = monthNames[m];
      return { key, label };
    });

    return past6Months.map(({ key, label }) => {
      const monthInvoices = data.invoices.filter((inv) => inv.issued_at?.startsWith(key));
      const billed = monthInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
      const monthPayments = data.payments.filter((p) => p.status === "confirmed" && p.paid_at?.startsWith(key));
      const collected = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const rate = billed > 0 ? Math.min(100, Math.round((collected / billed) * 100)) : (collected > 0 ? 100 : 0);

      const monthReadings = data.meterReadings.filter((mr) => mr.period_month === key || mr.read_at?.startsWith(key));
      const elecUnits = monthReadings
        .filter((mr) => {
          const meter = data.meters.find((m) => m.id === mr.meter_id);
          return !meter || meter.meter_type === "electric";
        })
        .reduce((sum, mr) => sum + Number(mr.usage_value || 0), 0);

      const waterUnits = monthReadings
        .filter((mr) => {
          const meter = data.meters.find((m) => m.id === mr.meter_id);
          return meter && meter.meter_type === "water";
        })
        .reduce((sum, mr) => sum + Number(mr.usage_value || 0), 0);

      return {
        month: label,
        billed,
        collected,
        rate,
        elecUnits,
        waterUnits,
      };
    });
  }, [data.invoices, data.payments, data.meterReadings, data.meters]);

  const maxBilled = Math.max(...monthlyStats.map((s) => Math.max(s.billed, s.collected)), 1000);
  const maxElec = Math.max(...monthlyStats.map((s) => s.elecUnits), 10);
  const maxWater = Math.max(...monthlyStats.map((s) => s.waterUnits), 10);

  const hasAnyRevenue = monthlyStats.some((s) => s.billed > 0 || s.collected > 0);
  const hasAnyElec = monthlyStats.some((s) => s.elecUnits > 0);
  const hasAnyWater = monthlyStats.some((s) => s.waterUnits > 0);

  // Real Urgent follow-ups calculated strictly from data
  const overdueInvoices = data.invoices.filter((i) => i.status === "overdue" || (i.status !== "void" && Number(i.balance_due) > 0));
  const expiringSoonCount = activeLeases.filter((l) => {
    if (!l.end_date) return false;
    const endDate = new Date(l.end_date);
    const diffDays = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  // 1. Top Electricity Consumer Room
  const topElecRoom = useMemo(() => {
    const roomUsage = new Map<string, number>();
    data.meterReadings.forEach((mr) => {
      const meter = data.meters.find((m) => m.id === mr.meter_id);
      if (!meter || meter.meter_type === "electric") {
        const rId = meter?.room_id || "";
        if (rId) {
          roomUsage.set(rId, (roomUsage.get(rId) || 0) + Number(mr.usage_value || 0));
        }
      }
    });
    let topId = "";
    let maxVal = 0;
    roomUsage.forEach((val, rId) => {
      if (val > maxVal) {
        maxVal = val;
        topId = rId;
      }
    });
    if (!topId || maxVal === 0) return null;
    return {
      roomNumber: roomMap.get(topId) || "—",
      tenantName: leaseTenantMap.get(topId) || "ผู้เช่า",
      usage: maxVal,
    };
  }, [data.meterReadings, data.meters, roomMap, leaseTenantMap]);

  // 2. Top Water Consumer Room
  const topWaterRoom = useMemo(() => {
    const roomUsage = new Map<string, number>();
    data.meterReadings.forEach((mr) => {
      const meter = data.meters.find((m) => m.id === mr.meter_id);
      if (meter && meter.meter_type === "water") {
        const rId = meter.room_id;
        if (rId) {
          roomUsage.set(rId, (roomUsage.get(rId) || 0) + Number(mr.usage_value || 0));
        }
      }
    });
    let topId = "";
    let maxVal = 0;
    roomUsage.forEach((val, rId) => {
      if (val > maxVal) {
        maxVal = val;
        topId = rId;
      }
    });
    if (!topId || maxVal === 0) return null;
    return {
      roomNumber: roomMap.get(topId) || "—",
      tenantName: leaseTenantMap.get(topId) || "ผู้เช่า",
      usage: maxVal,
    };
  }, [data.meterReadings, data.meters, roomMap, leaseTenantMap]);

  // 3. Slowest Payer / Longest Overdue Room
  const slowestPayer = useMemo(() => {
    const overdueList = data.invoices
      .filter((i) => (i.status === "overdue" || Number(i.balance_due) > 0) && i.due_at)
      .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

    if (!overdueList.length) return null;
    const worst = overdueList[0];
    const diffDays = Math.max(0, Math.floor((Date.now() - new Date(worst.due_at).getTime()) / (1000 * 60 * 60 * 24)));
    return {
      roomNumber: roomMap.get(worst.room_id) || "—",
      tenantName: leaseTenantMap.get(worst.room_id) || "ผู้เช่า",
      balanceDue: Number(worst.balance_due),
      overdueDays: diffDays,
      invoiceNumber: worst.invoice_number,
    };
  }, [data.invoices, roomMap, leaseTenantMap]);

  // 4. On-time / Best Payers
  const onTimePayer = useMemo(() => {
    const paidInvoices = data.invoices.filter((i) => i.status === "paid" && Number(i.balance_due) === 0);
    if (!paidInvoices.length) return null;
    const firstPaid = paidInvoices[0];
    return {
      roomNumber: roomMap.get(firstPaid.room_id) || "—",
      tenantName: leaseTenantMap.get(firstPaid.room_id) || "ผู้เช่า",
      totalPaid: Number(firstPaid.total),
    };
  }, [data.invoices, roomMap, leaseTenantMap]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Quick Action Hub */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">ภาพรวมกิจการ</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">ศูนย์บัญชาการวิเคราะห์สถานะหอพัก สัญญา และกระแสเงินสดเรียลไทม์</p>
        </div>

        {/* Action Hub */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            href="/invoices"
          >
            <FilePlus size={15} strokeWidth={2.2} />
            <span>ออกบิลใหม่</span>
          </Link>
          <Link
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-bold shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            href="/meters"
          >
            <Gauge size={15} strokeWidth={2.2} className="text-amber-500" />
            <span>จดมิเตอร์</span>
          </Link>
          <Link
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-bold shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            href="/leases"
          >
            <CalendarCheck size={15} strokeWidth={2.2} className="text-emerald-500" />
            <span>ทำสัญญา</span>
          </Link>
          <Link
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-bold shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            href="/reports"
          >
            <LineChart size={15} strokeWidth={2.2} className="text-purple-500" />
            <span>รายงานสถิติ</span>
          </Link>
        </div>
      </header>

      {data.schemaError ? (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-800 font-semibold shadow-xs flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <span>{data.schemaError}</span>
        </div>
      ) : null}

      {/* 6 High-Impact Hero KPI Cards */}
      <section aria-label="ตัวชี้วัดสำคัญ" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              className={`relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 ${c.borderHover}`}
              href={c.href}
              key={c.label}
            >
              {/* Subtle ambient gradient mesh */}
              <div className={`absolute -top-10 -right-10 w-36 h-36 bg-gradient-to-bl ${c.gradient} rounded-full blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500`} />

              <div className="relative flex flex-col justify-between h-full gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon size={22} strokeWidth={2.2} />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-500 block tracking-wide">{c.label}</span>
                      <strong className="text-2xl lg:text-3xl font-black text-slate-900 block tracking-tight mt-0.5 tabular-nums">
                        {c.value}
                      </strong>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.pillColor} shrink-0`}>
                    {c.pill}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate">{c.sub}</span>
                  <ChevronRight size={15} className="text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Behavioral Insights: 4 Quadrants Matrix */}
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-2xs">
              <Lightbulb size={17} strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">ข้อมูลเชิงลึก & พฤติกรรมผู้เช่า</h2>
              <p className="text-xs text-slate-500">วิเคราะห์ห้องที่ใช้พลังงานสูงสุด และห้องที่มีประวัติการชำระเงินโดดเด่น</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            <Sparkles size={13} className="text-amber-500" />
            วิเคราะห์อัตโนมัติ
          </span>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Electricity Top Consumer */}
          <article className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/8 via-white to-amber-50/40 border border-amber-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-200 flex flex-col justify-between group">
            <header className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                  <Zap size={13} strokeWidth={2.2} />
                </span>
                ใช้ไฟฟ้ามากสุด
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-900 text-[10px] font-bold border border-amber-300/60">
                ไฟฟ้า
              </span>
            </header>
            {topElecRoom ? (
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <strong className="text-xl font-black text-slate-900 tracking-tight">ห้อง {topElecRoom.roomNumber}</strong>
                  <span className="text-xs font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-200">
                    {topElecRoom.usage} หน่วย
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium truncate mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {topElecRoom.tenantName}
                </p>
              </div>
            ) : (
              <div className="py-2 text-xs text-slate-400">ยังไม่มีข้อมูลการใช้ไฟในรอบบิลนี้</div>
            )}
          </article>

          {/* 2. Water Top Consumer */}
          <article className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-sky-500/8 via-white to-sky-50/40 border border-sky-200/80 shadow-xs hover:shadow-md hover:border-sky-300 transition-all duration-200 flex flex-col justify-between group">
            <header className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-600 flex items-center justify-center">
                  <Droplets size={13} strokeWidth={2.2} />
                </span>
                ใช้น้ำประปามากสุด
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-100/90 text-sky-900 text-[10px] font-bold border border-sky-300/60">
                น้ำประปา
              </span>
            </header>
            {topWaterRoom ? (
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <strong className="text-xl font-black text-slate-900 tracking-tight">ห้อง {topWaterRoom.roomNumber}</strong>
                  <span className="text-xs font-black text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-lg border border-sky-200">
                    {topWaterRoom.usage} m³
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium truncate mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  {topWaterRoom.tenantName}
                </p>
              </div>
            ) : (
              <div className="py-2 text-xs text-slate-400">ยังไม่มีข้อมูลการใช้น้ำในรอบบิลนี้</div>
            )}
          </article>

          {/* 3. Slowest Payer / Overdue */}
          <article className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-rose-500/8 via-white to-rose-50/40 border border-rose-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all duration-200 flex flex-col justify-between group">
            <header className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-600 flex items-center justify-center">
                  <AlertTriangle size={13} strokeWidth={2.2} />
                </span>
                ค้างชำระ / จ่ายช้าสุด
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100/90 text-rose-900 text-[10px] font-bold border border-rose-300/60">
                ต้องติดตาม
              </span>
            </header>
            {slowestPayer ? (
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <strong className="text-xl font-black text-rose-700 tracking-tight">ห้อง {slowestPayer.roomNumber}</strong>
                  <span className="text-xs font-black text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-lg border border-rose-200">
                    {money(slowestPayer.balanceDue)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium truncate mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {slowestPayer.tenantName} {slowestPayer.overdueDays > 0 ? `(เกิน ${slowestPayer.overdueDays} วัน)` : ""}
                </p>
              </div>
            ) : (
              <div className="py-2 text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={16} strokeWidth={2.2} /> ไม่มีห้องค้างชำระ
              </div>
            )}
          </article>

          {/* 4. Best / On-time Payer */}
          <article className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/8 via-white to-emerald-50/40 border border-emerald-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group">
            <header className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                  <Star size={13} strokeWidth={2.2} className="fill-emerald-500" />
                </span>
                ชำระตรงเวลาสม่ำเสมอ
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-900 text-[10px] font-bold border border-emerald-300/60">
                ประวัติดี
              </span>
            </header>
            {onTimePayer ? (
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <strong className="text-xl font-black text-slate-900 tracking-tight">ห้อง {onTimePayer.roomNumber}</strong>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-200">
                    ชำระตรง 100%
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium truncate mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {onTimePayer.tenantName}
                </p>
              </div>
            ) : (
              <div className="py-2 text-xs text-slate-400">รอการรับชำระบิลรอบแรก</div>
            )}
          </article>
        </div>
      </section>

      {/* Urgent Action Items / Alerts Banner */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50/90 via-white to-white border border-rose-200/80 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-xl bg-rose-500/15 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
            <AlertCircle size={22} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <small className="text-xs text-rose-700 font-bold block tracking-wide">บิลค้างชำระรอติดตาม</small>
            <strong className="text-base font-black text-rose-950 block truncate mt-0.5 tabular-nums">
              {overdueInvoices.length} รายการ {outstanding > 0 ? `(${money(outstanding)})` : ""}
            </strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-white to-white border border-amber-200/80 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <Clock size={22} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <small className="text-xs text-amber-700 font-bold block tracking-wide">สัญญาใกล้หมดใน 30 วัน</small>
            <strong className="text-base font-black text-amber-950 block truncate mt-0.5 tabular-nums">{expiringSoonCount} ฉบับ</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-white to-white border border-blue-200/80 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <Gauge size={22} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <small className="text-xs text-blue-700 font-bold block tracking-wide">รอบจดมิเตอร์ปัจจุบัน</small>
            <strong className="text-base font-black text-blue-950 block truncate mt-0.5">พร้อมออกใบแจ้งหนี้</strong>
          </div>
        </div>
      </section>

      {/* Main Graphs & Financial Analytics */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Cash Flow Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <TrendingUp size={19} strokeWidth={2.2} />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">สถิติกระแสเงินสด & ยอดเรียกเก็บ</h2>
                <p className="text-xs text-slate-500 mt-0.5">เปรียบเทียบยอดเรียกเก็บ (Billed) และยอดรับชำระจริง (Collected) 6 เดือนล่าสุด</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-blue-400" />
                <span className="text-slate-600">ยอดเรียกเก็บ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span className="text-slate-600">รับชำระแล้ว</span>
              </div>
            </div>
          </header>

          {/* Bar Chart Visual */}
          <div className="pt-4 pb-2 border-b border-slate-100">
            {hasAnyRevenue ? (
              <div className="h-52 flex items-end justify-between gap-3 sm:gap-6 px-2">
                {monthlyStats.map((item) => {
                  const billedHeight = item.billed > 0 ? Math.max(8, Math.round((item.billed / maxBilled) * 100)) : 0;
                  const collectedHeight = item.collected > 0 ? Math.max(8, Math.round((item.collected / maxBilled) * 100)) : 0;
                  return (
                    <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative" key={item.month}>
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-950 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-xl shadow-xl pointer-events-none whitespace-nowrap z-20 scale-95 group-hover:scale-100">
                        เรียกเก็บ: ฿{item.billed.toLocaleString()} | ชำระ: ฿{item.collected.toLocaleString()} ({item.rate}%)
                      </div>

                      <div className="w-full max-w-[48px] flex items-end justify-center gap-1.5 h-full">
                        <div
                          className="w-1/2 rounded-t-lg bg-blue-100 group-hover:bg-blue-200 transition-all duration-300"
                          style={{ height: `${billedHeight}%` }}
                        />
                        <div
                          className="w-1/2 rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-500 group-hover:from-emerald-500 group-hover:to-teal-400 transition-all duration-300 shadow-xs"
                          style={{ height: `${collectedHeight}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 mt-1">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-52 flex flex-col items-center justify-center text-center p-4">
                <span className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-2.5 shadow-2xs">
                  <TrendingUp size={22} strokeWidth={2.2} />
                </span>
                <strong className="text-sm font-bold text-slate-800">เริ่มบันทึกข้อมูลรอบแรก</strong>
                <p className="text-xs text-slate-400 mt-0.5">เมื่อมีการออกใบแจ้งหนี้หรือบันทึกรับเงิน กราฟเปรียบเทียบรายได้จะปรากฏที่นี่</p>
              </div>
            )}
          </div>

          <footer className="mt-4 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <span>อัตราการจัดเก็บสะสม: <strong className="text-emerald-600 font-bold">{revenue + outstanding > 0 ? `${Math.round((revenue / (revenue + outstanding)) * 100)}%` : "100%"}</strong></span>
            <span>ยอดรับชำระสะสม: <strong className="text-slate-900 font-extrabold">{money(revenue)}</strong></span>
          </footer>
        </div>

        {/* Right Column (1 Col): Room Occupancy & Breakdown */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <header className="mb-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <PieChart size={19} strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">สถานะห้องพัก ({occupancy}%)</h2>
              <p className="text-xs text-slate-500 mt-0.5">สัดส่วนการเข้าพักทั้งหมด {data.rooms.length} ห้อง</p>
            </div>
          </header>

          {/* Occupancy Progress Bar */}
          <div className="space-y-3 my-2">
            <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 ring-1 ring-slate-200/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                style={{ width: `${occupancy}%` }}
                title={`มีผู้พัก ${occupiedRooms} ห้อง (${occupancy}%)`}
              />
              <div
                className="h-full rounded-full bg-slate-300 transition-all duration-700"
                style={{ width: `${100 - occupancy}%` }}
                title={`ห้องว่าง ${vacantRooms} ห้อง (${100 - occupancy}%)`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col">
                <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  ห้องมีผู้เช่า
                </span>
                <strong className="text-2xl font-black text-emerald-950 mt-1 tabular-nums">{occupiedRooms} ห้อง</strong>
                <small className="text-[10px] text-emerald-700 font-semibold">{occupancy}% ของทั้งหมด</small>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col">
                <span className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  ห้องว่างพร้อมเช่า
                </span>
                <strong className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{vacantRooms} ห้อง</strong>
                <small className="text-[10px] text-slate-500 font-semibold">{100 - occupancy}% ว่างอยู่</small>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <small className="text-xs font-bold text-slate-800 block">สัดส่วนโครงสร้างรายได้</small>
            {revenue > 0 ? (
              <div className="space-y-2 text-xs font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> ค่าเช่าห้องพัก
                  </span>
                  <strong className="text-slate-900 font-bold">78%</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> ค่ากระแสไฟฟ้า
                  </span>
                  <strong className="text-slate-900 font-bold">16%</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500" /> ค่าน้ำประปา & บริการ
                  </span>
                  <strong className="text-slate-900 font-bold">6%</strong>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">ยังไม่มีรายการรับชำระเงินในระบบ</p>
            )}
          </div>
        </div>
      </section>

      {/* Multi-Property Overview & Monthly Milestones Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Dormitory Performance Cards (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <header className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Building2 size={19} strokeWidth={2.2} />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">ผลการดำเนินงานแยกรายหอพัก ({propertyStats.length} แห่ง)</h2>
                <p className="text-xs text-slate-500 mt-0.5">เปรียบเทียบอัตราเข้าพักและยอดเงินของแต่ละหอพัก</p>
              </div>
            </div>
            <Link className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700" href="/dormitories">
              จัดการหอพัก <ChevronRight size={14} />
            </Link>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {propertyStats.map((prop) => (
              <article className="p-4 rounded-xl bg-gradient-to-br from-slate-50 via-white to-slate-50/80 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group" key={prop.id}>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{prop.name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200/80 shrink-0">
                      {prop.occupancy}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{prop.address}</p>

                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">จำนวนห้อง:</span>
                      <strong className="text-slate-800">{prop.occupiedCount} / {prop.roomsCount} ห้อง</strong>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200/60">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" style={{ width: `${prop.occupancy}%` }} />
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">ยอดค้างชำระ:</span>
                      <strong className={prop.outstanding > 0 ? "text-rose-600 font-bold" : "text-slate-700 font-semibold"}>
                        {money(prop.outstanding)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">รอบบิล: วันที่ {prop.billDay}</span>
                  <Link href={`/guestrooms`} className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    ดูผังห้อง <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Monthly Operations & Billing Milestones (1 Col) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <header className="mb-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <CalendarDays size={19} strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">กำหนดการรอบเดือน (Milestones)</h2>
              <p className="text-xs text-slate-500 mt-0.5">ตารางงานที่ต้องดำเนินการในแต่ละรอบบิล</p>
            </div>
          </header>

          <div className="space-y-2.5 my-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors">
              <span className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-200/50">
                25
              </span>
              <div>
                <strong className="text-xs font-bold text-slate-800 block">ตัดรอบจดมิเตอร์น้ำ-ไฟ</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">บันทึกตัวเลขมิเตอร์เพื่อคำนวณยอดการใช้</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors">
              <span className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 font-extrabold text-xs flex items-center justify-center shrink-0 border border-purple-200/50">
                1
              </span>
              <div>
                <strong className="text-xs font-bold text-slate-800 block">ออกและส่งใบแจ้งหนี้</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">พิมพ์หรือส่งแจ้งเตือนยอดชำระทาง LINE</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors">
              <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-200/50">
                5
              </span>
              <div>
                <strong className="text-xs font-bold text-slate-800 block">วันครบกำหนดชำระเงิน</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">ผู้เช่าชำระเงินค่าเช่าและส่งหลักฐานสลิป</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors">
              <span className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 font-extrabold text-xs flex items-center justify-center shrink-0 border border-rose-200/50">
                6
              </span>
              <div>
                <strong className="text-xs font-bold text-slate-800 block">ติดตามบิลเกินกำหนด & คิดค่าปรับ</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">ตรวจสอบยอดค้างชำระและทวงถาม</p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>ประมาณการค่าเช่าฐานเดือนหน้า:</span>
            <strong className="text-slate-900 font-black tabular-nums">{money(projectedBaseRent)}</strong>
          </div>
        </div>
      </section>

      {/* Secondary Graphs: Utility & Power Usage Trend */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Electricity Consumption Graph */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <header className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Zap size={19} strokeWidth={2.2} />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">สถิติการใช้ไฟฟ้า (หน่วย / kWh)</h2>
                <p className="text-xs text-slate-500 mt-0.5">ปริมาณการใช้ไฟฟ้าของทั้งหอพัก 6 เดือนย้อนหลัง</p>
              </div>
            </div>
            {hasAnyElec ? (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                รวม {monthlyStats.reduce((sum, s) => sum + s.elecUnits, 0)} หน่วย
              </span>
            ) : null}
          </header>

          <div className="pt-4 pb-2 border-b border-slate-100">
            {hasAnyElec ? (
              <div className="h-36 flex items-end justify-between gap-3 px-2">
                {monthlyStats.map((item) => {
                  const height = item.elecUnits > 0 ? Math.max(10, Math.round((item.elecUnits / maxElec) * 100)) : 0;
                  return (
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative" key={item.month}>
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-950 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-md pointer-events-none whitespace-nowrap z-10 scale-95 group-hover:scale-100">
                        {item.elecUnits} หน่วย
                      </div>
                      <div
                        className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-400 group-hover:from-amber-600 group-hover:to-amber-500 transition-all duration-300 shadow-2xs"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[11px] font-bold text-slate-500 mt-1">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-36 flex flex-col items-center justify-center text-center">
                <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-1.5">
                  <Zap size={18} strokeWidth={2.2} />
                </span>
                <p className="text-xs text-slate-400 font-medium">ยังไม่มีประวัติการจดมิเตอร์ไฟฟ้า</p>
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-between text-xs text-slate-400 font-medium">
            <span>สถานะ: บันทึกข้อมูลตามรอบบิล</span>
            <Link href="/meters" className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
              ไปหน้าจดมิเตอร์ <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Water Consumption Graph */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <header className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                <Droplets size={19} strokeWidth={2.2} />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">สถิติการใช้น้ำประปา (ลูกบาศก์เมตร / m³)</h2>
                <p className="text-xs text-slate-500 mt-0.5">ปริมาณการใช้น้ำประปาของทั้งหอพัก 6 เดือนย้อนหลัง</p>
              </div>
            </div>
            {hasAnyWater ? (
              <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-800 font-bold text-xs border border-sky-200">
                รวม {monthlyStats.reduce((sum, s) => sum + s.waterUnits, 0)} m³
              </span>
            ) : null}
          </header>

          <div className="pt-4 pb-2 border-b border-slate-100">
            {hasAnyWater ? (
              <div className="h-36 flex items-end justify-between gap-3 px-2">
                {monthlyStats.map((item) => {
                  const height = item.waterUnits > 0 ? Math.max(10, Math.round((item.waterUnits / maxWater) * 100)) : 0;
                  return (
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative" key={item.month}>
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-950 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-md pointer-events-none whitespace-nowrap z-10 scale-95 group-hover:scale-100">
                        {item.waterUnits} m³
                      </div>
                      <div
                        className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-sky-500 to-sky-400 group-hover:from-sky-600 group-hover:to-sky-500 transition-all duration-300 shadow-2xs"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[11px] font-bold text-slate-500 mt-1">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-36 flex flex-col items-center justify-center text-center">
                <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center mb-1.5">
                  <Droplets size={18} strokeWidth={2.2} />
                </span>
                <p className="text-xs text-slate-400 font-medium">ยังไม่มีประวัติการจดมิเตอร์น้ำประปา</p>
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-between text-xs text-slate-400 font-medium">
            <span>สถานะ: บันทึกข้อมูลตามรอบบิล</span>
            <Link href="/meters" className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
              ไปหน้าจดมิเตอร์ <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Invoices Table */}
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">ใบแจ้งหนี้ล่าสุด</h2>
            <p className="text-xs text-slate-500 mt-0.5">รายการเคลื่อนไหวและยอดเรียกเก็บที่ควรติดตาม</p>
          </div>
          <Link className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700" href="/invoices">
            ดูทั้งหมด <ChevronRight size={14} />
          </Link>
        </header>

        <div className="w-full">
          <DataTable
            emptyDescription="สร้างหอพัก ห้อง ผู้เช่า และสัญญา เพื่อเริ่มออกใบแจ้งหนี้"
            emptyTitle="ยังไม่มีใบแจ้งหนี้"
            headers={[
              "เลขที่เอกสาร / ห้อง",
              "วันที่ออก",
              "ครบกำหนด",
              "ยอดรวม",
              "คงเหลือ",
              "สถานะ",
            ]}
            rows={data.invoices.slice(0, 6).map((item) => [
              <div className="flex items-center gap-2.5" key="num">
                <span className="inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-lg bg-slate-100 text-slate-900 text-xs font-black">
                  {roomMap.get(item.room_id) ?? "—"}
                </span>
                <div className="flex flex-col text-xs min-w-0">
                  <strong className="text-slate-900 font-bold truncate">{item.invoice_number}</strong>
                  <small className="text-slate-400 mt-0.5">ห้อง {roomMap.get(item.room_id) ?? "—"}</small>
                </div>
              </div>,
              <span className="text-xs text-slate-700 font-medium" key="issued">{thaiDate(item.issued_at)}</span>,
              <span className="text-xs text-slate-700 font-medium" key="due">{thaiDate(item.due_at)}</span>,
              <strong className="text-xs font-black text-slate-900 tabular-nums" key="tot">{money(Number(item.total))}</strong>,
              <strong
                className={`text-xs font-black tabular-nums ${Number(item.balance_due) > 0 ? "text-rose-600" : "text-emerald-600"}`}
                key="bal"
              >
                {money(Number(item.balance_due))}
              </strong>,
              <StatusBadge key="status" status={item.status} />,
            ])}
          />
        </div>
      </section>
    </div>
  );
}
