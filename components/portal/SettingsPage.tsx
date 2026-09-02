"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  Coins,
  CreditCard,
  Droplets,
  Pencil,
  QrCode,
  Sparkles,
  Zap,
} from "lucide-react";
import { updatePropertySettingsAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  EmptyState,
  Modal,
  PageHeader,
  PortalForm,
} from "@/components/portal/PortalUI";
import { SelectControl } from "@/components/ui/SelectControl";
import { money } from "@/lib/format";
import type { Property, PropertySettings } from "@/components/portal/types";
import { validateSettings } from "@/lib/portal/validation.mjs";

const waterMethodLabels: Record<PropertySettings["water_billing_method"], string> = {
  meter: "ตามมิเตอร์ (บาท/หน่วย)",
  per_person: "ตามจำนวนผู้พัก (บาท/คน)",
  flat_room: "เหมาจ่าย (บาท/ห้อง)",
};

export function SettingsPage({
  organizationId,
  properties,
  settings,
  canEdit,
}: {
  organizationId: string;
  properties: Property[];
  settings: PropertySettings[];
  canEdit: boolean;
}) {
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [waterMethod, setWaterMethod] = useState<PropertySettings["water_billing_method"]>("meter");
  const [query, setQuery] = useState("");

  const settingsMap = useMemo(() => new Map(settings.map((item) => [item.property_id, item])), [settings]);
  const selected = propertyId ? settingsMap.get(propertyId) : undefined;

  const openSettings = (id: string | null) => {
    setPropertyId(id);
    if (id) setWaterMethod(settingsMap.get(id)?.water_billing_method ?? "meter");
  };

  const waterRateLabel =
    waterMethod === "meter"
      ? "ค่าน้ำ/หน่วย"
      : waterMethod === "per_person"
      ? "ค่าน้ำ/คน"
      : "ค่าน้ำ/ห้อง";

  const hasProperties = properties.length > 0;
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th");
    return properties.filter(
      (item) =>
        !keyword ||
        [item.name, item.address, item.phone].some((value) =>
          value?.toLocaleLowerCase("th").includes(keyword)
        )
    );
  }, [properties, query]);

  return (
    <div className="portal-refined-page space-y-8">
      <PageHeader
        description={
          hasProperties
            ? "กำหนดสูตรค่าน้ำ ค่าไฟ รอบบิล ค่าปรับ และข้อมูลรับเงินแยกตามหอ"
            : "เพิ่มหอพักอย่างน้อย 1 แห่งก่อนกำหนดสูตรค่าน้ำ ค่าไฟ และรอบบิล"
        }
        title="ตั้งค่าหอพัก"
      />

      <section aria-label="ภาพรวมการตั้งค่า" className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs sm:grid-cols-3">
        <div className="flex items-center gap-3.5 p-5 sm:border-r sm:border-slate-100">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
            <Building2 aria-hidden="true" size={20} strokeWidth={2.2} />
          </span>
          <div>
            <span className="block text-xs font-bold text-slate-500">หอพักทั้งหมด</span>
            <strong className="mt-0.5 block text-2xl font-black tracking-tight text-slate-900 tabular-nums">{properties.length.toLocaleString("th-TH")} แห่ง</strong>
          </div>
        </div>
        <div className="flex items-center gap-3.5 border-t border-slate-100 p-5 sm:border-r sm:border-t-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25">
            <Sparkles aria-hidden="true" size={20} strokeWidth={2.2} />
          </span>
          <div>
            <span className="block text-xs font-bold text-slate-500">ตั้งค่าแล้ว</span>
            <strong className="mt-0.5 block text-2xl font-black tracking-tight text-emerald-800 tabular-nums">{settings.length.toLocaleString("th-TH")} แห่ง</strong>
          </div>
        </div>
        <div className="flex items-center gap-3.5 border-t border-slate-100 p-5 sm:border-t-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white shadow-md shadow-blue-500/25">
            <QrCode aria-hidden="true" size={20} strokeWidth={2.2} />
          </span>
          <div>
            <span className="block text-xs font-bold text-slate-500">ผูก PromptPay</span>
            <strong className="mt-0.5 block text-2xl font-black tracking-tight text-blue-900 tabular-nums">
              {properties.filter((item) => settingsMap.get(item.id)?.promptpay_id).length.toLocaleString("th-TH")} แห่ง
            </strong>
          </div>
        </div>
      </section>

      {hasProperties ? (
        <CollectionToolbar
          description={`แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${properties.length.toLocaleString("th-TH")} หอพัก`}
          onQueryChange={setQuery}
          placeholder="ค้นหาชื่อหอพัก ที่อยู่ หรือเบอร์โทร"
          query={query}
          title="รายการหอพัก"
        />
      ) : null}

      {filtered.length ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {filtered.map((property) => {
            const item = settingsMap.get(property.id);
            return (
              <article className="group relative overflow-hidden p-6 flex flex-col gap-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1" key={property.id}>
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent blur-xl transition-transform duration-500 group-hover:scale-125" />
                <header className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <Building2 aria-hidden="true" size={20} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-slate-800 truncate">{property.name}</h2>
                      <small className="text-xs text-slate-400 block truncate">{property.address}</small>
                    </div>
                  </div>
                  {canEdit ? (
                    <button
                      aria-label={`แก้ไขการตั้งค่า ${property.name}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0"
                      onClick={() => openSettings(property.id)}
                      title="แก้ไขการตั้งค่า"
                      type="button"
                    >
                      <Pencil size={14} />
                    </button>
                  ) : null}
                </header>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <Zap className="text-amber-500 shrink-0" size={16} />
                    <div>
                      <span className="text-[10px] text-slate-400 block">ค่าไฟฟ้า</span>
                      <strong className="text-xs font-bold text-slate-800 block">
                        {item ? `${money(Number(item.electric_rate))}/หน่วย` : "ยังไม่ตั้ง"}
                      </strong>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <Droplets className="text-sky-500 shrink-0" size={16} />
                    <div>
                      <span className="text-[10px] text-slate-400 block">ค่าน้ำประปา</span>
                      <strong className="text-xs font-bold text-slate-800 block">
                        {item ? `${money(Number(item.water_rate))}` : "ยังไม่ตั้ง"}
                      </strong>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <CalendarDays className="text-blue-500 shrink-0" size={16} />
                    <div>
                      <span className="text-[10px] text-slate-400 block">รอบบิล / กำหนด</span>
                      <strong className="text-xs font-bold text-slate-800 block">
                        {item ? `ตัดวันที่ ${item.bill_day} / จ่ายวันที่ ${item.due_day}` : "ยังไม่ตั้ง"}
                      </strong>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <QrCode className="text-purple-500 shrink-0" size={16} />
                    <div>
                      <span className="text-[10px] text-slate-400 block">PromptPay</span>
                      <strong className="text-xs font-bold text-slate-800 block truncate">
                        {item?.promptpay_id || "ยังไม่ผูก"}
                      </strong>
                    </div>
                  </div>
                </div>

                <footer className="mt-auto pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span>
                    วิธีคิดค่าน้ำ: <strong>{item ? waterMethodLabels[item.water_billing_method] : "—"}</strong>
                  </span>
                </footer>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState
          description={
            hasProperties
              ? "ลองเปลี่ยนคำค้นหาเพื่อค้นหาหอพักอื่น"
              : "สร้างหอพักอย่างน้อย 1 แห่งเพื่อเริ่มกำหนดอัตราค่าน้ำ ค่าไฟ และรอบบิล"
          }
          title={hasProperties ? "ไม่พบหอพักที่ค้นหา" : "ยังไม่มีข้อมูลหอพัก"}
        />
      )}

      {selected && propertyId ? (
        <Modal
          className="portal-refined-modal"
          description={`กำหนดอัตราสาธารณูปโภค รอบบิล ค่าปรับ และบัญชีรับเงินของ ${properties.find((item) => item.id === propertyId)?.name ?? ""}`}
          maxWidth={620}
          onClose={() => openSettings(null)}
          title={`ตั้งค่า ${properties.find((item) => item.id === propertyId)?.name ?? ""}`}
        >
          <PortalForm
            action={updatePropertySettingsAction}
            onCancel={() => openSettings(null)}
            onSuccess={() => openSettings(null)}
            organizationId={organizationId}
            submitLabel="บันทึกการตั้งค่า"
            validate={validateSettings}
          >
            {(errors, clear) => (
              <div className="space-y-4 text-xs">
                {/* Value Banner */}
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles size={13} strokeWidth={2.2} />
                  </span>
                  <div className="leading-relaxed">
                    <strong className="font-bold block text-blue-950">กำหนดอัตราค่าบริการและรอบบิล</strong>
                    <span className="text-[11px] text-blue-800/80">
                      ระบบจะนำอัตราเหล่านี้ไปใช้คำนวณบิลรายเดือน และแสดงข้อมูลพร้อมเพย์บนใบแจ้งหนี้อัตโนมัติ
                    </span>
                  </div>
                </div>

                <input name="propertyId" type="hidden" value={propertyId} />
                <input name="waterBillingMethod" type="hidden" value={waterMethod} />

                {/* Utility Rates */}
                <div className="flex items-center gap-3 pt-1">
                  <strong className="whitespace-nowrap text-xs font-black text-slate-900">อัตราค่าบริการ</strong>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-500" />
                        <span>ค่าไฟ/หน่วย (บาท) <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">บาท/Unit</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                      defaultValue={selected.electric_rate}
                      min={0}
                      aria-invalid={Boolean(errors.electricRate)}
                      name="electricRate"
                      onChange={() => clear("electricRate")}
                      placeholder="เช่น 7.00"
                      step="0.01"
                      type="number"
                    />
                    {errors.electricRate ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.electricRate}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Droplets size={14} className="text-cyan-500" />
                        <span>วิธีคิดค่าน้ำประปา <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">สูตรคำนวณ</span>
                    </label>
                    <SelectControl
                      ariaLabel="วิธีคิดค่าน้ำประปา"
                      onValueChange={(val) => setWaterMethod(val as PropertySettings["water_billing_method"])}
                      options={[
                        { value: "meter", label: "ตามมิเตอร์ (บาท/หน่วย)" },
                        { value: "per_person", label: "ตามจำนวนผู้พัก (บาท/คน)" },
                        { value: "flat_room", label: "เหมาจ่าย (บาท/ห้อง)" },
                      ]}
                      value={waterMethod}
                    />
                  </div>
                </div>

                {/* Water Rate & Late Fee */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Droplets size={14} className="text-cyan-500" />
                        <span>{waterRateLabel} (บาท) <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">THB</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                      defaultValue={selected.water_rate}
                      min={0}
                      aria-invalid={Boolean(errors.waterRate)}
                      name="waterRate"
                      onChange={() => clear("waterRate")}
                      placeholder="เช่น 18.00"
                      step="0.01"
                      type="number"
                    />
                    {errors.waterRate ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.waterRate}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Coins size={14} className="text-slate-500" />
                        <span>ค่าปรับล่าช้า/วัน (บาท) <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">0 หากไม่มีค่าปรับ</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                      defaultValue={selected.late_fee}
                      min={0}
                      aria-invalid={Boolean(errors.lateFee)}
                      name="lateFee"
                      onChange={() => clear("lateFee")}
                      placeholder="เช่น 50.00"
                      step="0.01"
                      type="number"
                    />
                    {errors.lateFee ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.lateFee}</p>
                    ) : null}
                  </div>
                </div>

                {/* Billing Cycle Days */}
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
                      <span className="text-[11px] text-slate-400 font-normal">เช่น วันที่ 25 ของทุกเดือน</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all"
                      defaultValue={selected.bill_day}
                      aria-invalid={Boolean(errors.billDay)}
                      max={28}
                      min={1}
                      name="billDay"
                      onChange={() => clear("billDay")}
                      step="1"
                      type="number"
                    />
                    {errors.billDay ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.billDay}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-slate-500" />
                        <span>วันครบกำหนดชำระ (1-28) <span className="text-rose-500">*</span></span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">เช่น วันที่ 5 ของเดือนถัดไป</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all"
                      defaultValue={selected.due_day}
                      aria-invalid={Boolean(errors.dueDay)}
                      max={28}
                      min={1}
                      name="dueDay"
                      onChange={() => clear("dueDay")}
                      step="1"
                      type="number"
                    />
                    {errors.dueDay ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.dueDay}</p>
                    ) : null}
                  </div>
                </div>

                {/* PromptPay Info */}
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
                        defaultValue={selected.promptpay_id ?? ""}
                        aria-invalid={Boolean(errors.promptpayId)}
                        name="promptpayId"
                        onChange={() => clear("promptpayId")}
                        placeholder="เช่น 0812345678 หรือ 010555..."
                      />
                    </div>
                    {errors.promptpayId ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.promptpayId}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CreditCard size={14} className="text-slate-500" />
                        <span>ชื่อบัญชีพร้อมเพย์</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">แสดงในใบแจ้งหนี้</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <CreditCard size={16} strokeWidth={2.2} />
                      </span>
                      <input
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all placeholder:text-slate-400"
                        defaultValue={selected.account_name ?? ""}
                        aria-invalid={Boolean(errors.accountName)}
                        name="accountName"
                        onChange={() => clear("accountName")}
                        placeholder="เช่น บจก. หอพักดีเลิศ หรือ นายสมศักดิ์"
                      />
                    </div>
                    {errors.accountName ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.accountName}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </PortalForm>
        </Modal>
      ) : null}
    </div>
  );
}
