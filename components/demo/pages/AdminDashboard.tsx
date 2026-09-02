import { Building2, ChevronRight, CircleDollarSign, Gauge, Hotel, Users } from "lucide-react";
import { DataTable, StatusBadge } from "@/components/portal/PortalUI";
import { companies } from "../mock-data";
import type { PageKey } from "../types";
import { Metric } from "../ui/Metric";
import { PanelHeading } from "../ui/PanelHeading";
import { StatusBar } from "../ui/StatusBar";

export function AdminDashboard({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  return (
    <>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Metric label="กิจการทั้งหมด" value="28" delta="+4 เดือนนี้" icon={Building2} tone="blue" />
        <Metric label="หอพักในระบบ" value="46" delta="2,184 ห้อง" icon={Hotel} tone="violet" />
        <Metric label="Subscription Active" value="21" delta="75% ของลูกค้า" icon={CircleDollarSign} tone="green" />
        <Metric label="Trial ใกล้หมด" value="4" delta="ภายใน 7 วัน" icon={Gauge} tone="orange" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <PanelHeading
            title="สถานะลูกค้า"
            description="กิจการที่ต้องติดตามในรอบนี้"
            action="ดูลูกค้าทั้งหมด"
            onAction={() => onNavigate("companies")}
          />
          <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
            <div className="w-28 h-28 rounded-full border-8 border-emerald-500 flex flex-col items-center justify-center shrink-0">
              <strong className="text-xl font-bold text-slate-800">75%</strong>
              <small className="text-[10px] text-slate-400">Active</small>
            </div>
            <div className="flex-1 w-full space-y-3">
              <StatusBar label="ชำระแล้ว" value={21} total={28} color="emerald" />
              <StatusBar label="กำลังทดลอง" value={5} total={28} color="blue" />
              <StatusBar label="หมดอายุ" value={2} total={28} color="rose" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <PanelHeading title="ต้องดำเนินการ" description="รายการสำคัญวันนี้" />
          <div className="space-y-2 mt-2">
            <button
              onClick={() => onNavigate("subscriptions")}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-between text-left cursor-pointer border border-slate-100"
              type="button"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <Gauge size={18} />
                </span>
                <div>
                  <strong className="text-xs font-bold text-slate-800 block">Trial ใกล้หมด</strong>
                  <small className="text-[11px] text-slate-400">4 กิจการ ภายใน 7 วัน</small>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            <button
              onClick={() => onNavigate("subscriptions")}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-between text-left cursor-pointer border border-slate-100"
              type="button"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <CircleDollarSign size={18} />
                </span>
                <div>
                  <strong className="text-xs font-bold text-slate-800 block">เกินกำหนดชำระ</strong>
                  <small className="text-[11px] text-slate-400">2 กิจการ รวม ฿3,180</small>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            <button
              onClick={() => onNavigate("users")}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-between text-left cursor-pointer border border-slate-100"
              type="button"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Users size={18} />
                </span>
                <div>
                  <strong className="text-xs font-bold text-slate-800 block">คำเชิญรอยืนยัน</strong>
                  <small className="text-[11px] text-slate-400">6 ผู้ใช้งาน</small>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>
        </div>
      </section>

      <section className="w-full mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">กิจการล่าสุด</h2>
            <p className="text-xs text-slate-500 mt-0.5">ลูกค้าและสถานะบริการที่มีการเปลี่ยนแปลงล่าสุด</p>
          </div>
          <button
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-all bg-transparent border-0 cursor-pointer"
            onClick={() => onNavigate("companies")}
            type="button"
          >
            ดูทั้งหมด <ChevronRight size={14} />
          </button>
        </div>
        <DataTable
          headers={["กิจการ / เจ้าของ", "เบอร์โทร", "หอพัก / ห้อง", "แพ็กเกจ", "รอบถัดไป", "สถานะ"]}
          rows={companies.slice(0, 4).map((c) => [
            <div className="flex items-center gap-3" key="c">
              <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Building2 size={18} />
              </span>
              <div className="flex flex-col text-xs min-w-0">
                <strong className="text-slate-800 font-bold truncate">{c.name}</strong>
                <small className="text-slate-400 mt-0.5">{c.owner}</small>
              </div>
            </div>,
            <span key="phone" className="text-slate-700 font-mono text-xs">{c.phone}</span>,
            <span key="rooms" className="text-slate-700 text-xs">{c.dorms} หอ · {c.rooms} ห้อง</span>,
            <span key="plan" className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">{c.plan}</span>,
            <span key="date" className="text-slate-500 text-xs">{c.date}</span>,
            <StatusBadge key="st" status={c.status as "active" | "trial" | "pending"} />,
          ])}
        />
      </section>
    </>
  );
}
