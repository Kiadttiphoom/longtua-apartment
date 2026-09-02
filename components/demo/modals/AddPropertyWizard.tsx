import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Droplets,
  HelpCircle,
  MapPin,
  Phone,
  QrCode,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import type { AppSettings, Property } from "../types";

export function AddPropertyWizard({
  existingSettings,
  onClose,
  onSave,
}: {
  existingSettings: AppSettings;
  onClose: () => void;
  onSave: (prop: Property) => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [copySettings, setCopySettings] = useState(true);
  const [electricRate, setElectricRate] = useState(existingSettings.electricRate);
  const [waterRate, setWaterRate] = useState(existingSettings.waterRate);
  const [promptpay, setPromptpay] = useState(existingSettings.promptpay);
  const [accountName, setAccountName] = useState(existingSettings.accountName);

  function handleSave() {
    if (!name.trim()) return;
    const settings: AppSettings = copySettings
      ? { ...existingSettings, invoiceHeader: `ใบแจ้งหนี้ค่าเช่า ${name}` }
      : { ...existingSettings, electricRate, waterRate, promptpay, accountName, invoiceHeader: `ใบแจ้งหนี้ค่าเช่า ${name}` };
    onSave({
      id: `prop-${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      settings,
      rooms: [],
      contracts: [],
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-gradient-to-bl from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <header className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/80 via-white to-white">
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0">
              <Building2 size={22} strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">เพิ่มหอพักใหม่</h2>
              <p className="text-xs text-slate-500 mt-0.5">ระบบจะตั้งค่าอัตโนมัติและสร้างโครงสร้างห้องพักให้ทันที</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            type="button"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </header>

        {/* Step Indicator Tabs */}
        <div className="px-6 pt-5 pb-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setStep(1)}
              type="button"
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                step === 1
                  ? "bg-blue-50/80 border-blue-200 text-blue-800 shadow-2xs"
                  : "bg-slate-50/60 border-slate-200/70 text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                step === 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                1
              </span>
              <span className="truncate">1. ข้อมูลหอพัก</span>
            </button>

            <button
              onClick={() => name.trim() && setStep(2)}
              disabled={!name.trim()}
              type="button"
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                step === 2
                  ? "bg-blue-50/80 border-blue-200 text-blue-800 shadow-2xs"
                  : "bg-slate-50/60 border-slate-200/70 text-slate-400 disabled:opacity-60 cursor-pointer"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                step === 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                2
              </span>
              <span className="truncate">2. ค่าน้ำ-ไฟ & ชำระเงิน</span>
            </button>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="p-6 space-y-4 text-xs animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>ชื่อหอพัก / อาคาร <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-400 font-normal">เช่น ลองตัว แมนชั่น 2</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Building2 size={16} strokeWidth={2.2} />
                </span>
                <input
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all placeholder:text-slate-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="กรอกชื่อหอพักหรืออาคาร"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>ที่ตั้ง / ที่อยู่หอพัก</span>
                <span className="text-[11px] text-slate-400 font-normal">สำหรับพิมพ์ลงใบแจ้งหนี้</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
                  <MapPin size={16} strokeWidth={2.2} />
                </span>
                <textarea
                  className="w-full h-20 pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-medium transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="บ้านเลขที่ ถนน ซอย ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>เบอร์โทรศัพท์ติดต่อ</span>
                <span className="text-[11px] text-slate-400 font-normal">เบอร์ติดต่อผู้จัดการหรือออฟฟิศ</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Phone size={16} strokeWidth={2.2} />
                </span>
                <input
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-semibold transition-all placeholder:text-slate-400"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08x-xxx-xxxx หรือ 02-xxx-xxxx"
                />
              </div>
            </div>

            {/* Smart Helper Pill */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Sparkles size={13} strokeWidth={2.2} />
              </span>
              <div className="text-xs text-blue-900 leading-relaxed">
                <strong className="font-bold block text-blue-950">สร้างเสร็จพร้อมเริ่มใช้งานได้ทันที</strong>
                <span className="text-[11px] text-blue-800/80">คุณสามารถเพิ่มห้องพัก สัญญาผู้เช่า และพิมพ์ใบเสร็จของหอพักนี้ได้ทันทีหลังจากบันทึก</span>
              </div>
            </div>

            <footer className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                className="h-10 px-4.5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                onClick={onClose}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="h-10 px-5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                type="button"
              >
                <span>ถัดไป</span>
                <ArrowRight size={14} strokeWidth={2.2} />
              </button>
            </footer>
          </div>
        )}

        {/* Step 2: Rates & Payment Setting */}
        {step === 2 && (
          <div className="p-6 space-y-4 text-xs animate-in fade-in duration-200">
            <div
              onClick={() => setCopySettings(!copySettings)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
                copySettings
                  ? "bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white border-blue-200/90 shadow-2xs"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                copySettings ? "bg-blue-600 text-white shadow-2xs" : "border border-slate-300 bg-white"
              }`}>
                {copySettings ? <Check size={13} strokeWidth={3} /> : null}
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 font-bold block text-sm">คัดลอกการตั้งค่าจากหอพักปัจจุบัน (แนะนำ)</strong>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                  นำอัตราค่าไฟ ค่าน้ำ และข้อมูลบัญชี PromptPay มาใช้กับหอพักนี้ทันที (ปรับเปลี่ยนได้ตลอดเวลา)
                </p>
              </div>
            </div>

            {!copySettings && (
              <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Zap size={13} className="text-amber-500" /> ค่าไฟ (฿/หน่วย)
                    </label>
                    <input
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-black tabular-nums"
                      type="number"
                      step="0.01"
                      min="0"
                      value={electricRate}
                      onChange={(e) => setElectricRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Droplets size={13} className="text-sky-500" /> ค่าน้ำ (฿/เดือน)
                    </label>
                    <input
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-black tabular-nums"
                      type="number"
                      min="0"
                      value={waterRate}
                      onChange={(e) => setWaterRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <QrCode size={13} className="text-indigo-500" /> เลขพร้อมเพย์ (PromptPay)
                  </label>
                  <input
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold"
                    value={promptpay}
                    onChange={(e) => setPromptpay(e.target.value)}
                    placeholder="เบอร์มือถือ หรือ เลขบัตรประชาชน"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <CreditCard size={13} className="text-emerald-500" /> ชื่อบัญชีรับเงิน
                  </label>
                  <input
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="ชื่อเจ้าของบัญชี"
                  />
                </div>
              </div>
            )}

            <footer className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                className="h-10 px-4 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5"
                onClick={() => setStep(1)}
                type="button"
              >
                <ArrowLeft size={14} strokeWidth={2.2} />
                <span>ย้อนกลับ</span>
              </button>
              <button
                className="h-10 px-5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/25 active:scale-98"
                onClick={handleSave}
                type="button"
              >
                <CheckCircle2 size={16} strokeWidth={2.2} />
                <span>ยืนยันสร้างหอพัก</span>
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
