"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  CalendarCheck,
  CalendarRange,
  Coins,
  DoorOpen,
  Eye,
  FileText,
  LayoutGrid,
  Layers,
  List,
  Pencil,
  Printer,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UserRoundCheck,
  UsersRound,
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
import { ThaiResidentialLeaseDocument } from "@/components/contracts/ThaiResidentialLeaseDocument";
import type { ContractRecord, PageContentProps } from "../types";

export function ContractsPage({
  isLocked,
  onToast,
  contracts,
  onEditContract,
  onDeleteContract,
  activeProperty,
  properties,
  meterRooms,
  ownerName,
}: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState(activeProperty?.id ?? properties[0]?.id ?? "");
  const [floor, setFloor] = useState("all");
  const [viewingContract, setViewingContract] = useState<ContractRecord | null>(null);
  const [editingItem, setEditingItem] = useState<ContractRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const currentProperty = properties.find((p) => p.id === selectedPropertyId) ?? activeProperty ?? properties[0];

  const floorLabel = (key: string) => `ชั้น ${key}`;

  // Multi-property demo contracts pool
  const allContracts = useMemo(() => {
    const list: Array<ContractRecord & { propertyId: string; propertyName: string; floor: string }> = [];
    const propsList = properties && properties.length > 0 ? properties : [activeProperty];

    propsList.forEach((prop, pIdx) => {
      const demoRooms = [
        { room: "101", floor: "1", tenant: "สมมุต ศรีสระเกษ", phone: "089-123-4567", rent: 3500, dep: 7000, status: "active" as const },
        { room: "102", floor: "1", tenant: "วิภาดา จิตผ่อง", phone: "081-987-6543", rent: 3500, dep: 7000, status: "active" as const },
        { room: "201", floor: "2", tenant: "กฤษณะ ชัยมงคล", phone: "086-555-1234", rent: 3800, dep: 7600, status: "draft" as const },
        { room: "202", floor: "2", tenant: "ธนกฤต มั่งคั่ง", phone: "092-333-8888", rent: 3800, dep: 7600, status: "expired" as const },
        { room: "301", floor: "3", tenant: "ปรียานุช รุ่งเรือง", phone: "084-222-1111", rent: 4000, dep: 8000, status: "active" as const },
        { room: "302", floor: "3", tenant: "อภิสิทธิ์ วงศ์ไทย", phone: "085-777-9999", rent: 4000, dep: 8000, status: "active" as const },
      ];

      demoRooms.forEach((r, idx) => {
        list.push({
          id: `CONT-2026-${prop.id.slice(-2)}-${r.room}`,
          propertyId: prop.id,
          propertyName: prop.name,
          roomNumber: r.room,
          floor: r.floor,
          tenantName: r.tenant,
          tenantPhone: r.phone,
          tenantIdCard: "1100200300405",
          startDate: "2026-01-01",
          endDate: "2027-01-01",
          rent: r.rent,
          deposit: r.dep,
          advanceRent: r.rent,
          customClauses: "ห้ามสูบบุหรี่และห้ามเลี้ยงสัตว์ภายในห้องพัก",
          status: r.status,
        });
      });
    });
    return list;
  }, [properties, activeProperty]);

  const propertyContracts = useMemo(() => {
    return allContracts.filter((c) => c.propertyId === currentProperty.id);
  }, [allContracts, currentProperty.id]);

  const floorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of propertyContracts) {
      counts.set(c.floor, (counts.get(c.floor) ?? 0) + 1);
    }
    return Array.from(counts, ([value, count]) => ({ value, count, label: floorLabel(value) })).sort(
      (a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" })
    );
  }, [propertyContracts]);

  // Form states for creating/editing
  const [formRoomNumber, setFormRoomNumber] = useState("");
  const [formTenantName, setFormTenantName] = useState("");
  const [formTenantPhone, setFormTenantPhone] = useState("");
  const [formTenantIdCard, setFormTenantIdCard] = useState("");
  const [formStartDate, setFormStartDate] = useState("2025-01-01");
  const [formEndDate, setFormEndDate] = useState("2027-08-29");
  const [formRent, setFormRent] = useState(2500);
  const [formDeposit, setFormDeposit] = useState(5000);
  const [formAdvanceRent, setFormAdvanceRent] = useState(2500);
  const [formClauses, setFormClauses] = useState("ห้ามสูบบุหรี่ภายในห้องพักโดยเด็ดขาด");
  const [formStatus, setFormStatus] = useState<"active" | "draft">("active");

  const totalCount = propertyContracts.length;
  const activeCount = propertyContracts.filter((c) => c.status === "active").length;
  const draftCount = propertyContracts.filter((c) => c.status === "draft").length;
  const endedCount = propertyContracts.filter((c) => c.status === "expired" || (c.status as string) === "ended").length;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return propertyContracts.filter((c) => {
      const matchesFloor = floor === "all" || c.floor === floor;
      const matchesSearch =
        !needle ||
        `${c.id} ${c.roomNumber} ${c.tenantName} ${c.tenantPhone} ${c.customClauses}`
          .toLowerCase()
          .includes(needle);
      const matchesStatus =
        status === "all"
          ? true
          : status === "ended"
          ? c.status === "expired" || (c.status as string) === "ended"
          : c.status === status;
      return matchesFloor && matchesSearch && matchesStatus;
    });
  }, [propertyContracts, floor, query, status]);

  const visibleFloorGroups = useMemo(() => {
    if (floor !== "all") {
      return [{ value: floor, label: floorLabel(floor), contracts: filtered }];
    }
    const groups = new Map<string, typeof filtered>();
    for (const c of filtered) {
      if (!groups.has(c.floor)) groups.set(c.floor, []);
      groups.get(c.floor)!.push(c);
    }
    return Array.from(groups, ([value, list]) => ({
      value,
      label: floorLabel(value),
      contracts: list,
    })).sort((a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" }));
  }, [floor, filtered]);

  function openCreateModal() {
    setIsCreating(true);
    setEditingItem(null);
    setFormRoomNumber("");
    setFormTenantName("");
    setFormTenantPhone("");
    setFormTenantIdCard("");
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate("");
    setFormRent(0);
    setFormDeposit(0);
    setFormAdvanceRent(0);
    setFormClauses("");
    setFormStatus("active");
  }

  function openEditModal(c: ContractRecord) {
    setEditingItem(c);
    setIsCreating(false);
    setFormRoomNumber(c.roomNumber);
    setFormTenantName(c.tenantName);
    setFormTenantPhone(c.tenantPhone || "");
    setFormTenantIdCard(c.tenantIdCard || "");
    setFormStartDate(c.startDate);
    setFormEndDate(c.endDate);
    setFormRent(c.rent);
    setFormDeposit(c.deposit);
    setFormAdvanceRent(c.advanceRent);
    setFormClauses(c.customClauses || "");
    setFormStatus((c.status as "active" | "draft") || "active");
  }

  function handleSaveForm() {
    if (!formRoomNumber) {
      onToast("กรุณาเลือกห้องพัก");
      return;
    }
    if (!formTenantName.trim()) {
      onToast("กรุณาเลือกผู้เช่า");
      return;
    }
    const newRecord: ContractRecord = {
      id: editingItem ? editingItem.id : `CONT-2026-${String(contracts.length + 1).padStart(3, "0")}`,
      roomNumber: formRoomNumber,
      tenantName: formTenantName,
      tenantPhone: formTenantPhone,
      tenantIdCard: formTenantIdCard,
      startDate: formStartDate,
      endDate: formEndDate,
      rent: Number(formRent),
      deposit: Number(formDeposit),
      advanceRent: Number(formAdvanceRent),
      customClauses: formClauses,
      status: formStatus,
    };
    onEditContract(newRecord);
    setIsCreating(false);
    setEditingItem(null);
    onToast(editingItem ? "แก้ไขข้อมูลสัญญาเรียบร้อยแล้ว" : "สร้างสัญญาเช่าใหม่เรียบร้อยแล้ว");
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        actionLabel={!isLocked ? "สร้างสัญญาเช่า" : undefined}
        description="จัดการข้อมูลสัญญาเช่า ห้องพัก ผู้เช่า เงินประกัน และข้อตกลงการอยู่อาศัย"
        onAction={openCreateModal}
        title="สัญญาเช่า"
      />

      {/* 4 Hero Stat Cards (Matching Portal LeasesPage) */}
      <section aria-label="ภาพรวมสัญญาเช่า" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Contracts */}
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
              <FileText size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">สัญญาทั้งหมด</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {totalCount.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 2: Active Contracts */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            status === "active"
              ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setStatus("active")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">กำลังมีผลใช้งาน</span>
              <strong className="text-2xl font-black text-emerald-800 tracking-tight tabular-nums mt-0.5 block">
                {activeCount.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 3: Draft Contracts */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            status === "draft"
              ? "bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setStatus("draft")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
              <Pencil size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ร่างสัญญารอดำเนินการ</span>
              <strong className="text-2xl font-black text-amber-800 tracking-tight tabular-nums mt-0.5 block">
                {draftCount.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 4: Ended Contracts */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            status === "ended"
              ? "bg-white border-slate-500 shadow-md ring-2 ring-slate-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setStatus("ended")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-slate-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-600 to-slate-800 text-white shadow-md shadow-slate-500/25 flex items-center justify-center shrink-0">
              <CalendarCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">สิ้นสุด/ยกเลิกแล้ว</span>
              <strong className="text-2xl font-black text-slate-800 tracking-tight tabular-nums mt-0.5 block">
                {endedCount.toLocaleString("th-TH")} ฉบับ
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
            <strong className="text-xs font-bold text-slate-800">เลือกหอพักเพื่อแสดงรายการสัญญาเช่า</strong>
          </div>
          <small className="text-xs text-slate-500 font-semibold">
            {properties.length} หอพัก · {allContracts.length} สัญญาทั้งหมดในระบบ
          </small>
        </header>
        <div aria-label="รายชื่อหอพัก" className="p-3 flex gap-2.5 overflow-x-auto" role="tablist">
          {properties.map((property) => {
            const active = property.id === currentProperty.id;
            const propContracts = allContracts.filter((c) => c.propertyId === property.id);
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
                    {property.rooms.length} ห้อง · มีสัญญา <strong className="text-blue-600 font-bold">{propContracts.length}</strong> ฉบับ
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
            ทุกชั้น <span className={`text-[11px] font-bold ${floor === "all" ? "text-blue-600" : "text-slate-400"}`}>({propertyContracts.length})</span>
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
        description={`พบ ${filtered.length.toLocaleString("th-TH")} จาก ${propertyContracts.length.toLocaleString("th-TH")} ฉบับ (${currentProperty.name})`}
        filter={{
          label: "กรองสถานะสัญญา",
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "ทุกสถานะ" },
            { value: "active", label: "มีผลอยู่ (Active)" },
            { value: "draft", label: "ฉบับร่าง (Draft)" },
            { value: "ended", label: "สิ้นสุด/ยกเลิก (Ended)" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขสัญญา หอ ห้อง ผู้เช่า หรือข้อตกลง"
        query={query}
        title="รายการสัญญา"
      />

      {/* Main Content: Table or Grid View */}
      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full mb-6">
            <DataTable
              headers={[
                "เลขที่สัญญา",
                "หอพัก / ห้องพัก",
                "ชั้น",
                "ผู้เช่า",
                "ค่าเช่า / เดือน",
                "เงินประกัน",
                "ระยะเวลาสัญญา",
                "พอร์ทัลผู้เช่า",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => [
                <strong className="text-slate-800 text-xs font-bold font-mono" key="id">
                  {item.id}
                </strong>,
                <div className="flex items-center gap-2.5" key="room">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                    {item.roomNumber || "—"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{currentProperty.name}</span>
                </div>,
                <span className="text-xs font-semibold text-slate-700" key="floor">
                  ชั้น {item.floor}
                </span>,
                <div className="flex flex-col text-xs min-w-0" key="tenant">
                  <strong className="text-slate-900 font-bold truncate">{item.tenantName || "—"}</strong>
                  <small className="text-slate-400 mt-0.5 font-mono">
                    {item.tenantPhone ? `โทร. ${item.tenantPhone}` : "ไม่มีเบอร์โทร"}
                  </small>
                </div>,
                <strong className="text-slate-900 text-xs font-bold font-mono" key="rent">
                  ฿{item.rent.toLocaleString("th-TH")}.00
                </strong>,
                <span className="text-xs text-slate-600 font-mono" key="deposit">
                  ฿{item.deposit.toLocaleString("th-TH")}.00
                </span>,
                <div className="flex flex-col text-xs font-medium" key="dates">
                  <span className="text-slate-800">{item.startDate}</span>
                  <small className="text-slate-400 mt-0.5">ถึง {item.endDate || "ไม่ระบุวันสิ้นสุด"}</small>
                </div>,
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200" key="portal">
                  <UserRoundCheck size={12} />
                  <span>พร้อมใช้งาน</span>
                </span>,
                <StatusBadge key="status" status={item.status as "active" | "draft"} />,
                <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                  <button
                    className="h-8 px-2.5 rounded-xl flex items-center gap-1 text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                    onClick={() => setViewingContract(item)}
                    title="ดูตัวอย่างสัญญา"
                    type="button"
                  >
                    <Eye size={13} strokeWidth={2.2} />
                    <span>ดูสัญญา</span>
                  </button>
                  <button
                    aria-label={`แก้ไขสัญญา ${item.id}`}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                    onClick={() => openEditModal(item)}
                    title="แก้ไขสัญญา"
                    type="button"
                  >
                    <Pencil size={13} strokeWidth={2.2} />
                  </button>
                  <button
                    aria-label={`ลบสัญญา ${item.id}`}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                    onClick={() => {
                      onDeleteContract(item.id);
                      onToast(`ลบสัญญา ${item.id} เรียบร้อยแล้ว`);
                    }}
                    title="ลบสัญญา"
                    type="button"
                  >
                    <Trash2 size={13} strokeWidth={2.2} />
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
                  <span className="text-xs text-slate-400 font-semibold">({group.contracts.length} ฉบับ)</span>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.contracts.map((item) => (
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
                              {item.roomNumber ? `ห้อง ${item.roomNumber}` : "ไม่ระบุห้อง"}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-500 block truncate">{currentProperty.name} · ชั้น {item.floor}</span>
                              <span className="text-[11px] font-mono text-slate-400 block truncate">{item.id}</span>
                            </div>
                          </div>
                          <StatusBadge status={item.status as "active" | "draft"} />
                        </header>

                        {/* Tenant info */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 mb-3">
                          <span className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs text-sm">
                            {item.tenantName ? item.tenantName.slice(0, 1) : "ผ"}
                          </span>
                          <div className="min-w-0">
                            <strong className="text-sm font-bold text-slate-800 truncate block">
                              {item.tenantName || "ยังไม่ระบุผู้เช่า"}
                            </strong>
                            <span className="text-xs text-slate-400 font-mono mt-0.5 block truncate">
                              {item.tenantPhone ? `โทร. ${item.tenantPhone}` : "ไม่มีเบอร์โทรศัพท์"}
                            </span>
                          </div>
                        </div>

                        {/* Financial metrics */}
                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                            <span className="text-slate-400 font-medium">ค่าเช่ารายเดือน</span>
                            <strong className="text-slate-900 font-black font-mono text-sm mt-0.5">
                              ฿{item.rent.toLocaleString("th-TH")}.00
                            </strong>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                            <span className="text-slate-400 font-medium">เงินประกัน</span>
                            <strong className="text-slate-900 font-black font-mono text-sm mt-0.5">
                              ฿{item.deposit.toLocaleString("th-TH")}.00
                            </strong>
                          </div>
                        </div>

                        {/* Lease duration */}
                        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="flex items-center gap-1.5 font-medium">
                              <CalendarRange size={13} className="text-slate-400" />
                              <span>ระยะเวลาสัญญา</span>
                            </span>
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                              สัญญามาตรฐาน
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-800 font-medium pt-1">
                            <span>{item.startDate}</span>
                            <span className="text-slate-400">ถึง</span>
                            <span>{item.endDate || "ไม่ระบุ"}</span>
                          </div>
                        </div>

                        {item.customClauses ? (
                          <p className="text-xs text-slate-500 mt-2 px-1 line-clamp-1 italic" title={item.customClauses}>
                            &ldquo;{item.customClauses}&rdquo;
                          </p>
                        ) : null}
                      </div>

                      {/* Card actions */}
                      <footer className="pt-3 border-t border-slate-100 space-y-2 mt-4">
                        {/* Row 1: ดูสัญญา / พิมพ์ */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                            onClick={() => setViewingContract(item)}
                            title="ดูตัวอย่างสัญญา"
                            type="button"
                          >
                            <Eye size={14} strokeWidth={2.2} />
                            <span>ดูสัญญา</span>
                          </button>
                          <button
                            className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                            onClick={() => {
                              setViewingContract(item);
                              setTimeout(() => window.print(), 150);
                            }}
                            title="พิมพ์สัญญาเช่า A4"
                            type="button"
                          >
                            <Printer size={14} strokeWidth={2.2} />
                            <span>พิมพ์</span>
                          </button>
                        </div>

                        {/* Row 2: แก้ไขสัญญา / ลบสัญญา */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            aria-label={`แก้ไขสัญญา ${item.id}`}
                            className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                            onClick={() => openEditModal(item)}
                            title="แก้ไขสัญญา"
                            type="button"
                          >
                            <Pencil size={14} strokeWidth={2.2} />
                            <span>แก้ไขสัญญา</span>
                          </button>
                          <button
                            aria-label={`ลบสัญญา ${item.id}`}
                            className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                            onClick={() => {
                              onDeleteContract(item.id);
                              onToast(`ลบสัญญา ${item.id} เรียบร้อยแล้ว`);
                            }}
                            title="ลบสัญญา"
                            type="button"
                          >
                            <Trash2 size={14} strokeWidth={2.2} />
                            <span>ลบสัญญา</span>
                          </button>
                        </div>
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
          actionLabel={!isLocked ? "สร้างสัญญาฉบับแรก" : undefined}
          description="ไม่พบสัญญาเช่าที่ตรงกับเงื่อนไขการค้นหา"
          onAction={openCreateModal}
          title="ไม่พบสัญญาเช่า"
        />
      )}

      {/* Official Thai Apartment Lease View/Print Modal (Matching Portal UI) */}
      {viewingContract ? (
        <Modal
          maxWidth="max-w-3xl"
          onClose={() => setViewingContract(null)}
          title={`สัญญาเช่าห้องพักเลขที่ ${viewingContract.id}`}
        >
          <div className="p-6 space-y-6">
            <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm print:border-none print:shadow-none">
              <ThaiResidentialLeaseDocument
                advanceAmount={viewingContract.advanceRent}
                contractDate={viewingContract.startDate}
                customTerms={viewingContract.customClauses}
                depositAmount={viewingContract.deposit}
                dueDay={currentProperty.settings.dueDay}
                electricRate={currentProperty.settings.electricRate}
                endDate={viewingContract.endDate}
                landlordName={`กิจการ ${currentProperty.name}`}
                landlordRepresentative={currentProperty.settings.accountName || ownerName}
                leaseNumber={viewingContract.id}
                occupantCount={1}
                propertyAddress={currentProperty.address}
                propertyName={currentProperty.name}
                propertyPhone={currentProperty.phone}
                rentAmount={viewingContract.rent}
                roomNumber={viewingContract.roomNumber}
                startDate={viewingContract.startDate}
                tenantIdCard={viewingContract.tenantIdCard}
                tenantName={viewingContract.tenantName}
                tenantPhone={viewingContract.tenantPhone}
                waterBillingMethod="flat_room"
                waterRate={currentProperty.settings.waterRate}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-all"
                onClick={() => setViewingContract(null)}
                type="button"
              >
                ปิดหน้าต่าง
              </button>
              <button
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 transition-all"
                onClick={() => {
                  window.print();
                  onToast("สั่งพิมพ์สัญญาเช่า");
                }}
                type="button"
              >
                <Printer size={15} />
                <span>พิมพ์สัญญา</span>
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Create / Edit Modal (Matching Portal UI exactly as Image 1) */}
      {isCreating || editingItem ? (
        <Modal
          description={
            editingItem
              ? `แก้ไขข้อมูลสัญญาเช่าเลขที่ ${editingItem.id}`
              : "ระบุหอพัก ห้องว่าง ผู้เช่า และเงื่อนไขการเงินเพื่อเปิดใช้งานสัญญาเช่า"
          }
          maxWidth={640}
          onClose={() => {
            setIsCreating(false);
            setEditingItem(null);
          }}
          title={editingItem ? "แก้ไขสัญญาเช่า" : "สร้างสัญญาเช่าใหม่"}
        >
          <div className="p-6 flex flex-col gap-4 text-left text-xs">
            {/* Feature Intro Banner */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Sparkles size={13} strokeWidth={2.2} />
              </span>
              <div className="leading-relaxed">
                <strong className="font-bold block text-blue-950">
                  {editingItem ? "ข้อมูลข้อตกลงและสัญญาเช่า" : "สร้างข้อตกลงและเปิดสัญญาเช่า"}
                </strong>
                <span className="text-[11px] text-blue-800/80">
                  {editingItem
                    ? "ปรับปรุงข้อมูลทางการเงิน เงื่อนไข และระยะเวลาของสัญญาเช่า"
                    : "ระบบจะผูกผู้เช่าเข้ากับห้องพัก และนำอัตราค่าเช่าไปใช้คำนวณบิลรายเดือนอัตโนมัติ"}
                </span>
              </div>
            </div>

            {editingItem ? (
              <>
                {/* Edit Overview Summary Panel */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">หอพัก</span>
                    <strong className="text-slate-800 font-bold block mt-0.5">{activeProperty.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">ห้องพัก</span>
                    <strong className="text-slate-800 font-bold block mt-0.5">ห้อง {editingItem.roomNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">ผู้เช่า</span>
                    <strong className="text-slate-800 font-bold block mt-0.5 truncate">{editingItem.tenantName}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText size={14} className="text-slate-500" />
                        <span>เลขที่สัญญา <span className="text-rose-500">*</span></span>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <FileText size={16} strokeWidth={2.2} />
                      </span>
                      <input
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all placeholder:text-slate-400"
                        defaultValue={editingItem.id}
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-slate-500" />
                        <span>สถานะสัญญา <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">Status</span>
                    </label>
                    <SelectControl
                      ariaLabel="สถานะสัญญา"
                      onValueChange={(val) => setFormStatus(val as "active" | "draft")}
                      options={[
                        { value: "active", label: "มีผลอยู่ (Active)" },
                        { value: "draft", label: "ฉบับร่าง (Draft)" },
                      ]}
                      value={formStatus}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Property Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-500" />
                      <span>เลือกหอพัก / อาคาร <span className="text-rose-500">*</span></span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">สาขาที่ทำสัญญา</span>
                  </label>
                  <SelectControl
                    ariaLabel="หอพัก"
                    onValueChange={() => {}}
                    options={(properties || [activeProperty]).map((item) => ({ value: item.id, label: item.name }))}
                    placeholder="เลือกหอพัก"
                    value={activeProperty.id}
                  />
                </div>

                {/* Available Room and Primary Tenant */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <DoorOpen size={14} className="text-slate-500" />
                        <span>ห้องพักที่ว่าง <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">เฉพาะห้องว่าง</span>
                    </label>
                    <SelectControl
                      ariaLabel="ห้องพัก"
                      onValueChange={(val) => setFormRoomNumber(val)}
                      options={meterRooms.map((item) => ({
                        value: item.number,
                        label: `ห้อง ${item.number}`,
                      }))}
                      placeholder="เลือกห้องพัก"
                      value={formRoomNumber}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <UserRound size={14} className="text-slate-500" />
                        <span>ผู้เช่าหลัก <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">คู่สัญญา</span>
                    </label>
                    <SelectControl
                      ariaLabel="ผู้เช่า"
                      onValueChange={(val) => {
                        setFormTenantName(val);
                      }}
                      options={[
                        { value: "สมมุต ศรีสระเกษ", label: "สมมุต ศรีสระเกษ" },
                        { value: "อารยา พรดี", label: "อารยา พรดี" },
                        { value: "กิตติภพ ทองแท้", label: "กิตติภพ ทองแท้" },
                        { value: "วิภาดา เลิศรัตนกุล", label: "วิภาดา เลิศรัตนกุล" },
                        { value: "ธนวัฒน์ พัฒนเดช", label: "ธนวัฒน์ พัฒนเดช" },
                      ]}
                      placeholder="เลือกผู้เช่า"
                      value={formTenantName}
                    />
                  </div>
                </div>

                {/* Lease Number (Auto-generated) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText size={14} className="text-slate-500" />
                      <span>เลขที่สัญญา <span className="text-rose-500">*</span></span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">สร้างอัตโนมัติ</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <FileText size={16} strokeWidth={2.2} />
                    </span>
                    <input
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all placeholder:text-slate-400"
                      defaultValue={`CONT-2026-00${contracts.length + 1}`}
                      disabled
                      placeholder="ระบุเลขที่สัญญา"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Dates & Occupant Count (3 columns matching Image 1) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <CalendarRange size={13} className="text-slate-500" />
                    <span>วันเริ่มสัญญา <span className="text-rose-500">*</span></span>
                  </span>
                </label>
                <DateTimeControl
                  ariaLabel="วันเริ่มสัญญา"
                  defaultValue={formStartDate || new Date().toISOString().slice(0, 10)}
                  mode="date"
                  name="startDate"
                  onValueChange={(val) => setFormStartDate(val)}
                  placeholder="เลือกวันเริ่มสัญญา"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <CalendarCheck size={13} className="text-slate-500" />
                    <span>วันสิ้นสุดสัญญา</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">ถ้ามี</span>
                </label>
                <DateTimeControl
                  ariaLabel="วันสิ้นสุดสัญญา"
                  defaultValue={formEndDate || ""}
                  mode="date"
                  name="endDate"
                  onValueChange={(val) => setFormEndDate(val)}
                  placeholder="เลือกวันสิ้นสุดสัญญา"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <UsersRound size={13} className="text-slate-500" />
                    <span>จำนวนผู้พัก (คน) <span className="text-rose-500">*</span></span>
                  </span>
                </label>
                <input
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all"
                  defaultValue={1}
                  max={50}
                  min={1}
                  step="1"
                  type="number"
                />
              </div>
            </div>

            {/* Financial Amounts (3 columns matching Image 1) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Banknote size={13} className="text-slate-500" />
                    <span>ค่าเช่า/เดือน <span className="text-rose-500">*</span></span>
                  </span>
                </label>
                <input
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                  defaultValue={editingItem?.rent}
                  min={0}
                  onChange={(e) => setFormRent(Number(e.target.value))}
                  placeholder="เช่น 3500"
                  step="0.01"
                  type="number"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={13} className="text-slate-500" />
                    <span>เงินประกัน <span className="text-rose-500">*</span></span>
                  </span>
                </label>
                <input
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                  defaultValue={editingItem?.deposit ?? 0}
                  min={0}
                  onChange={(e) => setFormDeposit(Number(e.target.value))}
                  placeholder="เช่น 5000"
                  step="0.01"
                  type="number"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Coins size={13} className="text-slate-500" />
                    <span>ค่าเช่าล่วงหน้า <span className="text-rose-500">*</span></span>
                  </span>
                </label>
                <input
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                  defaultValue={editingItem?.advanceRent ?? 0}
                  min={0}
                  onChange={(e) => setFormAdvanceRent(Number(e.target.value))}
                  placeholder="เช่น 3500"
                  step="0.01"
                  type="number"
                />
              </div>
            </div>

            {/* Terms (matching Image 1) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>เงื่อนไขและข้อตกลงเพิ่มเติม</span>
                <span className="text-[11px] text-slate-400 font-normal">พิมพ์ลงท้ายสัญญา</span>
              </label>
              <textarea
                className="w-full p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-medium transition-all placeholder:text-slate-400 resize-none h-20"
                defaultValue={editingItem?.customClauses ?? ""}
                onChange={(e) => setFormClauses(e.target.value)}
                placeholder="เช่น ห้ามเลี้ยงสัตว์ทุกชนิด, ห้ามส่งเสียงดังหลังเวลา 22:00 น."
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                className="h-11 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-all"
                onClick={() => {
                  setIsCreating(false);
                  setEditingItem(null);
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
                {editingItem ? "บันทึกการแก้ไขสัญญา" : "บันทึกและเปิดสัญญา"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
