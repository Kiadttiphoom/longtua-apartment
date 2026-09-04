"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Clock3,
  CreditCard,
  Layers,
  LayoutGrid,
  List,
  ReceiptText,
  ShieldAlert,
} from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import { DataTable, EmptyState, PageHeader, StatusBadge } from "@/components/portal/PortalUI";
import type { Invoice, Property, Room } from "@/components/portal/types";
import { money, thaiDate } from "@/lib/format";

export function ReceivablesPage({
  invoices,
  rooms,
  properties = [],
}: {
  invoices: Invoice[];
  rooms: Room[];
  properties?: Property[];
}) {
  const [activePropertyId, setActivePropertyId] = useState(() => properties[0]?.id ?? "");
  const [floor, setFloor] = useState("all");
  const [query, setQuery] = useState("");
  const [urgency, setUrgency] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const resolvedPropertyId = properties.some((p) => p.id === activePropertyId)
    ? activePropertyId
    : properties[0]?.id ?? "";
  const activeProperty = properties.find((p) => p.id === resolvedPropertyId);

  const roomMap = useMemo(() => new Map(rooms.map((item) => [item.id, item])), [rooms]);
  const outstanding = useMemo(
    () => invoices.filter((item) => Number(item.balance_due) > 0 && item.status !== "void"),
    [invoices]
  );
  const today = new Date().toISOString().slice(0, 10);

  const propertyInvoices = useMemo(
    () =>
      outstanding.filter((item) =>
        !resolvedPropertyId ? true : item.property_id === resolvedPropertyId
      ),
    [outstanding, resolvedPropertyId]
  );

  const getInvoiceFloor = (inv: Invoice) => {
    const room = roomMap.get(inv.room_id);
    return room?.floor || "1";
  };

  const floorLabel = (key: string) => `ชั้น ${key}`;

  const floorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const inv of propertyInvoices) {
      const fl = getInvoiceFloor(inv);
      counts.set(fl, (counts.get(fl) ?? 0) + 1);
    }
    return Array.from(counts, ([value, count]) => ({
      value,
      count,
      label: floorLabel(value),
    })).sort((a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" }));
  }, [propertyInvoices]);

  const overdueInvoices = useMemo(
    () => propertyInvoices.filter((item) => item.due_at < today),
    [propertyInvoices, today]
  );
  const upcomingInvoices = useMemo(
    () => propertyInvoices.filter((item) => item.due_at >= today),
    [propertyInvoices, today]
  );

  const totalOutstandingBalance = useMemo(
    () => propertyInvoices.reduce((sum, item) => sum + Number(item.balance_due), 0),
    [propertyInvoices]
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th-TH");
    return propertyInvoices.filter((item) => {
      const fl = getInvoiceFloor(item);
      const matchesFloor = floor === "all" || fl === floor;
      const overdue = item.due_at < today;
      const matchesUrgency = urgency === "all" || (urgency === "overdue" ? overdue : !overdue);
      const room = roomMap.get(item.room_id);
      const matchesSearch =
        !keyword ||
        [item.invoice_number, room?.room_number, item.note].some((value) =>
          value?.toLocaleLowerCase("th-TH").includes(keyword)
        );

      return matchesFloor && matchesUrgency && matchesSearch;
    });
  }, [propertyInvoices, floor, today, urgency, query, roomMap]);

  const visibleFloorGroups = useMemo(() => {
    if (floor !== "all") {
      return [{ value: floor, label: floorLabel(floor), invoices: filtered }];
    }
    const groups = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const fl = getInvoiceFloor(item);
      if (!groups.has(fl)) groups.set(fl, []);
      groups.get(fl)!.push(item);
    }
    return Array.from(groups, ([value, list]) => ({
      value,
      label: floorLabel(value),
      invoices: list,
    })).sort((a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" }));
  }, [floor, filtered]);

  return (
    <div className="portal-refined-page space-y-8">
      <PageHeader
        description="ติดตามใบแจ้งหนี้ที่ยังมียอดคงเหลือและเกินกำหนดชำระแบบเรียลไทม์"
        title="ยอดค้างชำระ"
      />

      {/* 4-Metric Hero Stat Cards */}
      <section aria-label="ภาพรวมยอดค้างชำระ" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Outstanding Documents */}
        <button
          aria-pressed={urgency === "all"}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/20 ${
            urgency === "all"
              ? "bg-white border-rose-500 shadow-md ring-2 ring-rose-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setUrgency("all")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/25 flex items-center justify-center shrink-0">
              <ReceiptText size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">เอกสารค้างชำระ</span>
              <strong className="text-2xl font-black text-rose-800 tracking-tight tabular-nums mt-0.5 block">
                {propertyInvoices.length.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 2: Total Outstanding Balance */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-red-600 to-rose-700 text-white shadow-md shadow-rose-500/25 flex items-center justify-center shrink-0">
              <CalendarClock size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ยอดค้างรวมทั้งหมด</span>
              <strong className="text-2xl font-black text-rose-900 tracking-tight tabular-nums mt-0.5 block">
                {money(totalOutstandingBalance)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Overdue Count & Balance */}
        <button
          aria-pressed={urgency === "overdue"}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 ${
            urgency === "overdue"
              ? "bg-white border-red-500 shadow-md ring-2 ring-red-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setUrgency("overdue")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-red-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-red-700 to-rose-800 text-white shadow-md shadow-red-500/25 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">เกินกำหนดชำระ</span>
              <strong className="text-2xl font-black text-red-700 tracking-tight tabular-nums mt-0.5 block">
                {overdueInvoices.length.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 4: Upcoming within due date */}
        <button
          aria-pressed={urgency === "upcoming"}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 ${
            urgency === "upcoming"
              ? "bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setUrgency("upcoming")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
              <Clock3 size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ยังไม่ถึงกำหนด</span>
              <strong className="text-2xl font-black text-amber-800 tracking-tight tabular-nums mt-0.5 block">
                {upcomingInvoices.length.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>
      </section>

      {/* Property Switcher Bar (แยกหอ แบบ /guestrooms) */}
      <section aria-label="เลือกหอพัก" className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <header className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" strokeWidth={2.2} />
            <strong className="text-xs font-bold text-slate-800">เลือกหอพักเพื่อแสดงยอดค้างชำระ</strong>
          </div>
          <small className="text-xs text-slate-500 font-semibold">
            {properties.length} หอพัก · {outstanding.length} เอกสารค้างชำระทั้งหมดในระบบ
          </small>
        </header>
        <div aria-label="รายชื่อหอพัก" className="p-3 flex gap-2.5 overflow-x-auto" role="tablist">
          {properties.map((property) => {
            const active = property.id === resolvedPropertyId;
            const propRooms = rooms.filter((r) => r.property_id === property.id);
            const propReceivables = outstanding.filter((inv) => inv.property_id === property.id);
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
                    {propRooms.length} ห้อง · ค้าง <strong className="text-rose-600 font-bold">{propReceivables.length}</strong> ฉบับ
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Floor Filter Tabs (แยกชั้น แบบ /guestrooms) */}
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
            ทุกชั้น <span className={`text-[11px] font-bold ${floor === "all" ? "text-blue-600" : "text-slate-400"}`}>({propertyInvoices.length})</span>
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
        description={`พบ ${filtered.length.toLocaleString("th-TH")} จาก ${propertyInvoices.length.toLocaleString("th-TH")} รายการค้าง (${activeProperty?.name ?? "หอพัก"})`}
        filter={{
          label: "กรองสถานะกำหนดชำระ",
          value: urgency,
          onChange: setUrgency,
          options: [
            { value: "all", label: "ทุกรายการค้างชำระ" },
            { value: "overdue", label: "เฉพาะที่เกินกำหนดชำระ" },
            { value: "upcoming", label: "ยังไม่ถึงกำหนดชำระ" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขที่ใบแจ้งหนี้ หรือห้องพัก..."
        query={query}
        title="รายการติดตามหนี้"
      />

      {/* Content: Table or Grid */}
      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full">
            <DataTable
              headers={[
                "เลขที่เอกสาร / ห้อง",
                "ชั้น",
                "ยอดค้างชำระ",
                "ยอดเรียกเก็บรวม",
                "กำหนดชำระ",
                "สถานะกำหนด",
                "สถานะเอกสาร",
                "การดำเนินการ",
              ]}
              rows={filtered.map((item) => {
                const overdue = item.due_at < today;
                const room = roomMap.get(item.room_id);
                const fl = getInvoiceFloor(item);
                return [
                  // 1. เอกสาร / ห้อง
                  <div className="flex items-center gap-2.5" key="inv">
                    <span
                      className={`inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-lg text-xs font-black border ${
                        overdue
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-blue-50 text-blue-900 border-blue-200"
                      }`}
                    >
                      {room?.room_number ?? "—"}
                    </span>
                    <div className="flex flex-col text-xs min-w-0">
                      <strong className="text-slate-900 font-mono font-bold block">{item.invoice_number}</strong>
                      <small className="text-slate-400">ห้อง {room?.room_number ?? "—"}</small>
                    </div>
                  </div>,

                  // 2. ชั้น
                  <span className="text-xs font-semibold text-slate-700" key="floor">
                    ชั้น {fl}
                  </span>,

                  // 3. ยอดค้างชำระ
                  <strong className="text-xs font-mono font-black text-rose-600" key="bal">
                    {money(Number(item.balance_due))}
                  </strong>,

                  // 4. ยอดเรียกเก็บรวม
                  <span className="text-xs font-mono text-slate-500" key="tot">
                    {money(Number(item.total))}
                  </span>,

                  // 5. กำหนดชำระ
                  <span className="text-xs text-slate-700 font-medium" key="due">
                    {thaiDate(item.due_at)}
                  </span>,

                  // 6. สถานะกำหนด
                  overdue ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg" key="status-urgency">
                      <AlertTriangle size={12} strokeWidth={2.2} /> เกินกำหนด
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg" key="status-urgency">
                      <Clock3 size={12} strokeWidth={2.2} /> ปกติ
                    </span>
                  ),

                  // 7. สถานะเอกสาร
                  <StatusBadge key="status" status={item.status} />,

                  // 8. การดำเนินการ
                  <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                    <Link
                      className="h-8.5 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-2xs cursor-pointer"
                      href="/payments"
                      title="ไปหน้าบันทึกรับเงิน"
                    >
                      <CreditCard size={13} strokeWidth={2.2} />
                      <span>รับชำระ</span>
                    </Link>
                  </div>,
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
                  <span className="text-xs text-slate-400 font-semibold">({group.invoices.length} รายการค้าง)</span>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.invoices.map((item) => {
                    const overdue = item.due_at < today;
                    const room = roomMap.get(item.room_id);
                    const fl = getInvoiceFloor(item);
                    return (
                      <article
                        className={`relative overflow-hidden p-6 rounded-2xl bg-white border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 ${
                          overdue ? "border-rose-200 hover:border-rose-300" : "border-slate-200/90 hover:border-blue-300"
                        }`}
                        key={item.id}
                      >
                        {/* Ambient Glow */}
                        <div
                          className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500 ${
                            overdue
                              ? "bg-gradient-to-bl from-rose-500/15 via-red-500/5 to-transparent"
                              : "bg-gradient-to-bl from-amber-500/10 via-orange-500/5 to-transparent"
                          }`}
                        />

                        <div>
                          {/* Header */}
                          <header className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-12 h-12 rounded-xl text-white font-black text-sm shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                                  overdue
                                    ? "bg-gradient-to-tr from-rose-600 to-red-600 shadow-rose-500/25"
                                    : "bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/25"
                                }`}
                              >
                                {room?.room_number ?? "—"}
                              </span>
                              <div className="min-w-0">
                                <h2 className="text-sm font-bold text-slate-900 font-mono truncate group-hover:text-rose-600 transition-colors">
                                  {item.invoice_number}
                                </h2>
                                <span className="text-xs text-slate-400 block truncate mt-0.5">
                                  ห้อง {room?.room_number ?? "—"} · ชั้น {fl}
                                </span>
                              </div>
                            </div>
                            <StatusBadge status={item.status} />
                          </header>

                          {/* Numbers Grid */}
                          <dl className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                              <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ยอดเรียกเก็บ</dt>
                              <dd className="text-base font-mono font-bold text-slate-800 mt-1">{money(Number(item.total))}</dd>
                            </div>
                            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                              <dt className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">ยอดค้างชำระ</dt>
                              <dd className="text-base font-mono font-black text-rose-600 mt-1">{money(Number(item.balance_due))}</dd>
                            </div>
                          </dl>
                        </div>

                        {/* Footer */}
                        <footer className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[11px] text-slate-400 block">ครบกำหนด</span>
                              <strong className="text-xs font-medium text-slate-800">{thaiDate(item.due_at)}</strong>
                            </div>
                            {overdue ? (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl text-[11px] border border-rose-200 shrink-0">
                                <AlertTriangle size={12} strokeWidth={2.2} /> เกินกำหนด
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl text-[11px] border border-amber-200 shrink-0">
                                <Clock3 size={12} strokeWidth={2.2} /> ปกติ
                              </span>
                            )}
                          </div>
                          <Link
                            className="w-full h-9 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 shadow-2xs transition-all hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
                            href="/payments"
                          >
                            <CreditCard aria-hidden="true" size={14} strokeWidth={2.2} />
                            <span>บันทึกรับชำระเงิน</span>
                          </Link>
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
          description="ยอดค้างชำระจะปรากฏเมื่อมีการออกใบแจ้งหนี้และยังไม่ได้รับชำระเต็มจำนวน"
          title="ไม่มียอดค้างชำระ"
        />
      )}
    </div>
  );
}
