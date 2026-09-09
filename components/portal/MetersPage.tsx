"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  DoorOpen,
  Droplets,
  Gauge,
  History,
  Info,
  Layers,
  LayoutGrid,
  List,
  Lock,
  Pencil,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { saveMeterReadingAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  EmptyState,
  Modal,
  PageHeader,
  PortalForm,
} from "@/components/portal/PortalUI";
import { DateTimeControl } from "@/components/ui/DateTimeControl";
import { DateFilterControl, type DateFilterMode } from "@/components/portal/DateFilterControl";
import { SelectControl } from "@/components/ui/SelectControl";
import type { Invoice, Meter, MeterReading, Property, Room } from "@/components/portal/types";
import { thaiDate } from "@/lib/format";
import { formatThaiBillingMonth, getMeterReadingDefaults, getRelatedPeriodMonth } from "@/lib/portal/meter-reading.mjs";
import { validateMeter } from "@/lib/portal/validation.mjs";

type MetersPageProps = {
  organizationId: string;
  properties: Property[];
  rooms: Room[];
  meters: Meter[];
  readings: MeterReading[];
  invoices?: Invoice[];
  submissions?: { id: string; invoice_id: string; status: string }[];
  canCreate: boolean;
};

export function MetersPage({
  organizationId,
  properties,
  rooms,
  meters,
  readings,
  invoices = [],
  submissions = [],
  canCreate,
}: MetersPageProps) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activePropertyId, setActivePropertyId] = useState(properties[0]?.id ?? "");
  const [floor, setFloor] = useState("all");
  const [modalPropertyId, setModalPropertyId] = useState("");
  const [modalRoomId, setModalRoomId] = useState("");
  const [meterType, setMeterType] = useState("electric");
  const [periodMonth, setPeriodMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>("month");
  const [dateFilterValue, setDateFilterValue] = useState("");

  const propertyMap = useMemo(() => new Map(properties.map((item) => [item.id, item.name])), [properties]);
  const roomMap = useMemo(() => new Map(rooms.map((item) => [item.id, item])), [rooms]);
  const meterMap = useMemo(() => new Map(meters.map((item) => [item.id, item])), [meters]);

  const activeProperty = properties.find((item) => item.id === activePropertyId) ?? properties[0];
  const resolvedPropertyId = activeProperty?.id ?? "";

  const floorKey = (room?: Room) => (room?.floor ? String(room.floor) : "1");
  const floorLabel = (key: string) => `ชั้น ${key}`;

  const propertyReadings = useMemo(() => {
    return readings.filter((item) => {
      const meter = meterMap.get(item.meter_id);
      return meter?.property_id === resolvedPropertyId;
    });
  }, [readings, meterMap, resolvedPropertyId]);

  const floorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const reading of propertyReadings) {
      const meter = meterMap.get(reading.meter_id);
      const room = roomMap.get(meter?.room_id ?? "");
      const key = floorKey(room);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts, ([value, count]) => ({ value, count, label: floorLabel(value) })).sort(
      (left, right) => left.value.localeCompare(right.value, "th", { numeric: true, sensitivity: "base" })
    );
  }, [propertyReadings, meterMap, roomMap]);

  const selectedMeter = useMemo(
    () => meters.find((item) => item.room_id === modalRoomId && item.meter_type === meterType),
    [meters, modalRoomId, meterType]
  );

  const draft = useMemo(
    () => getMeterReadingDefaults(readings, selectedMeter?.id ?? "", periodMonth),
    [readings, selectedMeter?.id, periodMonth]
  );
  const draftKey = `${selectedMeter?.id ?? "none"}-${periodMonth}-${draft.mode}`;

  const getLockStatusForReading = (reading: MeterReading) => {
    if (!invoices || invoices.length === 0) return { isLocked: false };
    const meter = meterMap.get(reading.meter_id);
    if (!meter) return { isLocked: false };

    const readingMonth = reading.period_month?.slice(0, 7) || "";
    const activeInvoice = invoices.find(
      (inv) =>
        inv.room_id === meter.room_id &&
        inv.status !== "void" &&
        (inv.billing_cycle_id === reading.billing_cycle_id ||
          inv.issued_at?.slice(0, 7) === readingMonth)
    );

    if (!activeInvoice) return { isLocked: false };

    if (activeInvoice.status === "paid" || Number(activeInvoice.balance_due) <= 0) {
      return {
        isLocked: true,
        reason: "paid" as const,
        badgeLabel: "ชำระแล้ว",
        badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
        invoiceNumber: activeInvoice.invoice_number,
        message: `ใบแจ้งหนี้รอบนี้ (${activeInvoice.invoice_number}) ชำระเงินเรียบร้อยแล้ว ล็อกการแก้ไข`,
      };
    }

    const hasPendingSlip = submissions?.some(
      (s) => s.invoice_id === activeInvoice.id && s.status === "pending"
    );
    if (hasPendingSlip) {
      return {
        isLocked: true,
        reason: "pending_slip" as const,
        badgeLabel: "รอตรวจสลิป",
        badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
        invoiceNumber: activeInvoice.invoice_number,
        message: `มีสลิปรอการตรวจสอบ (${activeInvoice.invoice_number}) ล็อกการแก้ไข`,
      };
    }

    return {
      isLocked: true,
      reason: "issued" as const,
      badgeLabel: "ออกบิลแล้ว",
      badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
      invoiceNumber: activeInvoice.invoice_number,
      message: `ออกใบแจ้งหนี้แล้ว (${activeInvoice.invoice_number}) ต้องยกเลิกใบแจ้งหนี้ก่อนถึงจะแก้ไขได้`,
    };
  };

  const modalLock = useMemo(() => {
    if (!modalRoomId || !periodMonth || !invoices || invoices.length === 0) {
      return { isLocked: false };
    }

    const activeInvoice = invoices.find((inv) => {
      if (inv.room_id !== modalRoomId || inv.status === "void") return false;
      const invMonth = inv.issued_at ? inv.issued_at.slice(0, 7) : "";
      const matchingReading = readings.find(
        (r) =>
          selectedMeter &&
          r.meter_id === selectedMeter.id &&
          r.period_month?.slice(0, 7) === periodMonth
      );
      if (matchingReading && inv.billing_cycle_id === matchingReading.billing_cycle_id) {
        return true;
      }
      return invMonth === periodMonth;
    });

    if (!activeInvoice) return { isLocked: false };

    if (activeInvoice.status === "paid" || Number(activeInvoice.balance_due) <= 0) {
      return {
        isLocked: true,
        reason: "paid" as const,
        invoiceNumber: activeInvoice.invoice_number,
        message: `ไม่สามารถแก้ไขเลขมิเตอร์ได้ เนื่องจากใบแจ้งหนี้รอบนี้ (${activeInvoice.invoice_number}) ชำระเงินเรียบร้อยแล้ว`,
      };
    }

    const hasPendingSlip = submissions?.some(
      (s) => s.invoice_id === activeInvoice.id && s.status === "pending"
    );
    if (hasPendingSlip) {
      return {
        isLocked: true,
        reason: "pending_slip" as const,
        invoiceNumber: activeInvoice.invoice_number,
        message: `ไม่สามารถแก้ไขเลขมิเตอร์ได้ เนื่องจากมีสลิปชำระเงิน (${activeInvoice.invoice_number}) อยู่ระหว่างรอการตรวจสอบ กรุณากดไม่อนุมัติสลิปก่อน`,
      };
    }

    return {
      isLocked: true,
      reason: "issued" as const,
      invoiceNumber: activeInvoice.invoice_number,
      message: `ไม่สามารถแก้ไขเลขมิเตอร์ได้ เนื่องจากมีการออกใบแจ้งหนี้แล้ว (${activeInvoice.invoice_number}) กรุณาไปที่เมนูใบแจ้งหนี้เพื่อยกเลิกบิลก่อนหากต้องการแก้ไขเลขมิเตอร์`,
    };
  }, [modalRoomId, periodMonth, invoices, readings, selectedMeter, submissions]);

  const editButton = (reading: MeterReading) => {
    const meter = meterMap.get(reading.meter_id);
    if (!canCreate || !meter) return null;
    const lock = getLockStatusForReading(reading);

    if (lock.isLocked) {
      return (
        <button
          type="button"
          className="h-9 min-w-44 px-3 rounded-xl inline-flex items-center justify-center gap-1.5 text-xs font-bold border border-slate-200 bg-slate-100/80 text-slate-500 hover:bg-slate-200/80 transition-all cursor-pointer shadow-2xs"
          aria-label={`ดูเลขมิเตอร์ห้อง ${roomMap.get(meter.room_id)?.room_number ?? ""} (${lock.badgeLabel})`}
          title={lock.message}
          onClick={() => {
            setModalPropertyId(meter.property_id);
            setModalRoomId(meter.room_id);
            setMeterType(meter.meter_type);
            setPeriodMonth(reading.period_month.slice(0, 7));
            setOpen(true);
          }}
        >
          <Lock size={13} strokeWidth={2.2} /> <span>{lock.badgeLabel} (ล็อก)</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        className="h-9 min-w-44 px-3 rounded-xl inline-flex items-center justify-center gap-1.5 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs"
        aria-label={`แก้ไขเลขมิเตอร์ห้อง ${roomMap.get(meter.room_id)?.room_number ?? ""} ${formatThaiBillingMonth(reading.period_month)}`}
        onClick={() => {
          setModalPropertyId(meter.property_id);
          setModalRoomId(meter.room_id);
          setMeterType(meter.meter_type);
          setPeriodMonth(reading.period_month.slice(0, 7));
          setOpen(true);
        }}
      >
        <Pencil size={14} strokeWidth={2.2} /> <span>แก้ไขมิเตอร์</span>
      </button>
    );
  };

  // Stats calculation for current property
  const totalCount = propertyReadings.length;
  const electricCount = useMemo(
    () => propertyReadings.filter((item) => meterMap.get(item.meter_id)?.meter_type === "electric").length,
    [propertyReadings, meterMap]
  );
  const waterCount = useMemo(
    () => propertyReadings.filter((item) => meterMap.get(item.meter_id)?.meter_type === "water").length,
    [propertyReadings, meterMap]
  );
  const totalUnits = useMemo(
    () =>
      propertyReadings.reduce((sum, item) => {
        const usage = Number(item.current_value) - Number(item.previous_value);
        return sum + (usage > 0 ? usage : 0);
      }, 0),
    [propertyReadings]
  );

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<string>([String(currentYear)]);
    for (const r of propertyReadings) {
      if (r.period_month) years.add(r.period_month.slice(0, 4));
      if (r.read_at) years.add(r.read_at.slice(0, 4));
    }
    return Array.from(years).sort().reverse();
  }, [propertyReadings]);

  // Filtered readings
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th-TH");
    return propertyReadings.filter((item) => {
      const meter = meterMap.get(item.meter_id);
      const room = roomMap.get(meter?.room_id ?? "");
      const itemFloor = floorKey(room);
      const matchesFloor = floor === "all" || itemFloor === floor;
      const matchesType = typeFilter === "all" || meter?.meter_type === typeFilter;
      const matchesSearch =
        !keyword ||
        [room?.room_number, item.period_month].some(
          (value) => value?.toLocaleLowerCase("th-TH").includes(keyword)
        );

      let matchesDate = true;
      if (dateFilterValue) {
        const period = item.period_month || "";
        const readAt = item.read_at || "";
        if (dateFilterMode === "date") {
          matchesDate = readAt.slice(0, 10) === dateFilterValue;
        } else if (dateFilterMode === "month") {
          matchesDate = period.slice(0, 7) === dateFilterValue || readAt.slice(0, 7) === dateFilterValue;
        } else if (dateFilterMode === "year") {
          matchesDate = period.slice(0, 4) === dateFilterValue || readAt.slice(0, 4) === dateFilterValue;
        }
      }

      return matchesFloor && matchesType && matchesSearch && matchesDate;
    });
  }, [propertyReadings, meterMap, roomMap, floor, typeFilter, query, dateFilterValue, dateFilterMode]);

  const visibleFloorGroups = useMemo(() => {
    if (floor !== "all") {
      return [{ value: floor, label: floorLabel(floor), readings: filtered }];
    }
    const groups = new Map<string, MeterReading[]>();
    for (const reading of filtered) {
      const meter = meterMap.get(reading.meter_id);
      const room = roomMap.get(meter?.room_id ?? "");
      const key = floorKey(room);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(reading);
    }
    return Array.from(groups, ([value, list]) => ({
      value,
      label: floorLabel(value),
      readings: list,
    })).sort((a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" }));
  }, [floor, filtered, meterMap, roomMap]);

  const contextMessage = !modalRoomId
    ? "เลือกห้องพักและประเภทมิเตอร์ ระบบจะค้นหาเลขรอบล่าสุดให้อัตโนมัติ"
    : !selectedMeter
    ? "ห้องนี้ยังไม่มีมิเตอร์ประเภทที่เลือก กรุณาตรวจสอบข้อมูลห้องพัก"
    : draft.mode === "edit"
    ? `พบข้อมูลของ ${formatThaiBillingMonth(periodMonth)} กำลังแก้ไขรายการเดิม`
    : draft.mode === "next"
    ? `เลขครั้งก่อนดึงจาก ${formatThaiBillingMonth(draft.sourcePeriod ?? "")}`
    : "การจดครั้งแรก ระบบกำหนดเลขครั้งก่อนหน้าเป็น 0";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        actionLabel={canCreate ? "บันทึกมิเตอร์" : undefined}
        description="บันทึกหรือแก้ไขเลขมิเตอร์ตามรอบเดือน ระบบคำนวณหน่วยใช้งานให้อัตโนมัติ"
        onAction={() => {
          setModalPropertyId(properties[0]?.id ?? "");
          setModalRoomId("");
          setOpen(true);
        }}
        title="มิเตอร์น้ำ-ไฟ"
      />

      {/* 4-Metric Hero Stat Cards (Matching /guestrooms, /users, /leases) */}
      <section aria-label="ภาพรวมมิเตอร์" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Readings */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            typeFilter === "all"
              ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setTypeFilter("all")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0">
              <Gauge size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">รายการจดทั้งหมด</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {totalCount.toLocaleString("th-TH")} รายการ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 2: Electric Meters */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            typeFilter === "electric"
              ? "bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setTypeFilter("electric")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
              <Zap size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">มิเตอร์ไฟฟ้า</span>
              <strong className="text-2xl font-black text-amber-800 tracking-tight tabular-nums mt-0.5 block">
                {electricCount.toLocaleString("th-TH")} รายการ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 3: Water Meters */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            typeFilter === "water"
              ? "bg-white border-cyan-500 shadow-md ring-2 ring-cyan-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setTypeFilter("water")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/25 flex items-center justify-center shrink-0">
              <Droplets size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">มิเตอร์น้ำประปา</span>
              <strong className="text-2xl font-black text-cyan-800 tracking-tight tabular-nums mt-0.5 block">
                {waterCount.toLocaleString("th-TH")} รายการ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 4: Total Units Used */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <TrendingUp size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">หน่วยรวมที่บันทึก</span>
              <strong className="text-2xl font-black text-emerald-800 tracking-tight tabular-nums mt-0.5 block">
                {Math.round(totalUnits).toLocaleString("th-TH")} หน่วย
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Property Switcher Bar (แยกหอ แบบ /guestrooms) */}
      <section aria-label="เลือกหอพัก" className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <header className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" strokeWidth={2.2} />
            <strong className="text-xs font-bold text-slate-800">เลือกหอพักเพื่อแสดงรายการมิเตอร์</strong>
          </div>
          <small className="text-xs text-slate-500 font-semibold">
            {properties.length} หอพัก · {readings.length} รายการจดมิเตอร์ในระบบ
          </small>
        </header>
        <div aria-label="รายชื่อหอพัก" className="p-3 flex gap-2.5 overflow-x-auto" role="tablist">
          {properties.map((property) => {
            const active = property.id === resolvedPropertyId;
            const propRooms = rooms.filter((r) => r.property_id === property.id);
            const propReadings = readings.filter((r) => meterMap.get(r.meter_id)?.property_id === property.id);
            return (
              <button
                aria-selected={active}
                className={`min-w-[220px] p-3.5 flex items-center gap-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                  active
                    ? "border-blue-500 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/15"
                    : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                }`}
                key={property.id}
                onClick={() => {
                  setActivePropertyId(property.id);
                  setFloor("all");
                  setQuery("");
                }}
                role="tab"
                type="button"
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${active ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"}`}>
                  <Building2 size={18} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="text-xs font-bold text-slate-900 block truncate">{property.name}</strong>
                  <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {propRooms.length} ห้อง · จดแล้ว <strong className="text-blue-600 font-bold">{propReadings.length}</strong>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Floor Filter Tabs (แยกชั้น แบบ /guestrooms) */}
      <nav aria-label="เลือกชั้น" className="p-2 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 pl-2 text-xs font-bold text-slate-600 shrink-0">
          <Layers size={14} className="text-slate-400" strokeWidth={2.2} />
          <span>ชั้น:</span>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl" role="tablist">
          <button
            aria-selected={floor === "all"}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              floor === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setFloor("all")}
            role="tab"
            type="button"
          >
            ทุกชั้น <span className={`text-[11px] font-bold ${floor === "all" ? "text-blue-600" : "text-slate-400"}`}>({propertyReadings.length})</span>
          </button>
          {floorOptions.map((option) => (
            <button
              aria-selected={floor === option.value}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                floor === option.value ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
              key={option.value}
              onClick={() => setFloor(option.value)}
              role="tab"
              type="button"
            >
              {option.label} <span className={`text-[11px] font-bold ${floor === option.value ? "text-blue-600" : "text-slate-400"}`}>({option.count})</span>
            </button>
          ))}
        </div>
      </nav>

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
        description={`แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${propertyReadings.length.toLocaleString("th-TH")} รายการ (${activeProperty?.name ?? "หอพัก"})`}
        extraFilters={
          <DateFilterControl
            availableYears={availableYears}
            mode={dateFilterMode}
            onModeChange={setDateFilterMode}
            onValueChange={setDateFilterValue}
            value={dateFilterValue}
            placeholderMonth="ทุกรอบบิล (ด/ป)"
          />
        }
        filter={{
          label: "กรองประเภท",
          value: typeFilter,
          onChange: setTypeFilter,
          options: [
            { value: "all", label: "ทุกประเภทมิเตอร์" },
            { value: "electric", label: "มิเตอร์ไฟฟ้า (Electric)" },
            { value: "water", label: "มิเตอร์น้ำประปา (Water)" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาห้อง หรือรอบเดือน (เช่น 2026-09)..."
        query={query}
        title="ประวัติการจดมิเตอร์"
      />

      {/* Content: Table or Grid */}
      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full">
            <DataTable
              headers={[
                "ห้องพัก",
                "ชั้น",
                "หอพัก",
                "ประเภทมิเตอร์",
                "รอบบิล",
                "เลขอ่านครั้งก่อน",
                "เลขอ่านครั้งนี้",
                "หน่วยที่ใช้",
                "วันที่จดจริง",
                ...(canCreate ? ["จัดการ"] : []),
              ]}
              rows={filtered.map((item) => {
                const meter = meterMap.get(item.meter_id);
                const room = roomMap.get(meter?.room_id ?? "");
                const isElectric = meter?.meter_type === "electric";
                const usage = Number(item.current_value) - Number(item.previous_value);

                return [
                  // 1. ห้องพัก
                  <div className="flex items-center gap-2.5" key="room">
                    <span className="inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-lg bg-blue-50/80 text-blue-900 border border-blue-200 text-xs font-black">
                      {room?.room_number ?? "—"}
                    </span>
                    <strong className="text-slate-900 font-bold text-xs truncate">ห้อง {room?.room_number ?? "—"}</strong>
                  </div>,

                  // 2. ชั้น
                  <span className="text-slate-700 text-xs font-semibold" key="floor">
                    {room?.floor ? `ชั้น ${room.floor}` : "ไม่ระบุ"}
                  </span>,

                  // 3. หอพัก
                  <span className="text-slate-600 text-xs font-medium" key="property">
                    {propertyMap.get(meter?.property_id ?? "") ?? "—"}
                  </span>,

                  // 4. ประเภทมิเตอร์
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-2xs ${
                      isElectric
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-cyan-50 text-cyan-800 border-cyan-200"
                    }`}
                    key="type"
                  >
                    {isElectric ? <Zap size={13} strokeWidth={2.2} /> : <Droplets size={13} strokeWidth={2.2} />}
                    {isElectric ? "ไฟฟ้า" : "น้ำประปา"}
                  </span>,

                  // 5. รอบบิล
                  <strong className="text-xs font-bold text-slate-800" key="period">
                    {formatThaiBillingMonth(item.period_month)}
                  </strong>,

                  // 6. เลขครั้งก่อน
                  <span className="text-xs font-mono font-medium text-slate-500" key="prev">
                    {Number(item.previous_value).toLocaleString("th-TH")}
                  </span>,

                  // 7. เลขครั้งนี้
                  <strong className="text-xs font-mono font-bold text-slate-900" key="curr">
                    {Number(item.current_value).toLocaleString("th-TH")}
                  </strong>,

                  // 8. หน่วยที่ใช้
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-black text-xs" key="units">
                    <span>{usage.toLocaleString("th-TH")}</span>
                    <span className="text-[10px] font-sans font-bold">หน่วย</span>
                  </div>,

                  // 9. วันที่จดจริง
                  <span className="text-xs text-slate-400" key="date">
                    {thaiDate(item.read_at)}
                  </span>,
                  ...(canCreate ? [<span key="edit">{editButton(item)}</span>] : []),
                ];
              })}
            />
          </div>
        ) : (
          <div className="space-y-8">
            {visibleFloorGroups.map((group) => (
              <section className="space-y-4" key={group.value}>
                <header className="flex items-baseline gap-2.5">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers size={16} className="text-blue-600" strokeWidth={2.2} />
                    <span>{group.label}</span>
                  </h2>
                  <span className="text-xs text-slate-400 font-semibold">({group.readings.length} รายการ)</span>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.readings.map((item) => {
                    const meter = meterMap.get(item.meter_id);
                    const room = roomMap.get(meter?.room_id ?? "");
                    const isElectric = meter?.meter_type === "electric";
                    const usage = Number(item.current_value) - Number(item.previous_value);

                    const lock = getLockStatusForReading(item);

                    return (
                      <article
                        className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                        key={item.id}
                      >
                        {/* Ambient Glow */}
                        <div
                          className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500 ${
                            isElectric ? "bg-gradient-to-bl from-amber-500/10 to-transparent" : "bg-gradient-to-bl from-cyan-500/10 to-transparent"
                          }`}
                        />

                        <div>
                          {/* Header: Room & Meter Type */}
                          <header className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-12 h-12 rounded-xl text-white font-black text-sm shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                                  isElectric
                                    ? "bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/25"
                                    : "bg-gradient-to-tr from-cyan-500 to-blue-500 shadow-cyan-500/25"
                                }`}
                              >
                                {room?.room_number ?? "—"}
                              </span>
                              <div className="min-w-0">
                                <h2 className="text-sm font-bold text-slate-900 truncate">ห้อง {room?.room_number ?? "—"}</h2>
                                <span className="text-xs text-slate-400 block truncate mt-0.5">
                                  {propertyMap.get(meter?.property_id ?? "") ?? "หอพัก"} · ชั้น {room?.floor ?? "1"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {lock.isLocked && (
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs ${lock.badgeStyle}`}
                                  title={lock.message}
                                >
                                  <Lock size={11} strokeWidth={2.2} />
                                  <span>{lock.badgeLabel}</span>
                                </span>
                              )}
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs ${
                                  isElectric
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-cyan-50 text-cyan-800 border-cyan-200"
                                }`}
                              >
                                {isElectric ? <Zap size={12} strokeWidth={2.2} /> : <Droplets size={12} strokeWidth={2.2} />}
                                {isElectric ? "ไฟฟ้า" : "น้ำประปา"}
                              </span>
                            </div>
                          </header>

                          {/* 3-Column Reading Stats Container */}
                          <div className="grid grid-cols-3 gap-2 text-center p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs mb-4">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">ก่อนหน้า</span>
                              <strong className="text-xs font-mono font-bold text-slate-600 block mt-1">
                                {Number(item.previous_value).toLocaleString("th-TH")}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">ปัจจุบัน</span>
                              <strong className="text-xs font-mono font-bold text-slate-900 block mt-1">
                                {Number(item.current_value).toLocaleString("th-TH")}
                              </strong>
                            </div>
                            <div className="bg-emerald-50/90 rounded-xl py-1 border border-emerald-200/60 shadow-2xs">
                              <span className="text-[10px] font-bold text-emerald-700 block uppercase tracking-wider">ใช้ไป</span>
                              <strong className="text-xs font-mono font-black text-emerald-800 block mt-0.5">
                                {usage.toLocaleString("th-TH")}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Footer: Period & Date */}
                        <footer className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Calendar size={13} className="text-slate-400" />
                            <span>รอบ {formatThaiBillingMonth(item.period_month)}</span>
                          </span>
                          <span>จดเมื่อ {thaiDate(item.read_at)}</span>
                        </footer>
                        {canCreate ? <div className="flex justify-end mt-2">{editButton(item)}</div> : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          description="บันทึกเลขอ่านมิเตอร์ประจำเดือนเพื่อนำไปคำนวณในใบแจ้งหนี้อัตโนมัติ"
          title="ยังไม่มีประวัติการจดมิเตอร์"
        />
      )}

      {/* Modal: Record Meter Reading */}
      {open ? (
        <Modal
          description="ระบบจะล็อกเลขอ่านครั้งก่อนหน้า และเปิดให้บันทึกเฉพาะเลขมิเตอร์รอบปัจจุบัน"
          maxWidth={600}
          onClose={() => setOpen(false)}
          title="บันทึกมิเตอร์ประจำรอบเดือน"
        >
          <PortalForm
            action={saveMeterReadingAction}
            key={draftKey}
            onCancel={() => setOpen(false)}
            onSuccess={() => setOpen(false)}
            organizationId={organizationId}
            submitLabel={
              modalLock.isLocked
                ? "ล็อกการแก้ไข (ไม่สามารถบันทึกได้)"
                : draft.mode === "edit"
                ? "บันทึกการแก้ไขเลขมิเตอร์"
                : "บันทึกเลขมิเตอร์"
            }
            submitDisabled={modalLock.isLocked}
            submitDisabledReason={modalLock.isLocked ? modalLock.message : undefined}
            validate={validateMeter}
          >
            {(errors, clear) => (
              <div className="space-y-4 text-xs">
                {/* Lock Alert Banner if active invoice exists */}
                {modalLock.isLocked ? (
                  <div
                    role="alert"
                    className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 ${
                      modalLock.reason === "paid"
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : modalLock.reason === "pending_slip"
                        ? "bg-amber-50 text-amber-900 border-amber-200"
                        : "bg-rose-50 text-rose-900 border-rose-200"
                    }`}
                  >
                    <Lock size={16} className="shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="block font-bold">ล็อกการแก้ไขมิเตอร์รอบเดือนนี้</strong>
                      <p className="mt-0.5 font-normal">{modalLock.message}</p>
                    </div>
                  </div>
                ) : null}

                {/* Value Banner */}
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles size={13} strokeWidth={2.2} />
                  </span>
                  <div className="leading-relaxed">
                    <strong className="font-bold block text-blue-950">บันทึกเลขอ่านมิเตอร์ประจำรอบ</strong>
                    <span className="text-[11px] text-blue-800/80">
                      ระบบจะค้นหาเลขอ่านครั้งก่อนหน้าให้อัตโนมัติ และนำผลต่างไปคำนวณค่าไฟ/ค่าน้ำลงในใบแจ้งหนี้
                    </span>
                  </div>
                </div>

                <input name="meterId" type="hidden" value={selectedMeter?.id ?? ""} />
                <input name="previousValue" readOnly type="hidden" value={String(draft.previousValue)} />

                {/* Property Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-500" />
                      <span>เลือกหอพัก / อาคาร</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">สาขา</span>
                  </label>
                  <SelectControl
                    ariaLabel="หอพัก"
                    name="propertyId"
                    invalid={Boolean(errors.propertyId)}
                    onValueChange={(val) => {
                      setModalPropertyId(val);
                      setModalRoomId("");
                      clear("propertyId");
                    }}
                    options={properties.map((item) => ({ value: item.id, label: item.name }))}
                    placeholder="เลือกหอพัก"
                    value={modalPropertyId}
                  />
                  {errors.propertyId ? (
                    <p role="alert" className="mt-1 text-rose-600 text-[11px] font-bold">{errors.propertyId}</p>
                  ) : null}
                </div>

                {/* Room & Meter Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <DoorOpen size={14} className="text-slate-500" />
                        <span>ห้องพัก <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">เลือกห้องที่ต้องการจด</span>
                    </label>
                    <SelectControl
                      ariaLabel="ห้องพัก"
                      name="roomId"
                      invalid={Boolean(errors.roomId)}
                      onValueChange={(val) => {
                        setModalRoomId(val);
                        clear("roomId");
                      }}
                      options={rooms
                        .filter((item) => !modalPropertyId || item.property_id === modalPropertyId)
                        .map((item) => ({
                          value: item.id,
                          label: `ห้อง ${item.room_number}`,
                        }))}
                      placeholder="เลือกห้องพัก"
                      value={modalRoomId}
                    />
                    {errors.roomId ? (
                      <p role="alert" className="mt-1 text-rose-600 text-[11px] font-bold">{errors.roomId}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        {meterType === "electric" ? (
                          <Zap size={14} className="text-amber-500" />
                        ) : (
                          <Droplets size={14} className="text-cyan-500" />
                        )}
                        <span>ประเภทมิเตอร์ <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">น้ำ / ไฟ</span>
                    </label>
                    <SelectControl
                      ariaLabel="ประเภทมิเตอร์"
                      name="meterType"
                      onValueChange={(val) => setMeterType(val)}
                      options={[
                        { value: "electric", label: "ไฟฟ้า (Electric)" },
                        { value: "water", label: "น้ำประปา (Water)" },
                      ]}
                      value={meterType}
                    />
                  </div>
                </div>

                {/* Context Status notice */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 font-medium flex items-center gap-2.5">
                  <Info size={15} className="text-blue-600 shrink-0" strokeWidth={2.2} />
                  <span>{contextMessage}</span>
                </div>

                {/* Period Month & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-500" />
                        <span>รอบเดือนที่จด <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">ประจำเดือน</span>
                    </label>
                    <DateTimeControl
                      ariaLabel="รอบเดือนที่จด"
                      defaultValue={periodMonth}
                      invalid={Boolean(errors.periodMonth)}
                      mode="month"
                      type="month"
                      name="periodMonth"
                      onValueChange={(val) => {
                        setPeriodMonth(val);
                        clear("periodMonth");
                      }}
                      placeholder="เลือกรอบเดือน"
                    />
                    {errors.periodMonth ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.periodMonth}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-500" />
                        <span>วันที่จดจริง <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">วันที่บันทึก</span>
                    </label>
                    <DateTimeControl
                      ariaLabel="วันที่จดจริง"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      invalid={Boolean(errors.recordedAt)}
                      mode="date"
                      name="recordedAt"
                      onValueChange={() => clear("recordedAt")}
                      placeholder="เลือกวันที่จดจริง"
                    />
                    {errors.recordedAt ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.recordedAt}</p>
                    ) : null}
                  </div>
                </div>

                {/* Meter Readings Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <History size={14} className="text-slate-500" />
                        <span>เลขอ่านครั้งก่อนหน้า</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">ระบบดึงให้อัตโนมัติ</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <History size={16} strokeWidth={2.2} />
                      </span>
                      <input
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-600 text-xs font-mono font-bold cursor-not-allowed outline-none"
                        defaultValue={draft.previousValue}
                        disabled
                        name="previousValueDisplay"
                        type="number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Gauge size={14} className="text-slate-500" />
                        <span>เลขอ่านครั้งนี้ (Current) <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">ต้องไม่น้อยกว่าครั้งก่อน</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Gauge size={16} strokeWidth={2.2} />
                      </span>
                      <input
                        className={`w-full h-11 pl-10 pr-3.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                          modalLock.isLocked
                            ? "bg-slate-100/90 border-slate-200 text-slate-500 cursor-not-allowed"
                            : "border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 text-slate-900 placeholder:text-slate-400"
                        }`}
                        defaultValue={draft.currentValue}
                        disabled={modalLock.isLocked}
                        min={draft.previousValue}
                        name="currentValue"
                        onChange={() => clear("currentValue")}
                        placeholder={modalLock.isLocked ? "ถูกล็อกไม่ให้แก้ไข" : "กรอกเลขอ่านปัจจุบัน"}
                        step="0.01"
                        type="number"
                      />
                    </div>
                    {errors.currentValue ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.currentValue}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </PortalForm>
        </Modal>
      ) : null}
    </div>
  );
}
