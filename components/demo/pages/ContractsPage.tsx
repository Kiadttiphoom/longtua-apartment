"use client";

import { useMemo, useState } from "react";
import { FileText, LayoutGrid, List, Pencil, Printer, Trash2, UserRoundCheck, UsersRound } from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  PageHeader,
  StatusBadge,
} from "@/components/portal/PortalUI";
import type { ContractRecord, PageContentProps } from "../types";

export function ContractsPage({
  isLocked,
  onToast,
  contracts,
  onViewContract,
  onEditContract,
  onDeleteContract,
  activeProperty,
}: PageContentProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return contracts.filter((c) => {
      const matchesSearch =
        !needle ||
        `${c.id} ${c.roomNumber} ${c.tenantName} ${c.tenantPhone} ${c.customClauses}`
          .toLowerCase()
          .includes(needle);
      const matchesStatus =
        status === "all" ||
        (status === "active" && c.status === "active") ||
        (status === "draft" && c.status === "draft") ||
        c.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, query, status]);

  const activeCount = contracts.filter((c) => c.status === "active").length;
  const draftCount = contracts.filter((c) => c.status === "draft").length;

  return (
    <>
      <PageHeader
        actionLabel={!isLocked ? "สร้างสัญญา" : undefined}
        description="จัดการเงื่อนไขสัญญา ผู้เช่า ห้องพัก เงินประกัน และช่วงเวลาเช่า"
        onAction={() =>
          onEditContract({
            id: `สญ.-2568-${String(contracts.length + 1).padStart(3, "0")}`,
            roomNumber: "",
            tenantName: "",
            tenantIdCard: "",
            tenantPhone: "",
            startDate: "",
            endDate: "",
            rent: 4500,
            deposit: 9000,
            advanceRent: 4500,
            customClauses: "",
            status: "active",
          })
        }
        title="สัญญาเช่า"
      />

      <section className="mb-6 p-4 lg:p-5 flex flex-wrap items-center gap-8 lg:gap-12 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-slate-800 tracking-tight">
            {contracts.length.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">สัญญาทั้งหมด</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-emerald-600 tracking-tight">
            {activeCount.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">กำลังใช้งาน</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-amber-600 tracking-tight">
            {draftCount.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">ฉบับร่าง</span>
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
        description={`พบ ${filtered.length.toLocaleString("th-TH")} ฉบับ`}
        filter={{
          label: "กรองสถานะสัญญา",
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "ทุกสถานะ" },
            { value: "active", label: "มีผลอยู่" },
            { value: "draft", label: "ฉบับร่าง" },
            { value: "ended", label: "สิ้นสุด" },
            { value: "cancelled", label: "ยกเลิก" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขสัญญา หอ ห้อง ผู้เช่า หรือข้อตกลง"
        query={query}
        title="รายการสัญญา"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full mb-6">
            <DataTable
              emptyDescription="สร้างสัญญาเช่าเพื่อเริ่มผูกห้องพักและผู้เช่า"
              emptyTitle="ไม่พบสัญญาเช่า"
              headers={[
                "เลขที่สัญญา",
                "ห้อง / ผู้เช่า",
                "ระยะเวลาสัญญา",
                "ค่าเช่า / ประกัน",
                "ข้อตกลงพิเศษ",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => [
                <strong className="text-slate-800 text-xs font-bold" key="id">
                  {item.id}
                </strong>,
                <div className="flex items-center gap-2.5" key="tenant">
                  <span className="inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                    {item.roomNumber || "—"}
                  </span>
                  <div className="flex flex-col text-xs min-w-0">
                    <strong className="text-slate-800 font-bold truncate">{item.tenantName || "—"}</strong>
                    <small className="text-slate-400 mt-0.5">
                      {item.tenantPhone ? `โทร. ${item.tenantPhone}` : "—"}
                    </small>
                  </div>
                </div>,
                <div className="flex flex-col text-xs" key="dates">
                  <strong className="text-slate-800 font-semibold">{item.startDate}</strong>
                  <small className="text-slate-400 mt-0.5">{item.endDate ? `ถึง ${item.endDate}` : "ไม่ระบุวันสิ้นสุด"}</small>
                </div>,
                <div className="flex flex-col text-xs" key="fin">
                  <strong className="text-slate-800 font-bold">฿{item.rent.toLocaleString("th-TH")}.00/ด.</strong>
                  <small className="text-slate-400 mt-0.5">ประกัน ฿{item.deposit.toLocaleString("th-TH")}.00</small>
                </div>,
                <div className="text-xs text-slate-500 max-w-xs truncate" key="terms" title={item.customClauses}>
                  {item.customClauses || "—"}
                </div>,
                <StatusBadge key="status" status={item.status as "active" | "draft"} />,
                <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                  <button
                    className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs"
                    onClick={() => onViewContract(item)}
                    title="ดูรายละเอียดสัญญา"
                    type="button"
                  >
                    <FileText size={14} />
                    <span>ดูสัญญา</span>
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-2xs shrink-0"
                    onClick={() => {
                      onViewContract(item);
                      setTimeout(() => window.print(), 150);
                    }}
                    title="พิมพ์สัญญาเช่า"
                    type="button"
                  >
                    <Printer size={14} />
                  </button>
                  <button
                    aria-label={`แก้ไขสัญญา ${item.id}`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0"
                    onClick={() => onEditContract(item)}
                    title="แก้ไขสัญญา"
                    type="button"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    aria-label={`จัดการบัญชีผู้เช่า ${item.tenantName}`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all cursor-pointer shadow-2xs shrink-0"
                    onClick={() => onToast(`จัดการบัญชี Tenant Portal สำหรับ ${item.tenantName}`)}
                    title="จัดการบัญชีผู้เช่า"
                    type="button"
                  >
                    <UserRoundCheck size={14} />
                  </button>
                </div>,
              ])}
            />
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {filtered.map((item) => (
              <article
                className="p-5 flex flex-col gap-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all"
                key={item.id}
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex items-center justify-center min-w-10 h-8 px-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs">
                      {item.roomNumber || "—"}
                    </span>
                    <div className="min-w-0">
                      <strong className="text-sm font-bold text-slate-800 block truncate">{item.id}</strong>
                      <small className="text-[11px] text-slate-400 block truncate">{activeProperty.name}</small>
                    </div>
                  </div>
                  <StatusBadge status={item.status as "active" | "draft"} />
                </header>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="min-w-0">
                    <strong className="text-slate-800 font-bold block truncate">{item.tenantName || "—"}</strong>
                    <small className="text-slate-400 block truncate mt-0.5">
                      {item.tenantPhone ? `โทร. ${item.tenantPhone}` : "ยังไม่มีเบอร์โทร"}
                    </small>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">
                    <UsersRound size={13} /> 1 คน
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium block">ค่าเช่า / ประกัน</span>
                    <strong className="text-xs font-bold text-slate-800 block mt-0.5">
                      ฿{item.rent.toLocaleString("th-TH")}.00/ด.
                    </strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      (ประกัน ฿{item.deposit.toLocaleString("th-TH")}.00)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium block">ระยะเวลาสัญญา</span>
                    <strong className="text-xs font-bold text-slate-800 block mt-0.5">
                      {item.startDate}
                    </strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      ถึง {item.endDate || "ไม่ระบุ"}
                    </span>
                  </div>
                </div>

                {item.customClauses ? (
                  <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs text-amber-900 line-clamp-2">
                    <strong className="font-bold">ข้อตกลง:</strong> {item.customClauses}
                  </div>
                ) : null}

                <footer className="mt-auto pt-3.5 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400 mb-2.5 truncate">
                    <span>บัญชีผู้เช่า: k101</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all shadow-2xs cursor-pointer"
                      onClick={() => onViewContract(item)}
                      type="button"
                    >
                      <FileText size={15} />
                      <span>ดูสัญญา</span>
                    </button>
                    <button
                      className="h-9 px-3 rounded-xl flex items-center justify-center gap-1 text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                      onClick={() => {
                        onViewContract(item);
                        setTimeout(() => window.print(), 150);
                      }}
                      title="พิมพ์สัญญาเช่า"
                      type="button"
                    >
                      <Printer size={15} />
                      <span>พิมพ์</span>
                    </button>
                    <button
                      aria-label={`แก้ไขสัญญา ${item.id}`}
                      className="h-9 px-3 rounded-xl flex items-center justify-center gap-1 text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs"
                      onClick={() => onEditContract(item)}
                      type="button"
                    >
                      <Pencil size={14} />
                      <span>แก้ไข</span>
                    </button>
                    <button
                      aria-label={`จัดการบัญชีผู้เช่า ${item.tenantName}`}
                      className="w-9 h-9 rounded-xl flex items-center justify-center border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all cursor-pointer shadow-2xs shrink-0"
                      onClick={() => onToast(`จัดการบัญชี Tenant Portal สำหรับ ${item.tenantName}`)}
                      title="จัดการบัญชีผู้เช่า"
                      type="button"
                    >
                      <UserRoundCheck size={14} />
                    </button>
                  </div>
                </footer>
              </article>
            ))}
          </section>
        )
      ) : null}
    </>
  );
}
