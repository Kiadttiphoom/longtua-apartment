"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  Droplets,
  Eye,
  FileText,
  Home,
  Layers,
  LayoutGrid,
  List,
  Pencil,
  Printer,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  EmptyState,
  Modal,
  PageHeader,
  StatusBadge,
} from "@/components/portal/PortalUI";
import { DateTimeControl } from "@/components/ui/DateTimeControl";
import { SelectControl } from "@/components/ui/SelectControl";
import { money, thaiBahtText, thaiDate } from "@/lib/format";
import type { PageContentProps, RoomRecord } from "../types";

type DemoInvoice = {
  id: string;
  propertyId: string;
  invoiceNumber: string;
  roomNumber: string;
  floor: string;
  propertyName: string;
  tenant: string;
  tenantPhone: string;
  periodMonth: string;
  issueDate: string;
  dueDate: string;
  rentAmount: number;
  waterUnits: number;
  waterRate: number;
  waterAmount: number;
  electricUnits: number;
  electricRate: number;
  electricAmount: number;
  otherAmount: number;
  totalAmount: number;
  balanceDue: number;
  status: "issued" | "paid" | "partial" | "overdue" | "void";
  note: string;
};

export function InvoicesPage({
  isLocked,
  onToast,
  meterRooms,
  activeProperty,
  properties,
  appSettings,
  onViewInvoice,
}: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState(activeProperty?.id ?? properties[0]?.id ?? "");
  const [floor, setFloor] = useState("all");

  const currentProperty = properties.find((p) => p.id === selectedPropertyId) ?? activeProperty ?? properties[0];

  const floorLabel = (key: string) => `ชั้น ${key}`;

  // Local demo invoices
  const [invoices, setInvoices] = useState<DemoInvoice[]>(() => {
    const list: DemoInvoice[] = [];
    const propsList = properties && properties.length > 0 ? properties : [activeProperty];

    propsList.forEach((prop) => {
      const demoData = [
        { room: "101", floor: "1", tenant: "สมมุต ศรีสระเกษ", phone: "089-123-4567", rent: 3500, elec: 80, water: 150, status: "paid" as const, due: 0 },
        { room: "102", floor: "1", tenant: "อารยา พรดี", phone: "089-876-5432", rent: 3500, elec: 65, water: 150, status: "overdue" as const, due: 4105 },
        { room: "201", floor: "2", tenant: "กิตติภพ ทองแท้", phone: "081-998-7766", rent: 3800, elec: 72, water: 150, status: "issued" as const, due: 4454 },
        { room: "202", floor: "2", tenant: "ธนกฤต มั่งคั่ง", phone: "092-333-8888", rent: 3800, elec: 90, water: 150, status: "partial" as const, due: 2000 },
        { room: "301", floor: "3", tenant: "ปรียานุช รุ่งเรือง", phone: "084-222-1111", rent: 4000, elec: 85, water: 150, status: "paid" as const, due: 0 },
        { room: "302", floor: "3", tenant: "อภิสิทธิ์ วงศ์ไทย", phone: "085-777-9999", rent: 4000, elec: 110, water: 150, status: "issued" as const, due: 4920 },
      ];

      demoData.forEach((d) => {
        const elecAmount = d.elec * 7;
        const total = d.rent + d.water + elecAmount;
        list.push({
          id: `inv-${prop.id.slice(-2)}-${d.room}`,
          propertyId: prop.id,
          invoiceNumber: `INV-2569-${d.room}`,
          roomNumber: d.room,
          floor: d.floor,
          propertyName: prop.name,
          tenant: d.tenant,
          tenantPhone: d.phone,
          periodMonth: "2026-08",
          issueDate: "2026-08-01",
          dueDate: "2026-08-05",
          rentAmount: d.rent,
          waterUnits: 1,
          waterRate: 150,
          waterAmount: d.water,
          electricUnits: d.elec,
          electricRate: 7,
          electricAmount: elecAmount,
          otherAmount: 0,
          totalAmount: total,
          balanceDue: d.due === 0 ? 0 : d.due,
          status: d.status,
          note: d.status === "paid" ? "ชำระเงินเรียบร้อยแล้ว" : "กรุณาชำระเงินภายในวันที่กำหนด",
        });
      });
    });
    return list;
  });

  const propertyInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.propertyId === currentProperty.id);
  }, [invoices, currentProperty.id]);

  const floorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const inv of propertyInvoices) {
      counts.set(inv.floor, (counts.get(inv.floor) ?? 0) + 1);
    }
    return Array.from(counts, ([value, count]) => ({
      value,
      count,
      label: floorLabel(value),
    })).sort((a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" }));
  }, [propertyInvoices]);

  // Modal states
  const [viewingInvoice, setViewingInvoice] = useState<DemoInvoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<DemoInvoice | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [formRoom, setFormRoom] = useState("101");
  const [formTenant, setFormTenant] = useState("สมมุต ศรีสระเกษ");
  const [formMonth, setFormMonth] = useState("2026-08");
  const [formRent, setFormRent] = useState(2500);
  const [formWater, setFormWater] = useState(150);
  const [formElecUnits, setFormElecUnits] = useState(70);
  const [formElecRate, setFormElecRate] = useState(7);
  const [formDueDate, setFormDueDate] = useState("2026-08-05");
  const [formStatus, setFormStatus] = useState<DemoInvoice["status"]>("issued");

  // Stats
  const totalCount = propertyInvoices.length;
  const totalBilled = propertyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = propertyInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.balanceDue), 0);
  const totalBalanceDue = propertyInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return propertyInvoices.filter((item) => {
      const matchesFloor = floor === "all" || item.floor === floor;
      const matchesSearch =
        !needle ||
        `${item.invoiceNumber} ${item.roomNumber} ${item.tenant} ${item.note}`
          .toLowerCase()
          .includes(needle);
      const matchesStatus =
        status === "all"
          ? true
          : status === "issued"
          ? item.status === "issued" || item.status === "overdue"
          : item.status === status;
      return matchesFloor && matchesSearch && matchesStatus;
    });
  }, [propertyInvoices, floor, query, status]);

  const visibleFloorGroups = useMemo(() => {
    if (floor !== "all") {
      return [{ value: floor, label: floorLabel(floor), invoices: filtered }];
    }
    const groups = new Map<string, typeof filtered>();
    for (const inv of filtered) {
      if (!groups.has(inv.floor)) groups.set(inv.floor, []);
      groups.get(inv.floor)!.push(inv);
    }
    return Array.from(groups, ([value, list]) => ({
      value,
      label: floorLabel(value),
      invoices: list,
    })).sort((a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" }));
  }, [floor, filtered]);

  function openCreateModal() {
    setIsCreating(true);
    setEditingInvoice(null);
    const r = meterRooms[0] || { number: "101", tenant: "สมมุต ศรีสระเกษ", rent: 2500 };
    setFormRoom(r.number);
    setFormTenant(r.tenant || "ผู้เช่าใหม่");
    setFormMonth("2026-08");
    setFormRent(r.rent || 2500);
    setFormWater(150);
    setFormElecUnits(80);
    setFormElecRate(7);
    setFormDueDate("2026-08-05");
    setFormStatus("issued");
  }

  function openEditModal(inv: DemoInvoice) {
    setEditingInvoice(inv);
    setIsCreating(false);
    setFormRoom(inv.roomNumber);
    setFormTenant(inv.tenant);
    setFormMonth(inv.periodMonth);
    setFormRent(inv.rentAmount);
    setFormWater(inv.waterAmount);
    setFormElecUnits(inv.electricUnits);
    setFormElecRate(inv.electricRate);
    setFormDueDate(inv.dueDate);
    setFormStatus(inv.status);
  }

  function handleSaveForm() {
    const electricAmount = formElecUnits * formElecRate;
    const totalAmount = Number(formRent) + Number(formWater) + electricAmount;
    const balanceDue = formStatus === "paid" ? 0 : totalAmount;

    if (editingInvoice) {
      setInvoices((prev) =>
        prev.map((it) =>
          it.id === editingInvoice.id
            ? {
                ...it,
                roomNumber: formRoom,
                tenant: formTenant,
                periodMonth: formMonth,
                rentAmount: Number(formRent),
                waterAmount: Number(formWater),
                electricUnits: Number(formElecUnits),
                electricRate: Number(formElecRate),
                electricAmount,
                totalAmount,
                balanceDue,
                dueDate: formDueDate,
                status: formStatus,
              }
            : it
        )
      );
      onToast(`แก้ไขใบแจ้งหนี้ ${editingInvoice.invoiceNumber} เรียบร้อยแล้ว`);
    } else {
      const newInv: DemoInvoice = {
        id: `inv-${Date.now()}`,
        propertyId: currentProperty.id,
        invoiceNumber: `INV-2569-08${formRoom}`,
        roomNumber: formRoom,
        floor: formRoom.length >= 3 ? formRoom.slice(0, 1) : "1",
        propertyName: currentProperty.name,
        tenant: formTenant,
        tenantPhone: "08X-XXX-XXXX",
        periodMonth: formMonth,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: formDueDate,
        rentAmount: Number(formRent),
        waterUnits: 1,
        waterRate: Number(formWater),
        waterAmount: Number(formWater),
        electricUnits: Number(formElecUnits),
        electricRate: Number(formElecRate),
        electricAmount,
        otherAmount: 0,
        totalAmount,
        balanceDue,
        status: formStatus,
        note: "กรุณาชำระเงินภายในกำหนด",
      };
      setInvoices((prev) => [newInv, ...prev]);
      onToast(`ออกใบแจ้งหนี้ห้อง ${formRoom} เรียบร้อยแล้ว`);
    }
    setIsCreating(false);
    setEditingInvoice(null);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        actionLabel={!isLocked ? "ออกใบแจ้งหนี้" : undefined}
        description="คำนวณค่าเช่า ค่าน้ำ และค่าไฟจากสัญญาและมิเตอร์ของรอบเดือนโดยอัตโนมัติ"
        onAction={openCreateModal}
        title="ใบแจ้งหนี้"
      />

      {/* 4 Hero Stat Cards (Matching Portal InvoicesPage) */}
      <section aria-label="ภาพรวมใบแจ้งหนี้" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Invoices */}
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
              <ReceiptText size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ใบแจ้งหนี้ทั้งหมด</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {totalCount.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 2: Total Billed Amount */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-700 to-blue-800 text-white shadow-md shadow-slate-500/25 flex items-center justify-center shrink-0">
              <FileText size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ยอดเรียกเก็บรวม</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {money(totalBilled)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Paid Amount */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            status === "paid"
              ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setStatus("paid")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">รับชำระแล้ว</span>
              <strong className="text-2xl font-black text-emerald-800 tracking-tight tabular-nums mt-0.5 block">
                {money(totalPaid)}
              </strong>
            </div>
          </div>
        </button>

        {/* Card 4: Outstanding Balance */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            status === "issued" || status === "overdue"
              ? "bg-white border-rose-500 shadow-md ring-2 ring-rose-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setStatus(status === "issued" ? "all" : "issued")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/25 flex items-center justify-center shrink-0">
              <CalendarClock size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ยอดค้างชำระ</span>
              <strong className="text-2xl font-black text-rose-800 tracking-tight tabular-nums mt-0.5 block">
                {money(totalBalanceDue)}
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
            <strong className="text-xs font-bold text-slate-800">เลือกหอพักเพื่อแสดงใบแจ้งหนี้</strong>
          </div>
          <small className="text-xs text-slate-500 font-semibold">
            {properties.length} หอพัก · {invoices.length} ใบแจ้งหนี้ทั้งหมดในระบบ
          </small>
        </header>
        <div aria-label="รายชื่อหอพัก" className="p-3 flex gap-2.5 overflow-x-auto" role="tablist">
          {properties.map((property) => {
            const active = property.id === currentProperty.id;
            const propInvoices = invoices.filter((inv) => inv.propertyId === property.id);
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
                    {property.rooms.length} ห้อง · บิล <strong className="text-blue-600 font-bold">{propInvoices.length}</strong> ฉบับ
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
        description={`พบ ${filtered.length.toLocaleString("th-TH")} จาก ${propertyInvoices.length.toLocaleString("th-TH")} ฉบับ (${currentProperty.name})`}
        filter={{
          label: "กรองสถานะใบแจ้งหนี้",
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "ทุกสถานะ" },
            { value: "issued", label: "รอชำระ (Issued)" },
            { value: "paid", label: "ชำระแล้ว (Paid)" },
            { value: "overdue", label: "เกินกำหนด (Overdue)" },
            { value: "void", label: "ยกเลิก (Void)" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขที่ใบแจ้งหนี้ ห้อง หรือหมายเหตุ"
        query={query}
        title="รายการใบแจ้งหนี้"
      />

      {/* Content: Table or Grid View */}
      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full mb-6">
            <DataTable
              headers={[
                "เลขที่เอกสาร / ห้อง",
                "ชั้น",
                "ผู้เช่า",
                "ค่าเช่า",
                "ค่าน้ำ",
                "ค่าไฟ",
                "ยอดรวม",
                "ยอดคงเหลือ",
                "ครบกำหนด",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => [
                <div className="flex items-center gap-2.5" key="doc">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 font-mono">
                    ห้อง {item.roomNumber}
                  </span>
                  <div className="flex flex-col text-xs min-w-0">
                    <strong className="text-slate-900 font-mono font-bold">{item.invoiceNumber}</strong>
                    <small className="text-slate-400">{item.periodMonth}</small>
                  </div>
                </div>,
                <span className="text-xs font-semibold text-slate-700" key="floor">
                  ชั้น {item.floor}
                </span>,
                <div className="flex flex-col text-xs" key="tenant">
                  <strong className="text-slate-800 font-bold">{item.tenant}</strong>
                  <small className="text-slate-400 font-mono">{item.tenantPhone}</small>
                </div>,
                <span className="text-xs font-mono text-slate-700" key="rent">
                  {money(item.rentAmount)}
                </span>,
                <span className="text-xs font-mono text-slate-700" key="water">
                  {money(item.waterAmount)}
                </span>,
                <span className="text-xs font-mono text-slate-700" key="elec">
                  {money(item.electricAmount)}
                </span>,
                <strong className="text-xs font-mono font-black text-slate-900" key="total">
                  {money(item.totalAmount)}
                </strong>,
                <span
                  className={`text-xs font-mono font-bold ${
                    item.balanceDue > 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                  key="balance"
                >
                  {money(item.balanceDue)}
                </span>,
                <span className="text-xs text-slate-600 font-medium" key="due">
                  {item.dueDate}
                </span>,
                <StatusBadge key="status" status={item.status} />,
                <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                  <button
                    className="h-8 px-2.5 rounded-xl flex items-center gap-1 text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                    onClick={() => setViewingInvoice(item)}
                    title="ดูใบแจ้งหนี้"
                    type="button"
                  >
                    <Eye size={13} strokeWidth={2.2} />
                    <span>ดูบิล</span>
                  </button>
                  <button
                    aria-label={`แก้ไขบิล ${item.invoiceNumber}`}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                    onClick={() => openEditModal(item)}
                    title="แก้ไขใบแจ้งหนี้"
                    type="button"
                  >
                    <Pencil size={13} strokeWidth={2.2} />
                  </button>
                </div>,
              ])}
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
                  <span className="text-xs text-slate-400 font-semibold">({group.invoices.length} ใบแจ้งหนี้)</span>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.invoices.map((item) => (
                    <article
                      className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                      key={item.id}
                    >
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                      <div>
                        {/* Header */}
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
                                {item.propertyName} · ชั้น {item.floor} · รอบ {item.periodMonth}
                              </span>
                            </div>
                          </div>
                          <StatusBadge status={item.status} />
                        </header>

                        {/* Tenant */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100 mb-3 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">ผู้เช่า</span>
                            <strong className="text-slate-800 font-bold">{item.tenant}</strong>
                          </div>
                          <span className="text-slate-500 font-mono">{item.tenantPhone}</span>
                        </div>

                        {/* Charges Breakdown */}
                        <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 text-xs mb-3">
                          <div className="flex items-center justify-between text-slate-600">
                            <span>ค่าเช่าห้อง</span>
                            <span className="font-mono font-medium">{money(item.rentAmount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span>ค่าน้ำประปา</span>
                            <span className="font-mono font-medium">{money(item.waterAmount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span>ค่าไฟฟ้า ({item.electricUnits} หน่วย)</span>
                            <span className="font-mono font-medium">{money(item.electricAmount)}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between font-bold text-slate-900">
                            <span>ยอดรวมทั้งสิ้น</span>
                            <span className="font-mono font-black text-sm text-blue-700">{money(item.totalAmount)}</span>
                          </div>
                        </div>

                        {/* Balance Due & Due Date */}
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="text-slate-400">ครบกำหนดชำระ:</span>
                          <strong className="text-slate-700">{item.dueDate}</strong>
                        </div>
                        {item.balanceDue > 0 ? (
                          <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-between text-xs text-rose-700 font-bold">
                            <span>ยอดค้างชำระ:</span>
                            <span className="font-mono">{money(item.balanceDue)}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Footer Actions */}
                      <footer className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2">
                        <button
                          className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                          onClick={() => setViewingInvoice(item)}
                          type="button"
                        >
                          <Eye size={14} strokeWidth={2.2} />
                          <span>ดูใบแจ้งหนี้</span>
                        </button>
                        <button
                          aria-label={`แก้ไข ${item.invoiceNumber}`}
                          className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                          onClick={() => openEditModal(item)}
                          type="button"
                        >
                          <Pencil size={14} strokeWidth={2.2} />
                          <span>แก้ไขใบแจ้งหนี้</span>
                        </button>
                      </footer>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          actionLabel={!isLocked ? "ออกใบแจ้งหนี้" : undefined}
          description="ไม่พบใบแจ้งหนี้ที่ตรงกับเงื่อนไขการค้นหา"
          onAction={openCreateModal}
          title="ไม่พบใบแจ้งหนี้"
        />
      )}

      {/* Invoice View & Print Modal (Official Thai Invoice Layout with PromptPay) */}
      {viewingInvoice ? (
        <Modal
          maxWidth="max-w-2xl"
          onClose={() => setViewingInvoice(null)}
          title={`ใบแจ้งหนี้เลขที่ ${viewingInvoice.invoiceNumber}`}
        >
          <div className="p-6 space-y-6">
            <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm print:border-none print:shadow-none text-slate-900 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{activeProperty.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{activeProperty.address}</p>
                  <p className="text-xs text-slate-500">โทร. {activeProperty.settings.promptpay}</p>
                </div>
                <div className="sm:text-right">
                  <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-1">
                    ใบแจ้งหนี้ / ใบเรียกเก็บเงิน
                  </span>
                  <strong className="block text-sm font-mono font-bold text-slate-800">
                    เลขที่: {viewingInvoice.invoiceNumber}
                  </strong>
                  <span className="text-xs text-slate-500 block">วันที่ออก: {viewingInvoice.issueDate}</span>
                  <span className="text-xs font-bold text-rose-600 block">ครบกำหนด: {viewingInvoice.dueDate}</span>
                </div>
              </div>

              {/* Tenant details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">ผู้เช่าห้องพัก:</span>
                  <strong className="text-sm font-bold text-slate-800 block">{viewingInvoice.tenant}</strong>
                  <span className="text-slate-500 font-mono">โทร. {viewingInvoice.tenantPhone}</span>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-400 block">ห้องพัก:</span>
                  <strong className="text-sm font-bold text-blue-700 block">ห้อง {viewingInvoice.roomNumber}</strong>
                  <span className="text-slate-500">รอบบิล: ประจำเดือน {viewingInvoice.periodMonth}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">ลำดับ</th>
                      <th className="p-3">รายการ</th>
                      <th className="p-3 text-right">จำนวนหน่วย</th>
                      <th className="p-3 text-right">ราคา/หน่วย</th>
                      <th className="p-3 text-right">จำนวนเงิน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="p-3">1</td>
                      <td className="p-3 font-sans">ค่าเช่าห้องพัก</td>
                      <td className="p-3 text-right">1</td>
                      <td className="p-3 text-right">{money(viewingInvoice.rentAmount)}</td>
                      <td className="p-3 text-right font-bold">{money(viewingInvoice.rentAmount)}</td>
                    </tr>
                    <tr>
                      <td className="p-3">2</td>
                      <td className="p-3 font-sans">ค่าน้ำประปา (เหมาจ่าย)</td>
                      <td className="p-3 text-right">1</td>
                      <td className="p-3 text-right">{money(viewingInvoice.waterAmount)}</td>
                      <td className="p-3 text-right font-bold">{money(viewingInvoice.waterAmount)}</td>
                    </tr>
                    <tr>
                      <td className="p-3">3</td>
                      <td className="p-3 font-sans">ค่าไฟฟ้า</td>
                      <td className="p-3 text-right">{viewingInvoice.electricUnits}</td>
                      <td className="p-3 text-right">฿{viewingInvoice.electricRate}.00</td>
                      <td className="p-3 text-right font-bold">{money(viewingInvoice.electricAmount)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                    <tr>
                      <td className="p-3 text-right font-sans" colSpan={4}>
                        ยอดรวมทั้งสิ้น (Total):
                      </td>
                      <td className="p-3 text-right font-black text-sm text-blue-700 font-mono">
                        {money(viewingInvoice.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount In Thai Text */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">จำนวนเงินตัวอักษร:</span>
                <strong className="text-slate-800 font-bold">
                  ({thaiBahtText(viewingInvoice.totalAmount)})
                </strong>
              </div>

              {/* Payment Info with PromptPay Box */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-xs text-blue-900">
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    <QrCode size={16} />
                    <span>ช่องทางการชำระเงิน</span>
                  </h4>
                  <p>พร้อมเพย์ (PromptPay): <strong>{appSettings.promptpay}</strong></p>
                  <p>ชื่อบัญชี: <strong>{appSettings.accountName}</strong></p>
                  <p className="text-[11px] text-blue-700 pt-1">{appSettings.invoiceNote}</p>
                </div>
                <div className="w-24 h-24 bg-white p-2 rounded-xl border border-blue-200 shadow-2xs flex flex-col items-center justify-center shrink-0">
                  <QrCode size={60} className="text-slate-800" />
                  <span className="text-[9px] font-bold text-slate-500 mt-1">สแกนจ่าย</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-all"
                onClick={() => setViewingInvoice(null)}
                type="button"
              >
                ปิดหน้าต่าง
              </button>
              <button
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 transition-all"
                onClick={() => {
                  window.print();
                  onToast("สั่งพิมพ์ใบแจ้งหนี้");
                }}
                type="button"
              >
                <Printer size={15} />
                <span>พิมพ์ใบแจ้งหนี้</span>
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Create / Edit Invoice Modal (Matching Portal UI) */}
      {isCreating || editingInvoice ? (
        <Modal
          description={
            editingInvoice
              ? `แก้ไขข้อมูลใบแจ้งหนี้ ${editingInvoice.invoiceNumber}`
              : "ระบบจะคำนวณค่าเช่า ค่าน้ำ และค่าไฟตามมิเตอร์ของรอบเดือนที่เลือกโดยอัตโนมัติ"
          }
          maxWidth={640}
          onClose={() => {
            setIsCreating(false);
            setEditingInvoice(null);
          }}
          title={editingInvoice ? "แก้ไขใบแจ้งหนี้" : "ออกใบแจ้งหนี้ใหม่"}
        >
          <div className="p-6 flex flex-col gap-4 text-left text-xs">
            {/* Feature Intro Banner */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Sparkles size={13} strokeWidth={2.2} />
              </span>
              <div className="leading-relaxed">
                <strong className="font-bold block text-blue-950">
                  {editingInvoice ? "ข้อมูลใบแจ้งหนี้" : "ออกใบแจ้งหนี้ประจำรอบเดือน"}
                </strong>
                <span className="text-[11px] text-blue-800/80">
                  {editingInvoice
                    ? "ปรับปรุงข้อมูลสถานะ ยอดเงิน หรือกำหนดชำระของใบแจ้งหนี้"
                    : "ระบบจะผูกมิเตอร์น้ำ-ไฟและสัญญาเช่าเพื่อสร้างบิลเรียกเก็บอัตโนมัติ"}
                </span>
              </div>
            </div>

            {editingInvoice ? (
              <>
                {/* Summary Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">เลขที่ใบแจ้งหนี้</span>
                    <strong className="text-slate-800 font-bold block mt-0.5 font-mono">{editingInvoice.invoiceNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">ห้องพัก</span>
                    <strong className="text-slate-800 font-bold block mt-0.5">ห้อง {editingInvoice.roomNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">ผู้เช่า</span>
                    <strong className="text-slate-800 font-bold block mt-0.5 truncate">{editingInvoice.tenant}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ReceiptText size={14} className="text-slate-500" />
                        <span>เลขที่ใบแจ้งหนี้</span>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ReceiptText size={16} strokeWidth={2.2} />
                      </span>
                      <input
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-100/80 text-slate-600 text-xs font-mono font-bold cursor-not-allowed outline-none"
                        defaultValue={editingInvoice.invoiceNumber}
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-slate-500" />
                        <span>สถานะใบแจ้งหนี้ <span className="text-rose-500">*</span></span>
                      </span>
                    </label>
                    <SelectControl
                      ariaLabel="สถานะใบแจ้งหนี้"
                      onValueChange={(val) => setFormStatus(val as DemoInvoice["status"])}
                      options={[
                        { value: "issued", label: "รอชำระ (Issued)" },
                        { value: "paid", label: "ชำระแล้ว (Paid)" },
                        { value: "overdue", label: "เกินกำหนด (Overdue)" },
                        { value: "void", label: "ยกเลิก (Void)" },
                      ]}
                      value={formStatus}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-500" />
                      <span>เลือกหอพัก / อาคาร <span className="text-rose-500">*</span></span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <DoorOpen size={14} className="text-slate-500" />
                        <span>ห้องพัก <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">เลือกห้องที่ออกบิล</span>
                    </label>
                    <SelectControl
                      ariaLabel="ห้องพัก"
                      onValueChange={(val) => {
                        setFormRoom(val);
                        const found = meterRooms.find((r) => r.number === val);
                        if (found && found.tenant) setFormTenant(found.tenant);
                      }}
                      options={meterRooms.map((r) => ({
                        value: r.number,
                        label: `ห้อง ${r.number} ${r.tenant ? `(${r.tenant})` : "(ห้องว่าง)"}`,
                      }))}
                      value={formRoom}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <UserRound size={14} className="text-slate-500" />
                        <span>ชื่อผู้เช่า</span>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <UserRound size={16} strokeWidth={2.2} />
                      </span>
                      <input
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all placeholder:text-slate-400"
                        onChange={(e) => setFormTenant(e.target.value)}
                        placeholder="ชื่อผู้เช่า"
                        value={formTenant}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Billing Period & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-500" />
                    <span>รอบเดือน <span className="text-rose-500">*</span></span>
                  </span>
                </label>
                <DateTimeControl
                  ariaLabel="รอบเดือน"
                  defaultValue={formMonth}
                  mode="month"
                  name="formMonth"
                  onValueChange={(val) => setFormMonth(val)}
                  placeholder="เลือกรอบเดือน"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CalendarCheck size={14} className="text-slate-500" />
                    <span>วันครบกำหนดชำระ <span className="text-rose-500">*</span></span>
                  </span>
                </label>
                <DateTimeControl
                  ariaLabel="วันครบกำหนดชำระ"
                  defaultValue={formDueDate}
                  mode="date"
                  name="formDueDate"
                  onValueChange={(val) => setFormDueDate(val)}
                  placeholder="เลือกวันครบกำหนดชำระ"
                />
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div className="flex items-center gap-3 pt-1">
              <strong className="whitespace-nowrap text-xs font-black text-slate-900">รายการค่าใช้จ่าย</strong>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Banknote size={14} className="text-slate-500" />
                    <span>ค่าเช่าห้อง (บาท)</span>
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Banknote size={16} strokeWidth={2.2} />
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                    onChange={(e) => setFormRent(Number(e.target.value))}
                    type="number"
                    value={formRent}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Droplets size={14} className="text-cyan-500" />
                    <span>ค่าน้ำประปา (บาท)</span>
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Droplets size={16} strokeWidth={2.2} />
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                    onChange={(e) => setFormWater(Number(e.target.value))}
                    type="number"
                    value={formWater}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500" />
                    <span>หน่วยไฟที่ใช้</span>
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Zap size={16} strokeWidth={2.2} />
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                    onChange={(e) => setFormElecUnits(Number(e.target.value))}
                    type="number"
                    value={formElecUnits}
                  />
                </div>
              </div>
            </div>

            {/* Total calculation preview box */}
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-950 block">ยอดรวมเรียกเก็บสุทธิ</span>
                <span className="text-[11px] text-blue-700 block">รวมค่าเช่า + ค่าน้ำ + ค่าไฟ ({formElecUnits} หน่วย × ฿{formElecRate})</span>
              </div>
              <strong className="text-xl font-black text-blue-700 font-mono">
                {money(Number(formRent) + Number(formWater) + formElecUnits * formElecRate)}
              </strong>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                className="h-11 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-all"
                onClick={() => {
                  setIsCreating(false);
                  setEditingInvoice(null);
                }}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-500/25 transition-all"
                onClick={handleSaveForm}
                type="button"
              >
                {editingInvoice ? "บันทึกการแก้ไข" : "ออกใบแจ้งหนี้"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
