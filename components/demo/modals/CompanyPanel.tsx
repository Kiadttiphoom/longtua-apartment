import { X } from "lucide-react";
import type { Company } from "../types";

export function CompanyPanel({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (company: Company) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end" onClick={onClose}>
      <aside
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">จัดการลูกค้า</p>
            <h2 className="text-lg font-bold text-slate-800">เพิ่มกิจการใหม่</h2>
          </div>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            type="button"
            aria-label="ปิดหน้าต่าง"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="p-5 flex flex-col gap-5 text-xs"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            onSave({
              name: String(formData.get("companyName")),
              owner: String(formData.get("ownerName")),
              plan: String(formData.get("plan")),
              properties: 1,
              users: 1,
              status: formData.get("plan") === "Trial" ? "trial" : "active",
              date: formData.get("plan") === "Trial" ? "อีก 30 วัน" : "รอบถัดไป 30 วัน",
            });
          }}
        >
          <div className="flex flex-col gap-3.5">
            <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">ข้อมูลกิจการ</h3>
            <label className="flex flex-col gap-1.5 font-medium text-slate-600">
              <span>ชื่อกิจการ *</span>
              <input
                className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-slate-800 text-xs font-semibold"
                name="companyName"
                maxLength={80}
                placeholder="เช่น บริษัท สมชายอพาร์ทเมนท์"
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 font-medium text-slate-600">
                <span>เบอร์โทร</span>
                <input
                  className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-slate-800 text-xs font-semibold"
                  name="phone"
                  maxLength={20}
                  placeholder="08x-xxx-xxxx"
                />
              </label>
              <label className="flex flex-col gap-1.5 font-medium text-slate-600">
                <span>เลขภาษี (13 หลัก)</span>
                <input
                  className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-slate-800 text-xs font-semibold"
                  name="taxId"
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="13 หลัก"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">เจ้าของกิจการ</h3>
            <label className="flex flex-col gap-1.5 font-medium text-slate-600">
              <span>ชื่อ-นามสกุล *</span>
              <input
                className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-slate-800 text-xs font-semibold"
                name="ownerName"
                maxLength={80}
                placeholder="ชื่อผู้ดูแลหลัก"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 font-medium text-slate-600">
              <span>อีเมลสำหรับเข้าใช้งาน *</span>
              <input
                className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-slate-800 text-xs font-semibold"
                name="email"
                type="email"
                maxLength={120}
                placeholder="owner@company.com"
                required
              />
            </label>
          </div>

          <div className="flex flex-col gap-3.5">
            <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">แพ็กเกจ</h3>
            <label className="flex flex-col gap-1.5 font-medium text-slate-600">
              <span>เลือกแพ็กเกจ</span>
              <select
                className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-slate-800 text-xs font-semibold cursor-pointer"
                name="plan"
              >
                <option value="Starter">Starter (฿790/เดือน - 1 หอพัก 50 ห้อง)</option>
                <option value="Business">Business (฿1,590/เดือน - 3 หอพัก 200 ห้อง)</option>
                <option value="Trial">Trial (ทดลองฟรี 30 วัน)</option>
              </select>
            </label>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              className="h-10 px-4 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              type="button"
              onClick={onClose}
            >
              ยกเลิก
            </button>
            <button
              className="h-10 px-5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-2xs"
              type="submit"
            >
              บันทึกกิจการ
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
