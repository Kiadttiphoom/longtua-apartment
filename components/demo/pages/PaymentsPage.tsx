"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  DoorOpen,
  ExternalLink,
  Eye,
  FileText,
  Hash,
  Layers,
  LayoutGrid,
  List,
  Pencil,
  Printer,
  Receipt,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
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
import type { PageContentProps } from "../types";

type DemoPayment = {
  id: string;
  propertyId: string;
  receiptNumber: string;
  invoiceNumber: string;
  roomNumber: string;
  floor: string;
  propertyName: string;
  tenant: string;
  tenantPhone: string;
  amount: number;
  paidAt: string;
  method: "transfer" | "promptpay" | "cash" | "card";
  reference: string;
  status: "confirmed" | "pending";
};

type DemoSlipSubmission = {
  id: string;
  roomNumber: string;
  tenant: string;
  invoiceNumber: string;
  amount: number;
  paidAt: string;
  method: string;
  slipNote: string;
};

export function PaymentsPage({
  isLocked,
  onToast,
  meterRooms,
  activeProperty,
  properties,
  appSettings,
}: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState(activeProperty?.id ?? properties[0]?.id ?? "");
  const [floor, setFloor] = useState("all");

  const currentProperty = properties.find((p) => p.id === selectedPropertyId) ?? activeProperty ?? properties[0];

  const floorLabel = (key: string) => `ชั้น ${key}`;

  // Local demo payments
  const [payments, setPayments] = useState<DemoPayment[]>(() => {
    const list: DemoPayment[] = [];
    const propsList = properties && properties.length > 0 ? properties : [activeProperty];

    propsList.forEach((prop) => {
      const demoData = [
        { room: "101", floor: "1", tenant: "สมมุต ศรีสระเกษ", phone: "089-123-4567", amount: 3210, date: "2026-08-01", method: "promptpay" as const, ref: "PP-987213456" },
        { room: "102", floor: "1", tenant: "อารยา พรดี", phone: "089-876-5432", amount: 3105, date: "2026-07-31", method: "transfer" as const, ref: "KBANK-11209" },
        { room: "201", floor: "2", tenant: "กิตติภพ ทองแท้", phone: "081-998-7766", amount: 3450, date: "2026-08-02", method: "transfer" as const, ref: "SCB-876231" },
        { room: "202", floor: "2", tenant: "ธนกฤต มั่งคั่ง", phone: "092-333-8888", amount: 3800, date: "2026-08-03", method: "cash" as const, ref: "CASH-202608" },
        { room: "301", floor: "3", tenant: "ปรียานุช รุ่งเรือง", phone: "084-222-1111", amount: 4150, date: "2026-08-02", method: "promptpay" as const, ref: "PP-6543219" },
        { room: "302", floor: "3", tenant: "อภิสิทธิ์ วงศ์ไทย", phone: "085-777-9999", amount: 4300, date: "2026-08-01", method: "card" as const, ref: "VISA-9912" },
      ];

      demoData.forEach((d) => {
        list.push({
          id: `pay-${prop.id.slice(-2)}-${d.room}`,
          propertyId: prop.id,
          receiptNumber: `REC-2569-08${d.room}`,
          invoiceNumber: `INV-2569-08${d.room}`,
          roomNumber: d.room,
          floor: d.floor,
          propertyName: prop.name,
          tenant: d.tenant,
          tenantPhone: d.phone,
          amount: d.amount,
          paidAt: d.date,
          method: d.method,
          reference: d.ref,
          status: "confirmed",
        });
      });
    });
    return list;
  });

  const propertyPayments = useMemo(() => {
    return payments.filter((p) => p.propertyId === currentProperty.id);
  }, [payments, currentProperty.id]);

  const floorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of propertyPayments) {
      counts.set(p.floor, (counts.get(p.floor) ?? 0) + 1);
    }
    return Array.from(counts, ([value, count]) => ({
      value,
      count,
      label: floorLabel(value),
    })).sort((a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" }));
  }, [propertyPayments]);

  // Demo slip submission waiting for review
  const [submissions, setSubmissions] = useState<DemoSlipSubmission[]>([
    {
      id: "slip-001",
      roomNumber: "103",
      tenant: "กิตติภพ ทองแท้",
      invoiceNumber: "INV-2569-08103",
      amount: 3154,
      paidAt: "2026-08-02 14:30 น.",
      method: "โอนผ่าน Mobile Banking (กสิกรไทย)",
      slipNote: "โอนค่าเช่าห้อง 103 รอบสิงหาคมเรียบร้อยครับ",
    },
  ]);

  // Modal states
  const [viewingReceipt, setViewingReceipt] = useState<DemoPayment | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [viewingSlip, setViewingSlip] = useState<DemoSlipSubmission | null>(null);

  // Form states
  const [formRoom, setFormRoom] = useState("101");
  const [formTenant, setFormTenant] = useState("สมมุต ศรีสระเกษ");
  const [formInvoice, setFormInvoice] = useState("INV-2569-08101");
  const [formAmount, setFormAmount] = useState(3210);
  const [formMethod, setFormMethod] = useState<DemoPayment["method"]>("promptpay");
  const [formPaidDate, setFormPaidDate] = useState("2026-08-02");
  const [formRef, setFormRef] = useState("TXN-123456");

  // Stats
  const confirmedAmount = propertyPayments
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalCount = propertyPayments.length;
  const pendingSlipsCount = submissions.length;
  const openInvoicesCount = 2; // Demo count of unpaid invoices

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return propertyPayments.filter((item) => {
      const matchesFloor = floor === "all" || item.floor === floor;
      const matchesMethod = method === "all" || item.method === method;
      const matchesSearch =
        !needle ||
        `${item.receiptNumber} ${item.invoiceNumber} ${item.roomNumber} ${item.tenant} ${item.reference}`
          .toLowerCase()
          .includes(needle);
      return matchesFloor && matchesMethod && matchesSearch;
    });
  }, [propertyPayments, floor, query, method]);

  const visibleFloorGroups = useMemo(() => {
    if (floor !== "all") {
      return [{ value: floor, label: floorLabel(floor), payments: filtered }];
    }
    const groups = new Map<string, typeof filtered>();
    for (const item of filtered) {
      if (!groups.has(item.floor)) groups.set(item.floor, []);
      groups.get(item.floor)!.push(item);
    }
    return Array.from(groups, ([value, list]) => ({
      value,
      label: floorLabel(value),
      payments: list,
    })).sort((a, b) => a.value.localeCompare(b.value, "th", { numeric: true, sensitivity: "base" }));
  }, [floor, filtered]);

  const methodLabel = (m: string) => {
    switch (m) {
      case "transfer":
        return "โอนธนาคาร";
      case "promptpay":
        return "พร้อมเพย์";
      case "cash":
        return "เงินสด";
      case "card":
        return "บัตรเครดิต/เดบิต";
      default:
        return m;
    }
  };

  const methodIcon = (m: string) => {
    switch (m) {
      case "transfer":
      case "promptpay":
        return <CreditCard size={13} />;
      case "cash":
        return <Banknote size={13} />;
      default:
        return <Receipt size={13} />;
    }
  };

  function handleSavePayment() {
    const newPay: DemoPayment = {
      id: `pay-${Date.now()}`,
      propertyId: currentProperty.id,
      receiptNumber: `REC-2569-08${formRoom}`,
      invoiceNumber: formInvoice,
      roomNumber: formRoom,
      floor: formRoom.length >= 3 ? formRoom.slice(0, 1) : "1",
      propertyName: currentProperty.name,
      tenant: formTenant,
      tenantPhone: "08X-XXX-XXXX",
      amount: Number(formAmount),
      paidAt: formPaidDate,
      method: formMethod,
      reference: formRef,
      status: "confirmed",
    };
    setPayments((prev) => [newPay, ...prev]);
    setShowRecordModal(false);
    onToast(`บันทึกรับชำระเงินห้อง ${formRoom} เรียบร้อยแล้ว`);
  }

  function handleApproveSlip(sub: DemoSlipSubmission) {
    const newPay: DemoPayment = {
      id: `pay-${Date.now()}`,
      propertyId: currentProperty.id,
      receiptNumber: `REC-2569-08${sub.roomNumber}`,
      invoiceNumber: sub.invoiceNumber,
      roomNumber: sub.roomNumber,
      floor: sub.roomNumber.length >= 3 ? sub.roomNumber.slice(0, 1) : "1",
      propertyName: currentProperty.name,
      tenant: sub.tenant,
      tenantPhone: "081-998-7766",
      amount: sub.amount,
      paidAt: new Date().toISOString().slice(0, 10),
      method: "transfer",
      reference: `SLIP-${sub.id}`,
      status: "confirmed",
    };
    setPayments((prev) => [newPay, ...prev]);
    setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
    setViewingSlip(null);
    onToast(`อนุมัติสลิปห้อง ${sub.roomNumber} และออกใบเสร็จเรียบร้อยแล้ว`);
  }

  function handleRejectSlip(sub: DemoSlipSubmission) {
    setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
    setViewingSlip(null);
    onToast(`ปฏิเสธสลิปห้อง ${sub.roomNumber} แล้ว`);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        actionLabel={!isLocked ? "บันทึกรับชำระ" : undefined}
        description="บันทึกยอดรับเงินจริงและตัดยอดคงเหลือของใบแจ้งหนี้อัตโนมัติ"
        onAction={() => setShowRecordModal(true)}
        title="รับชำระเงิน"
      />

      {/* 4 Hero Stat Cards (Matching Portal PaymentsPage) */}
      <section aria-label="ภาพรวมการรับชำระ" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Verified Paid Amount */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">รับชำระยืนยันแล้ว</span>
              <strong className="text-2xl font-black text-emerald-800 tracking-tight tabular-nums mt-0.5 block">
                {money(confirmedAmount)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 2: Total Transactions */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            method === "all"
              ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setMethod("all")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0">
              <Receipt size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">รายการทั้งหมด</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {totalCount.toLocaleString("th-TH")} รายการ
              </strong>
            </div>
          </div>
        </button>

        {/* Card 3: Pending Slip Submissions */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
              <Clock3 size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">สลิปรอตรวจสอบ</span>
              <strong className="text-2xl font-black text-amber-800 tracking-tight tabular-nums mt-0.5 block">
                {pendingSlipsCount.toLocaleString("th-TH")} รายการ
              </strong>
            </div>
          </div>
        </div>

        {/* Card 4: Open Invoices Waiting for Payment */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/25 flex items-center justify-center shrink-0">
              <CreditCard size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ใบแจ้งหนี้รอชำระ</span>
              <strong className="text-2xl font-black text-rose-800 tracking-tight tabular-nums mt-0.5 block">
                {openInvoicesCount.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Pending Slip Verification Banner (Matching Portal Feature) */}
      {submissions.length > 0 ? (
        <section className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Clock3 size={18} className="text-amber-600" />
              <span>มีสลิปโอนเงินรอยืนยันจากผู้เช่า ({submissions.length} รายการ)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {submissions.map((sub) => (
              <div
                className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                key={sub.id}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-bold">
                      ห้อง {sub.roomNumber}
                    </span>
                    <strong className="text-xs font-bold text-slate-800">{sub.tenant}</strong>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    ยอดเงิน: <strong className="text-emerald-700 font-mono">{money(sub.amount)}</strong> · {sub.paidAt}
                  </p>
                  <span className="text-[11px] text-slate-400 block truncate">{sub.method}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="h-8 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                    onClick={() => setViewingSlip(sub)}
                    type="button"
                  >
                    <Eye size={13} />
                    <span>ตรวจสลิป</span>
                  </button>
                  <button
                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    onClick={() => handleApproveSlip(sub)}
                    type="button"
                  >
                    <CheckCircle2 size={13} />
                    <span>อนุมัติ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Property Switcher Bar (แยกหอ แบบ /guestrooms) */}
      <section aria-label="เลือกหอพัก" className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <header className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" strokeWidth={2.2} />
            <strong className="text-xs font-bold text-slate-800">เลือกหอพักเพื่อแสดงรายการรับชำระ</strong>
          </div>
          <small className="text-xs text-slate-500 font-semibold">
            {properties.length} หอพัก · {payments.length} รายการรับชำระทั้งหมดในระบบ
          </small>
        </header>
        <div aria-label="รายชื่อหอพัก" className="p-3 flex gap-2.5 overflow-x-auto" role="tablist">
          {properties.map((property) => {
            const active = property.id === currentProperty.id;
            const propPayments = payments.filter((p) => p.propertyId === property.id);
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
                    {property.rooms.length} ห้อง · รับชำระ <strong className="text-blue-600 font-bold">{propPayments.length}</strong> รายการ
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
            ทุกชั้น <span className={`text-[11px] font-bold ${floor === "all" ? "text-blue-600" : "text-slate-400"}`}>({propertyPayments.length})</span>
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
        description={`พบ ${filtered.length.toLocaleString("th-TH")} จาก ${propertyPayments.length.toLocaleString("th-TH")} รายการ (${currentProperty.name})`}
        filter={{
          label: "กรองช่องทางชำระ",
          value: method,
          onChange: setMethod,
          options: [
            { value: "all", label: "ทุกช่องทางชำระ" },
            { value: "promptpay", label: "พร้อมเพย์" },
            { value: "transfer", label: "โอนธนาคาร" },
            { value: "cash", label: "เงินสด" },
            { value: "card", label: "บัตรเครดิต/เดบิต" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขที่ใบเสร็จ ผู้เช่า หรือหมายเลขอ้างอิง"
        query={query}
        title="รายการรับชำระ"
      />

      {/* Content: Table or Grid View */}
      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full mb-6">
            <DataTable
              headers={[
                "เลขที่ใบเสร็จ",
                "อ้างอิงใบแจ้งหนี้ / ห้อง",
                "ชั้น",
                "ผู้เช่า",
                "ช่องทางชำระ",
                "วันที่ชำระ",
                "ยอดเงินที่รับ",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => [
                <strong className="text-slate-900 font-mono font-bold text-xs" key="receipt">
                  {item.receiptNumber}
                </strong>,
                <div className="flex items-center gap-2" key="inv">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-mono font-bold border border-blue-200">
                    ห้อง {item.roomNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{item.invoiceNumber}</span>
                </div>,
                <span className="text-xs font-semibold text-slate-700" key="floor">
                  ชั้น {item.floor}
                </span>,
                <span className="text-xs font-bold text-slate-800" key="tenant">
                  {item.tenant}
                </span>,
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium" key="method">
                  {methodIcon(item.method)}
                  <span>{methodLabel(item.method)}</span>
                </span>,
                <span className="text-xs text-slate-600 font-mono" key="date">
                  {item.paidAt}
                </span>,
                <strong className="text-xs font-mono font-black text-emerald-700" key="amt">
                  {money(item.amount)}
                </strong>,
                <StatusBadge key="status" status="confirmed" />,
                <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                  <button
                    className="h-8 px-2.5 rounded-xl flex items-center gap-1 text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                    onClick={() => setViewingReceipt(item)}
                    title="ดูใบเสร็จรับเงิน"
                    type="button"
                  >
                    <Eye size={13} strokeWidth={2.2} />
                    <span>ดูใบเสร็จ</span>
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
                  <span className="text-xs text-slate-400 font-semibold">({group.payments.length} รายการ)</span>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.payments.map((item) => (
                    <article
                      className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                      key={item.id}
                    >
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                      <div>
                        {/* Card Header */}
                        <header className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-mono font-black text-sm border border-blue-200 shadow-2xs shrink-0">
                              ห้อง {item.roomNumber}
                            </span>
                            <div className="min-w-0">
                              <strong className="text-xs font-mono font-bold text-slate-900 block truncate">
                                {item.receiptNumber}
                              </strong>
                              <span className="text-[11px] text-slate-400 block truncate">
                                {item.propertyName} · ชั้น {item.floor} · {item.invoiceNumber}
                              </span>
                            </div>
                          </div>
                          <StatusBadge status="confirmed" />
                        </header>

                        {/* Tenant */}
                        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 mb-3 text-xs">
                          <span className="text-slate-400 text-[11px] block">ผู้ชำระเงิน</span>
                          <strong className="text-slate-800 font-bold text-sm block mt-0.5">{item.tenant}</strong>
                          <span className="text-slate-500 font-mono mt-0.5 block">{item.tenantPhone}</span>
                        </div>

                        {/* Amount Paid Callout */}
                        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between mb-3">
                          <div>
                            <span className="text-[11px] font-bold text-emerald-800 block">ยอดรับชำระเงิน</span>
                            <strong className="text-lg font-black text-emerald-800 font-mono mt-0.5 block">
                              {money(item.amount)}
                            </strong>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                            {methodIcon(item.method)}
                            <span>{methodLabel(item.method)}</span>
                          </span>
                        </div>

                        {/* Metadata */}
                        <div className="space-y-1 text-xs text-slate-500 px-1">
                          <div className="flex items-center justify-between">
                            <span>วันที่ชำระ:</span>
                            <strong className="text-slate-700 font-mono">{item.paidAt}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>เลขอ้างอิง:</span>
                            <span className="font-mono text-slate-500">{item.reference}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <footer className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                        <button
                          className="w-full h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                          onClick={() => setViewingReceipt(item)}
                          type="button"
                        >
                          <Eye size={14} strokeWidth={2.2} />
                          <span>ดูใบเสร็จรับเงิน</span>
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
          actionLabel={!isLocked ? "บันทึกรับชำระ" : undefined}
          description="ไม่พบรายการรับชำระที่ตรงกับเงื่อนไขการค้นหา"
          onAction={() => setShowRecordModal(true)}
          title="ไม่พบรายการรับชำระ"
        />
      )}

      {/* Official Thai Receipt View & Print Modal (Matching Portal UI) */}
      {viewingReceipt ? (
        <Modal
          maxWidth="max-w-2xl"
          onClose={() => setViewingReceipt(null)}
          title={`ใบเสร็จรับเงินเลขที่ ${viewingReceipt.receiptNumber}`}
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
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-1">
                    ใบเสร็จรับเงิน / Receipt
                  </span>
                  <strong className="block text-sm font-mono font-bold text-slate-800">
                    เลขที่: {viewingReceipt.receiptNumber}
                  </strong>
                  <span className="text-xs text-slate-500 block">วันที่รับเงิน: {viewingReceipt.paidAt}</span>
                  <span className="text-xs text-slate-400 block font-mono">อ้างอิงบิล: {viewingReceipt.invoiceNumber}</span>
                </div>
              </div>

              {/* Received From */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">ได้รับเงินจาก:</span>
                  <strong className="text-sm font-bold text-slate-800 block">{viewingReceipt.tenant}</strong>
                  <span className="text-slate-500">โทร. {viewingReceipt.tenantPhone}</span>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-400 block">ห้องพัก:</span>
                  <strong className="text-sm font-bold text-blue-700 block">ห้อง {viewingReceipt.roomNumber}</strong>
                  <span className="text-slate-500">ช่องทาง: {methodLabel(viewingReceipt.method)} ({viewingReceipt.reference})</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">ลำดับ</th>
                      <th className="p-3">รายการรับชำระ</th>
                      <th className="p-3 text-right">จำนวนเงิน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="p-3">1</td>
                      <td className="p-3 font-sans">ชำระค่าห้องพักและสาธารณูปโภค ตามใบแจ้งหนี้ {viewingReceipt.invoiceNumber}</td>
                      <td className="p-3 text-right font-bold">{money(viewingReceipt.amount)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                    <tr>
                      <td className="p-3 text-right font-sans" colSpan={2}>
                        ยอดเงินที่ได้รับชำระทั้งสิ้น:
                      </td>
                      <td className="p-3 text-right font-black text-sm text-emerald-700 font-mono">
                        {money(viewingReceipt.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount In Thai Text */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">จำนวนเงินตัวอักษร:</span>
                <strong className="text-slate-800 font-bold">
                  ({thaiBahtText(viewingReceipt.amount)})
                </strong>
              </div>

              {/* Signature Line */}
              <div className="pt-6 flex justify-end text-xs text-center">
                <div className="space-y-6">
                  <p>ลงชื่อ........................................................ผู้รับเงิน</p>
                  <p className="text-slate-500">({activeProperty.settings.accountName || "ผู้มีอำนาจลงนาม"})</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-all"
                onClick={() => setViewingReceipt(null)}
                type="button"
              >
                ปิดหน้าต่าง
              </button>
              <button
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 transition-all"
                onClick={() => {
                  window.print();
                  onToast("สั่งพิมพ์ใบเสร็จรับเงิน");
                }}
                type="button"
              >
                <Printer size={15} />
                <span>พิมพ์ใบเสร็จรับเงิน</span>
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Slip Preview Modal */}
      {viewingSlip ? (
        <Modal
          maxWidth="max-w-md"
          onClose={() => setViewingSlip(null)}
          title={`ตรวจสอบสลิปโอนเงินห้อง ${viewingSlip.roomNumber}`}
        >
          <div className="p-6 space-y-4 text-xs">
            <div className="p-6 rounded-2xl bg-slate-900 text-white text-center space-y-3">
              <span className="inline-block p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={32} />
              </span>
              <div>
                <span className="text-slate-400 block text-xs">สลิปการโอนเงิน (จำลอง)</span>
                <strong className="text-2xl font-black font-mono mt-1 block text-emerald-400">
                  {money(viewingSlip.amount)}
                </strong>
              </div>
              <div className="pt-2 border-t border-slate-800 text-left space-y-1 text-slate-300">
                <p>ผู้โอน: <strong>{viewingSlip.tenant}</strong> (ห้อง {viewingSlip.roomNumber})</p>
                <p>เวลาที่โอน: {viewingSlip.paidAt}</p>
                <p>ช่องทาง: {viewingSlip.method}</p>
                <p className="text-slate-400 italic mt-2">&ldquo;{viewingSlip.slipNote}&rdquo;</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                className="h-10 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold cursor-pointer transition-all"
                onClick={() => handleRejectSlip(viewingSlip)}
                type="button"
              >
                ปฏิเสธสลิป
              </button>
              <button
                className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-md shadow-emerald-500/20 transition-all"
                onClick={() => handleApproveSlip(viewingSlip)}
                type="button"
              >
                อนุมัติและออกใบเสร็จ
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Record Payment Modal (Matching Portal UI) */}
      {showRecordModal ? (
        <Modal
          description="บันทึกยอดเงินที่ได้รับจากผู้เช่าเพื่อตัดยอดบิลและออกใบเสร็จรับเงิน"
          maxWidth={640}
          onClose={() => setShowRecordModal(false)}
          title="บันทึกรับเงินชำระ"
        >
          <div className="p-6 flex flex-col gap-4 text-left text-xs">
            {/* Feature Intro Banner */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Sparkles size={13} strokeWidth={2.2} />
              </span>
              <div className="leading-relaxed">
                <strong className="font-bold block text-blue-950">บันทึกรับเงินชำระและออกใบเสร็จ</strong>
                <span className="text-[11px] text-blue-800/80">
                  เลือกใบแจ้งหนี้ที่มียอดค้างชำระเพื่อบันทึกการรับเงิน พร้อมตัดยอดคงค้างให้อัตโนมัติ
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

            {/* Invoice & Room Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <DoorOpen size={14} className="text-slate-500" />
                    <span>ห้องพัก <span className="text-rose-500">*</span></span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">เลือกห้องที่รับชำระ</span>
                </label>
                <SelectControl
                  ariaLabel="ห้องพัก"
                  onValueChange={(val) => {
                    setFormRoom(val);
                    const found = meterRooms.find((r) => r.number === val);
                    if (found && found.tenant) setFormTenant(found.tenant);
                    setFormInvoice(`INV-2569-08${val}`);
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
                    <ReceiptText size={14} className="text-slate-500" />
                    <span>เลขที่ใบแจ้งหนี้อ้างอิง <span className="text-rose-500">*</span></span>
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ReceiptText size={16} strokeWidth={2.2} />
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                    onChange={(e) => setFormInvoice(e.target.value)}
                    value={formInvoice}
                  />
                </div>
              </div>
            </div>

            {/* Balance Due Notice */}
            <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 p-3 text-xs border border-emerald-200/80">
              <div>
                <span className="block text-[11px] font-medium text-emerald-700">ยอดคงเหลือของบิลที่เลือก</span>
                <strong className="mt-0.5 block font-mono text-sm font-black text-emerald-900">
                  {money(formAmount)}
                </strong>
              </div>
              <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-800 shadow-xs">
                {formTenant ? `ผู้เช่า: ${formTenant}` : activeProperty.name}
              </span>
            </div>

            {/* Paid Date & Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-500" />
                    <span>วันที่รับเงินจริง <span className="text-rose-500">*</span></span>
                  </span>
                </label>
                <DateTimeControl
                  ariaLabel="วันที่รับเงินจริง"
                  defaultValue={formPaidDate}
                  mode="date"
                  name="formPaidDate"
                  onValueChange={(val) => setFormPaidDate(val)}
                  placeholder="เลือกวันที่รับเงิน"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Banknote size={14} className="text-slate-500" />
                    <span>จำนวนเงินที่รับจริง (บาท) <span className="text-rose-500">*</span></span>
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Banknote size={16} strokeWidth={2.2} />
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    step="0.01"
                    type="number"
                    value={formAmount}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method & Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard size={14} className="text-slate-500" />
                    <span>ช่องทางการชำระ <span className="text-rose-500">*</span></span>
                  </span>
                </label>
                <SelectControl
                  ariaLabel="วิธีชำระเงิน"
                  onValueChange={(val) => setFormMethod(val as DemoPayment["method"])}
                  options={[
                    { value: "promptpay", label: "พร้อมเพย์ (PromptPay)" },
                    { value: "transfer", label: "โอนผ่านธนาคาร" },
                    { value: "cash", label: "เงินสด" },
                    { value: "card", label: "บัตรเครดิต/เดบิต" },
                  ]}
                  value={formMethod}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hash size={14} className="text-slate-500" />
                    <span>เลขอ้างอิง / สลิปโอน</span>
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Hash size={16} strokeWidth={2.2} />
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all placeholder:text-slate-400"
                    onChange={(e) => setFormRef(e.target.value)}
                    placeholder="เช่น 202603019842"
                    value={formRef}
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                className="h-11 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-all"
                onClick={() => setShowRecordModal(false)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-500/25 transition-all"
                onClick={handleSavePayment}
                type="button"
              >
                บันทึกรับชำระเงิน
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
