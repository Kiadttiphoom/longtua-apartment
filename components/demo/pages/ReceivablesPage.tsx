"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Clock3,
  CreditCard,
  Download,
  Layers,
  LayoutGrid,
  List,
  MessageCircle,
  Phone,
  ReceiptText,
  Send,
  ShieldAlert,
} from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/portal/PortalUI";
import { money } from "@/lib/format";
import type { PageContentProps } from "../types";

type ReceivableItem = {
  id: string;
  propertyId: string;
  invoiceNumber: string;
  roomNumber: string;
  floor: string;
  propertyName: string;
  tenantName: string;
  tenantPhone: string;
  totalAmount: number;
  balanceDue: number;
  dueDate: string;
  overdueDays: number;
  urgency: "overdue" | "upcoming";
  lineSent: boolean;
};

export function ReceivablesPage({
  isLocked,
  onToast,
  activeProperty,
  properties = [],
}: PageContentProps) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [urgency, setUrgency] = useState("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    activeProperty?.id ?? properties[0]?.id ?? ""
  );
  const [floor, setFloor] = useState("all");

  const currentProperty =
    properties.find((p) => p.id === selectedPropertyId) ?? activeProperty ?? properties[0];

  const floorLabel = (key: string) => `ชั้น ${key}`;

  const [items, setItems] = useState<ReceivableItem[]>(() => {
    const list: ReceivableItem[] = [];
    const propsList = properties && properties.length > 0 ? properties : [activeProperty];

    propsList.forEach((prop) => {
      const demoData = [
        { room: "102", floor: "1", tenant: "อารยา พรดี", phone: "089-876-5432", billed: 3105, due: 3105, dueDate: "2026-08-05", days: 29, urgency: "overdue" as const },
        { room: "103", floor: "1", tenant: "กิตติภพ ทองแท้", phone: "081-998-7766", billed: 3154, due: 3154, dueDate: "2026-09-05", days: 0, urgency: "upcoming" as const },
        { room: "202", floor: "2", tenant: "ธนกฤต มั่งคั่ง", phone: "092-333-8888", billed: 3800, due: 2000, dueDate: "2026-08-05", days: 29, urgency: "overdue" as const },
        { room: "302", floor: "3", tenant: "อภิสิทธิ์ วงศ์ไทย", phone: "085-777-9999", billed: 4920, due: 4920, dueDate: "2026-09-05", days: 0, urgency: "upcoming" as const },
      ];

      demoData.forEach((d) => {
        list.push({
          id: `rec-${prop.id.slice(-2)}-${d.room}`,
          propertyId: prop.id,
          invoiceNumber: `INV-2569-08${d.room}`,
          roomNumber: d.room,
          floor: d.floor,
          propertyName: prop.name,
          tenantName: d.tenant,
          tenantPhone: d.phone,
          totalAmount: d.billed,
          balanceDue: d.due,
          dueDate: d.dueDate,
          overdueDays: d.days,
          urgency: d.urgency,
          lineSent: false,
        });
      });
    });
    return list;
  });

  const propertyItems = useMemo(() => {
    return items.filter((i) => i.propertyId === currentProperty.id);
  }, [items, currentProperty.id]);

  const floorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of propertyItems) {
      counts.set(item.floor, (counts.get(item.floor) ?? 0) + 1);
    }
    return Array.from(counts, ([value, count]) => ({
      value,
      count,
      label: floorLabel(value),
    })).sort((a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" }));
  }, [propertyItems]);

  const overdueItems = useMemo(() => propertyItems.filter((i) => i.urgency === "overdue"), [propertyItems]);
  const upcomingItems = useMemo(() => propertyItems.filter((i) => i.urgency === "upcoming"), [propertyItems]);
  const totalOutstandingBalance = useMemo(
    () => propertyItems.reduce((sum, item) => sum + item.balanceDue, 0),
    [propertyItems]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return propertyItems.filter((item) => {
      const matchesFloor = floor === "all" || item.floor === floor;
      const matchesUrgency = urgency === "all" || item.urgency === urgency;
      const matchesSearch =
        !needle ||
        `${item.invoiceNumber} ${item.roomNumber} ${item.tenantName} ${item.tenantPhone}`
          .toLowerCase()
          .includes(needle);
      return matchesFloor && matchesUrgency && matchesSearch;
    });
  }, [propertyItems, floor, query, urgency]);

  const visibleFloorGroups = useMemo(() => {
    if (floor !== "all") {
      return [{ value: floor, label: floorLabel(floor), items: filtered }];
    }
    const groups = new Map<string, typeof filtered>();
    for (const item of filtered) {
      if (!groups.has(item.floor)) groups.set(item.floor, []);
      groups.get(item.floor)!.push(item);
    }
    return Array.from(groups, ([value, list]) => ({
      value,
      label: floorLabel(value),
      items: list,
    })).sort((a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" }));
  }, [floor, filtered]);

  function handleSendReminder(item: ReceivableItem) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, lineSent: true } : i))
    );
    onToast(`ส่งข้อความแจ้งเตือนยอดค้างทาง LINE ไปยัง ${item.tenantName} (ห้อง ${item.roomNumber}) เรียบร้อยแล้ว`);
  }

  function handleQuickPay(item: ReceivableItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    onToast(`บันทึกรับชำระยอดค้างห้อง ${item.roomNumber} เรียบร้อยแล้ว`);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        description="ติดตามใบแจ้งหนี้ที่ยังมียอดคงเหลือและเกินกำหนดชำระแบบเรียลไทม์"
        title="ยอดค้างชำระ"
      />

      {/* 4 Hero Stat Cards (Matching Portal ReceivablesPage) */}
      <section aria-label="ภาพรวมยอดค้างชำระ" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Outstanding Invoices */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
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
                {propertyItems.length.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 2: Total Balance Due */}
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

        {/* Card 3: Overdue Count */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
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
                {overdueItems.length.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 4: Upcoming Count */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
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
                {upcomingItems.length.toLocaleString("th-TH")} ฉบับ
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
            {properties.length} หอพัก · {items.length} เอกสารค้างชำระทั้งหมดในระบบ
          </small>
        </header>
        <div aria-label="รายชื่อหอพัก" className="p-3 flex gap-2.5 overflow-x-auto" role="tablist">
          {properties.map((property) => {
            const active = property.id === currentProperty.id;
            const propReceivables = items.filter((inv) => inv.propertyId === property.id);
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
                    {property.rooms.length} ห้อง · ค้าง <strong className="text-rose-600 font-bold">{propReceivables.length}</strong> ฉบับ
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
            ทุกชั้น <span className={`text-[11px] font-bold ${floor === "all" ? "text-blue-600" : "text-slate-400"}`}>({propertyItems.length})</span>
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
        description={`พบ ${filtered.length.toLocaleString("th-TH")} จาก ${propertyItems.length.toLocaleString("th-TH")} ฉบับ (${currentProperty.name})`}
        filter={{
          label: "กรองกำหนดชำระ",
          value: urgency,
          onChange: setUrgency,
          options: [
            { value: "all", label: "ทั้งหมด" },
            { value: "overdue", label: "เกินกำหนดชำระ (Overdue)" },
            { value: "upcoming", label: "ยังไม่ถึงกำหนด (Upcoming)" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขที่ใบแจ้งหนี้ ห้อง หรือชื่อผู้เช่า"
        query={query}
        title="รายการยอดค้างชำระ"
      />

      {/* Content: Table or Grid View */}
      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full mb-6">
            <DataTable
              headers={[
                "เลขที่เอกสาร / ห้อง",
                "ชั้น",
                "ผู้เช่า / ข้อมูลติดต่อ",
                "ยอดเรียกเก็บ",
                "ยอดค้างชำระ",
                "ครบกำหนด",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => {
                const isOverdue = item.urgency === "overdue";
                return [
                  <div className="flex items-center gap-2" key="doc">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-mono font-bold border border-blue-200">
                      ห้อง {item.roomNumber}
                    </span>
                    <strong className="text-slate-900 font-mono text-xs font-bold">{item.invoiceNumber}</strong>
                  </div>,
                  <span className="text-xs font-semibold text-slate-700" key="floor">
                    ชั้น {item.floor}
                  </span>,
                  <div className="flex flex-col text-xs" key="tenant">
                    <strong className="text-slate-800 font-bold">{item.tenantName}</strong>
                    <small className="text-slate-400 font-mono">โทร. {item.tenantPhone}</small>
                  </div>,
                  <span className="text-xs font-mono text-slate-600" key="billed">
                    {money(item.totalAmount)}
                  </span>,
                  <strong className="text-xs font-mono font-black text-rose-700" key="balance">
                    {money(item.balanceDue)}
                  </strong>,
                  <div className="flex flex-col text-xs" key="due">
                    <span className="font-medium text-slate-800">{item.dueDate}</span>
                    {isOverdue ? (
                      <small className="text-rose-600 font-bold font-mono">เกินกำหนด {item.overdueDays} วัน</small>
                    ) : (
                      <small className="text-amber-600 font-medium">รอชำระ</small>
                    )}
                  </div>,
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isOverdue
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                    key="status"
                  >
                    {isOverdue ? "เกินกำหนดชำระ" : "ยังไม่ถึงกำหนด"}
                  </span>,
                  <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                    <button
                      className="h-8 px-2.5 rounded-xl flex items-center gap-1 text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                      onClick={() => handleSendReminder(item)}
                      title="ส่ง LINE ทวงถาม"
                      type="button"
                    >
                      <MessageCircle size={13} strokeWidth={2.2} />
                      <span>{item.lineSent ? "ส่งซ้ำ" : "ทวง LINE"}</span>
                    </button>
                    <button
                      className="h-8 px-2.5 rounded-xl flex items-center gap-1 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                      onClick={() => handleQuickPay(item)}
                      title="บันทึกรับชำระ"
                      type="button"
                    >
                      <CreditCard size={13} strokeWidth={2.2} />
                      <span>รับเงิน</span>
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
                  <span className="text-xs text-slate-400 font-semibold">({group.items.length} ฉบับ)</span>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.items.map((item) => {
                    const isOverdue = item.urgency === "overdue";
                    return (
                      <article
                        className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-rose-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                        key={item.id}
                      >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-rose-500/10 via-red-500/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                        <div>
                          {/* Header with Overdue Badge */}
                          <header className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-mono font-black text-sm border border-blue-200 shadow-2xs shrink-0">
                                ห้อง {item.roomNumber}
                              </span>
                              <div className="min-w-0">
                                <strong className="text-xs font-mono font-bold text-slate-900 block truncate">
                                  {item.invoiceNumber}
                                </strong>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {item.propertyName} · ชั้น {item.floor}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                                isOverdue
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {isOverdue ? <AlertTriangle size={12} /> : <Clock3 size={12} />}
                              <span>{isOverdue ? `เกินกำหนด ${item.overdueDays} วัน` : "ยังไม่ถึงกำหนด"}</span>
                            </span>
                          </header>

                          {/* Tenant Information */}
                          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 mb-3 text-xs flex items-center justify-between">
                            <div>
                              <span className="text-slate-400 block text-[11px]">ผู้เช่า</span>
                              <strong className="text-slate-800 font-bold text-sm block mt-0.5">{item.tenantName}</strong>
                            </div>
                            <span className="text-slate-500 font-mono text-xs">โทร. {item.tenantPhone}</span>
                          </div>

                          {/* Balance Callout */}
                          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between mb-3">
                            <div>
                              <span className="text-[11px] font-bold text-rose-800 block">ยอดค้างชำระ</span>
                              <strong className="text-xl font-black text-rose-800 font-mono mt-0.5 block">
                                {money(item.balanceDue)}
                              </strong>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] text-slate-400 block">ยอดเรียกเก็บเดิม</span>
                              <span className="text-xs font-mono font-bold text-slate-600 block">{money(item.totalAmount)}</span>
                            </div>
                          </div>

                          {/* Due Date & Line status */}
                          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                            <span>วันครบกำหนด: <strong className="text-slate-700 font-mono">{item.dueDate}</strong></span>
                            {item.lineSent ? (
                              <span className="text-emerald-600 font-bold text-[11px]">✓ ส่ง LINE แล้ว</span>
                            ) : null}
                          </div>
                        </div>

                        {/* Actions Footer */}
                        <footer className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2">
                          <button
                            className="h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                            onClick={() => handleSendReminder(item)}
                            type="button"
                          >
                            <MessageCircle size={14} strokeWidth={2.2} />
                            <span>{item.lineSent ? "ส่ง LINE ซ้ำ" : "ทวงถามทาง LINE"}</span>
                          </button>
                          <button
                            className="h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-2xs active:scale-95"
                            onClick={() => handleQuickPay(item)}
                            type="button"
                          >
                            <CreditCard size={14} strokeWidth={2.2} />
                            <span>บันทึกรับเงิน</span>
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
          description="ยอดค้างชำระทั้งหมดได้รับการจัดการเรียบร้อยแล้ว"
          title="ไม่พบรายการค้างชำระ"
        />
      )}
    </div>
  );
}
