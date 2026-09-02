"use client";

import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  DeleteButton,
  EditButton,
  PageHeader,
  StatusBadge,
} from "@/components/portal/PortalUI";
import type { PageContentProps } from "../types";

export function CompaniesPage({ onOpenPanel, companies: companyItems, onDeleteCompany, onToast }: PageContentProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return companyItems.filter((c) => {
      const matchesSearch =
        !needle ||
        c.name.toLowerCase().includes(needle) ||
        c.owner.toLowerCase().includes(needle) ||
        (c.phone ? c.phone.includes(needle) : false);
      const matchesStatus = status === "all" || c.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [companyItems, query, status]);

  return (
    <>
      <PageHeader
        actionLabel="เพิ่มกิจการ"
        description="จัดการลูกค้า เจ้าของกิจการ และสถานะการให้บริการ"
        onAction={onOpenPanel}
        title="กิจการ"
      />

      <section className="mb-6 p-4 lg:p-5 flex flex-wrap items-center gap-8 lg:gap-12 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-slate-800 tracking-tight">
            {companyItems.length.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">กิจการทั้งหมด</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-emerald-600 tracking-tight">
            {companyItems.filter((c) => c.status === "active").length.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">Active</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-amber-600 tracking-tight">
            {companyItems.filter((c) => c.status === "trial").length.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">Trial</span>
        </div>
      </section>

      <CollectionToolbar
        description={`แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${companyItems.length.toLocaleString("th-TH")} กิจการ`}
        filter={{
          label: "กรองสถานะกิจการ",
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "ทุกสถานะ" },
            { value: "active", label: "Active" },
            { value: "trial", label: "Trial" },
            { value: "expired", label: "หมดอายุ" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาชื่อกิจการ เจ้าของ หรือเบอร์โทร"
        query={query}
        title="ค้นหาและกรอง"
      />

      <div className="w-full">
        <DataTable
          emptyDescription="ไม่พบกิจการที่ค้นหา"
          emptyTitle="ไม่พบกิจการ"
          headers={["กิจการ / เจ้าของ", "เบอร์โทร", "หอพัก / ห้อง", "แพ็กเกจ", "รอบถัดไป", "สถานะ", "การจัดการ"]}
          rows={filtered.map((item, idx) => [
            <div className="flex items-center gap-3" key="comp">
              <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Building2 size={18} />
              </span>
              <div className="flex flex-col text-xs min-w-0">
                <strong className="text-slate-800 font-bold truncate">{item.name}</strong>
                <small className="text-slate-400 mt-0.5">{item.owner}</small>
              </div>
            </div>,
            <span key="phone" className="text-slate-700 font-mono text-xs">
              {item.phone}
            </span>,
            <span key="rooms" className="text-slate-700 text-xs">
              {item.dorms} หอ · {item.rooms} ห้อง
            </span>,
            <span key="plan" className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
              {item.plan}
            </span>,
            <span key="date" className="text-slate-500 text-xs">
              {item.date}
            </span>,
            <StatusBadge key="status" status={item.status as "active" | "trial" | "pending"} />,
            <div className="flex items-center gap-1.5" key="action">
              <EditButton label={item.name} onClick={() => onToast?.("เปิดแก้ไขกิจการ")} />
              <DeleteButton label={item.name} onClick={() => onDeleteCompany(idx)} />
            </div>,
          ])}
        />
      </div>
    </>
  );
}
