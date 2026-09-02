"use client";

import { useMemo, useState } from "react";
import { Building2, CalendarDays, Droplets, Pencil, QrCode, Zap } from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  EmptyState,
  Field,
  Modal,
  PageHeader,
  SelectField,
} from "@/components/portal/PortalUI";
import type { AppSettings, PageContentProps, Property } from "../types";

export function SettingsPage({ isLocked, onToast, appSettings, onSettingsChange, properties }: PageContentProps) {
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

  function handleSaveModal() {
    onSettingsChange(localSettings);
    setSelectedPropertyId(null);
    onToast("บันทึกการตั้งค่าหอพักเรียบร้อยแล้ว");
  }

  const waterMethodLabels: Record<string, string> = {
    meter: "ตามมิเตอร์ (บาท/หน่วย)",
    per_person: "ตามจำนวนผู้พัก (บาท/คน)",
    flat_room: "เหมาจ่าย (บาท/ห้อง)",
  };

  const waterRateLabel =
    waterMethod === "meter"
      ? "ค่าน้ำ/หน่วย"
      : waterMethod === "per_person"
      ? "ค่าน้ำ/คน"
      : "ค่าน้ำ/ห้อง";

  return (
    <>
      <PageHeader
        description="กำหนดสูตรค่าน้ำ ค่าไฟ รอบบิล ค่าปรับ และข้อมูลรับเงินแยกตามหอ"
        title="ตั้งค่าหอพัก"
      />

      <section className="mb-6 p-4 lg:p-5 flex flex-wrap items-center gap-8 lg:gap-12 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-slate-800 tracking-tight">
            {properties.length.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">หอพักทั้งหมด</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-emerald-600 tracking-tight">
            {properties.length.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">ตั้งค่าแล้ว</span>
        </div>
        <div className="flex flex-col">
          <strong className="text-2xl font-bold text-purple-600 tracking-tight">
            {properties.length.toLocaleString("th-TH")}
          </strong>
          <span className="text-xs text-slate-500 mt-0.5">ผูก PromptPay</span>
        </div>
      </section>

      <CollectionToolbar
        description={`แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${properties.length.toLocaleString("th-TH")} หอพัก`}
        onQueryChange={setQuery}
        placeholder="ค้นหาชื่อหอพัก ที่อยู่ หรือเบอร์โทร"
        query={query}
        title="รายการหอพัก"
      />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {filtered.map((property) => (
          <article
            className="p-5 flex flex-col gap-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all"
            key={property.id}
          >
            <header className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Building2 aria-hidden="true" size={20} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-800 truncate">{property.name}</h2>
                  <small className="text-xs text-slate-400 block truncate">{property.address || "ยังไม่ได้ระบุที่อยู่"}</small>
                </div>
              </div>
              <button
                aria-label={`แก้ไขการตั้งค่า ${property.name}`}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0"
                onClick={() => {
                  setSelectedPropertyId(property.id);
                  setLocalSettings(property.settings);
                }}
                title="แก้ไขการตั้งค่า"
                type="button"
              >
                <Pencil size={14} />
              </button>
            </header>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <Zap className="text-amber-500 shrink-0" size={16} />
                <div>
                  <span className="text-[10px] text-slate-400 block">ค่าไฟฟ้า</span>
                  <strong className="text-xs font-bold text-slate-800 block">
                    ฿{property.settings.electricRate.toFixed(2)}/หน่วย
                  </strong>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <Droplets className="text-sky-500 shrink-0" size={16} />
                <div>
                  <span className="text-[10px] text-slate-400 block">ค่าน้ำประปา</span>
                  <strong className="text-xs font-bold text-slate-800 block">
                    ฿{property.settings.waterRate.toFixed(2)}
                  </strong>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <CalendarDays className="text-blue-500 shrink-0" size={16} />
                <div>
                  <span className="text-[10px] text-slate-400 block">รอบบิล / กำหนด</span>
                  <strong className="text-xs font-bold text-slate-800 block">
                    ตัดวันที่ {property.settings.billDay} / จ่ายวันที่ {property.settings.dueDay}
                  </strong>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <QrCode className="text-purple-500 shrink-0" size={16} />
                <div>
                  <span className="text-[10px] text-slate-400 block">PromptPay</span>
                  <strong className="text-xs font-bold text-slate-800 block truncate">
                    {property.settings.promptpay || "ยังไม่ผูก"}
                  </strong>
                </div>
              </div>
            </div>

            <footer className="mt-auto pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span>
                วิธีคิดค่าน้ำ: <strong>{waterMethodLabels[waterMethod] || "เหมาจ่าย (บาท/ห้อง)"}</strong>
              </span>
            </footer>
          </article>
        ))}
      </section>

      {selectedProperty ? (
        <Modal
          description="กำหนดอัตราสาธารณูปโภค รอบบิล ค่าปรับล่าช้า และบัญชีรับเงิน"
          onClose={() => setSelectedPropertyId(null)}
          title={`ตั้งค่า ${selectedProperty.name}`}
        >
          <div className="p-6 flex flex-col gap-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                clear={() => {}}
                defaultValue={localSettings.electricRate}
                label="ค่าไฟ/หน่วย (บาท)"
                min={0}
                name="electricRatePerUnit"
                onChange={(v) => setLocalSettings((p) => ({ ...p, electricRate: parseFloat(v) || 0 }))}
                required
                step="0.01"
                type="number"
              />
              <SelectField
                clear={() => {}}
                defaultValue={waterMethod}
                label="วิธีคิดค่าน้ำประปา"
                name="waterBillingMethod"
                onChange={(val) => setWaterMethod(val as "meter" | "per_person" | "flat_room")}
                options={[
                  { value: "meter", label: "ตามมิเตอร์ (บาท/หน่วย)" },
                  { value: "per_person", label: "ตามจำนวนผู้พัก (บาท/คน)" },
                  { value: "flat_room", label: "เหมาจ่าย (บาท/ห้อง)" },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                clear={() => {}}
                defaultValue={localSettings.waterRate}
                label={`${waterRateLabel} (บาท)`}
                min={0}
                name="waterRatePerUnit"
                onChange={(v) => setLocalSettings((p) => ({ ...p, waterRate: parseFloat(v) || 0 }))}
                required
                step="0.01"
                type="number"
              />
              <Field
                clear={() => {}}
                defaultValue={localSettings.lateFee}
                label="ค่าปรับล่าช้า/วัน (บาท)"
                min={0}
                name="lateFeePerDay"
                onChange={(v) => setLocalSettings((p) => ({ ...p, lateFee: parseFloat(v) || 0 }))}
                required
                step="0.01"
                type="number"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                clear={() => {}}
                defaultValue={localSettings.billDay}
                label="วันตัดรอบบิล (1-31)"
                max={31}
                min={1}
                name="billingCutoffDay"
                onChange={(v) => setLocalSettings((p) => ({ ...p, billDay: parseInt(v, 10) || 1 }))}
                required
                step="1"
                type="number"
              />
              <Field
                clear={() => {}}
                defaultValue={localSettings.dueDay}
                label="วันครบกำหนดชำระ (1-31)"
                max={31}
                min={1}
                name="invoiceDueDay"
                onChange={(v) => setLocalSettings((p) => ({ ...p, dueDay: parseInt(v, 10) || 5 }))}
                required
                step="1"
                type="number"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                clear={() => {}}
                defaultValue={localSettings.promptpay}
                label="เลขพร้อมเพย์ (PromptPay ID)"
                name="promptpayId"
                onChange={(v) => setLocalSettings((p) => ({ ...p, promptpay: v }))}
                placeholder="เบอร์โทร หรือ เลขบัตร ปชช."
              />
              <Field
                clear={() => {}}
                defaultValue={localSettings.accountName}
                label="ชื่อบัญชีพร้อมเพย์"
                name="promptpayName"
                onChange={(v) => setLocalSettings((p) => ({ ...p, accountName: v }))}
                placeholder="เช่น สมชาย ใจดี"
              />
            </div>

            <footer className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer"
                onClick={() => setSelectedPropertyId(null)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 cursor-pointer"
                onClick={handleSaveModal}
                type="button"
              >
                บันทึกการตั้งค่า
              </button>
            </footer>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
