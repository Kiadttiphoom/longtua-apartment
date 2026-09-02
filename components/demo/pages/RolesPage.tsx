"use client";

import { ShieldCheck } from "lucide-react";
import { roles } from "../mock-data";
import type { PageContentProps } from "../types";
import {
  DataTable,
  EditButton,
  PageHeader,
} from "@/components/portal/PortalUI";
import { useDemoCollection } from "../utils";

export function RolesPage({ isLocked, onToast }: PageContentProps) {
  const collection = useDemoCollection(roles, onToast, 12);

  return (
    <>
      <PageHeader
        actionLabel={!isLocked ? "เพิ่ม Role" : undefined}
        description="กลุ่มสิทธิ์การใช้งานสำหรับกำหนดหน้าที่ของผู้ดูแลในระบบ"
        onAction={() => onToast("เปิดหน้าสร้าง Role ใหม่แล้ว")}
        title="บทบาท (Roles)"
      />

      <div className="w-full">
        <DataTable
          headers={["ชื่อ Role", "รหัส (Code)", "ขอบเขตข้อมูล", "ผู้ใช้งาน", "จำนวนสิทธิ์", "ประเภท", "การจัดการ"]}
          rows={collection.items.map((role) => [
            <strong key="name" className="text-slate-800 font-bold text-xs">
              {role.name}
            </strong>,
            <span key="code" className="text-slate-500 font-mono text-xs">
              {role.code}
            </span>,
            <span key="scope" className="text-slate-700 text-xs">
              {role.scope}
            </span>,
            <span key="users" className="text-slate-700 text-xs">
              {role.users} คน
            </span>,
            <span key="perms" className="inline-flex items-center gap-1 font-semibold text-blue-600 text-xs">
              <ShieldCheck size={14} />
              {role.permissions} สิทธิ์
            </span>,
            <span
              key="system"
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                role.system
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              {role.system ? "ระบบหลัก" : "กำหนดเอง"}
            </span>,
            <EditButton key="action" label={role.name} onClick={() => onToast("เปิดแก้ไข Role")} />,
          ])}
        />
      </div>
    </>
  );
}
