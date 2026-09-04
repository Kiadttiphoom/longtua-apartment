import { useState } from "react";
import {
  Banknote,
  Calendar,
  CalendarCheck,
  CreditCard,
  DoorOpen,
  Eye,
  FilePlus,
  FileText,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { DateTimeControl } from "@/components/ui/DateTimeControl";
import { SelectControl } from "@/components/ui/SelectControl";
import type { ContractRecord } from "../types";

export function ContractFormModal({
  contract,
  onClose,
  onSave,
  onSaveAndView,
}: {
  contract: ContractRecord;
  onClose: () => void;
  onSave: (contract: ContractRecord) => void;
  onSaveAndView: (contract: ContractRecord) => void;
}) {
  const [form, setForm] = useState<ContractRecord>({ ...contract });

  function update<K extends keyof ContractRecord>(key: K, value: ContractRecord[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "rent" && typeof value === "number") {
        next.deposit = value * 2;
        next.advanceRent = value;
      }
      return next;
    });
  }

  const isFormValid = form.tenantName.trim() !== "" && form.roomNumber.trim() !== "" && form.rent > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {contract.tenantName ? (
                <>
                  <Pencil size={17} className="text-blue-600" />
                  <span>แก้ไขสัญญาเช่า · {contract.id}</span>
                </>
              ) : (
                <>
                  <FilePlus size={17} className="text-blue-600" />
                  <span>ทำสัญญาเช่าห้องพักใหม่</span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">ระบุรายละเอียดข้อตกลงและเงื่อนไขการเช่า</p>
          </div>
          <button
            aria-label="ปิดหน้าต่าง"
            className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            onClick={onClose}
            type="button"
          >
            <X size={17} strokeWidth={2.2} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-4 text-xs">
          {/* Value Banner */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Sparkles size={13} strokeWidth={2.2} />
            </span>
            <div className="leading-relaxed">
              <strong className="font-bold block text-blue-950">ข้อมูลข้อตกลงและสัญญาเช่า</strong>
              <span className="text-[11px] text-blue-800/80">
                ระบบจะคำนวณเงินประกันและค่าเช่าล่วงหน้าให้อัตโนมัติ พร้อมพิมพ์เป็นเอกสารสัญญาได้ทันที
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText size={14} className="text-slate-500" />
                  <span>เลขที่สัญญา <span className="text-rose-500">*</span></span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">เช่น สญ.-2568-001</span>
              </label>
              <input
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                value={form.id}
                onChange={(e) => update("id", e.target.value)}
                placeholder="เช่น สญ.-2568-001"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DoorOpen size={14} className="text-slate-500" />
                  <span>หมายเลขห้องพัก <span className="text-rose-500">*</span></span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">เช่น 101, 202</span>
              </label>
              <input
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all"
                value={form.roomNumber}
                onChange={(e) => update("roomNumber", e.target.value)}
                placeholder="เช่น 101"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserRound size={14} className="text-slate-500" />
                  <span>ชื่อ-นามสกุล ผู้เช่า <span className="text-rose-500">*</span></span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">คู่สัญญา</span>
              </label>
              <input
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all"
                value={form.tenantName}
                onChange={(e) => update("tenantName", e.target.value)}
                placeholder="เช่น นายธนกร มั่นคง"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CreditCard size={14} className="text-slate-500" />
                  <span>เลขบัตรประชาชน</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">13 หลัก</span>
              </label>
              <input
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                value={form.tenantIdCard}
                onChange={(e) => update("tenantIdCard", e.target.value)}
                placeholder="เช่น 1-1004-00892-31-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-500" />
                  <span>เบอร์โทรศัพท์ติดต่อ</span>
                </span>
              </label>
              <input
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                value={form.tenantPhone}
                onChange={(e) => update("tenantPhone", e.target.value)}
                placeholder="เช่น 081-234-5678"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-slate-500" />
                  <span>สถานะสัญญา</span>
                </span>
              </label>
              <SelectControl
                ariaLabel="สถานะสัญญา"
                onValueChange={(val) => update("status", val as "active" | "expired" | "draft")}
                options={[
                  { value: "active", label: "มีผลอยู่ (Active)" },
                  { value: "draft", label: "ร่างสัญญา (Draft)" },
                  { value: "expired", label: "หมดอายุแล้ว (Expired)" },
                ]}
                searchable={false}
                value={form.status}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-500" />
                  <span>วันที่เริ่มสัญญา <span className="text-rose-500">*</span></span>
                </span>
              </label>
              <DateTimeControl
                ariaLabel="วันที่เริ่มสัญญา"
                defaultValue={form.startDate}
                mode="date"
                name="startDate"
                onValueChange={(val) => update("startDate", val)}
                placeholder="เลือกวันที่เริ่มสัญญา"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CalendarCheck size={14} className="text-slate-500" />
                  <span>วันที่สิ้นสุดสัญญา <span className="text-rose-500">*</span></span>
                </span>
              </label>
              <DateTimeControl
                ariaLabel="วันที่สิ้นสุดสัญญา"
                defaultValue={form.endDate}
                mode="date"
                name="endDate"
                onValueChange={(val) => update("endDate", val)}
                placeholder="เลือกวันที่สิ้นสุดสัญญา"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Banknote size={14} className="text-slate-500" />
                  <span>ค่าเช่า/เดือน (บาท) <span className="text-rose-500">*</span></span>
                </span>
              </label>
              <input
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                type="number"
                min="0"
                step="100"
                value={form.rent || ""}
                onChange={(e) => update("rent", parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-slate-500" />
                  <span>เงินประกัน (บาท)</span>
                </span>
              </label>
              <input
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                type="number"
                min="0"
                step="100"
                value={form.deposit || ""}
                onChange={(e) => update("deposit", parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CreditCard size={14} className="text-slate-500" />
                  <span>ค่าเช่าล่วงหน้า (บาท)</span>
                </span>
              </label>
              <input
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                type="number"
                min="0"
                step="100"
                value={form.advanceRent || ""}
                onChange={(e) => update("advanceRent", parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
          <div className="flex items-center gap-2">
            <button
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              disabled={!isFormValid}
              onClick={() => {
                if (isFormValid) onSave(form);
              }}
              type="button"
            >
              <Save size={14} />
              <span>บันทึก</span>
            </button>
            <button
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
              disabled={!isFormValid}
              onClick={() => {
                if (isFormValid) onSaveAndView(form);
              }}
              type="button"
            >
              <FileText size={14} />
              <span>บันทึกและดูเอกสาร PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
