"use client";

import {
  DataTable,
  DeleteButton,
  PageHeader,
  StatusBadge,
} from "@/components/portal/PortalUI";
import type { PageContentProps } from "../types";
import { useDemoCollection } from "../utils";

export function MenusPage({ isLocked, onToast }: PageContentProps) {
  const initialRows = [
    ["แดชบอร์ด", "dashboard", "1", "ภาพรวม", "เปิด"],
    ["หอพัก", "properties", "2", "จัดการลูกค้า", "เปิด"],
    ["ห้องพัก", "rooms", "1", "จัดการหอพัก", "เปิด"],
    ["ผู้เช่า", "tenants", "2", "จัดการหอพัก", "เปิด"],
    ["สัญญาเช่า", "contracts", "3", "จัดการหอพัก", "เปิด"],
    ["มิเตอร์", "meters", "1", "การเงิน", "เปิด"],
    ["ใบแจ้งหนี้", "invoices", "2", "การเงิน", "เปิด"],
    ["รับชำระ", "payments", "3", "การเงิน", "เปิด"],
    ["ยอดค้าง", "receivables", "4", "การเงิน", "เปิด"],
    ["รายงาน", "reports", "5", "การเงิน", "เปิด"],
    ["LINE แจ้งเตือน", "line", "1", "บริการเสริม", "Add-on"],
  ];
  const collection = useDemoCollection(initialRows, onToast, 20);

  return (
    <>
      <PageHeader
        actionLabel={!isLocked ? "บันทึกลำดับเมนู" : undefined}
        description="กำหนดชื่อ ลำดับ และหมวดหมู่ของเมนูในระบบ"
        onAction={() => onToast("บันทึกลำดับเมนูแล้ว")}
        title="จัดการเมนู"
      />
      <div className="w-full">
        <DataTable
          headers={["ชื่อเมนู", "รหัส", "ลำดับ", "หมวดหมู่", "สถานะ", "การจัดการ"]}
          rows={collection.items.map((row, idx) => [
            <strong key="name" className="text-slate-800 font-bold text-xs">{row[0]}</strong>,
            <span key="code" className="text-slate-500 font-mono text-xs">{row[1]}</span>,
            <span key="order" className="text-slate-700 text-xs">{row[2]}</span>,
            <span key="cat" className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">{row[3]}</span>,
            <span key="status" className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{row[4]}</span>,
            <DeleteButton key="del" disabled={isLocked} label={row[0]} onClick={() => collection.removeItem(idx)} />,
          ])}
        />
      </div>
    </>
  );
}
