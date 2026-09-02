"use client";

import { useMemo, useState } from "react";
import { CalendarClock, FileText, LayoutGrid, List, Pencil, Printer, ReceiptText, Sparkles, Zap } from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  Field,
  Modal,
  PageHeader,
  SelectField,
  StatusBadge,
} from "@/components/portal/PortalUI";
import type { PageContentProps, RoomRecord } from "../types";

export function InvoicesPage({
  isLocked,
  onToast,
  meterRooms,
  onViewInvoice,
  appSettings,
  activeProperty,
}: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const initialInvoices = useMemo(() => {
    return [
      {
        id: "INV-2568-08101",
        roomNumber: "101",
        tenant: "สมมุต ศรีสระเกษ",
        phone: "",
        issuedAt: "1 ส.ค. 2568",
        dueAt: "5 ส.ค. 2568",
        rent: 2500,
        electricUnits: 40,
        electricCost: 280,
        waterCost: 150,
        total: 2930,
        balanceDue: 2930,
        status: "issued" as const,
      },
    ];
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return initialInvoices.filter((item) => {
      const matchesSearch =
        !needle ||
        `${item.id} ${item.roomNumber} ${item.tenant}`.toLowerCase().includes(needle);
      const matchesStatus = status === "all" || item.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [initialInvoices, query, status]);

  const totalSum = initialInvoices.reduce((s, i) => s + i.total, 0);
  const balanceSum = initialInvoices.reduce((s, i) => s + i.balanceDue, 0);

  return (
    <>
      <PageHeader
        actionLabel={!isLocked ? "ออกใบแจ้งหนี้" : undefined}
        description="คำนวณค่าเช่า ค่าน้ำ และค่าไฟจากสัญญาและมิเตอร์ของรอบเดือนโดยอัตโนมัติ"
        onAction={() => setShowCreateModal(true)}
        title="ใบแจ้งหนี้"
      />

      <section className="mb-6 p-4 lg:p-5 flex flex-wrap items-center gap-8 lg:gap-12 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-slate-800 tracking-tight">
            {initialInvoices.length.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">ใบแจ้งหนี้ทั้งหมด</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-slate-800 tracking-tight">
            ฿{totalSum.toLocaleString("th-TH")}.00
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">ยอดเรียกเก็บรวม</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-rose-600 tracking-tight">
            ฿{balanceSum.toLocaleString("th-TH")}.00
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">ยอดคงเหลือค้างชำระ</span>
        </div>
      </section>

      <CollectionToolbar
        actions={
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
            <button
              aria-label="มุมมองตาราง"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("table")}
              type="button"
            >
              <List size={15} />
              <span>ตาราง</span>
            </button>
            <button
              aria-label="มุมมองการ์ด"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              <LayoutGrid size={15} />
              <span>การ์ด</span>
            </button>
          </div>
        }
        description={`พบ ${filtered.length.toLocaleString("th-TH")} เอกสาร`}
        filter={{
          label: "กรองสถานะใบแจ้งหนี้",
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "ทุกสถานะ" },
            { value: "issued", label: "รอชำระ" },
            { value: "partial", label: "ชำระบางส่วน" },
            { value: "paid", label: "ชำระแล้ว" },
            { value: "overdue", label: "เกินกำหนด" },
            { value: "void", label: "ยกเลิก" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขที่ใบแจ้งหนี้ ห้อง หรือหมายเหตุ"
        query={query}
        title="รายการใบแจ้งหนี้"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full mb-6">
            <DataTable
              headers={[
                "เลขที่เอกสาร / ห้อง",
                "ผู้เช่า",
                "ยอดรวม",
                "ยอดคงเหลือ",
                "ครบกำหนด",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => {
                const dummyRoomRecord: RoomRecord = {
                  number: item.roomNumber,
                  tenant: item.tenant,
                  rent: item.rent,
                  prevElec: 12430,
                  newElec: 12430 + item.electricUnits,
                  contractStart: "1 ม.ค. 2568",
                  contractEnd: "29 ส.ค. 2570",
                };

                return [
                  <div className="flex items-center gap-2.5" key="inv">
                    <span className="inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                      {item.roomNumber}
                    </span>
                    <div className="flex flex-col text-xs min-w-0">
                      <strong className="text-slate-800 font-bold truncate">{item.id}</strong>
                      <small className="text-slate-400 mt-0.5">ออกเมื่อ {item.issuedAt}</small>
                    </div>
                  </div>,
                  <div className="flex flex-col text-xs" key="tenant">
                    <strong className="text-slate-800 font-bold truncate">{item.tenant}</strong>
                    <small className="text-slate-400 mt-0.5">{item.phone ? `โทร. ${item.phone}` : "—"}</small>
                  </div>,
                  <strong className="text-xs font-bold text-slate-800" key="total">
                    ฿{item.total.toLocaleString("th-TH")}.00
                  </strong>,
                  <strong
                    className={`text-xs font-bold ${item.balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}`}
                    key="balance"
                  >
                    ฿{item.balanceDue.toLocaleString("th-TH")}.00
                  </strong>,
                  <span className="text-xs text-slate-700" key="due">{item.dueAt}</span>,
                  <StatusBadge key="status" status={item.status} />,
                  <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                    <button
                      className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs"
                      onClick={() => onViewInvoice(dummyRoomRecord)}
                      title="ดูใบแจ้งหนี้"
                      type="button"
                    >
                      <ReceiptText size={14} />
                      <span>ดูบิล</span>
                    </button>
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-2xs shrink-0"
                      onClick={() => {
                        onViewInvoice(dummyRoomRecord);
                        setTimeout(() => window.print(), 150);
                      }}
                      title="พิมพ์ใบแจ้งหนี้ A4"
                      type="button"
                    >
                      <Printer size={14} />
                    </button>
                    <button
                      aria-label={`แก้ไขใบแจ้งหนี้ ${item.id}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0"
                      onClick={() => onToast(`เปิดแบบฟอร์มแก้ไข ${item.id}`)}
                      title="แก้ไขใบแจ้งหนี้"
                      type="button"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>,
                ];
              })}
            />
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {filtered.map((item) => {
              const dummyRoomRecord: RoomRecord = {
                number: item.roomNumber,
                tenant: item.tenant,
                rent: item.rent,
                prevElec: 12430,
                newElec: 12430 + item.electricUnits,
                contractStart: "1 ม.ค. 2568",
                contractEnd: "29 ส.ค. 2570",
              };

              return (
                <article
                  className="p-5 flex flex-col gap-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all"
                  key={item.id}
                >
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        <ReceiptText aria-hidden="true" size={20} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-sm font-bold text-slate-800 truncate">{item.id}</h2>
                        <small className="text-[11px] text-slate-400 block truncate">
                          ห้อง {item.roomNumber} · ออกเมื่อ {item.issuedAt}
                        </small>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </header>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium block">ยอดรวม</span>
                      <strong className="text-xs font-bold text-slate-800 block mt-0.5">
                        ฿{item.total.toLocaleString("th-TH")}.00
                      </strong>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${item.balanceDue > 0 ? "bg-rose-50/70 border-rose-100" : "bg-emerald-50/70 border-emerald-100"}`}>
                      <span className="text-[10px] text-slate-400 font-medium block">คงเหลือ</span>
                      <strong className={`text-xs font-bold block mt-0.5 ${item.balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        ฿{item.balanceDue.toLocaleString("th-TH")}.00
                      </strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-slate-500">
                      ผู้เช่า: <strong className="text-slate-800">{item.tenant}</strong>
                    </span>
                  </div>

                  <footer className="mt-auto pt-3.5 border-t border-slate-100">
                    <div className="text-[11px] text-slate-400 mb-2.5 truncate">
                      <span className="flex items-center gap-1">
                        <CalendarClock aria-hidden="true" size={13} />
                        ครบกำหนด: {item.dueAt}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all shadow-2xs cursor-pointer"
                        onClick={() => onViewInvoice(dummyRoomRecord)}
                        title="ดูใบแจ้งหนี้"
                        type="button"
                      >
                        <FileText size={15} />
                        <span>ดูใบแจ้งหนี้</span>
                      </button>
                      <button
                        className="h-9 px-3 rounded-xl flex items-center justify-center gap-1 text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                        onClick={() => {
                          onViewInvoice(dummyRoomRecord);
                          setTimeout(() => window.print(), 150);
                        }}
                        title="พิมพ์ใบแจ้งหนี้ A4"
                        type="button"
                      >
                        <Printer size={15} />
                        <span>พิมพ์</span>
                      </button>
                      <button
                        aria-label={`แก้ไขใบแจ้งหนี้ ${item.id}`}
                        className="h-9 px-3 rounded-xl flex items-center justify-center gap-1 text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs"
                        onClick={() => onToast(`เปิดแบบฟอร์มแก้ไข ${item.id}`)}
                        title="แก้ไขใบแจ้งหนี้"
                        type="button"
                      >
                        <Pencil size={14} />
                        <span>แก้ไข</span>
                      </button>
                    </div>
                  </footer>
                </article>
              );
            })}
          </section>
        )
      ) : null}

      {showCreateModal ? (
        <Modal
          description="เลือกสัญญาเช่าและรอบเดือน ระบบจะดึงข้อมูลมิเตอร์และค่าเช่ามาคำนวณอัตโนมัติ"
          onClose={() => setShowCreateModal(false)}
          title="ออกใบแจ้งหนี้ใหม่"
        >
          <div className="p-6 flex flex-col gap-4 text-left">
            <SelectField
              clear={() => {}}
              label="เลือกสัญญาเช่า / ห้องพัก"
              name="lease_id"
              options={[{ value: "101", label: "ห้อง 101 - สมมุต ศรีสระเกษ (฿2,500.00/ด.)" }]}
              value="101"
            />
            <Field
              clear={() => {}}
              defaultValue="2026-08"
              label="รอบเดือนที่ออกบิล"
              name="period_month"
              type="month"
            />
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 space-y-1">
              <div className="flex justify-between"><span>ค่าเช่าห้อง:</span><strong>฿2,500.00</strong></div>
              <div className="flex justify-between"><span>ค่าไฟ (40 หน่วย x ฿7.00):</span><strong>฿280.00</strong></div>
              <div className="flex justify-between"><span>ค่าน้ำเหมาจ่าย:</span><strong>฿150.00</strong></div>
              <div className="pt-2 border-t border-blue-200 flex justify-between font-bold text-sm text-blue-950">
                <span>ยอดรวมทั้งสิ้น:</span><span>฿2,930.00</span>
              </div>
            </div>
            <footer className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer"
                onClick={() => setShowCreateModal(false)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 cursor-pointer"
                onClick={() => {
                  setShowCreateModal(false);
                  onToast("ออกใบแจ้งหนี้เรียบร้อยแล้ว");
                }}
                type="button"
              >
                ออกใบแจ้งหนี้
              </button>
            </footer>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
