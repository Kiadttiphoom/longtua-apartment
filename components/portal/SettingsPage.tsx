"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, CalendarDays, Droplets, QrCode, Zap } from "lucide-react";
import { updatePropertySettingsAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import { EditButton, EmptyState, Field, Modal, PageHeader, PortalForm, SelectField } from "@/components/portal/PortalUI";
import { money } from "@/lib/format";
import type { Property, PropertySettings } from "@/components/portal/types";
import { validateSettings } from "@/lib/portal/validation.mjs";

const waterMethodLabels: Record<PropertySettings["water_billing_method"], string> = {
  meter: "ตามมิเตอร์",
  per_person: "ตามจำนวนผู้พัก",
  flat_room: "เหมาจ่ายต่อห้อง",
};

export function SettingsPage({ organizationId, properties, settings, canEdit }: { organizationId: string; properties: Property[]; settings: PropertySettings[]; canEdit: boolean }) {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [waterMethod, setWaterMethod] = useState<PropertySettings["water_billing_method"]>("meter");
  const [query, setQuery] = useState("");
  const settingsMap = useMemo(() => new Map(settings.map((item) => [item.property_id, item])), [settings]);
  const selected = propertyId ? settingsMap.get(propertyId) : undefined;
  const openSettings = (id: string | null) => {
    setPropertyId(id);
    if (id) setWaterMethod(settingsMap.get(id)?.water_billing_method ?? "meter");
  };
  const waterRateLabel = waterMethod === "meter" ? "ค่าน้ำ/หน่วย" : waterMethod === "per_person" ? "ค่าน้ำ/คน" : "ค่าน้ำ/ห้อง";
  const hasProperties = properties.length > 0;
  const filtered = useMemo(() => { const keyword = query.trim().toLocaleLowerCase("th"); return properties.filter((item) => !keyword || [item.name, item.address, item.phone].some((value) => value?.toLocaleLowerCase("th").includes(keyword))); }, [properties, query]);

  return <>
    <PageHeader
      title="ตั้งค่าหอพัก"
      description={hasProperties ? "กำหนดสูตรค่าน้ำ ค่าไฟ รอบบิล ค่าปรับ และข้อมูลรับเงินแยกตามหอ" : "เพิ่มหอพักอย่างน้อย 1 แห่งก่อนกำหนดสูตรค่าน้ำ ค่าไฟ และรอบบิล"}
      actionLabel={canEdit ? (hasProperties ? "แก้ไขการตั้งค่า" : "เพิ่มหอพัก") : undefined}
      onAction={() => hasProperties ? openSettings(properties[0].id) : router.push("/dormitories")}
    />
    <section className="portal-summary-strip"><div><strong>{properties.length.toLocaleString("th-TH")}</strong><span>หอพักทั้งหมด</span></div><div><strong>{settings.length.toLocaleString("th-TH")}</strong><span>ตั้งค่าแล้ว</span></div><div><strong>{properties.filter((item) => settingsMap.get(item.id)?.promptpay_id).length.toLocaleString("th-TH")}</strong><span>ผูก PromptPay</span></div></section>
    {hasProperties ? <CollectionToolbar title="การตั้งค่าแยกตามหอ" description={`พบ ${filtered.length.toLocaleString("th-TH")} หอพัก`} query={query} onQueryChange={setQuery} placeholder="ค้นหาชื่อหอ ที่อยู่ หรือเบอร์โทร" /> : null}
    {filtered.length ? <section className="portal-dormitory-grid portal-settings-grid">{filtered.map((item) => { const value = settingsMap.get(item.id); const method = value?.water_billing_method ?? "meter"; return <article className="portal-dormitory-card portal-settings-card" key={item.id}><header><span><Building2 aria-hidden="true" size={21} /></span><div><h2>{item.name}</h2><small>{value ? "พร้อมใช้สำหรับคำนวณใบแจ้งหนี้" : "ยังใช้ค่าเริ่มต้นของระบบ"}</small></div>{canEdit ? <EditButton label={item.name} onClick={() => openSettings(item.id)} /> : null}</header><div className="portal-settings-rates"><div><span><Zap aria-hidden="true" size={16} /> ค่าไฟ</span><strong>{money(Number(value?.electric_rate ?? 0))}<small>/หน่วย</small></strong></div><div><span><Droplets aria-hidden="true" size={16} /> ค่าน้ำ</span><strong>{money(Number(value?.water_rate ?? 0))}<small> · {waterMethodLabels[method]}</small></strong></div></div><dl><div><dt><CalendarDays aria-hidden="true" size={13} /> ออกบิล</dt><dd>วันที่ {value?.bill_day ?? "—"}</dd></div><div><dt>ครบกำหนด</dt><dd>วันที่ {value?.due_day ?? "—"}</dd></div><div><dt><QrCode aria-hidden="true" size={13} /> PromptPay</dt><dd className="settings-value">{value?.promptpay_id ?? "ยังไม่ตั้งค่า"}</dd></div></dl></article>; })}</section> : <EmptyState title={hasProperties ? "ไม่พบหอพักที่ค้นหา" : "ยังไม่มีหอพัก"} description={hasProperties ? "ลองใช้ชื่อหอ ที่อยู่ หรือเบอร์โทรอื่น" : "เพิ่มหอพักก่อนกำหนดอัตราค่าบริการ"} />}
    {propertyId ? <Modal title="แก้ไขการตั้งค่าหอพัก" description={properties.find((item) => item.id === propertyId)?.name} onClose={() => setPropertyId(null)}>
      <PortalForm action={updatePropertySettingsAction} organizationId={organizationId} validate={validateSettings} onSuccess={() => setPropertyId(null)} submitLabel="บันทึกการตั้งค่า">
        {(errors, clear) => <>
          <SelectField label="หอพัก" name="propertyId" required defaultValue={propertyId} error={errors.propertyId} clear={clear} options={properties.map((item) => ({ value: item.id, label: item.name }))} />
          <div className="portal-form-grid"><Field label="ค่าไฟ/หน่วย" name="electricRate" required type="number" min={0} step="0.01" defaultValue={selected?.electric_rate ?? 8} error={errors.electricRate} clear={clear} /><SelectField label="วิธีคิดค่าน้ำ" name="waterBillingMethod" required value={waterMethod} error={errors.waterBillingMethod} clear={clear} onChange={(value) => setWaterMethod(value as PropertySettings["water_billing_method"])} options={[{ value: "meter", label: "ตามมิเตอร์ (บาท/หน่วย)" }, { value: "per_person", label: "ตามจำนวนผู้พัก (บาท/คน)" }, { value: "flat_room", label: "เหมาจ่าย (บาท/ห้อง)" }]} /></div>
          <Field label={waterRateLabel} name="waterRate" required type="number" min={0} step="0.01" defaultValue={selected?.water_rate ?? 100} error={errors.waterRate} clear={clear} />
          <div className="billing-method-hint" role="status">{waterMethod === "meter" ? "ค่าน้ำ = จำนวนหน่วยที่ใช้ × อัตราต่อหน่วย และต้องจดมิเตอร์น้ำก่อนออกบิล" : waterMethod === "per_person" ? "ค่าน้ำ = จำนวนผู้พักในสัญญา × อัตราต่อคน" : "ค่าน้ำคิดเป็นยอดคงที่ต่อห้องในแต่ละรอบบิล"}</div>
          <div className="portal-form-grid"><Field label="วันออกบิล" name="billDay" required type="number" min={1} max={28} defaultValue={selected?.bill_day ?? 1} error={errors.billDay} clear={clear} /><Field label="วันครบกำหนด" name="dueDay" required type="number" min={1} max={28} defaultValue={selected?.due_day ?? 5} error={errors.dueDay} clear={clear} /></div>
          <Field label="ค่าปรับล่าช้า" name="lateFee" required type="number" min={0} step="0.01" defaultValue={selected?.late_fee ?? 0} error={errors.lateFee} clear={clear} />
          <div className="portal-form-grid"><Field label="PromptPay" name="promptpayId" defaultValue={selected?.promptpay_id} error={errors.promptpayId} clear={clear} /><Field label="ชื่อบัญชี" name="accountName" defaultValue={selected?.account_name} error={errors.accountName} clear={clear} /></div>
          <Field label="หมายเหตุท้ายบิล" name="invoiceNote" defaultValue={selected?.invoice_note} error={errors.invoiceNote} clear={clear} />
        </>}
      </PortalForm>
    </Modal> : null}
  </>;
}
