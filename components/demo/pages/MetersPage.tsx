"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  CalendarRange,
  CheckCircle2,
  DoorOpen,
  Droplets,
  Gauge,
  History,
  Info,
  Layers,
  LayoutGrid,
  List,
  Pencil,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  EmptyState,
  Modal,
  PageHeader,
} from "@/components/portal/PortalUI";
import { thaiDate } from "@/lib/format";
import { DateTimeControl } from "@/components/ui/DateTimeControl";
import { SelectControl } from "@/components/ui/SelectControl";
import type { PageContentProps, RoomRecord } from "../types";

type MeterReadingItem = {
  id: string;
  propertyId?: string;
  roomNumber: string;
  floor?: string;
  propertyName: string;
  type: "electric" | "water";
  periodMonth: string;
  previousValue: number;
  currentValue: number;
  recordedAt: string;
};

export function MetersPage({
  isLocked,
  onToast,
  meterRooms,
  onMeterChange,
  appSettings,
  activeProperty,
  properties,
}: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "electric" | "water">("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState(activeProperty?.id ?? properties[0]?.id ?? "");
  const [floor, setFloor] = useState("all");

  const currentProperty = properties.find((p) => p.id === selectedPropertyId) ?? activeProperty ?? properties[0];

  // Local meter readings list in demo with multiple floors per property
  const [readings, setReadings] = useState<MeterReadingItem[]>(() => {
    const list: MeterReadingItem[] = [];
    const propsList = properties && properties.length > 0 ? properties : [activeProperty];

    propsList.forEach((prop, pIdx) => {
      const demoRooms = [
        { number: "101", floor: "1", prevElec: 12430 + pIdx * 200, prevWater: 320 + pIdx * 15 },
        { number: "102", floor: "1", prevElec: 13120 + pIdx * 200, prevWater: 345 + pIdx * 15 },
        { number: "103", floor: "1", prevElec: 11800 + pIdx * 200, prevWater: 290 + pIdx * 15 },
        { number: "201", floor: "2", prevElec: 14560 + pIdx * 200, prevWater: 380 + pIdx * 15 },
        { number: "202", floor: "2", prevElec: 12890 + pIdx * 200, prevWater: 310 + pIdx * 15 },
        { number: "203", floor: "2", prevElec: 13450 + pIdx * 200, prevWater: 360 + pIdx * 15 },
        { number: "301", floor: "3", prevElec: 15200 + pIdx * 200, prevWater: 410 + pIdx * 15 },
        { number: "302", floor: "3", prevElec: 14110 + pIdx * 200, prevWater: 375 + pIdx * 15 },
      ];

      demoRooms.forEach((r, idx) => {
        // Electric reading
        list.push({
          id: `m-elec-${prop.id}-${r.number}`,
          propertyId: prop.id,
          roomNumber: r.number,
          floor: r.floor,
          propertyName: prop.name,
          type: "electric",
          periodMonth: "2026-08",
          previousValue: r.prevElec,
          currentValue: r.prevElec + 85 + (idx % 5) * 15,
          recordedAt: "2026-08-01",
        });
        // Water reading
        list.push({
          id: `m-water-${prop.id}-${r.number}`,
          propertyId: prop.id,
          roomNumber: r.number,
          floor: r.floor,
          propertyName: prop.name,
          type: "water",
          periodMonth: "2026-08",
          previousValue: r.prevWater,
          currentValue: r.prevWater + 12 + (idx % 3) * 4,
          recordedAt: "2026-08-01",
        });
      });
    });
    return list;
  });

  const floorKey = (item: MeterReadingItem) =>
    item.floor ? String(item.floor) : item.roomNumber.length >= 3 ? item.roomNumber[0] : "1";
  const floorLabel = (key: string) => `ชั้น ${key}`;

  const propertyReadings = useMemo(() => {
    return readings.filter(
      (item) => item.propertyId === currentProperty.id || (!item.propertyId && currentProperty.id === properties[0]?.id)
    );
  }, [readings, currentProperty.id, properties]);

  const floorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const reading of propertyReadings) {
      const key = floorKey(reading);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts, ([value, count]) => ({ value, count, label: floorLabel(value) })).sort(
      (left, right) => left.value.localeCompare(right.value, "th", { numeric: true, sensitivity: "base" })
    );
  }, [propertyReadings]);

  // Counts & Stats
  const totalCount = propertyReadings.length;
  const electricCount = propertyReadings.filter((item) => item.type === "electric").length;
  const waterCount = propertyReadings.filter((item) => item.type === "water").length;
  const totalUnits = propertyReadings.reduce((sum, item) => {
    const diff = item.currentValue - item.previousValue;
    return sum + (diff > 0 ? diff : 0);
  }, 0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return propertyReadings.filter((item) => {
      const itemFloor = floorKey(item);
      const matchesFloor = floor === "all" || itemFloor === floor;
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesSearch =
        !needle ||
        `${item.roomNumber} ${item.propertyName} ${item.periodMonth}`
          .toLowerCase()
          .includes(needle);
      return matchesFloor && matchesType && matchesSearch;
    });
  }, [propertyReadings, floor, typeFilter, query]);

  const visibleFloorGroups = useMemo(() => {
    if (floor !== "all") {
      return [{ value: floor, label: floorLabel(floor), readings: filtered }];
    }
    const groups = new Map<string, MeterReadingItem[]>();
    for (const reading of filtered) {
      const key = floorKey(reading);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(reading);
    }
    return Array.from(groups, ([value, list]) => ({
      value,
      label: floorLabel(value),
      readings: list,
    })).sort((a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" }));
  }, [floor, filtered]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<MeterReadingItem | null>(null);
  const [modalRoom, setModalRoom] = useState(meterRooms[0]?.number ?? "101");
  const [modalType, setModalType] = useState<"electric" | "water">("electric");
  const [modalPeriod, setModalPeriod] = useState("2026-08");
  const [modalPrev, setModalPrev] = useState(12430);
  const [modalCur, setModalCur] = useState(12510);
  const [modalDate, setModalDate] = useState("2026-08-01");

  function openRecordModal() {
    setEditingReading(null);
    const firstRoom = meterRooms[0]?.number ?? "101";
    setModalRoom(firstRoom);
    setModalType("electric");
    setModalPeriod("2026-08");
    const r = meterRooms.find((rm) => rm.number === firstRoom);
    const prev = r ? r.prevElec : 12430;
    setModalPrev(prev);
    setModalCur(prev + 80);
    setModalDate(new Date().toISOString().slice(0, 10));
    setModalOpen(true);
  }

  function openEditReading(item: MeterReadingItem) {
    setEditingReading(item);
    setModalRoom(item.roomNumber);
    setModalType(item.type);
    setModalPeriod(item.periodMonth);
    setModalPrev(item.previousValue);
    setModalCur(item.currentValue);
    setModalDate(item.recordedAt);
    setModalOpen(true);
  }

  function handleRoomSelectChange(num: string) {
    setModalRoom(num);
    const r = meterRooms.find((rm) => rm.number === num);
    if (modalType === "electric") {
      const prev = r ? r.prevElec : 1000;
      setModalPrev(prev);
      setModalCur(prev + 80);
    } else {
      const prev = 320;
      setModalPrev(prev);
      setModalCur(prev + 12);
    }
  }

  function handleTypeToggle(newType: "electric" | "water") {
    setModalType(newType);
    const r = meterRooms.find((rm) => rm.number === modalRoom);
    if (newType === "electric") {
      const prev = r ? r.prevElec : 1000;
      setModalPrev(prev);
      setModalCur(prev + 80);
    } else {
      const prev = 320;
      setModalPrev(prev);
      setModalCur(prev + 12);
    }
  }

  function handleSaveModal() {
    if (modalCur < modalPrev) {
      onToast("เลขมิเตอร์ครั้งนี้ต้องไม่น้อยกว่าเลขครั้งก่อน");
      return;
    }

    if (editingReading) {
      setReadings((prev) =>
        prev.map((it) =>
          it.id === editingReading.id
            ? {
                ...it,
                roomNumber: modalRoom,
                type: modalType,
                periodMonth: modalPeriod,
                previousValue: modalPrev,
                currentValue: modalCur,
                recordedAt: modalDate,
              }
            : it
        )
      );
      if (modalType === "electric") {
        onMeterChange(modalRoom, modalCur);
      }
      onToast(`แก้ไขมิเตอร์ห้อง ${modalRoom} เรียบร้อยแล้ว`);
    } else {
      const newItem: MeterReadingItem = {
        id: `m-${Date.now()}`,
        roomNumber: modalRoom,
        propertyName: activeProperty.name,
        type: modalType,
        periodMonth: modalPeriod,
        previousValue: modalPrev,
        currentValue: modalCur,
        recordedAt: modalDate,
      };
      setReadings((prev) => [newItem, ...prev]);
      if (modalType === "electric") {
        onMeterChange(modalRoom, modalCur);
      }
      onToast(`บันทึกมิเตอร์ห้อง ${modalRoom} เรียบร้อยแล้ว`);
    }
    setModalOpen(false);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        actionLabel={!isLocked ? "บันทึกมิเตอร์" : undefined}
        description="บันทึกหรือแก้ไขเลขมิเตอร์ตามรอบเดือน ระบบคำนวณหน่วยใช้งานให้อัตโนมัติ"
        onAction={openRecordModal}
        title="มิเตอร์น้ำ-ไฟ"
      />

      {/* 4 Hero Stat Cards (Matching Portal MetersPage) */}
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
              <span className="text-xs font-bold text-slate-500 block">มิเตอร์น้ำ</span>
              <strong className="text-2xl font-black text-cyan-800 tracking-tight tabular-nums mt-0.5 block">
                {waterCount.toLocaleString("th-TH")} รายการ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 4: Total Units Used */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 text-white shadow-md shadow-purple-500/25 flex items-center justify-center shrink-0">
              <TrendingUp size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">หน่วยการใช้งานรวม</span>
              <strong className="text-2xl font-black text-purple-900 tracking-tight tabular-nums mt-0.5 block">
                {totalUnits.toLocaleString("th-TH")} หน่วย
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
            const active = property.id === currentProperty.id;
            const propReadings = readings.filter(
              (r) => r.propertyId === property.id || (!r.propertyId && property.id === properties[0]?.id)
            );
            const distinctRooms = new Set(propReadings.map((r) => r.roomNumber)).size;
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
                  setSelectedPropertyId(property.id);
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
                    {distinctRooms || 8} ห้อง · จดแล้ว <strong className="text-blue-600 font-bold">{propReadings.length}</strong>
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
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100/80 border border-slate-200 gap-1">
            <button
              aria-label="มุมมองตาราง"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("table")}
              type="button"
            >
              <List size={15} strokeWidth={2.2} />
              <span>ตาราง</span>
            </button>
            <button
              aria-label="มุมมองการ์ด"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              <LayoutGrid size={15} strokeWidth={2.2} />
              <span>การ์ด</span>
            </button>
          </div>
        }
        description={`พบ ${filtered.length.toLocaleString("th-TH")} จาก ${propertyReadings.length.toLocaleString("th-TH")} รายการ (${currentProperty.name})`}
        filter={{
          label: "กรองประเภทมิเตอร์",
          value: typeFilter,
          onChange: (val) => setTypeFilter(val as "all" | "electric" | "water"),
          options: [
            { value: "all", label: "ทุกประเภทมิเตอร์" },
            { value: "electric", label: "มิเตอร์ไฟฟ้า" },
            { value: "water", label: "มิเตอร์น้ำ" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาห้องพัก หรือรอบเดือน"
        query={query}
        title="รายการจดมิเตอร์"
      />

      {/* Content: Table or Grid View */}
      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full mb-6">
            <DataTable
              headers={[
                "ห้องพัก",
                "ชั้น",
                "หอพัก",
                "ประเภทมิเตอร์",
                "รอบเดือน",
                "เลขครั้งก่อน",
                "เลขครั้งนี้",
                "หน่วยที่ใช้",
                "วันที่บันทึก",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => {
                const diff = item.currentValue - item.previousValue;
                const isElectric = item.type === "electric";
                return [
                  <div className="flex items-center gap-2.5" key="room">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 font-mono">
                      ห้อง {item.roomNumber}
                    </span>
                  </div>,
                  <span className="text-slate-700 text-xs font-semibold" key="floor">
                    {item.floor ? `ชั้น ${item.floor}` : `ชั้น ${item.roomNumber[0] ?? "1"}`}
                  </span>,
                  <span className="text-xs text-slate-500 font-medium" key="property">
                    {item.propertyName}
                  </span>,
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      isElectric
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-cyan-50 text-cyan-800 border-cyan-200"
                    }`}
                    key="type"
                  >
                    {isElectric ? <Zap size={13} /> : <Droplets size={13} />}
                    <span>{isElectric ? "ไฟฟ้า" : "น้ำประปา"}</span>
                  </span>,
                  <strong className="text-slate-800 text-xs font-bold font-mono" key="period">
                    {item.periodMonth}
                  </strong>,
                  <span className="text-slate-500 font-mono text-xs" key="prev">
                    {item.previousValue.toLocaleString("th-TH")}
                  </span>,
                  <strong className="text-slate-900 font-mono text-xs font-bold" key="cur">
                    {item.currentValue.toLocaleString("th-TH")}
                  </strong>,
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono" key="diff">
                    +{diff.toLocaleString("th-TH")} หน่วย
                  </span>,
                  <span className="text-slate-400 text-xs" key="date">
                    {item.recordedAt}
                  </span>,
                  <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                    <button
                      aria-label={`แก้ไขมิเตอร์ห้อง ${item.roomNumber}`}
                      className="h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                      onClick={() => openEditReading(item)}
                      title="แก้ไขเลขมิเตอร์"
                      type="button"
                    >
                      <Pencil size={13} strokeWidth={2.2} />
                      <span>แก้ไข</span>
                    </button>
                  </div>,
                ];
              })}
            />
          </div>
        ) : (
          <div className="space-y-8 mb-6">
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
                    const diff = item.currentValue - item.previousValue;
                    const isElectric = item.type === "electric";
                    return (
                      <article
                        className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                        key={item.id}
                      >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                        <div>
                          {/* Card Header */}
                          <header className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-mono font-black text-sm border border-blue-200 shadow-2xs shrink-0">
                                ห้อง {item.roomNumber}
                              </span>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-500 block truncate">{item.propertyName} · ชั้น {item.floor ?? item.roomNumber[0] ?? "1"}</span>
                                <span className="text-[11px] font-mono text-slate-400 block truncate">รอบ {item.periodMonth}</span>
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-2xs ${
                                isElectric
                                  ? "bg-amber-50 text-amber-800 border-amber-200/80"
                                  : "bg-cyan-50 text-cyan-800 border-cyan-200/80"
                              }`}
                            >
                              {isElectric ? <Zap size={14} /> : <Droplets size={14} />}
                              <span>{isElectric ? "ไฟฟ้า" : "น้ำประปา"}</span>
                            </span>
                          </header>

                          {/* Meter Readings Comparison Box */}
                          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-100 my-3">
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div className="border-r border-slate-200/80 pr-2">
                                <span className="text-[11px] font-medium text-slate-400 block">เลขครั้งก่อน</span>
                                <strong className="text-base font-black text-slate-600 font-mono mt-0.5 block">
                                  {item.previousValue.toLocaleString("th-TH")}
                                </strong>
                              </div>
                              <div className="pl-2">
                                <span className="text-[11px] font-medium text-slate-400 block">เลขครั้งนี้</span>
                                <strong className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                                  {item.currentValue.toLocaleString("th-TH")}
                                </strong>
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-600 flex items-center gap-1">
                                <TrendingUp size={14} className="text-emerald-600" />
                                <span>ปริมาณการใช้งาน</span>
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full font-black font-mono bg-emerald-100/80 text-emerald-800 text-xs">
                                +{diff.toLocaleString("th-TH")} หน่วย
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                            <span>จดบันทึกเมื่อ: {item.recordedAt}</span>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <footer className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                          <button
                            className="w-full h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                            onClick={() => openEditReading(item)}
                            type="button"
                          >
                            <Pencil size={14} strokeWidth={2.2} />
                            <span>แก้ไขเลขมิเตอร์</span>
                          </button>
                        </footer>
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
          actionLabel={!isLocked ? "บันทึกมิเตอร์" : undefined}
          description="ไม่พบรายการจดมิเตอร์ที่ตรงกับเงื่อนไขการค้นหา"
          onAction={openRecordModal}
          title="ไม่พบรายการจดมิเตอร์"
        />
      )}

      {/* Record / Edit Meter Modal (Matching Portal UI) */}
      {modalOpen ? (
        <Modal
          description="ระบบจะค้นหาเลขอ่านครั้งก่อนหน้าให้อัตโนมัติ และนำผลต่างไปคำนวณค่าไฟ/ค่าน้ำลงในใบแจ้งหนี้"
          maxWidth={640}
          onClose={() => setModalOpen(false)}
          title={editingReading ? `แก้ไขมิเตอร์ห้อง ${modalRoom}` : "บันทึกมิเตอร์น้ำ-ไฟ"}
        >
          <div className="p-6 flex flex-col gap-4 text-left text-xs">
            {/* Feature Intro Banner */}
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
                onValueChange={() => {}}
                options={(properties || [activeProperty]).map((p) => ({ value: p.id, label: p.name }))}
                value={activeProperty.id}
              />
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
                  disabled={Boolean(editingReading)}
                  onValueChange={(val) => handleRoomSelectChange(val)}
                  options={meterRooms.map((r) => ({
                    value: r.number,
                    label: `ห้อง ${r.number} ${r.tenant ? `(${r.tenant})` : "(ห้องว่าง)"}`,
                  }))}
                  value={modalRoom}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    {modalType === "electric" ? (
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
                  disabled={Boolean(editingReading)}
                  onValueChange={(val) => handleTypeToggle(val as "electric" | "water")}
                  options={[
                    { value: "electric", label: "ไฟฟ้า (Electric)" },
                    { value: "water", label: "น้ำประปา (Water)" },
                  ]}
                  value={modalType}
                />
              </div>
            </div>

            {/* Context Status notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 font-medium flex items-center gap-2.5">
              <Info size={15} className="text-blue-600 shrink-0" strokeWidth={2.2} />
              <span>เลขอ่านครั้งก่อนหน้าบันทึกไว้ที่ {modalPrev.toLocaleString("th-TH")} หน่วย</span>
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
                  defaultValue={modalPeriod}
                  mode="month"
                  name="modalPeriod"
                  onValueChange={(val) => setModalPeriod(val)}
                  placeholder="เลือกรอบเดือน"
                />
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
                  defaultValue={modalDate}
                  mode="date"
                  name="modalDate"
                  onValueChange={(val) => setModalDate(val)}
                  placeholder="เลือกวันที่จด"
                />
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
                    disabled
                    value={modalPrev}
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
                    autoFocus
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all placeholder:text-slate-400"
                    onChange={(e) => setModalCur(Number(e.target.value))}
                    placeholder="เช่น 1250"
                    type="number"
                    value={modalCur}
                  />
                </div>
              </div>
            </div>

            {/* Calculated Units Highlight Box */}
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles size={16} className="text-blue-600" />
                <span>คำนวณหน่วยการใช้งาน:</span>
              </span>
              <strong className="text-base font-black text-blue-700 font-mono">
                {modalCur >= modalPrev ? `+${(modalCur - modalPrev).toLocaleString("th-TH")} หน่วย` : "ตัวเลขไม่ถูกต้อง"}
              </strong>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                className="h-11 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-all"
                onClick={() => setModalOpen(false)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-500/25 transition-all"
                onClick={handleSaveModal}
                type="button"
              >
                {editingReading ? "บันทึกการแก้ไขเลขมิเตอร์" : "บันทึกเลขมิเตอร์"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
