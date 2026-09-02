import { Building2, TrendingUp } from "lucide-react";
import { DataTable } from "@/components/portal/PortalUI";
import type { PageContentProps } from "../types";

export function ReportsPage({ properties }: PageContentProps) {
  const monthlyRows = [
    ["สิงหาคม 2569", "฿10,079.00", "3 ห้อง", "฿9,551.50", "47.8%"],
    ["กรกฎาคม 2569", "฿185,400.00", "52 ห้อง", "฿25,140.00", "86.7%"],
    ["มิถุนายน 2569", "฿178,920.00", "50 ห้อง", "฿18,600.00", "83.3%"],
    ["พฤษภาคม 2569", "฿182,250.00", "51 ห้อง", "฿12,000.00", "85.0%"],
    ["เมษายน 2569", "฿174,600.00", "49 ห้อง", "฿22,500.00", "81.7%"],
  ];

  const dormReports = [
    { name: "สมชายแมนชั่น", address: "123 ถ.กาญจนวนิช อ.หาดใหญ่ จ.สงขลา 90110", rooms: 6, occupied: 6, revenue: 30000, outstanding: 11100 },
    { name: "สมชายเพลส 2", address: "45 ถ.ราษฎร์ยินดี อ.เมือง จ.สงขลา 90000", rooms: 4, occupied: 3, revenue: 15000, outstanding: 0 },
  ];

  return (
    <>
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">รายงานและสถิติ</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">ภาพรวมผลการดำเนินงาน อัตราเข้าพัก และรายรับจากข้อมูลจริงของกิจการ</p>
        </div>
      </header>

      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <TrendingUp aria-hidden="true" size={28} />
          </span>
          <div>
            <small className="text-xs text-slate-500 font-medium">รายรับสะสมที่ยืนยันแล้ว</small>
            <strong className="text-2xl lg:text-3xl font-bold text-slate-800 block tracking-tight mt-0.5">฿45,000.00</strong>
            <p className="text-xs text-slate-400 mt-0.5">จาก 9 รายการรับชำระ</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-8">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">ยอดค้างปัจจุบัน</span>
            <strong className="text-lg font-bold text-rose-600 mt-0.5">฿11,100.00</strong>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">อัตราเข้าพักรวม</span>
            <strong className="text-lg font-bold text-emerald-600 mt-0.5">90.0%</strong>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">ใบแจ้งหนี้ออกแล้ว</span>
            <strong className="text-lg font-bold text-slate-800 mt-0.5">10 ฉบับ</strong>
          </div>
        </div>
      </section>

      <section className="mb-8 p-4 lg:p-5 flex flex-wrap items-center gap-8 lg:gap-12 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-slate-800 tracking-tight">2</strong>
          <span className="text-xs text-slate-500 mt-0.5">หอพักทั้งหมด</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-slate-800 tracking-tight">10</strong>
          <span className="text-xs text-slate-500 mt-0.5">ห้องทั้งหมด</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-emerald-600 tracking-tight">9</strong>
          <span className="text-xs text-slate-500 mt-0.5">ห้องมีผู้พัก</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-sky-600 tracking-tight">9</strong>
          <span className="text-xs text-slate-500 mt-0.5">สัญญาใช้งาน</span>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {dormReports.map((dorm) => {
          const occ = dorm.rooms ? Math.round((dorm.occupied / dorm.rooms) * 100) : 0;
          return (
            <article
              className="p-5 flex flex-col gap-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all"
              key={dorm.name}
            >
              <header className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Building2 aria-hidden="true" size={20} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-800 truncate">{dorm.name}</h2>
                  <small className="text-xs text-slate-400 block truncate">{dorm.address}</small>
                </div>
              </header>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">อัตราเข้าพัก</span>
                  <strong className="text-slate-800 font-bold">{occ}%</strong>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${occ}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>ทั้งหมด {dorm.rooms} ห้อง</span>
                  <span className="text-emerald-600 font-medium">พักอยู่ {dorm.occupied}</span>
                  <span>ว่าง {dorm.rooms - dorm.occupied}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">รายรับ</span>
                  <strong className="text-slate-800 font-bold">฿{dorm.revenue.toLocaleString("th-TH")}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">ยอดค้าง</span>
                  <strong className="text-rose-600 font-bold">฿{dorm.outstanding.toLocaleString("th-TH")}</strong>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mb-8">
        <header className="mb-4">
          <h2 className="text-base font-bold text-slate-800">สรุปรายรับย้อนหลัง 5 เดือน</h2>
          <p className="text-xs text-slate-500 mt-0.5">สถิติรายรับ ค่าสาธารณูปโภค และอัตราการชำระเงินรายงวด</p>
        </header>
        <div className="w-full">
          <DataTable
            headers={["เดือน / รอบบิล", "รายรับที่ได้รับ", "ห้องที่ชำระ", "ยอดค้างชำระ", "อัตราเข้าพัก (Occupancy)"]}
            rows={monthlyRows.map((row) => [
              <strong className="text-slate-800 font-bold text-xs" key="m">{row[0]}</strong>,
              <strong className="font-mono font-bold text-emerald-600 text-xs" key="rev">{row[1]}</strong>,
              <span className="text-slate-700 text-xs" key="paid">{row[2]}</span>,
              <strong className="font-mono font-bold text-rose-600 text-xs" key="out">{row[3]}</strong>,
              <span className="text-slate-800 font-semibold text-xs" key="occ">{row[4]}</span>,
            ])}
          />
        </div>
      </section>
    </>
  );
}
