"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  DoorOpen,
  FilePlus,
  FileText,
  Hash,
  Layers,
  LayoutGrid,
  ListFilter,
  Pencil,
  Percent,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserRound,
  UserRoundCheck,
  Zap,
} from "lucide-react";
import { SelectControl } from "@/components/ui/SelectControl";
import {
  DataTable,
  DeleteButton,
  EditButton,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  StatusBadge,
} from "@/components/portal/PortalUI";
import type { PageContentProps, RoomRecord } from "../types";

export function RoomsPage({
  isLocked,
  onToast,
  meterRooms,
  activeProperty,
  properties,
  onSwitchProperty,
  onAddRoom,
  onNavigate,
}: PageContentProps) {
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [floor, setFloor] = useState("all");

  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomRent, setNewRoomRent] = useState(2500);

  const floorOptions = useMemo(() => {
    const floorMap = new Map<string, number>();
    meterRooms.forEach((r) => {
      const fl = r.number.length >= 3 ? r.number[0] : "1";
      floorMap.set(fl, (floorMap.get(fl) ?? 0) + 1);
    });
    return Array.from(floorMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value, count]) => ({ value, label: `ชั้น ${value}`, count }));
  }, [meterRooms]);

  const visibleRooms = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return meterRooms.filter((room) => {
      const isVacant = !room.tenant || room.tenant === "(ว่าง)";
      const fl = room.number.length >= 3 ? room.number[0] : "1";

      const matchesSearch = !needle || `${room.number} ${room.tenant}`.toLowerCase().includes(needle);
      const matchesStatus =
        status === "all" ||
        (status === "vacant" && isVacant) ||
        (status === "occupied" && !isVacant);
      const matchesFloor = floor === "all" || fl === floor;

      return matchesSearch && matchesStatus && matchesFloor;
    });
  }, [meterRooms, query, status, floor]);

  const visibleFloorGroups = useMemo(() => {
    const groups: { value: string; label: string; rooms: typeof visibleRooms }[] = [];
    floorOptions.forEach((opt) => {
      if (floor !== "all" && floor !== opt.value) return;
      const roomsOnFloor = visibleRooms.filter((r) => (r.number.length >= 3 ? r.number[0] : "1") === opt.value);
      if (roomsOnFloor.length > 0) {
        groups.push({ value: opt.value, label: opt.label, rooms: roomsOnFloor });
      }
    });
    return groups;
  }, [floorOptions, floor, visibleRooms]);

  const totalRooms = meterRooms.length;
  const occupiedCount = meterRooms.filter((r) => r.tenant && r.tenant !== "(ว่าง)").length;
  const vacantCount = totalRooms - occupiedCount;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;
  const selectedFloorTotal = floor === "all" ? meterRooms.length : floorOptions.find((o) => o.value === floor)?.count ?? 0;

  function handleCreateRoom() {
    if (!newRoomNumber.trim()) return;
    onAddRoom({
      number: newRoomNumber.trim(),
      tenant: "(ว่าง)",
      rent: newRoomRent,
      prevElec: 0,
      newElec: null,
      contractStart: "",
      contractEnd: "",
    });
    setNewRoomNumber("");
    setShowAddRoom(false);
    onToast(`เพิ่มห้อง ${newRoomNumber.trim()} พร้อมสร้างมิเตอร์เรียบร้อยแล้ว`);
  }

  return (
    <>
      <PageHeader
        actionLabel={!isLocked ? "เพิ่มห้องพัก" : undefined}
        description="เลือกหอพักเพื่อดู ค้นหา และจัดการห้องของแต่ละอาคารแยกจากกัน"
        onAction={() => setShowAddRoom(true)}
        title="ห้องพัก"
      />

      {/* 4-Metric Hero Stat Cards (Identical style to /users) */}
      <section aria-label="ภาพรวมห้องพัก" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Rooms */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            status === "all"
              ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setStatus("all")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0">
              <Building2 size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ห้องพักในหอนี้</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {totalRooms.toLocaleString("th-TH")} ห้อง
              </strong>
            </div>
          </div>
        </button>

        {/* Card 2: Vacant Rooms */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            status === "vacant"
              ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setStatus("vacant")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <DoorOpen size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ห้องว่างพร้อมเช่า</span>
              <strong className="text-2xl font-black text-emerald-800 tracking-tight tabular-nums mt-0.5 block">
                {vacantCount.toLocaleString("th-TH")} ห้อง
              </strong>
            </div>
          </div>
        </button>

        {/* Card 3: Occupied Rooms */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            status === "occupied"
              ? "bg-white border-purple-500 shadow-md ring-2 ring-purple-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setStatus("occupied")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 text-white shadow-md shadow-purple-500/25 flex items-center justify-center shrink-0">
              <UserRound size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">มีผู้เช่าปัจจุบัน</span>
              <strong className="text-2xl font-black text-purple-900 tracking-tight tabular-nums mt-0.5 block">
                {occupiedCount.toLocaleString("th-TH")} ห้อง
              </strong>
            </div>
          </div>
        </button>

        {/* Card 4: Occupancy Rate */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
              <Percent size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">อัตราการเข้าพัก</span>
              <strong className="text-2xl font-black text-amber-900 tracking-tight tabular-nums mt-0.5 block">
                {occupancyRate}%
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Property Switcher Bar */}
      <section aria-label="เลือกหอพัก" className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <header className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" strokeWidth={2.2} />
            <strong className="text-xs font-bold text-slate-800">เลือกหอพักเพื่อแสดงผังห้อง</strong>
          </div>
          <small className="text-xs text-slate-500 font-semibold">
            {properties.length} หอพัก · {properties.reduce((s, p) => s + p.rooms.length, 0)} ห้องทั้งหมดในระบบ
          </small>
        </header>
        <div aria-label="รายชื่อหอพัก" className="p-3 flex gap-2.5 overflow-x-auto" role="tablist">
          {properties.map((property) => {
            const propTotal = property.rooms.length;
            const propOccupied = property.rooms.filter((r) => r.tenant && r.tenant !== "(ว่าง)").length;
            const propVacant = propTotal - propOccupied;
            const rate = propTotal > 0 ? Math.round((propOccupied / propTotal) * 100) : 0;
            const active = property.id === activeProperty.id;
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
                  onSwitchProperty(property.id);
                  setQuery("");
                  setStatus("all");
                  setFloor("all");
                }}
                role="tab"
                type="button"
              >
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                    active ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Building2 size={19} strokeWidth={2.2} />
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <strong className={`text-xs font-bold truncate ${active ? "text-blue-950" : "text-slate-800"}`}>
                      {property.name}
                    </strong>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${active ? "bg-blue-200/70 text-blue-800" : "bg-slate-100 text-slate-600"}`}>
                      {rate}%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {propTotal} ห้อง · ว่าง <strong className="text-emerald-600 font-bold">{propVacant}</strong>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Floor Filter Tabs */}
      <nav aria-label="เลือกชั้น" className="mb-4 p-2 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 overflow-x-auto">
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
            ทุกชั้น <span className={`text-[11px] font-bold ${floor === "all" ? "text-blue-600" : "text-slate-400"}`}>({meterRooms.length})</span>
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

      {/* Search Bar with Dorm Name & Controls */}
      <div className="mb-5 p-4 lg:p-4.5 flex flex-wrap lg:flex-nowrap items-center gap-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col min-w-[180px] mr-auto">
          <strong className="text-slate-900 text-sm font-bold flex items-center gap-2">
            <Building2 size={15} className="text-blue-600" />
            <span>{activeProperty?.name}</span>
          </strong>
          <span className="text-slate-500 text-xs mt-0.5 font-medium">
            แสดง {visibleRooms.length} จาก {selectedFloorTotal} ห้อง
          </span>
        </div>
        <label className="flex items-center gap-2.5 px-3.5 h-10 min-w-[200px] max-w-sm flex-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/15 transition-all">
          <Search aria-hidden="true" size={16} strokeWidth={2.2} />
          <input
            aria-label="ค้นหาหมายเลขห้องหรือชั้น"
            className="w-full bg-transparent border-0 outline-none text-slate-900 text-xs font-medium placeholder:text-slate-400"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาหมายเลขห้องหรือผู้เช่า..."
            type="search"
            value={query}
          />
        </label>
        <div className="min-w-[160px]">
          <SelectControl
            ariaLabel="กรองสถานะห้อง"
            onValueChange={setStatus}
            options={[
              { value: "all", label: "ทุกสถานะ" },
              { value: "vacant", label: "ห้องว่าง (Vacant)" },
              { value: "occupied", label: "มีผู้เช่า (Occupied)" },
            ]}
            value={status}
          />
        </div>
        {query || status !== "all" || floor !== "all" ? (
          <button
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
            onClick={() => {
              setQuery("");
              setStatus("all");
              setFloor("all");
            }}
            type="button"
          >
            ล้างตัวกรอง
          </button>
        ) : null}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
          <button
            aria-label="มุมมองตาราง"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setViewMode("table")}
            type="button"
          >
            <ListFilter size={15} strokeWidth={2.2} />
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
            <LayoutGrid size={15} strokeWidth={2.2} />
            <span>การ์ด</span>
          </button>
        </div>
      </div>

      {visibleRooms.length ? (
        viewMode === "table" ? (
          <div className="w-full mb-6">
            <DataTable
              headers={["หมายเลขห้อง", "ชั้น", "ค่าเช่า / เดือน", "สถานะ", "ผู้เช่าปัจจุบัน", "การจัดการ"]}
              rows={visibleRooms.map((item) => {
                const isVacant = !item.tenant || item.tenant === "(ว่าง)";
                const fl = item.number.length >= 3 ? item.number[0] : "1";
                return [
                  <div className="inline-flex items-center justify-center min-w-12 h-8 px-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-950 text-xs font-black tabular-nums shadow-2xs" key="room">
                    <span>{item.number}</span>
                  </div>,
                  <span className="text-slate-700 text-xs font-semibold" key="floor">ชั้น {fl}</span>,
                  <strong className="text-slate-900 text-xs font-bold tabular-nums" key="rent">฿{item.rent.toLocaleString("th-TH")}.00/ด.</strong>,
                  <StatusBadge key="status" status={isVacant ? "vacant" : "occupied"} />,
                  <div className="flex flex-col text-xs" key="tenant">
                    {!isVacant ? (
                      <>
                        <strong className="text-slate-900 font-bold">{item.tenant}</strong>
                        <small className="text-slate-400 font-normal mt-0.5">สัญญาถึง {item.contractEnd || "—"}</small>
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs font-normal">— ว่าง —</span>
                    )}
                  </div>,
                  <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                    {isVacant ? (
                      <button
                        className="h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                        onClick={() => onNavigate("contracts")}
                        title="ทำสัญญาเช่าใหม่"
                        type="button"
                      >
                        <FilePlus size={14} strokeWidth={2.2} />
                        <span>ทำสัญญา</span>
                      </button>
                    ) : (
                      <button
                        className="h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                        onClick={() => onNavigate("contracts")}
                        title="ดูสัญญาเช่า"
                        type="button"
                      >
                        <FileText size={14} strokeWidth={2.2} />
                        <span>ดูสัญญา</span>
                      </button>
                    )}
                    <button
                      className="h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                      onClick={() => onNavigate("meters")}
                      title="บันทึกมิเตอร์"
                      type="button"
                    >
                      <Zap size={14} strokeWidth={2.2} />
                      <span>มิเตอร์</span>
                    </button>
                    <button
                      aria-label={`แก้ไขห้อง ${item.number}`}
                      className="w-8 h-8 rounded-xl flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                      onClick={() => onToast("เปิดแก้ไขข้อมูลห้องพัก")}
                      title="แก้ไขข้อมูลห้อง"
                      type="button"
                    >
                      <Pencil size={14} strokeWidth={2.2} />
                    </button>
                    {isVacant ? (
                      <button
                        aria-label={`ลบห้อง ${item.number}`}
                        className="w-8 h-8 rounded-xl flex items-center justify-center border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                        onClick={() => onToast("ลบห้องพักเรียบร้อยแล้ว")}
                        title="ลบห้องพัก"
                        type="button"
                      >
                        <Trash2 size={14} strokeWidth={2.2} />
                      </button>
                    ) : null}
                  </div>,
                ];
              })}
            />
          </div>
        ) : (
          visibleFloorGroups.map((group) => (
            <section className="mb-8" key={group.value}>
              <header className="mb-4 flex items-baseline gap-2.5">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers size={16} className="text-blue-600" strokeWidth={2.2} />
                  <span>{group.label}</span>
                </h2>
                <span className="text-xs text-slate-400 font-semibold">({group.rooms.length} ห้อง)</span>
              </header>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4.5 mb-6">
                {group.rooms.map((item) => {
                  const isVacant = !item.tenant || item.tenant === "(ว่าง)";
                  const fl = item.number.length >= 3 ? item.number[0] : "1";

                  return (
                    <article
                      className="p-5 flex flex-col gap-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 group"
                      key={item.number}
                    >
                      <header className="flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs text-slate-400 font-semibold">ห้อง</span>
                          <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums group-hover:text-blue-600 transition-colors">
                            {item.number}
                          </strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge compact status={isVacant ? "vacant" : "occupied"} />
                          <button
                            aria-label={`แก้ไขห้อง ${item.number}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                            onClick={() => onToast("เปิดแก้ไขห้องพัก")}
                            title="แก้ไขห้องพัก"
                            type="button"
                          >
                            <Pencil size={13} strokeWidth={2.2} />
                          </button>
                        </div>
                      </header>

                      <dl className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
                        <div>
                          <dt className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ชั้น</dt>
                          <dd className="text-xs font-bold text-slate-800 mt-0.5">{fl}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ค่าเช่า / เดือน</dt>
                          <dd className="text-xs font-black text-blue-600 mt-0.5 tabular-nums">฿{item.rent.toLocaleString("th-TH")}.00</dd>
                        </div>
                      </dl>

                      <div className="h-12 px-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs flex items-center">
                        {!isVacant ? (
                          <div className="flex items-center gap-2 text-slate-700 w-full min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                              <UserRound size={13} strokeWidth={2.2} />
                            </span>
                            <div className="flex flex-col min-w-0 truncate">
                              <strong className="font-bold text-slate-900 truncate leading-tight">{item.tenant}</strong>
                              <span className="text-slate-400 text-[10px] truncate">
                                สัญญาถึง {item.contractEnd || "—"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-[11px] font-bold w-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>ห้องว่าง พร้อมทำสัญญา</span>
                          </div>
                        )}
                      </div>

                      <footer className="mt-auto pt-3 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-2">
                          {isVacant ? (
                            <button
                              className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                              onClick={() => onNavigate("contracts")}
                              title="ทำสัญญาเช่า"
                              type="button"
                            >
                              <FilePlus size={14} strokeWidth={2.2} />
                              <span>ทำสัญญา</span>
                            </button>
                          ) : (
                            <button
                              className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                              onClick={() => onNavigate("contracts")}
                              title="ดูสัญญาเช่า"
                              type="button"
                            >
                              <FileText size={14} strokeWidth={2.2} />
                              <span>ดูสัญญา</span>
                            </button>
                          )}
                          <button
                            className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                            onClick={() => onNavigate("meters")}
                            title="บันทึกมิเตอร์"
                            type="button"
                          >
                            <Zap size={14} strokeWidth={2.2} />
                            <span>มิเตอร์</span>
                          </button>
                        </div>
                      </footer>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )
      ) : (
        <EmptyState
          actionLabel="เพิ่มห้องแรก"
          description="ยังไม่มีห้องพักในชั้นนี้หรือตามเงื่อนไขที่เลือก"
          onAction={() => setShowAddRoom(true)}
          title="ไม่พบห้องพัก"
        />
      )}

      {/* Add Room Modal */}
      {showAddRoom ? (
        <Modal
          onClose={() => setShowAddRoom(false)}
          title="เพิ่มห้องพักใหม่"
          description={`เพิ่มห้องพักในอาคาร ${activeProperty.name}`}
        >
          <div className="p-6 space-y-4 text-xs">
            {/* Helper Banner */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Sparkles size={13} strokeWidth={2.2} />
              </span>
              <div className="leading-relaxed">
                <strong className="font-bold block text-blue-950">เพิ่มห้องพักพร้อมสร้างมิเตอร์</strong>
                <span className="text-[11px] text-blue-800/80">ระบบจะผูกมิเตอร์น้ำและไฟฟ้าให้อัตโนมัติพร้อมเริ่มจดเลขได้ทันที</span>
              </div>
            </div>

            {/* Room Number Field */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>หมายเลขห้อง <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-400 font-normal">เช่น 103 หรือ A204</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Hash size={16} strokeWidth={2.2} />
                </span>
                <input
                  autoFocus
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold font-mono transition-all placeholder:text-slate-400"
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  placeholder="กรอกหมายเลขห้อง"
                  type="text"
                  value={newRoomNumber}
                />
              </div>
            </div>

            {/* Rent Field */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>ค่าเช่ารายเดือน (บาท) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-400 font-normal">บาท / เดือน</span>
              </label>
              <input
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold tabular-nums transition-all"
                onChange={(e) => setNewRoomRent(parseInt(e.target.value, 10) || 0)}
                required
                step="100"
                type="number"
                value={newRoomRent}
              />
            </div>

            <footer className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                className="px-4.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                onClick={() => setShowAddRoom(false)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-98"
                disabled={!newRoomNumber.trim()}
                onClick={handleCreateRoom}
                type="button"
              >
                <Plus size={15} strokeWidth={2.2} />
                <span>บันทึกห้องพัก</span>
              </button>
            </footer>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

