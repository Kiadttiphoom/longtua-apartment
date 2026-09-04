"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
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
import { createRoomAction, deleteRoomAction, updateRoomAction } from "@/app/(portal)/resource-actions";
import {
  DataTable,
  DeleteConfirmation,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  PortalForm,
  SelectField,
  StatusBadge,
  type FieldErrors,
} from "@/components/portal/PortalUI";
import { TenantPortalAccountModal } from "@/components/portal/TenantPortalAccountModal";
import { SelectControl } from "@/components/ui/SelectControl";
import { money, thaiDate } from "@/lib/format";
import type { Lease, Property, Room, Tenant } from "@/components/portal/types";
import { buildRoomNumberRange } from "@/lib/rooms/room-number-range.mjs";
import { validateGuestroom } from "@/lib/portal/validation.mjs";
import type { TenantPortalAccountSummary } from "@/lib/portal/tenant-accounts";

const NO_FLOOR = "__no_floor__";
const floorKey = (room: Room) => room.floor?.trim() || NO_FLOOR;
const floorLabel = (value: string) => (value === NO_FLOOR ? "ไม่ระบุชั้น" : `ชั้น ${value}`);

type PortalTarget = { room: Room; tenant: Tenant };

export function GuestroomsPage({
  organizationId,
  items,
  properties,
  leases,
  tenants,
  portalAccounts,
  canCreate,
  canEdit,
  canDelete,
  canManageTenantPortal,
}: {
  organizationId: string;
  items: Room[];
  properties: Property[];
  leases: Lease[];
  tenants: Tenant[];
  portalAccounts: TenantPortalAccountSummary[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageTenantPortal: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Room | "create" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [portalTarget, setPortalTarget] = useState<PortalTarget | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activePropertyId, setActivePropertyId] = useState(properties[0]?.id ?? "");
  const [formPropertyId, setFormPropertyId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [floor, setFloor] = useState("all");
  const [prefix, setPrefix] = useState("");
  const [start, setStart] = useState("101");
  const [end, setEnd] = useState("110");
  const [padding, setPadding] = useState("0");

  const editing = selected && selected !== "create" ? selected : null;
  const propertyMap = useMemo(() => new Map(properties.map((item) => [item.id, item.name])), [properties]);
  const tenantMap = useMemo(() => new Map(tenants.map((item) => [item.id, item])), [tenants]);

  const activeLeaseMap = useMemo(() => {
    const result = new Map<string, Lease>();
    for (const lease of leases) {
      if (lease.status === "active" && !result.has(lease.room_id)) {
        result.set(lease.room_id, lease);
      }
    }
    return result;
  }, [leases]);

  const portalAccountMap = useMemo(
    () => new Map(portalAccounts.map((account) => [account.tenantId, account])),
    [portalAccounts]
  );

  const activeProperty = properties.find((item) => item.id === activePropertyId) ?? properties[0];
  const resolvedPropertyId = activeProperty?.id ?? "";

  const propertyStats = useMemo(() => {
    const stats = new Map(properties.map((item) => [item.id, { total: 0, vacant: 0, occupied: 0 }]));
    for (const room of items) {
      const value = stats.get(room.property_id);
      if (!value) continue;
      value.total += 1;
      if (room.status === "vacant") value.vacant += 1;
      if (room.status === "occupied") value.occupied += 1;
    }
    return stats;
  }, [items, properties]);

  const activeRooms = useMemo(
    () =>
      items
        .filter((room) => room.property_id === resolvedPropertyId)
        .sort((left, right) =>
          left.room_number.localeCompare(right.room_number, "th", { numeric: true, sensitivity: "base" })
        ),
    [items, resolvedPropertyId]
  );

  const floorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const room of activeRooms) {
      counts.set(floorKey(room), (counts.get(floorKey(room)) ?? 0) + 1);
    }
    return Array.from(counts, ([value, count]) => ({ value, count, label: floorLabel(value) })).sort(
      (left, right) => {
        if (left.value === NO_FLOOR) return 1;
        if (right.value === NO_FLOOR) return -1;
        return left.value.localeCompare(right.value, "th", { numeric: true, sensitivity: "base" });
      }
    );
  }, [activeRooms]);

  const visibleRooms = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("th-TH");
    return activeRooms.filter(
      (room) =>
        (floor === "all" || floorKey(room) === floor) &&
        (status === "all" || room.status === status) &&
        (!needle || `${room.room_number} ${room.floor ?? ""}`.toLocaleLowerCase("th-TH").includes(needle))
    );
  }, [activeRooms, floor, query, status]);

  const visibleFloorGroups = useMemo(
    () =>
      floorOptions
        .filter((option) => floor === "all" || option.value === floor)
        .map((option) => ({
          ...option,
          rooms: visibleRooms.filter((room) => floorKey(room) === option.value),
        }))
        .filter((group) => group.rooms.length > 0),
    [floor, floorOptions, visibleRooms]
  );

  const generated = useMemo(
    () => buildRoomNumberRange({ prefix, start, end, padding: Number(padding) }),
    [prefix, start, end, padding]
  );

  const existing = useMemo(
    () =>
      new Set(
        items
          .filter((room) => room.property_id === (formPropertyId || resolvedPropertyId))
          .map((room) => room.room_number)
      ),
    [items, formPropertyId, resolvedPropertyId]
  );

  const duplicateCount = useMemo(
    () => generated.roomNumbers.filter((roomNumber) => existing.has(roomNumber)).length,
    [generated.roomNumbers, existing]
  );

  const activeStats = propertyStats.get(resolvedPropertyId) ?? { total: 0, vacant: 0, occupied: 0 };
  const totalRooms = activeRooms.length;
  const vacantRooms = activeStats.vacant;
  const occupiedRooms = activeStats.occupied;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const selectedFloorTotal =
    floor === "all" ? activeRooms.length : floorOptions.find((o) => o.value === floor)?.count ?? 0;

  return (
    <>
      <PageHeader
        actionLabel={
          canCreate ? (properties.length ? "เพิ่มห้องพัก" : "เพิ่มหอพัก") : undefined
        }
        description="เลือกหอพักเพื่อดู ค้นหา และจัดการห้องของแต่ละอาคารแยกจากกัน"
        onAction={() => {
          if (!properties.length) {
            router.push("/dormitories");
            return;
          }
          setFormPropertyId(resolvedPropertyId);
          setSelected("create");
        }}
        title="ห้องพัก"
      />

      {properties.length ? (
        <>
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
                    {vacantRooms.toLocaleString("th-TH")} ห้อง
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
                    {occupiedRooms.toLocaleString("th-TH")} ห้อง
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
                {properties.length} หอพัก · {items.length} ห้องทั้งหมดในระบบ
              </small>
            </header>
            <div aria-label="รายชื่อหอพัก" className="p-3 flex gap-2.5 overflow-x-auto" role="tablist">
              {properties.map((property) => {
                const stats = propertyStats.get(property.id) ?? { total: 0, vacant: 0, occupied: 0 };
                const rate = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;
                const active = property.id === resolvedPropertyId;
                return (
                  <button
                    aria-controls="guestrooms-property-panel"
                    aria-selected={active}
                    className={`min-w-[220px] p-3.5 flex items-center gap-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                      active
                        ? "border-blue-500 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/15"
                        : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                    }`}
                    key={property.id}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.set("propertyId", property.id);
                      router.replace(`${pathname}?${params.toString()}`);
                      setActivePropertyId(property.id);
                      setFloor("all");
                      setQuery("");
                      setStatus("all");
                    }}
                    role="tab"
                    type="button"
                  >
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${active ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"}`}>
                      <Building2 size={19} strokeWidth={2.2} />
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <strong className={`text-xs font-bold truncate ${active ? "text-blue-950" : "text-slate-800"}`}>{property.name}</strong>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${active ? "bg-blue-200/70 text-blue-800" : "bg-slate-100 text-slate-600"}`}>
                          {rate}%
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {stats.total} ห้อง · ว่าง <strong className="text-emerald-600 font-bold">{stats.vacant}</strong>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Floor & Search Controls Section */}
          <section aria-label="รายการห้องพัก" id="guestrooms-property-panel">
            {/* Floor Filter Tabs */}
            <nav aria-label="เลือกชั้น" className="mb-4 p-2 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 overflow-x-auto">
              <div className="flex items-center gap-1.5 pl-2 text-xs font-bold text-slate-600 shrink-0">
                <Layers size={14} className="text-slate-400" strokeWidth={2.2} />
                <span>ชั้น:</span>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl" role="tablist">
                <button
                  aria-controls="guestrooms-floor-content"
                  aria-selected={floor === "all"}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    floor === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                  onClick={() => setFloor("all")}
                  role="tab"
                  type="button"
                >
                  ทุกชั้น <span className={`text-[11px] font-bold ${floor === "all" ? "text-blue-600" : "text-slate-400"}`}>({activeRooms.length})</span>
                </button>
                {floorOptions.map((option) => (
                  <button
                    aria-controls="guestrooms-floor-content"
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

            {/* Search Bar & View Mode Controls */}
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
                    { value: "maintenance", label: "ซ่อมบำรุง (Maintenance)" },
                    { value: "inactive", label: "ไม่ใช้งาน (Inactive)" },
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

            <div id="guestrooms-floor-content">
              {visibleRooms.length ? (
                viewMode === "table" ? (
                  <div className="w-full mb-6">
                    <DataTable
                      headers={[
                        "หมายเลขห้อง",
                        "ชั้น",
                        "ค่าเช่า / เดือน",
                        "สถานะ",
                        "ผู้เช่าปัจจุบัน",
                        "การจัดการ",
                      ]}
                      rows={visibleRooms.map((item) => {
                        const activeLease = activeLeaseMap.get(item.id);
                        const tenant = activeLease ? tenantMap.get(activeLease.primary_tenant_id) : undefined;
                        const portalAccount = tenant ? portalAccountMap.get(tenant.id) : undefined;

                        return [
                          <div className="inline-flex items-center justify-center min-w-12 h-8 px-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-950 text-xs font-black tabular-nums shadow-2xs" key="room">
                            <span>{item.room_number}</span>
                          </div>,
                          <span className="text-slate-700 text-xs font-semibold" key="floor">{item.floor ? `ชั้น ${item.floor}` : "ไม่ระบุ"}</span>,
                          <strong className="text-slate-900 text-xs font-bold tabular-nums" key="rent">{money(Number(item.base_rent))}/ด.</strong>,
                          <StatusBadge key="status" status={item.status} />,
                          <div className="flex flex-col text-xs" key="tenant">
                            {tenant ? (
                              <>
                                <strong className="text-slate-900 font-bold">{tenant.full_name}</strong>
                                <span className="text-slate-400 text-[10px] mt-0.5">
                                  สัญญาถึง {activeLease?.end_date ? thaiDate(activeLease.end_date) : "—"}
                                </span>
                                {portalAccount ? (
                                  <small className="text-purple-600 font-semibold text-[10px]">
                                    บัญชี: {portalAccount.username}
                                  </small>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-slate-400 text-xs font-normal">— ว่าง —</span>
                            )}
                          </div>,
                          <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                            {item.status === "vacant" ? (
                              <button
                                className="h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                                onClick={() => router.push(`/leases`)}
                                title="ทำสัญญาเช่าใหม่"
                                type="button"
                              >
                                <FilePlus size={14} strokeWidth={2.2} />
                                <span>ทำสัญญา</span>
                              </button>
                            ) : (
                              <button
                                className="h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                                onClick={() => router.push(`/leases`)}
                                title="ดูสัญญาเช่า"
                                type="button"
                              >
                                <FileText size={14} strokeWidth={2.2} />
                                <span>ดูสัญญา</span>
                              </button>
                            )}
                            <button
                              className="h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                              onClick={() => router.push(`/meters`)}
                              title="บันทึกมิเตอร์"
                              type="button"
                            >
                              <Zap size={14} strokeWidth={2.2} />
                              <span>มิเตอร์</span>
                            </button>
                            {tenant && canManageTenantPortal ? (
                              <button
                                aria-label={`${portalAccount ? "จัดการ" : "สร้าง"}บัญชีเข้าใช้ให้ ${tenant.full_name}`}
                                className="w-8 h-8 rounded-xl flex items-center justify-center border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                                onClick={() => setPortalTarget({ room: item, tenant })}
                                title={portalAccount ? "จัดการบัญชีผู้เช่า" : "สร้างบัญชีผู้เช่า"}
                                type="button"
                              >
                                <UserRoundCheck size={14} strokeWidth={2.2} />
                              </button>
                            ) : null}
                            {canEdit ? (
                              <button
                                aria-label={`แก้ไขห้อง ${item.room_number}`}
                                className="w-8 h-8 rounded-xl flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                                onClick={() => setSelected(item)}
                                title="แก้ไขข้อมูลห้อง"
                                type="button"
                              >
                                <Pencil size={14} strokeWidth={2.2} />
                              </button>
                            ) : null}
                            {canDelete && !activeLease ? (
                              <button
                                aria-label={`ลบห้อง ${item.room_number}`}
                                className="w-8 h-8 rounded-xl flex items-center justify-center border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                                onClick={() => setDeleteTarget(item)}
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
                          const activeLease = activeLeaseMap.get(item.id);
                          const tenant = activeLease ? tenantMap.get(activeLease.primary_tenant_id) : undefined;
                          const portalAccount = tenant ? portalAccountMap.get(tenant.id) : undefined;

                          return (
                            <article
                              className="p-5 flex flex-col gap-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 group"
                              data-status={item.status}
                              key={item.id}
                            >
                              <header className="flex items-center justify-between gap-2">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-xs text-slate-400 font-semibold">ห้อง</span>
                                  <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums group-hover:text-blue-600 transition-colors">
                                    {item.room_number}
                                  </strong>
                                </div>
                                <StatusBadge compact status={item.status} />
                              </header>

                              <dl className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
                                <div>
                                  <dt className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ชั้น</dt>
                                  <dd className="text-xs font-bold text-slate-800 mt-0.5">{item.floor || "ไม่ระบุ"}</dd>
                                </div>
                                <div>
                                  <dt className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ค่าเช่า / เดือน</dt>
                                  <dd className="text-xs font-black text-blue-600 mt-0.5 tabular-nums">{money(Number(item.base_rent))}</dd>
                                </div>
                              </dl>

                              <div className="h-12 px-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs flex items-center">
                                {tenant ? (
                                  <div className="flex items-center gap-2 text-slate-700 w-full min-w-0">
                                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                      <UserRound size={13} strokeWidth={2.2} />
                                    </span>
                                    <div className="flex flex-col min-w-0 truncate">
                                      <strong className="font-bold text-slate-900 truncate leading-tight">{tenant.full_name}</strong>
                                      <span className="text-slate-400 text-[10px] truncate">
                                        สัญญาถึง {activeLease?.end_date ? thaiDate(activeLease.end_date) : "—"}
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

                              <footer className="mt-auto pt-3 border-t border-slate-100 space-y-2">
                                {/* Row 1: สัญญา / มิเตอร์ */}
                                <div className="grid grid-cols-2 gap-2">
                                  {item.status === "vacant" ? (
                                    <button
                                      className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                                      onClick={() => router.push(`/leases`)}
                                      title="ทำสัญญาเช่า"
                                      type="button"
                                    >
                                      <FilePlus size={14} strokeWidth={2.2} />
                                      <span>ทำสัญญา</span>
                                    </button>
                                  ) : (
                                    <button
                                      className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                                      onClick={() => router.push(`/leases`)}
                                      title="ดูสัญญาเช่า"
                                      type="button"
                                    >
                                      <FileText size={14} strokeWidth={2.2} />
                                      <span>ดูสัญญา</span>
                                    </button>
                                  )}
                                  <button
                                    className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                                    onClick={() => router.push(`/meters`)}
                                    title="บันทึกมิเตอร์"
                                    type="button"
                                  >
                                    <Zap size={14} strokeWidth={2.2} />
                                    <span>มิเตอร์</span>
                                  </button>
                                </div>

                                {/* Row 2: จัดการห้อง / บัญชีผู้เช่า */}
                                <div className="grid grid-cols-2 gap-2">
                                  {canEdit ? (
                                    <button
                                      aria-label={`แก้ไขห้อง ${item.room_number}`}
                                      className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                                      onClick={() => setSelected(item)}
                                      title="แก้ไขห้องพัก"
                                      type="button"
                                    >
                                      <Pencil size={14} strokeWidth={2.2} />
                                      <span>แก้ไขห้อง</span>
                                    </button>
                                  ) : (
                                    <div className="h-9 rounded-xl border border-dashed border-slate-200 bg-slate-50/40" />
                                  )}
                                  {tenant && canManageTenantPortal ? (
                                    <button
                                      aria-label={`${portalAccount ? "จัดการ" : "สร้าง"}บัญชีเข้าใช้ให้ ${tenant.full_name}`}
                                      className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                                      onClick={() => setPortalTarget({ room: item, tenant })}
                                      title={portalAccount ? "จัดการบัญชีผู้เช่า" : "สร้างบัญชีผู้เช่า"}
                                      type="button"
                                    >
                                      <UserRoundCheck size={14} strokeWidth={2.2} />
                                      <span>บัญชีผู้เช่า</span>
                                    </button>
                                  ) : canDelete && !activeLease ? (
                                    <button
                                      aria-label={`ลบห้อง ${item.room_number}`}
                                      className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                                      onClick={() => setDeleteTarget(item)}
                                      title="ลบห้องพัก"
                                      type="button"
                                    >
                                      <Trash2 size={14} strokeWidth={2.2} />
                                      <span>ลบห้อง</span>
                                    </button>
                                  ) : (
                                    <div className="h-9 rounded-xl border border-dashed border-slate-200 bg-slate-50/40" />
                                  )}
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
                    description={
                      activeRooms.length
                        ? "ลองเปลี่ยนชั้น คำค้นหา หรือตัวกรองสถานะ"
                        : "กดเพิ่มห้องพักเพื่อสร้างห้องแบบช่วง เช่น 101–120"
                    }
                    title={activeRooms.length ? "ไม่พบห้องที่ค้นหา" : "หอนี้ยังไม่มีห้องพัก"}
                  />
                )}
              </div>
            </section>
          </>
        ) : (
          <EmptyState
            description="เพิ่มหอพักก่อน แล้วจึงสร้างห้องแยกตามแต่ละอาคาร"
            title="ยังไม่มีหอพัก"
          />
        )}

        {selected ? (
          <Modal
            description={
              editing
                ? "ปรับหมายเลข ชั้น ค่าเช่า หรือสถานะห้อง"
                : "กำหนดช่วงหมายเลข ระบบจะสร้างมิเตอร์น้ำและไฟให้ทุกห้องโดยอัตโนมัติ"
            }
            onClose={() => setSelected(null)}
            title={editing ? `แก้ไขห้อง ${editing.room_number}` : "เพิ่มห้องพักหลายห้อง"}
          >
            <PortalForm
              action={editing ? updateRoomAction : createRoomAction}
              onCancel={() => setSelected(null)}
              onSuccess={() => setSelected(null)}
              organizationId={organizationId}
              submitLabel={
                editing
                  ? "บันทึกการแก้ไข"
                  : `เพิ่ม ${Math.max(0, generated.roomNumbers.length - duplicateCount)} ห้อง`
              }
              validate={(values) => {
                const errors = validateGuestroom(values) as unknown as FieldErrors;
                if (editing) {
                  if (!String(values.roomNumber ?? "").trim()) {
                    errors.roomNumber = "กรุณากรอกหมายเลขห้อง";
                  }
                  if (values.status === "vacant" && activeLeaseMap.get(editing.id)) {
                    errors.status = "ห้องนี้มีสัญญาเช่าที่ยังมีผลอยู่ กรุณาสิ้นสุดหรือยกเลิกสัญญาก่อนเปลี่ยนเป็นห้องว่าง";
                  }
                } else {
                  if (generated.error) errors.roomNumbers = generated.error;
                  else if (generated.roomNumbers.length === duplicateCount) {
                    errors.roomNumbers = "หมายเลขห้องทั้งหมดมีอยู่แล้ว";
                  }
                }
                return errors;
              }}
            >
              {(errors, clear) =>
                editing ? (
                  <div className="space-y-4 text-xs">
                    <input name="roomId" type="hidden" value={editing.id} />
                    <input name="propertyId" type="hidden" value={editing.property_id} />
                    {activeLeaseMap.get(editing.id) ? (
                      <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" strokeWidth={2.2} />
                        <div className="leading-relaxed">
                          <strong className="font-bold text-amber-950 block">ห้องนี้มีสัญญาเช่าที่กำลังใช้งานอยู่</strong>
                          <p className="text-[11px] text-amber-800/90 mt-0.5">
                            สัญญาเลขที่ {activeLeaseMap.get(editing.id)?.lease_number} · หากต้องการเปลี่ยนสถานะเป็นห้องว่าง กรุณาสิ้นสุดหรือยกเลิกสัญญาเช่าที่เมนูสัญญาเช่าก่อน
                          </p>
                        </div>
                      </div>
                    ) : null}
                    
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Building2 size={14} className="text-slate-400" />
                        <span>หอพักสังกัด</span>
                      </span>
                      <strong className="text-slate-900 font-bold">{propertyMap.get(editing.property_id)}</strong>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <Field
                        clear={clear}
                        defaultValue={editing.room_number}
                        error={errors.roomNumber}
                        label="หมายเลขห้อง"
                        name="roomNumber"
                        required
                      />
                      <Field
                        clear={clear}
                        defaultValue={editing.floor}
                        error={errors.floor}
                        label="ชั้น"
                        name="floor"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <Field
                        clear={clear}
                        defaultValue={editing.base_rent}
                        error={errors.baseRent}
                        label="ค่าเช่าต่อเดือน (บาท)"
                        min={0}
                        name="baseRent"
                        required
                        step="0.01"
                        type="number"
                      />
                      <SelectField
                        clear={clear}
                        defaultValue={editing.status}
                        error={errors.status}
                        label="สถานะห้อง"
                        name="status"
                        options={
                          activeLeaseMap.get(editing.id)
                            ? [
                                { value: "occupied", label: "มีผู้เช่า (สัญญาใช้งานอยู่)" },
                                { value: "maintenance", label: "ซ่อมบำรุง" },
                                { value: "inactive", label: "ไม่ใช้งาน" },
                              ]
                            : [
                                { value: "vacant", label: "ว่าง (Vacant)" },
                                { value: "occupied", label: "มีผู้เช่า (Occupied)" },
                                { value: "maintenance", label: "ซ่อมบำรุง (Maintenance)" },
                                { value: "inactive", label: "ไม่ใช้งาน (Inactive)" },
                              ]
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    {/* Helper Banner */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Sparkles size={13} strokeWidth={2.2} />
                      </span>
                      <div className="leading-relaxed">
                        <strong className="font-bold block text-blue-950">สร้างห้องชุดแบบช่วง (Batch Creation)</strong>
                        <span className="text-[11px] text-blue-800/80">ระบบจะสร้างมิเตอร์น้ำและมิเตอร์ไฟให้อัตโนมัติทุกห้องที่สร้างใหม่</span>
                      </div>
                    </div>

                    {/* Property Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-slate-500" />
                          <span>หอพักที่ต้องการเพิ่มห้อง <span className="text-rose-500">*</span></span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">เลือกอาคาร</span>
                      </label>
                      <input name="propertyId" type="hidden" value={formPropertyId || resolvedPropertyId} />
                      <SelectControl
                        ariaLabel="หอพักที่ต้องการเพิ่มห้อง"
                        onValueChange={(val) => {
                          setFormPropertyId(val);
                          clear("propertyId");
                        }}
                        options={properties.map((item) => ({ value: item.id, label: item.name }))}
                        value={formPropertyId || resolvedPropertyId}
                      />
                      {errors.propertyId ? (
                        <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.propertyId}</p>
                      ) : null}
                    </div>

                    {/* Prefix & Padding */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Hash size={14} className="text-slate-500" />
                            <span>คำนำหน้า (Prefix)</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">เช่น A หรือ B</span>
                        </label>
                        <input
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all placeholder:text-slate-400"
                          onChange={(event) => {
                            setPrefix(event.target.value);
                            clear("roomNumbers");
                          }}
                          placeholder="เช่น A (เว้นว่างได้)"
                          value={prefix}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                          <span>จำนวนหลักตัวเลข</span>
                          <span className="text-[11px] text-slate-400 font-normal">Padding</span>
                        </label>
                        <SelectControl
                          ariaLabel="จำนวนหลักตัวเลข"
                          onValueChange={(nextValue) => {
                            setPadding(nextValue);
                            clear("roomNumbers");
                          }}
                          options={[
                            { value: "0", label: "อัตโนมัติ (เช่น 101)" },
                            { value: "2", label: "2 หลัก (เช่น 01)" },
                            { value: "3", label: "3 หลัก (เช่น 001)" },
                            { value: "4", label: "4 หลัก (เช่น 0001)" },
                          ]}
                          value={padding}
                        />
                      </div>
                    </div>

                    {/* Start & End Room Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                          <span>เลขเริ่มต้น <span className="text-rose-500">*</span></span>
                          <span className="text-[11px] text-slate-400 font-normal">เช่น 101</span>
                        </label>
                        <input
                          aria-invalid={Boolean(errors.roomNumbers)}
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold font-mono transition-all"
                          min="0"
                          onChange={(event) => {
                            setStart(event.target.value);
                            clear("roomNumbers");
                          }}
                          type="number"
                          value={start}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                          <span>เลขสิ้นสุด <span className="text-rose-500">*</span></span>
                          <span className="text-[11px] text-slate-400 font-normal">เช่น 110</span>
                        </label>
                        <input
                          aria-invalid={Boolean(errors.roomNumbers)}
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold font-mono transition-all"
                          min="0"
                          onChange={(event) => {
                            setEnd(event.target.value);
                            clear("roomNumbers");
                          }}
                          type="number"
                          value={end}
                        />
                      </div>
                    </div>

                    {errors.roomNumbers ? (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                        <AlertCircle size={16} className="text-rose-600 shrink-0" strokeWidth={2.2} />
                        <span>{errors.roomNumbers}</span>
                      </div>
                    ) : null}

                    {/* Floor & Base Rent */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Layers size={14} className="text-slate-500" />
                            <span>ชั้นที่ระบุ</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">เช่น 1</span>
                        </label>
                        <input
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all placeholder:text-slate-400"
                          name="floor"
                          placeholder="เช่น 1 (เว้นว่างได้)"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                          <span>ค่าเช่าต่อเดือน (บาท) <span className="text-rose-500">*</span></span>
                          <span className="text-[11px] text-slate-400 font-normal">บาท / เดือน</span>
                        </label>
                        <input
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold tabular-nums transition-all"
                          defaultValue="3500"
                          min="0"
                          name="baseRent"
                          placeholder="เช่น 3500"
                          required
                          step="0.01"
                          type="number"
                        />
                        {errors.baseRent ? (
                          <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.baseRent}</p>
                        ) : null}
                      </div>
                    </div>

                    <input
                      name="roomNumbers"
                      type="hidden"
                      value={JSON.stringify(generated.roomNumbers)}
                    />

                    {/* Room Chips Preview */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Hash size={14} className="text-blue-600" strokeWidth={2.2} />
                          <span>ตัวอย่างหมายเลขห้องที่จะสร้าง</span>
                        </strong>
                        <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                          {generated.error ??
                            `สร้างใหม่ ${generated.roomNumbers.length - duplicateCount} ห้อง · ซ้ำ ${duplicateCount}`}
                        </span>
                      </div>

                      {!generated.error ? (
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                          {generated.roomNumbers.slice(0, 20).map((roomNumber: string) => {
                            const isDup = existing.has(roomNumber);
                            return (
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                                  isDup
                                    ? "bg-rose-100 text-rose-700 border border-rose-200 line-through opacity-70"
                                    : "bg-white text-blue-900 border border-blue-200 shadow-2xs"
                                }`}
                                key={roomNumber}
                              >
                                {roomNumber}
                              </span>
                            );
                          })}
                          {generated.roomNumbers.length > 20 ? (
                            <span className="px-2 py-1 text-xs font-bold text-slate-400">
                              +{generated.roomNumbers.length - 20} ห้อง
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              }
            </PortalForm>
          </Modal>
        ) : null}

      {deleteTarget ? (
        <DeleteConfirmation
          action={deleteRoomAction}
          detail="มิเตอร์ที่ยังไม่มีประวัติจะถูกลบพร้อมห้อง หากห้องนี้มีสัญญา ใบแจ้งหนี้ หรือประวัติมิเตอร์ ระบบจะไม่อนุญาตให้ลบ"
          entityField="roomId"
          entityId={deleteTarget.id}
          onClose={() => setDeleteTarget(null)}
          organizationId={organizationId}
          subject={`กำลังจะลบห้อง “${deleteTarget.room_number}”`}
          submitLabel="ยืนยันลบห้อง"
          title={`ลบห้อง ${deleteTarget.room_number}?`}
        />
      ) : null}

      {portalTarget ? (
        <TenantPortalAccountModal
          account={portalAccountMap.get(portalTarget.tenant.id)}
          onClose={() => setPortalTarget(null)}
          organizationId={organizationId}
          roomNumber={portalTarget.room.room_number}
          tenant={portalTarget.tenant}
        />
      ) : null}
    </>
  );
}
