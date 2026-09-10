"use client";

import { useMemo, useState } from "react";
import { InvoiceDocument } from "@/components/portal/InvoiceDocument";
import { printDocument } from "@/lib/portal/print-document";
import { alertWarning } from "@/lib/sweetalert";
import {
  Building2,
  Calendar,
  CalendarClock,
  Eye,
  FileText,
  Layers,
  LayoutGrid,
  List,
  Pencil,
  Printer,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { cancelInvoiceAction, createInvoiceAction, updateInvoiceAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  EmptyState,
  Modal,
  PageHeader,
  PortalForm,
  StatusBadge,
} from "@/components/portal/PortalUI";
import { DateTimeControl } from "@/components/ui/DateTimeControl";
import { DateFilterControl } from "@/components/portal/DateFilterControl";
import { SelectControl } from "@/components/ui/SelectControl";
import { money, thaiDate } from "@/lib/format";
import type { Invoice, Lease, Meter, MeterReading, Property, PropertySettings, Room, Tenant } from "@/components/portal/types";
import { calculateInvoiceBreakdown, invoiceMissingMessage } from "@/lib/portal/invoice-calculation.mjs";
import { formatThaiBillingMonth } from "@/lib/portal/meter-reading.mjs";
import { validateInvoice } from "@/lib/portal/validation.mjs";

export function InvoicesPage({
  organizationId,
  invoices,
  leases,
  properties,
  rooms,
  tenants,
  meters,
  readings,
  settings,
  canCreate,
  canEdit,
  submissions = [],
}: {
  organizationId: string;
  invoices: Invoice[];
  leases: Lease[];
  properties: Property[];
  rooms: Room[];
  tenants: Tenant[];
  meters: Meter[];
  readings: MeterReading[];
  settings: PropertySettings[];
  canCreate: boolean;
  canEdit: boolean;
  submissions?: { id: string; invoice_id: string; status: string }[];
}) {
  const [selected, setSelected] = useState<Invoice | "create" | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);

  const submissionStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of submissions) {
      if (s.invoice_id) {
        if (s.status === "pending") {
          map.set(s.invoice_id, "pending");
        } else if (s.status === "approved" && !map.has(s.invoice_id)) {
          map.set(s.invoice_id, "approved");
        }
      }
    }
    return map;
  }, [submissions]);

  const isInvoiceCancellable = (invoice: Invoice) => {
    const subStatus = submissionStatusMap.get(invoice.id);
    const hasPendingSubmission = subStatus === "pending";
    const hasApprovedSubmission = subStatus === "approved";
    const isPaidOrPartial = invoice.status === "paid" || invoice.status === "partial" || Number(invoice.balance_due) < Number(invoice.total);

    // ไม่สามารถยกเลิกได้ ถ้ามีสถานะ รออนุมัติ หรืออนุมัติผ่าน
    if (hasPendingSubmission || hasApprovedSubmission || isPaidOrPartial) {
      return false;
    }
    return canEdit && ["draft", "issued", "overdue"].includes(invoice.status) && Number(invoice.balance_due) === Number(invoice.total);
  };

  const cancelButton = (invoice: Invoice) => {
    if (!canEdit || invoice.status === "void") return null;
    const subStatus = submissionStatusMap.get(invoice.id);
    const hasPendingSubmission = subStatus === "pending";
    const isPaidOrPartial =
      invoice.status === "paid" ||
      invoice.status === "partial" ||
      Number(invoice.balance_due) < Number(invoice.total);

    if (isPaidOrPartial) return null;

    if (hasPendingSubmission) {
      return (
        <button
          type="button"
          className="px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 cursor-pointer"
          onClick={() => {
            void alertWarning(
              "ไม่สามารถยกเลิกใบแจ้งหนี้ได้",
              "มีสลิปชำระเงินที่ผู้เช่าแนบมารอการตรวจสอบ กรุณากด 'ไม่อนุมัติ' สลิปก่อน จึงจะสามารถยกเลิกใบแจ้งหนี้ได้"
            );
          }}
          title="มีสลิปรอตรวจสอบ กรุณากดไม่อนุมัติสลิปก่อนยกเลิกบิล"
          aria-label={`ยกเลิกใบแจ้งหนี้ ${invoice.invoice_number}`}
        >
          ยกเลิกใบแจ้งหนี้
        </button>
      );
    }

    if (isInvoiceCancellable(invoice)) {
      return (
        <button
          type="button"
          className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 cursor-pointer"
          onClick={() => setCancellingInvoice(invoice)}
          aria-label={`ยกเลิกใบแจ้งหนี้ ${invoice.invoice_number}`}
        >
          ยกเลิกใบแจ้งหนี้
        </button>
      );
    }
    return null;
  };
  const [activePropertyId, setActivePropertyId] = useState(() => properties[0]?.id ?? "");
  const [floor, setFloor] = useState("all");
  const [leaseId, setLeaseId] = useState("");
  const [periodMonth, setPeriodMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [defaultDueAt] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFilterMode, setDateFilterMode] = useState<"date" | "month" | "year">("month");
  const [dateFilterValue, setDateFilterValue] = useState("");
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState("");

  const resolvedPropertyId = properties.some((p) => p.id === activePropertyId)
    ? activePropertyId
    : properties[0]?.id ?? "";
  const activeProperty = properties.find((p) => p.id === resolvedPropertyId);

  const editing = selected && selected !== "create" ? selected : null;
  const propertyMap = useMemo(() => new Map(properties.map((item) => [item.id, item.name])), [properties]);
  const roomMap = useMemo(() => new Map(rooms.map((item) => [item.id, item])), [rooms]);
  const tenantMap = useMemo(() => new Map(tenants.map((item) => [item.id, item])), [tenants]);

  const activeLeases = useMemo(
    () => leases.filter((item) => item.status === "active"),
    [leases]
  );

  const selectedLease = leases.find((l) => l.id === leaseId);
  const selectedRoom = selectedLease ? roomMap.get(selectedLease.room_id) : undefined;
  const selectedSettings = selectedLease ? settings.find((s) => s.property_id === selectedLease.property_id) : undefined;

  const voidedInvoicesForLeaseAndPeriod = useMemo(() => {
    if (!leaseId || !periodMonth) return [];
    return invoices.filter((inv) => {
      if (inv.lease_id !== leaseId || inv.status !== "void") return false;
      const invMonth = inv.issued_at ? inv.issued_at.slice(0, 7) : "";
      return invMonth === periodMonth;
    });
  }, [invoices, leaseId, periodMonth]);

  const defaultInvoiceNumber = useMemo(() => {
    if (!selectedRoom || !periodMonth) return "";
    const base = `INV-${periodMonth.replace("-", "")}-${selectedRoom.room_number}`;
    if (voidedInvoicesForLeaseAndPeriod.length > 0) {
      return `${base}-R${voidedInvoicesForLeaseAndPeriod.length}`;
    }
    return base;
  }, [selectedRoom, periodMonth, voidedInvoicesForLeaseAndPeriod]);

  const preview = useMemo(() => {
    if (!selectedLease || !selectedSettings) return null;
    return calculateInvoiceBreakdown({
      lease: selectedLease,
      settings: selectedSettings,
      meters,
      readings,
      periodMonth,
    });
  }, [selectedLease, selectedSettings, meters, readings, periodMonth]);

  const propertyInvoices = useMemo(
    () => invoices.filter((item) => item.property_id === resolvedPropertyId),
    [invoices, resolvedPropertyId]
  );

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<string>([String(currentYear)]);
    for (const inv of propertyInvoices) {
      if (inv.issued_at) years.add(inv.issued_at.slice(0, 4));
      if (inv.due_at) years.add(inv.due_at.slice(0, 4));
    }
    return Array.from(years).sort().reverse();
  }, [propertyInvoices]);

  const floorLabel = (key: string) => `ชั้น ${key}`;

  const floorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const inv of propertyInvoices) {
      const room = roomMap.get(inv.room_id);
      const floorKey = room?.floor || "1";
      counts.set(floorKey, (counts.get(floorKey) ?? 0) + 1);
    }
    return Array.from(counts, ([value, count]) => ({
      value,
      count,
      label: floorLabel(value),
    })).sort((a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" }));
  }, [propertyInvoices, roomMap]);

  const totalInvoicesCount = propertyInvoices.length;
  const totalBilledAmount = useMemo(() => propertyInvoices.reduce((sum, item) => sum + Number(item.total), 0), [propertyInvoices]);
  const totalPaidAmount = useMemo(() => propertyInvoices.reduce((sum, item) => sum + (Number(item.total) - Number(item.balance_due)), 0), [propertyInvoices]);
  const totalBalanceDue = useMemo(() => propertyInvoices.reduce((sum, item) => sum + Number(item.balance_due), 0), [propertyInvoices]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th-TH");
    return propertyInvoices.filter((item) => {
      const room = roomMap.get(item.room_id);
      const floorKey = room?.floor || "1";
      const matchesFloor = floor === "all" || floorKey === floor;
      const matchesStatus = status === "all" || item.status === status;
      const matchesSearch =
        !keyword ||
        [item.invoice_number, room?.room_number, propertyMap.get(item.property_id), item.note].some(
          (value) => value?.toLocaleLowerCase("th-TH").includes(keyword)
        );

      let matchesDate = true;
      if (dateFilterValue) {
        const issued = item.issued_at || "";
        const due = item.due_at || "";
        if (dateFilterMode === "date") {
          matchesDate = issued.slice(0, 10) === dateFilterValue || due.slice(0, 10) === dateFilterValue;
        } else if (dateFilterMode === "month") {
          matchesDate = issued.slice(0, 7) === dateFilterValue || due.slice(0, 7) === dateFilterValue;
        } else if (dateFilterMode === "year") {
          matchesDate = issued.slice(0, 4) === dateFilterValue || due.slice(0, 4) === dateFilterValue;
        }
      }

      return matchesFloor && matchesStatus && matchesSearch && matchesDate;
    });
  }, [propertyInvoices, floor, propertyMap, query, roomMap, status, dateFilterValue, dateFilterMode]);

  const visibleFloorGroups = useMemo(() => {
    if (floor !== "all") {
      return [{ value: floor, label: floorLabel(floor), invoices: filtered }];
    }
    const groups = new Map<string, typeof filtered>();
    for (const inv of filtered) {
      const room = roomMap.get(inv.room_id);
      const floorKey = room?.floor || "1";
      if (!groups.has(floorKey)) groups.set(floorKey, []);
      groups.get(floorKey)!.push(inv);
    }
    return Array.from(groups, ([value, list]) => ({
      value,
      label: floorLabel(value),
      invoices: list,
    })).sort((a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" }));
  }, [floor, filtered, roomMap]);

  const viewingProperty = viewingInvoice ? properties.find((p) => p.id === viewingInvoice.property_id) : undefined;
  const viewingRoom = viewingInvoice ? roomMap.get(viewingInvoice.room_id) : undefined;
  const viewingLease = viewingInvoice ? leases.find((l) => l.id === viewingInvoice.lease_id) : undefined;
  const viewingTenant = viewingLease ? tenantMap.get(viewingLease.primary_tenant_id) : undefined;
  const viewingSettings = viewingInvoice ? settings.find((s) => s.property_id === viewingInvoice.property_id) : undefined;

  return (
    <div className="portal-refined-page space-y-8">
      <PageHeader
        actionLabel={canCreate ? "ออกใบแจ้งหนี้" : undefined}
        description="คำนวณค่าเช่า ค่าน้ำ และค่าไฟจากสัญญาและมิเตอร์ของรอบเดือนโดยอัตโนมัติ"
        onAction={() => {
          setSelected("create");
          setLeaseId(activeLeases[0]?.id ?? "");
          setPeriodMonth(new Date().toISOString().slice(0, 7));
        }}
        title="ใบแจ้งหนี้"
      />

      <section aria-label="ภาพรวมใบแจ้งหนี้" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          aria-pressed={status === "all"}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${
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
                {totalInvoicesCount.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-700 to-blue-800 text-white shadow-md shadow-slate-500/25 flex items-center justify-center shrink-0">
              <FileText size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ยอดเรียกเก็บรวม</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {money(totalBilledAmount)}
              </strong>
            </div>
          </div>
        </div>

        <button
          aria-pressed={status === "paid"}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 ${
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
                {money(totalPaidAmount)}
              </strong>
            </div>
          </div>
        </button>

        <button
          aria-pressed={status === "issued" || status === "overdue"}
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/20 ${
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
            const active = property.id === resolvedPropertyId;
            const propRooms = rooms.filter((r) => r.property_id === property.id);
            const propInvoices = invoices.filter((inv) => inv.property_id === property.id);
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
                    {propRooms.length} ห้อง · บิล <strong className="text-blue-600 font-bold">{propInvoices.length}</strong> ฉบับ
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

      <CollectionToolbar
        actions={
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
            <button
              aria-label="มุมมองตาราง"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
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
        description={`แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${propertyInvoices.length.toLocaleString("th-TH")} ฉบับ (${activeProperty?.name ?? "หอพัก"})`}
        extraFilters={
          <DateFilterControl
            availableYears={availableYears}
            mode={dateFilterMode}
            onModeChange={setDateFilterMode}
            onValueChange={setDateFilterValue}
            value={dateFilterValue}
          />
        }
        filter={{
          label: "กรองสถานะ",
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "ทุกสถานะบิล" },
            { value: "issued", label: "รอชำระเงิน (Issued)" },
            { value: "partial", label: "ชำระบางส่วน (Partial)" },
            { value: "paid", label: "ชำระครบแล้ว (Paid)" },
            { value: "overdue", label: "เกินกำหนด (Overdue)" },
            { value: "void", label: "ยกเลิก (Void)" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขที่ใบแจ้งหนี้, ห้อง หรือหมายเหตุ..."
        query={query}
        title="รายการใบแจ้งหนี้"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full">
            <DataTable
              headers={[
                "เลขที่เอกสาร / ห้อง",
                "ชั้น",
                "ผู้เช่าหลัก",
                "ยอดรวมสุทธิ",
                "ยอดคงเหลือค้าง",
                "ครบกำหนด",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => {
                const room = roomMap.get(item.room_id);
                const lease = leases.find((l) => l.id === item.lease_id) || leases.find((l) => l.room_id === item.room_id && l.status === "active");
                const tenant = lease ? tenantMap.get(lease.primary_tenant_id) : undefined;
                const propName = propertyMap.get(item.property_id);

                return [
                  <div className="flex items-center gap-2.5" key="inv">
                    <span className="inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-lg bg-blue-50/80 text-blue-900 border border-blue-200 text-xs font-black">
                      {room?.room_number ?? "—"}
                    </span>
                    <div className="flex flex-col text-xs min-w-0">
                      <strong className="text-slate-900 font-mono font-bold block">{item.invoice_number}</strong>
                      <small className="text-slate-400">ออกเมื่อ {thaiDate(item.issued_at)} · {propName ?? "หอพัก"}</small>
                    </div>
                  </div>,
                  <div className="flex items-center" key="floor">
                    <span className="text-xs font-semibold text-slate-700">{room?.floor ? `ชั้น ${room.floor}` : "—"}</span>
                  </div>,
                  <div className="flex flex-col text-xs" key="tenant">
                    {tenant ? (
                      <>
                        <strong className="text-slate-900 font-bold truncate">{tenant.full_name}</strong>
                        <small className="text-slate-400 mt-0.5">{tenant.phone ? `โทร. ${tenant.phone}` : "ไม่มีเบอร์โทร"}</small>
                      </>
                    ) : (
                      <span className="text-slate-400">— ไม่ระบุ —</span>
                    )}
                  </div>,
                  <strong className="text-xs font-mono font-bold text-slate-900" key="total">
                    {money(Number(item.total))}
                  </strong>,
                  <strong
                    className={`text-xs font-mono font-bold ${Number(item.balance_due) > 0 ? "text-rose-600" : "text-emerald-600"}`}
                    key="balance"
                  >
                    {money(Number(item.balance_due))}
                  </strong>,
                  <span className="text-xs text-slate-700 font-medium" key="due">
                    {thaiDate(item.due_at)}
                  </span>,
                  <StatusBadge
                    key="status"
                    label={
                      submissionStatusMap.get(item.id) === "pending"
                        ? "รออนุมัติ"
                        : item.status === "paid" || submissionStatusMap.get(item.id) === "approved"
                        ? "อนุมัติผ่าน"
                        : undefined
                    }
                    status={
                      submissionStatusMap.get(item.id) === "pending"
                        ? "pending"
                        : item.status === "paid" || submissionStatusMap.get(item.id) === "approved"
                        ? "paid"
                        : item.status
                    }
                  />,
                  <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                    <button
                      className="h-8.5 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs"
                      onClick={() => setViewingInvoice(item)}
                      title="ดูใบแจ้งหนี้"
                      type="button"
                    >
                      <Eye size={14} strokeWidth={2.2} />
                      <span>ดูบิล</span>
                    </button>
                    <button
                      className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs shrink-0"
                      onClick={() => {
                        void printDocument(() => setViewingInvoice(item));
                      }}
                      title="พิมพ์ใบแจ้งหนี้ A4"
                      type="button"
                    >
                      <Printer size={14} strokeWidth={2.2} />
                    </button>
                    {canEdit && !["paid", "void"].includes(item.status) ? (
                      <button
                        aria-label={`แก้ไขใบแจ้งหนี้ ${item.invoice_number}`}
                        className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0"
                        onClick={() => setSelected(item)}
                        title="แก้ไขใบแจ้งหนี้"
                        type="button"
                      >
                        <Pencil size={14} strokeWidth={2.2} />
                      </button>
                    ) : null}
                    {cancelButton(item)}
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
                  <span className="text-xs text-slate-400 font-semibold">({group.invoices.length} ใบแจ้งหนี้)</span>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.invoices.map((item) => {
                    const room = roomMap.get(item.room_id);
                    const lease = leases.find((l) => l.id === item.lease_id) || leases.find((l) => l.room_id === item.room_id && l.status === "active");
                    const tenant = lease ? tenantMap.get(lease.primary_tenant_id) : undefined;
                    const propName = propertyMap.get(item.property_id);

                    return (
                      <article
                        className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                        key={item.id}
                      >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                        <div>
                          <header className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                {room?.room_number ?? "—"}
                              </span>
                              <div className="min-w-0">
                                <h2 className="text-sm font-bold text-slate-900 font-mono truncate group-hover:text-blue-600 transition-colors">
                                  {item.invoice_number}
                                </h2>
                                <span className="text-xs text-slate-400 block truncate mt-0.5">
                                  {propName ?? "หอพัก"} · ชั้น {room?.floor ?? "1"}
                                </span>
                              </div>
                            </div>
                            <StatusBadge
                              label={
                                submissionStatusMap.get(item.id) === "pending"
                                  ? "รออนุมัติ"
                                  : item.status === "paid" || submissionStatusMap.get(item.id) === "approved"
                                  ? "อนุมัติผ่าน"
                                  : undefined
                              }
                              status={
                                submissionStatusMap.get(item.id) === "pending"
                                  ? "pending"
                                  : item.status === "paid" || submissionStatusMap.get(item.id) === "approved"
                                  ? "paid"
                                  : item.status
                              }
                            />
                          </header>
                          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-8 h-8 rounded-full bg-white text-blue-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0 shadow-2xs">
                                {(tenant?.full_name || "ผ").slice(0, 1)}
                              </span>
                              <div className="min-w-0">
                                <strong className="text-xs font-bold text-slate-900 block truncate">{tenant?.full_name ?? "—"}</strong>
                                <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                                  {tenant?.phone ? `โทร. ${tenant.phone}` : "ไม่มีเบอร์โทร"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <dl className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                              <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ยอดรวมสุทธิ</dt>
                              <dd className="text-base font-mono font-black text-slate-900 mt-1">{money(Number(item.total))}</dd>
                              <span className="text-[10px] text-slate-400 block mt-0.5">ครบกำหนด {thaiDate(item.due_at)}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                              <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ยอดคงเหลือ</dt>
                              <dd className={`text-base font-mono font-black mt-1 ${Number(item.balance_due) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                {money(Number(item.balance_due))}
                              </dd>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {submissionStatusMap.get(item.id) === "pending"
                                  ? "รอตรวจสอบยอดโอน"
                                  : Number(item.balance_due) <= 0
                                  ? "ชำระครบถ้วน"
                                  : "รอชำระ"}
                              </span>
                            </div>
                          </dl>
                          {item.note ? (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                              <strong className="font-bold text-slate-800">หมายเหตุ:</strong> {item.note}
                            </div>
                          ) : null}
                        </div>
                        <footer className="pt-4 border-t border-slate-100 space-y-2">
                          {/* Row 1: ดูบิล / พิมพ์ */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all shadow-2xs cursor-pointer"
                              onClick={() => setViewingInvoice(item)}
                              title="ดูใบแจ้งหนี้"
                              type="button"
                            >
                              <Eye size={15} strokeWidth={2.2} />
                              <span>ดูบิล</span>
                            </button>
                            <button
                              className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                              onClick={() => {
                                void printDocument(() => setViewingInvoice(item));
                              }}
                              title="พิมพ์ใบแจ้งหนี้"
                              type="button"
                            >
                              <Printer size={15} strokeWidth={2.2} />
                              <span>พิมพ์</span>
                            </button>
                          </div>

                          {/* Row 2: จัดการใบแจ้งหนี้ (แก้ไข / ยกเลิก รวม 2 ปุ่ม) */}
                          {(() => {
                            const canCancel = isInvoiceCancellable(item);
                            const canModify = canEdit && !["paid", "void"].includes(item.status);
                            if (!canModify && !canCancel) return null;

                            return (
                              <div className={`grid ${canModify && canCancel ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
                                {canModify ? (
                                  <button
                                    aria-label={`แก้ไขใบแจ้งหนี้ ${item.invoice_number}`}
                                    className="h-9 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs"
                                    onClick={() => setSelected(item)}
                                    title="แก้ไขใบแจ้งหนี้"
                                    type="button"
                                  >
                                    <Pencil size={14} strokeWidth={2.2} className="shrink-0" />
                                    <span className="truncate">แก้ไขใบแจ้งหนี้</span>
                                  </button>
                                ) : null}
                                {canCancel ? (
                                  <button
                                    aria-label={`ยกเลิกใบแจ้งหนี้ ${item.invoice_number}`}
                                    className="h-9 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
                                    onClick={() => setCancellingInvoice(item)}
                                    title="ยกเลิกใบแจ้งหนี้"
                                    type="button"
                                  >
                                    <XCircle size={14} strokeWidth={2.2} className="shrink-0" />
                                    <span className="truncate">ยกเลิกใบแจ้งหนี้</span>
                                  </button>
                                ) : null}
                              </div>
                            );
                          })()}
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
          description="ออกใบแจ้งหนี้ประจำเดือนเพื่อเรียกเก็บค่าเช่า ค่าน้ำ และค่าไฟ"
          title="ยังไม่มีรายการใบแจ้งหนี้"
        />
      )}

      {cancellingInvoice ? (
        <Modal title="ยืนยันยกเลิกใบแจ้งหนี้" onClose={() => setCancellingInvoice(null)}>
          <PortalForm action={cancelInvoiceAction} organizationId={organizationId} validate={() => ({})} submitLabel="ยืนยันยกเลิกใบแจ้งหนี้" onCancel={() => setCancellingInvoice(null)} onSuccess={() => setCancellingInvoice(null)}>
            {() => (
              <div className="space-y-3.5 text-xs">
                <input name="invoiceId" type="hidden" value={cancellingInvoice.id} />
                <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-rose-900">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">เลขที่ใบแจ้งหนี้:</span>
                    <strong className="font-mono font-bold text-sm text-rose-700">{cancellingInvoice.invoice_number}</strong>
                  </div>
                  <p className="mt-2 text-[11px] text-rose-700/90 leading-relaxed">
                    ใบแจ้งหนี้จะเปลี่ยนเป็นสถานะยกเลิก (Void) และไม่นับเป็นยอดค้างชำระ โดยยังคงเก็บประวัติไว้ในระบบ ไม่สามารถยกเลิกรายการที่รับชำระแล้วได้
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    เหตุผลในการยกเลิกเอกสาร <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-medium transition-all"
                    defaultValue="จดเลขมิเตอร์ผิดพลาด / ออกบิลใหม่แทน"
                    name="reason"
                    placeholder="เช่น จดเลขมิเตอร์ผิดพลาด, มีการตกลงส่วนลดพิเศษ, ผู้เช่าย้ายออก"
                    required
                  />
                  <p className="mt-1 text-[11px] text-slate-400">ข้อมูลนี้จะถูกบันทึกใน Audit Log เพื่อการตรวจสอบย้อนหลัง</p>
                </div>
              </div>
            )}
          </PortalForm>
        </Modal>
      ) : null}
      {viewingInvoice ? (
        <Modal
          className="contract-modal portal-refined-modal"
          headerActions={
            <button
              className="h-8.5 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs print:hidden"
              onClick={() => void printDocument()}
              type="button"
            >
              <Printer size={14} strokeWidth={2.2} />
              <span>พิมพ์ใบแจ้งหนี้ A4</span>
            </button>
          }
          maxWidth={800}
          onClose={() => setViewingInvoice(null)}
          title={`ใบแจ้งหนี้เลขที่ ${viewingInvoice.invoice_number}`}
        >
          <InvoiceDocument invoice={viewingInvoice} property={viewingProperty} room={viewingRoom} tenant={viewingTenant} settings={viewingSettings} />
        </Modal>
      ) : null}

      {selected ? (
        <Modal
          className="portal-refined-modal"
          description={
            editing
              ? `แก้ไขข้อมูลใบแจ้งหนี้ ${editing.invoice_number}`
              : "ระบบจะคำนวณค่าเช่า ค่าน้ำ และค่าไฟตามมิเตอร์ของรอบเดือนที่เลือกโดยอัตโนมัติ"
          }
          maxWidth={640}
          onClose={() => setSelected(null)}
          title={editing ? "แก้ไขใบแจ้งหนี้" : "ออกใบแจ้งหนี้ใหม่"}
        >
          <PortalForm
            action={editing ? updateInvoiceAction : createInvoiceAction}
            onCancel={() => setSelected(null)}
            onSuccess={() => setSelected(null)}
            organizationId={organizationId}
            submitLabel={editing ? "บันทึกการแก้ไข" : "ออกใบแจ้งหนี้"}
            submitDisabled={!editing && !preview?.ready}
            submitDisabledReason={!editing && !preview?.ready ? "เลือกสัญญาและรอบเดือนที่มีข้อมูลมิเตอร์ครบก่อนออกใบแจ้งหนี้" : undefined}
            validate={validateInvoice}
          >
            {(errors, clear) => (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles size={13} strokeWidth={2.2} />
                  </span>
                  <div className="leading-relaxed">
                    <strong className="font-bold block text-blue-950">ออกใบแจ้งหนี้ประจำรอบเดือน</strong>
                    <span className="text-[11px] text-blue-800/80">
                      ระบบจะผูกมิเตอร์น้ำ-ไฟและสัญญาเช่าเพื่อสร้างบิลเรียกเก็บอัตโนมัติ
                    </span>
                  </div>
                </div>

                {editing ? (
                  <>
                    <input name="invoiceId" type="hidden" value={editing.id} />
                    <input name="invoiceNumber" type="hidden" value={editing.invoice_number} />
                    <DateTimeControl name="dueAt" ariaLabel="วันครบกำหนดชำระ" defaultValue={editing.due_at.slice(0, 10)} invalid={Boolean(errors.dueAt)} onValueChange={() => clear("dueAt")} />
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ReceiptText size={14} className="text-slate-500" />
                          <span>เลขที่ใบแจ้งหนี้</span>
                        </span>
                      </label>
                      <input
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-xs font-mono font-bold outline-none"
                        defaultValue={editing.invoice_number}
                        disabled
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <input name="leaseId" type="hidden" value={leaseId} />
                    <input name="itemsJson" type="hidden" value={JSON.stringify(preview?.items ?? [])} />
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ReceiptText size={14} className="text-slate-500" />
                          <span>เลขที่ใบแจ้งหนี้ <span className="text-rose-500">*</span></span>
                        </span>
                        {voidedInvoicesForLeaseAndPeriod.length > 0 ? (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-lg">
                            ฉบับออกใหม่แทนบิลที่ยกเลิก (-R{voidedInvoicesForLeaseAndPeriod.length})
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-normal">กำหนดเองหรือใช้ตามระบบ</span>
                        )}
                      </label>
                      <input
                        aria-invalid={Boolean(errors.invoiceNumber)}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all placeholder:text-slate-400"
                        name="invoiceNumber"
                        onChange={(e) => {
                          setCustomInvoiceNumber(e.target.value);
                          clear("invoiceNumber");
                        }}
                        placeholder="เช่น INV-202609-101"
                        value={customInvoiceNumber || defaultInvoiceNumber}
                      />
                      {errors.invoiceNumber ? (
                        <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.invoiceNumber}</p>
                      ) : null}
                      {voidedInvoicesForLeaseAndPeriod.length > 0 ? (
                        <p className="mt-1 text-[11px] text-amber-700 font-medium">
                          ⚠️ สัญญานี้เคยยกเลิกบิลรอบนี้ ({voidedInvoicesForLeaseAndPeriod[0].invoice_number}) ระบบจึงแนะนำเลขที่ต่อท้ายด้วย -R{voidedInvoicesForLeaseAndPeriod.length} เพื่อป้องกันเลขที่ซ้ำ
                        </p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Building2 size={14} className="text-slate-500" />
                            <span>เลือกห้อง / สัญญา <span className="text-rose-500">*</span></span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">สัญญาที่ใช้งาน</span>
                        </label>
                        <SelectControl
                          ariaLabel="สัญญาเช่า"
                          onValueChange={(val) => {
                            setLeaseId(val);
                            clear("leaseId");
                            setCustomInvoiceNumber("");
                          }}
                          options={activeLeases.map((l) => {
                            const room = roomMap.get(l.room_id);
                            const tenant = tenantMap.get(l.primary_tenant_id);
                            return {
                              value: l.id,
                              label: `ห้อง ${room?.room_number ?? "—"} (${tenant?.full_name ?? "ผู้เช่า"})`,
                            };
                          })}
                          placeholder="เลือกสัญญาเช่า"
                          value={leaseId}
                        />
                        {errors.leaseId ? (
                          <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.leaseId}</p>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-500" />
                            <span>รอบเดือนที่เรียกเก็บ <span className="text-rose-500">*</span></span>
                          </span>
                        </label>
                        <DateTimeControl
                          ariaLabel="รอบเดือนที่เรียกเก็บ"
                          defaultValue={periodMonth}
                          invalid={Boolean(errors.periodMonth)}
                          mode="month"
                          name="periodMonth"
                          onValueChange={(val) => {
                            setPeriodMonth(val);
                            clear("periodMonth");
                            setCustomInvoiceNumber("");
                          }}
                          placeholder="เลือกรอบเดือน"
                        />
                      </div>
                    </div>

                    {preview ? (
                      !preview.ready ? (
                        <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-800 font-medium leading-relaxed">
                          {invoiceMissingMessage(preview.missing)}
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-xs flex flex-col gap-2.5 shadow-2xs">
                          <strong className="text-blue-950 font-bold text-xs flex items-center gap-1.5">
                            <Sparkles size={14} className="text-blue-600" />
                            <span>สรุปยอดคำนวณ ({formatThaiBillingMonth(periodMonth)})</span>
                          </strong>
                          <div className="flex flex-col gap-1.5 pt-1 text-slate-700">
                            {preview.items.map((item, idx) => (
                              <div className="flex items-center justify-between" key={idx}>
                                <span className="text-slate-600">{item.description}</span>
                                <strong className="text-slate-900 font-mono">{money(item.amount)}</strong>
                              </div>
                            ))}
                            <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-blue-200 text-blue-950 font-bold text-sm">
                              <span>รวมยอดเรียกเก็บสุทธิ</span>
                              <span className="text-blue-600 font-mono font-black">{money(preview.total)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    ) : null}

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CalendarClock size={14} className="text-slate-500" />
                          <span>วันครบกำหนดชำระ <span className="text-rose-500">*</span></span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">กำหนดให้ชำระภายในวันนี้</span>
                      </label>
                      <DateTimeControl
                        ariaLabel="วันครบกำหนดชำระ"
                        defaultValue={defaultDueAt}
                        invalid={Boolean(errors.dueAt)}
                        mode="date"
                        name="dueAt"
                        onValueChange={() => clear("dueAt")}
                        placeholder="เลือกวันครบกำหนดชำระ"
                      />
                      {errors.dueAt ? (
                        <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.dueAt}</p>
                      ) : null}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>หมายเหตุ / รายละเอียดเพิ่มเติม</span>
                    <span className="text-[11px] text-slate-400 font-normal">พิมพ์ลงท้ายบิล</span>
                  </label>
                  <input
                    aria-invalid={Boolean(errors.note)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-medium transition-all placeholder:text-slate-400"
                    defaultValue={editing?.note ?? ""}
                    name="note"
                    onChange={() => clear("note")}
                    placeholder="เช่น ค่าส่วนกลางรวมแล้ว, กรุณาชำระก่อนวันที่ 5"
                  />
                  {errors.note ? (
                    <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.note}</p>
                  ) : null}
                </div>
              </div>
            )}
          </PortalForm>
        </Modal>
      ) : null}
    </div>
  );
}
