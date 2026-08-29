"use client";

import { useMemo, useState } from "react";
import { Droplets, Gauge, History, Zap } from "lucide-react";
import { saveMeterReadingAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import { EmptyState, Field, Modal, PageHeader, PortalForm, SelectField } from "@/components/portal/PortalUI";
import type { Meter, MeterReading, Property, Room } from "@/components/portal/types";
import { thaiDate } from "@/lib/format";
import { formatThaiBillingMonth, getMeterReadingDefaults } from "@/lib/portal/meter-reading.mjs";
import { validateMeter } from "@/lib/portal/validation.mjs";

type MetersPageProps = {
  organizationId: string;
  properties: Property[];
  rooms: Room[];
  meters: Meter[];
  readings: MeterReading[];
  canCreate: boolean;
};

export function MetersPage({ organizationId, properties, rooms, meters, readings, canCreate }: MetersPageProps) {
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [meterType, setMeterType] = useState("electric");
  const [periodMonth, setPeriodMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const propertyMap = useMemo(() => new Map(properties.map((item) => [item.id, item.name])), [properties]);
  const roomMap = useMemo(() => new Map(rooms.map((item) => [item.id, item])), [rooms]);
  const meterMap = useMemo(() => new Map(meters.map((item) => [item.id, item])), [meters]);
  const selectedMeter = useMemo(() => meters.find((item) => item.room_id === roomId && item.meter_type === meterType), [meters, roomId, meterType]);
  const draft = useMemo(() => getMeterReadingDefaults(readings, selectedMeter?.id ?? "", periodMonth), [readings, selectedMeter?.id, periodMonth]);
  const draftKey = `${selectedMeter?.id ?? "none"}-${periodMonth}-${draft.mode}`;
  const filtered = useMemo(() => { const keyword = query.trim().toLocaleLowerCase("th"); return readings.filter((item) => { const meter = meterMap.get(item.meter_id); const room = roomMap.get(meter?.room_id ?? ""); return (typeFilter === "all" || meter?.meter_type === typeFilter) && (!keyword || [room?.room_number, propertyMap.get(meter?.property_id ?? ""), item.period_month].some((value) => value?.toLocaleLowerCase("th").includes(keyword))); }); }, [meterMap, propertyMap, query, readings, roomMap, typeFilter]);

  const contextMessage = !roomId
    ? "เลือกห้องพักและประเภทมิเตอร์ ระบบจะค้นหาเลขรอบล่าสุดให้ทันที"
    : !selectedMeter
      ? "ห้องนี้ยังไม่มีมิเตอร์ประเภทที่เลือก กรุณาตรวจสอบข้อมูลห้องพัก"
      : draft.mode === "edit"
        ? `พบข้อมูลของ${formatThaiBillingMonth(periodMonth)} กำลังแก้ไขรายการเดิม`
        : draft.mode === "next"
          ? `เลขครั้งก่อนดึงจาก${formatThaiBillingMonth(draft.sourcePeriod ?? "")}`
          : "การจดครั้งแรก ระบบกำหนดเลขครั้งก่อนเป็น 0";

  return <>
    <PageHeader title="มิเตอร์" description="บันทึกหรือแก้ไขเลขมิเตอร์ตามรอบเดือน ระบบคำนวณหน่วยใช้งานให้อัตโนมัติ" actionLabel={canCreate ? "บันทึกมิเตอร์" : undefined} onAction={() => setOpen(true)} />
    <section className="portal-summary-strip"><div><strong>{readings.length.toLocaleString("th-TH")}</strong><span>รายการจดทั้งหมด</span></div><div><strong>{readings.filter((item) => meterMap.get(item.meter_id)?.meter_type === "electric").length.toLocaleString("th-TH")}</strong><span>มิเตอร์ไฟฟ้า</span></div><div><strong>{readings.filter((item) => meterMap.get(item.meter_id)?.meter_type === "water").length.toLocaleString("th-TH")}</strong><span>มิเตอร์น้ำ</span></div></section>
    <CollectionToolbar title="ประวัติการจดมิเตอร์" description={`พบ ${filtered.length.toLocaleString("th-TH")} รายการ`} query={query} onQueryChange={setQuery} placeholder="ค้นหาหอ ห้อง หรือรอบเดือน" filter={{ label: "กรองประเภทมิเตอร์", value: typeFilter, onChange: setTypeFilter, options: [{ value: "all", label: "มิเตอร์ทุกประเภท" }, { value: "electric", label: "ไฟฟ้า" }, { value: "water", label: "น้ำ" }] }} />
    {filtered.length ? <section className="portal-collection-grid">{filtered.map((item) => { const meter = meterMap.get(item.meter_id); const room = roomMap.get(meter?.room_id ?? ""); const electric = meter?.meter_type === "electric"; return <article className="portal-record-card meter-card" key={item.id}><header><span className={`portal-record-icon ${electric ? "electric" : "water"}`}>{electric ? <Zap aria-hidden="true" size={20} /> : <Droplets aria-hidden="true" size={20} />}</span><div><h2>ห้อง {room?.room_number ?? "—"}</h2><small>{propertyMap.get(meter?.property_id ?? "") ?? "ไม่พบหอพัก"}</small></div><span className="portal-record-period">{formatThaiBillingMonth(item.period_month)}</span></header><div className="portal-meter-reading"><div><small>ครั้งก่อน</small><strong>{Number(item.previous_value).toLocaleString("th-TH")}</strong></div><span><Gauge aria-hidden="true" size={17} />{Number(item.usage_value).toLocaleString("th-TH")} หน่วย</span><div><small>ครั้งนี้</small><strong>{Number(item.current_value).toLocaleString("th-TH")}</strong></div></div><footer><span>{electric ? "ไฟฟ้า" : "น้ำ"}</span><time dateTime={item.read_at}>จดเมื่อ {thaiDate(item.read_at)}</time></footer></article>; })}</section> : <EmptyState title={readings.length ? "ไม่พบรายการมิเตอร์" : "ยังไม่มีเลขมิเตอร์"} description={readings.length ? "ลองเปลี่ยนคำค้นหาหรือประเภทมิเตอร์" : "เลือกห้องและรอบเดือนเพื่อบันทึกเลขมิเตอร์ครั้งแรก"} />}
    {open ? <Modal title="บันทึกเลขมิเตอร์" description="เลขครั้งก่อนจะอ้างอิงจากรอบล่าสุดของมิเตอร์เดียวกันโดยอัตโนมัติ" onClose={() => setOpen(false)}>
      <PortalForm action={saveMeterReadingAction} organizationId={organizationId} validate={validateMeter} onSuccess={() => setOpen(false)} submitLabel={draft.mode === "edit" ? "บันทึกการแก้ไข" : "บันทึกเลขมิเตอร์"}>
        {(errors, clear) => <>
          <SelectField label="หอพัก" name="propertyId" required error={errors.propertyId} clear={clear} options={properties.map((item) => ({ value: item.id, label: item.name }))} value={propertyId} onChange={(value) => { setPropertyId(value); setRoomId(""); }} />
          <div className="portal-form-grid"><SelectField label="ห้องพัก" name="roomId" required error={errors.roomId} clear={clear} value={roomId} options={rooms.filter((item) => !propertyId || item.property_id === propertyId).map((item) => ({ value: item.id, label: `ห้อง ${item.room_number}` }))} onChange={setRoomId} /><SelectField label="ประเภทมิเตอร์" name="meterType" required value={meterType} error={errors.meterType} clear={clear} onChange={setMeterType} options={[{ value: "electric", label: "ไฟฟ้า" }, { value: "water", label: "น้ำ" }]} /></div>
          <Field label="รอบเดือน" name="periodMonth" required type="month" defaultValue={periodMonth} error={errors.periodMonth} clear={clear} onChange={setPeriodMonth} />
          <div className={`meter-reading-context ${roomId && !selectedMeter ? "is-warning" : ""}`} role="status"><History aria-hidden="true" size={18} /><span>{contextMessage}</span></div>
          <div className="portal-form-grid" key={draftKey}><Field label="เลขครั้งก่อน" name="previousValue" required type="number" min={0} step="0.01" defaultValue={draft.previousValue} readOnly error={errors.previousValue} clear={clear} /><Field label="เลขครั้งนี้" name="currentValue" required type="number" min={draft.previousValue || 0} step="0.01" defaultValue={draft.currentValue} error={errors.currentValue} clear={clear} /></div>
        </>}
      </PortalForm>
    </Modal> : null}
  </>;
}
