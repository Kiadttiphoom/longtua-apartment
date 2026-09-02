"use client";

import { DataTable, PageHeader } from "@/components/portal/PortalUI";

export function AuditPage() {
  const rows = [
    ["บันทึกเลขมิเตอร์ไฟฟ้า", "สมชาย ใจดี (Owner)", "ห้อง 101, 102, 201 รอบ ส.ค. 2568", "1 ส.ค. 2568 10:15"],
    ["ออกใบแจ้งหนี้รอบประจำเดือน", "สมชาย ใจดี (Owner)", "6 ใบแจ้งหนี้ ยอดรวม ฿30,500", "1 ส.ค. 2568 10:20"],
    ["บันทึกรับชำระเงิน", "สุภาวดี พรชัย (Accounting)", "INV-2568-08101 (ห้อง 101) ฿5,050", "2 ส.ค. 2568 14:30"],
    ["ทำสัญญาเช่าใหม่", "สมชาย ใจดี (Owner)", "ห้อง 401 ผู้เช่า: นันท์นภัส วารี", "1 ส.ค. 2568 09:00"],
    ["แก้ไขอัตราค่าน้ำประปา", "สมชาย ใจดี (Owner)", "ปรับจาก ฿40 เป็น ฿50/ห้อง", "28 ก.ค. 2568 16:45"],
  ];
  return (
    <>
      <PageHeader
        description="ประวัติการเปลี่ยนแปลงข้อมูล สิทธิ์ และบริการสำคัญ"
        title="ประวัติการใช้งาน (Audit Log)"
      />
      <div className="w-full">
        <DataTable
          headers={["การกระทำ", "ผู้ดำเนินการ", "รายละเอียด", "เวลา"]}
          rows={rows.map((row) => [
            <strong key="act" className="text-slate-800 font-bold text-xs">{row[0]}</strong>,
            <span key="user" className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">{row[1]}</span>,
            <span key="desc" className="text-slate-600 text-xs">{row[2]}</span>,
            <span key="time" className="text-slate-400 font-mono text-[11px]">{row[3]}</span>,
          ])}
        />
      </div>
    </>
  );
}
