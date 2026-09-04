"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  Coins,
  CreditCard,
  Droplets,
  FileText,
  Pencil,
  QrCode,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  EmptyState,
  Modal,
  PageHeader,
} from "@/components/portal/PortalUI";
import { SelectControl } from "@/components/ui/SelectControl";
import { money } from "@/lib/format";
import type { AppSettings, PageContentProps, Property } from "../types";

const waterMethodLabels: Record<string, string> = {
  meter: "ตามมิเตอร์ (บาท/หน่วย)",
  per_person: "ตามจำนวนผู้พัก (บาท/คน)",
  flat_room: "เหมาจ่าย (บาท/ห้อง)",
};

export function SettingsPage({
  isLocked,
  onToast,
  appSettings,
  onSettingsChange,
  properties,
}: PageContentProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<AppSettings>(appSettings);
  const [waterMethod, setWaterMethod] = useState<"meter" | "per_person" | "flat_room">("flat_room");
  const [query, setQuery] = useState("");

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return properties.filter(
      (item) =>
        !keyword ||
        [item.name, item.address, item.phone].some((value) =>
          value?.toLowerCase().includes(keyword)
        )
    );
  }, [properties, query]);

  const openSettings = (id: string | null) => {
    setSelectedPropertyId(id);
    if (id) {
      const p = properties.find((prop) => prop.id === id);
      if (p) {
        setLocalSettings(p.settings);
      }
    }
  };

  const handleSaveModal = () => {
    onSettingsChange(localSettings);
    setSelectedPropertyId(null);
    onToast("บันทึกการตั้งค่าหอพักเรียบร้อยแล้ว");
  };

  const waterRateLabel =
    waterMethod === "meter"
      ? "ค่าน้ำ/หน่วย (บาท)"
      : waterMethod === "per_person"
      ? "ค่าน้ำ/คน (บาท)"
      : "ค่าน้ำ/ห้อง (บาท)";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        description="กำหนดสูตรค่าน้ำ ค่าไฟ รอบบิล ค่าปรับ และข้อมูลรับเงินแยกตามหอ"
        title="ตั้งค่าหอพัก"
      />

      {/* 3 Hero Stat Cards (Matching Portal SettingsPage) */}
      <section aria-label="ภาพรวมการตั้งค่า" className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs sm:grid-cols-3">
        <div className="flex items-center gap-3.5 p-5 sm:border-r sm:border-slate-100">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
            <Building2 aria-hidden="true" size={20} strokeWidth={2.2} />
          </span>
          <div>
            <span className="block text-xs font-bold text-slate-500">หอพักทั้งหมด</span>
            <strong className="mt-0.5 block text-2xl font-black tracking-tight text-slate-900 tabular-nums">
              {properties.length.toLocaleString("th-TH")} แห่ง
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3.5 border-t border-slate-100 p-5 sm:border-r sm:border-t-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25">
            <Sparkles aria-hidden="true" size={20} strokeWidth={2.2} />
          </span>
          <div>
            <span className="block text-xs font-bold text-slate-500">ตั้งค่าแล้ว</span>
            <strong className="mt-0.5 block text-2xl font-black tracking-tight text-emerald-800 tabular-nums">
              {properties.length.toLocaleString("th-TH")} แห่ง
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3.5 border-t border-slate-100 p-5 sm:border-t-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white shadow-md shadow-blue-500/25">
            <QrCode aria-hidden="true" size={20} strokeWidth={2.2} />
          </span>
          <div>
            <span className="block text-xs font-bold text-slate-500">ผูก PromptPay</span>
            <strong className="mt-0.5 block text-2xl font-black tracking-tight text-blue-900 tabular-nums">
              {properties.filter((p) => p.settings.promptpay).length.toLocaleString("th-TH")} แห่ง
            </strong>
          </div>
        </div>
      </section>

      {/* Collection Toolbar */}
      <CollectionToolbar
        description={`แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${properties.length.toLocaleString("th-TH")} หอพัก`}
        onQueryChange={setQuery}
        placeholder="ค้นหาชื่อหอพัก ที่อยู่ หรือเบอร์โทร"
        query={query}
        title="รายการหอพัก"
      />

      {/* Property Settings Cards Grid (Matching Portal UI) */}
      {filtered.length ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {filtered.map((property) => (
            <article
              className="group relative overflow-hidden p-6 flex flex-col justify-between gap-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1"
              key={property.id}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent blur-xl transition-transform duration-500 group-hover:scale-125" />

              <div>
                {/* Header */}
                <header className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Building2 aria-hidden="true" size={20} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {property.name}
                      </h2>
                      <small className="text-xs text-slate-400 block truncate mt-0.5">
                        {property.address || "ยังไม่ได้ระบุที่อยู่"}
                      </small>
                    </div>
                  </div>
                  <button
                    aria-label={`แก้ไขการตั้งค่า ${property.name}`}
                    className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                    onClick={() => openSettings(property.id)}
                    title="แก้ไขการตั้งค่า"
                    type="button"
                  >
                    <Pencil size={14} strokeWidth={2.2} />
                  </button>
                </header>

                {/* 4 Setting chips */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
                      <Zap size={13} className="text-amber-500" />
                      <span>ค่าไฟฟ้า</span>
                    </span>
                    <strong className="text-slate-800 font-mono font-bold text-xs">
                      ฿{property.settings.electricRate.toFixed(2)}/หน่วย
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
                      <Droplets size={13} className="text-cyan-500" />
                      <span>ค่าน้ำประปา</span>
                    </span>
                    <strong className="text-slate-800 font-mono font-bold text-xs">
                      ฿{property.settings.waterRate.toFixed(2)}/ห้อง
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
                      <CalendarDays size={13} className="text-blue-500" />
                      <span>รอบบิล</span>
                    </span>
                    <strong className="text-slate-800 font-bold text-xs">
                      ออกบิล {property.settings.billDay} · ครบ {property.settings.dueDay}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
                      <QrCode size={13} className="text-purple-500" />
                      <span>บัญชีรับเงิน</span>
                    </span>
                    <strong className="text-slate-800 font-mono font-bold text-xs truncate" title={property.settings.promptpay}>
                      {property.settings.promptpay || "—"}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 text-xs text-slate-500 space-y-1">
                  <p className="truncate font-medium text-slate-700">ชื่อบัญชี: {property.settings.accountName || "—"}</p>
                  <p className="truncate text-[11px] text-slate-400">{property.settings.invoiceNote}</p>
                </div>
              </div>

              {/* Card Footer Button */}
              <footer className="mt-2 pt-3 border-t border-slate-100">
                <button
                  className="w-full h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                  onClick={() => openSettings(property.id)}
                  type="button"
                >
                  <Pencil size={14} strokeWidth={2.2} />
                  <span>แก้ไขการตั้งค่าหอพัก</span>
                </button>
              </footer>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          description="ไม่พบหอพักที่ตรงกับคำค้นหา"
          title="ไม่พบหอพัก"
        />
      )}

      {/* Edit Property Settings Modal (Matching Portal UI) */}
      {selectedPropertyId ? (
        <Modal
          description={`กำหนดรอบบิล ค่าน้ำ ค่าไฟ และข้อมูล PromptPay ของ ${selectedProperty?.name ?? ""}`}
          maxWidth={640}
          onClose={() => setSelectedPropertyId(null)}
          title={`ตั้งค่าหอพัก: ${selectedProperty?.name ?? ""}`}
        >
          <div className="p-6 flex flex-col gap-4 text-left text-xs">
            {/* Feature Intro Banner */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Sparkles size={13} strokeWidth={2.2} />
              </span>
              <div className="leading-relaxed">
                <strong className="font-bold block text-blue-950">ตั้งค่ารอบบิลและสาธารณูปโภค</strong>
                <span className="text-[11px] text-blue-800/80">
                  ค่าเหล่านี้จะถูกใช้เป็นค่าเริ่มต้นในการคำนวณมิเตอร์และใบแจ้งหนี้ประจำเดือน
                </span>
              </div>
            </div>

            {/* Section 1: Utility Rates */}
            <div className="flex items-center gap-3 pt-1">
              <strong className="whitespace-nowrap text-xs font-black text-slate-900">อัตราค่าสาธารณูปโภค</strong>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500" />
                    <span>ค่าไฟฟ้า/หน่วย (บาท) <span className="text-rose-500">*</span></span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">THB</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Zap size={16} strokeWidth={2.2} />
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        electricRate: Number(e.target.value),
                      }))
                    }
                    step="0.5"
                    type="number"
                    value={localSettings.electricRate}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Droplets size={14} className="text-cyan-500" />
                    <span>วิธีคิดค่าน้ำประปา <span className="text-rose-500">*</span></span>
                  </span>
                </label>
                <SelectControl
                  ariaLabel="วิธีคิดค่าน้ำประปา"
                  onValueChange={(val) =>
                    setWaterMethod(val as "meter" | "per_person" | "flat_room")
                  }
                  options={[
                    { value: "meter", label: "ตามมิเตอร์ (บาท/หน่วย)" },
                    { value: "flat_room", label: "เหมาจ่าย (บาท/ห้อง)" },
                    { value: "per_person", label: "ตามจำนวนผู้พัก (บาท/คน)" },
                  ]}
                  value={waterMethod}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Droplets size={14} className="text-cyan-500" />
                    <span>{waterRateLabel} <span className="text-rose-500">*</span></span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">THB</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Droplets size={16} strokeWidth={2.2} />
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        waterRate: Number(e.target.value),
                      }))
                    }
                    type="number"
                    value={localSettings.waterRate}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Coins size={14} className="text-slate-500" />
                    <span>ค่าปรับล่าช้า/วัน (บาท)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">0 หากไม่มีค่าปรับ</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Coins size={16} strokeWidth={2.2} />
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        lateFee: Number(e.target.value),
                      }))
                    }
                    placeholder="เช่น 50.00"
                    type="number"
                    value={localSettings.lateFee}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Billing Cycle Days */}
            <div className="flex items-center gap-3 pt-1">
              <strong className="whitespace-nowrap text-xs font-black text-slate-900">รอบวางบิลและกำหนดชำระ</strong>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-slate-500" />
                    <span>วันตัดรอบบิล (1-28) <span className="text-rose-500">*</span></span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">เช่น วันที่ 1 ของเดือน</span>
                </label>
                <input
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all"
                  max={28}
                  min={1}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      billDay: Number(e.target.value),
                    }))
                  }
                  step="1"
                  type="number"
                  value={localSettings.billDay}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-slate-500" />
                    <span>วันครบกำหนดชำระ (1-28) <span className="text-rose-500">*</span></span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">เช่น วันที่ 5 ของเดือน</span>
                </label>
                <input
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all"
                  max={28}
                  min={1}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      dueDay: Number(e.target.value),
                    }))
                  }
                  step="1"
                  type="number"
                  value={localSettings.dueDay}
                />
              </div>
            </div>

            {/* Section 3: PromptPay Info */}
            <div className="flex items-center gap-3 pt-1">
              <strong className="whitespace-nowrap text-xs font-black text-slate-900">ข้อมูลรับชำระเงิน</strong>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <QrCode size={14} className="text-slate-500" />
                    <span>เลขพร้อมเพย์ (PromptPay ID)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">เบอร์โทร / เลขนิติบุคคล</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <QrCode size={16} strokeWidth={2.2} />
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all placeholder:text-slate-400"
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        promptpay: e.target.value,
                      }))
                    }
                    placeholder="เบอร์โทร หรือ เลข ปชช."
                    type="text"
                    value={localSettings.promptpay}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-slate-500" />
                    <span>ชื่อบัญชีผู้รับเงิน</span>
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User size={16} strokeWidth={2.2} />
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-medium transition-all"
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        accountName: e.target.value,
                      }))
                    }
                    placeholder="ชื่อ-นามสกุล หรือ กิจการ"
                    type="text"
                    value={localSettings.accountName}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText size={14} className="text-slate-500" />
                  <span>ข้อความหัวใบแจ้งหนี้</span>
                </span>
              </label>
              <input
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-medium transition-all"
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    invoiceHeader: e.target.value,
                  }))
                }
                type="text"
                value={localSettings.invoiceHeader}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>หมายเหตุท้ายใบแจ้งหนี้</span>
                <span className="text-[11px] text-slate-400 font-normal">แสดงในบิล</span>
              </label>
              <textarea
                className="w-full p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-medium leading-relaxed transition-all"
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    invoiceNote: e.target.value,
                  }))
                }
                rows={2}
                value={localSettings.invoiceNote}
              />
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90">
              <input
                checked={localSettings.attachQR}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                id="attachQR"
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    attachQR: e.target.checked,
                  }))
                }
                type="checkbox"
              />
              <label className="text-xs font-bold text-slate-800 cursor-pointer" htmlFor="attachQR">
                แนบ QR Code PromptPay อัตโนมัติบนใบแจ้งหนี้
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                className="h-11 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-all"
                onClick={() => setSelectedPropertyId(null)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-500/25 transition-all"
                onClick={handleSaveModal}
                type="button"
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
