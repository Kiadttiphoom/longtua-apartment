"use client";

import { useMemo, useState } from "react";
import { Droplets, Gauge, History, LayoutGrid, ListFilter, Zap } from "lucide-react";
import { saveMeterReadingAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  PortalForm,
  SelectField,
} from "@/components/portal/PortalUI";
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

export function MetersPage({
  organizationId,
  properties,
  rooms,
  meters,
  readings,
  canCreate,
}: MetersPageProps) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [propertyId, setPropertyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [meterType, setMeterType] = useState("electric");
  const [periodMonth, setPeriodMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const propertyMap = useMemo(() => new Map(properties.map((item) => [item.id, item.name])), [properties]);
  const roomMap = useMemo(() => new Map(rooms.map((item) => [item.id, item])), [rooms]);
  const meterMap = useMemo(() => new Map(meters.map((item) => [item.id, item])), [meters]);
  const selectedMeter = useMemo(
    () => meters.find((item) => item.room_id === roomId && item.meter_type === meterType),
    [meters, roomId, meterType]
  );
  const draft = useMemo(
    () => getMeterReadingDefaults(readings, selectedMeter?.id ?? "", periodMonth),
    [readings, selectedMeter?.id, periodMonth]
  );
  const draftKey = `${selectedMeter?.id ?? "none"}-${periodMonth}-${draft.mode}`;

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th");
    return readings.filter((item) => {
      const meter = meterMap.get(item.meter_id);
      const room = roomMap.get(meter?.room_id ?? "");
      return (
        (typeFilter === "all" || meter?.meter_type === typeFilter) &&
        (!keyword ||
          [room?.room_number, propertyMap.get(meter?.property_id ?? ""), item.period_month].some(
            (value) => value?.toLocaleLowerCase("th").includes(keyword)
          ))
      );
    });
  }, [meterMap, propertyMap, query, readings, roomMap, typeFilter]);

  const contextMessage = !roomId
    ? "เลือกห้องพักและประเภทมิเตอร์ ระบบจะค้นหาเลขรอบล่าสุดให้ทันที"
    : !selectedMeter
    ? "ห้องนี้ยังไม่มีมิเตอร์ประเภทที่เลือก กรุณาตรวจสอบข้อมูลห้องพัก"
    : draft.mode === "edit"
    ? `พบข้อมูลของ${formatThaiBillingMonth(periodMonth)} กำลังแก้ไขรายการเดิม`
    : draft.mode === "next"
    ? `เลขครั้งก่อนดึงจาก${formatThaiBillingMonth(draft.sourcePeriod ?? "")}`
    : "การจดครั้งแรก ระบบกำหนดเลขครั้งก่อนเป็น 0";

  return (
    <>
      <PageHeader
        actionLabel={canCreate ? "บันทึกมิเตอร์" : undefined}
        description="บันทึกหรือแก้ไขเลขมิเตอร์ตามรอบเดือน ระบบคำนวณหน่วยใช้งานให้อัตโนมัติ"
        onAction={() => setOpen(true)}
        title="มิเตอร์"
      />

      <section className="portal-summary-strip">
        <div>
          <strong>{readings.length.toLocaleString("th-TH")}</strong>
          <span>รายการจดทั้งหมด</span>
        </div>
        <div>
          <strong>
            {
              readings.filter((item) => meterMap.get(item.meter_id)?.meter_type === "electric")
                .length
            }
          </strong>
          <span>มิเตอร์ไฟฟ้า</span>
        </div>
        <div>
          <strong>
            {
              readings.filter((item) => meterMap.get(item.meter_id)?.meter_type === "water")
                .length
            }
          </strong>
          <span>มิเตอร์น้ำ</span>
        </div>
      </section>

      <CollectionToolbar
        actions={
          <div className="portal-view-toggle">
            <button
              aria-label="มุมมองตาราง"
              className={`portal-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              type="button"
            >
              <ListFilter size={15} />
              <span>ตาราง</span>
            </button>
            <button
              aria-label="มุมมองการ์ด"
              className={`portal-view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              <LayoutGrid size={15} />
              <span>การ์ด</span>
            </button>
          </div>
        }
        description={`พบ ${filtered.length.toLocaleString("th-TH")} รายการ`}
        filter={{
          label: "กรองประเภทมิเตอร์",
          value: typeFilter,
          onChange: setTypeFilter,
          options: [
            { value: "all", label: "มิเตอร์ทุกประเภท" },
            { value: "electric", label: "ไฟฟ้า" },
            { value: "water", label: "น้ำ" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาหอ ห้อง หรือรอบเดือน"
        query={query}
        title="ประวัติการจดมิเตอร์"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <div className="portal-table-wrap">
            <DataTable
              headers={[
                "ห้องพัก / อาคาร",
                "ประเภทมิเตอร์",
                "รอบเดือน",
                "เลขครั้งก่อน",
                "เลขครั้งนี้",
                "หน่วยที่ใช้",
                "วันที่บันทึก",
              ]}
              rows={filtered.map((item) => {
                const meter = meterMap.get(item.meter_id);
                const room = roomMap.get(meter?.room_id ?? "");
                const electric = meter?.meter_type === "electric";

                return [
                  <div className="portal-lease-room-cell" key="room">
                    <span className="portal-lease-room-pill">{room?.room_number ?? "—"}</span>
                    <div className="portal-lease-tenant-meta">
                      <strong>ห้อง {room?.room_number ?? "—"}</strong>
                      <small>{propertyMap.get(meter?.property_id ?? "") ?? "ไม่พบหอพัก"}</small>
                    </div>
                  </div>,
                  <span
                    className={`account-badge ${electric ? "active" : "none"}`}
                    key="type"
                    style={{
                      background: electric ? "#fef3c7" : "#e0f2fe",
                      color: electric ? "#b45309" : "#0369a1",
                      borderColor: electric ? "#fde68a" : "#bae6fd",
                    }}
                  >
                    {electric ? <Zap size={13} /> : <Droplets size={13} />}
                    {electric ? "ไฟฟ้า" : "น้ำประปา"}
                  </span>,
                  <strong key="period">{formatThaiBillingMonth(item.period_month)}</strong>,
                  <span key="prev">{Number(item.previous_value).toLocaleString("th-TH")}</span>,
                  <strong key="curr">{Number(item.current_value).toLocaleString("th-TH")}</strong>,
                  <span
                    key="usage"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontWeight: 700,
                      color: "#059669",
                      background: "#ecfdf5",
                      padding: "3px 8px",
                      borderRadius: 9999,
                    }}
                  >
                    <Gauge size={13} />
                    {Number(item.usage_value).toLocaleString("th-TH")} หน่วย
                  </span>,
                  <span key="date" style={{ fontSize: "12px", color: "#64748b" }}>
                    {thaiDate(item.read_at)}
                  </span>,
                ];
              })}
            />
          </div>
        ) : (
          <section className="portal-collection-grid">
            {filtered.map((item) => {
              const meter = meterMap.get(item.meter_id);
              const room = roomMap.get(meter?.room_id ?? "");
              const electric = meter?.meter_type === "electric";

              return (
                <article className="portal-record-card meter-card" key={item.id}>
                  <header>
                    <span className={`portal-record-icon ${electric ? "electric" : "water"}`}>
                      {electric ? <Zap aria-hidden="true" size={20} /> : <Droplets aria-hidden="true" size={20} />}
                    </span>
                    <div>
                      <h2>ห้อง {room?.room_number ?? "—"}</h2>
                      <small>{propertyMap.get(meter?.property_id ?? "") ?? "ไม่พบหอพัก"}</small>
                    </div>
                    <span className="portal-record-period">
                      {formatThaiBillingMonth(item.period_month)}
                    </span>
                  </header>

                  <div className="portal-meter-reading">
                    <div>
                      <small>ครั้งก่อน</small>
                      <strong>{Number(item.previous_value).toLocaleString("th-TH")}</strong>
                    </div>
                    <span>
                      <Gauge aria-hidden="true" size={17} />
                      {Number(item.usage_value).toLocaleString("th-TH")} หน่วย
                    </span>
                    <div>
                      <small>ครั้งนี้</small>
                      <strong>{Number(item.current_value).toLocaleString("th-TH")}</strong>
                    </div>
                  </div>

                  <footer>
                    <span
                      style={{
                        fontWeight: 600,
                        color: electric ? "#b45309" : "#0284c7",
                      }}
                    >
                      {electric ? "⚡ มิเตอร์ไฟฟ้า" : "💧 มิเตอร์น้ำประปา"}
                    </span>
                    <time dateTime={item.read_at}>จดเมื่อ {thaiDate(item.read_at)}</time>
                  </footer>
                </article>
              );
            })}
          </section>
        )
      ) : (
        <EmptyState
          description={
            readings.length
              ? "ลองเปลี่ยนคำค้นหาหรือประเภทมิเตอร์"
              : "เลือกห้องและรอบเดือนเพื่อบันทึกเลขมิเตอร์ครั้งแรก"
          }
          title={readings.length ? "ไม่พบรายการมิเตอร์" : "ยังไม่มีเลขมิเตอร์"}
        />
      )}

      {open ? (
        <Modal
          description="เลขครั้งก่อนจะอ้างอิงจากรอบล่าสุดของมิเตอร์เดียวกันโดยอัตโนมัติ"
          onClose={() => setOpen(false)}
          title="บันทึกเลขมิเตอร์"
        >
          <PortalForm
            action={saveMeterReadingAction}
            onSuccess={() => setOpen(false)}
            organizationId={organizationId}
            submitLabel={draft.mode === "edit" ? "บันทึกการแก้ไข" : "บันทึกเลขมิเตอร์"}
            validate={validateMeter}
          >
            {(errors, clear) => (
              <>
                <SelectField
                  clear={clear}
                  error={errors.propertyId}
                  label="หอพัก"
                  name="propertyId"
                  onChange={(value) => {
                    setPropertyId(value);
                    setRoomId("");
                  }}
                  options={properties.map((item) => ({ value: item.id, label: item.name }))}
                  required
                  value={propertyId}
                />
                <div className="portal-form-grid">
                  <SelectField
                    clear={clear}
                    error={errors.roomId}
                    label="ห้องพัก"
                    name="roomId"
                    onChange={setRoomId}
                    options={rooms
                      .filter((item) => !propertyId || item.property_id === propertyId)
                      .map((item) => ({ value: item.id, label: `ห้อง ${item.room_number}` }))}
                    required
                    value={roomId}
                  />
                  <SelectField
                    clear={clear}
                    error={errors.meterType}
                    label="ประเภทมิเตอร์"
                    name="meterType"
                    onChange={setMeterType}
                    options={[
                      { value: "electric", label: "ไฟฟ้า" },
                      { value: "water", label: "น้ำ" },
                    ]}
                    required
                    value={meterType}
                  />
                </div>
                <Field
                  clear={clear}
                  defaultValue={periodMonth}
                  error={errors.periodMonth}
                  label="รอบเดือน"
                  name="periodMonth"
                  onChange={setPeriodMonth}
                  required
                  type="month"
                />
                <div
                  className={`meter-reading-context ${roomId && !selectedMeter ? "is-warning" : ""}`}
                  role="status"
                >
                  <History aria-hidden="true" size={18} />
                  <span>{contextMessage}</span>
                </div>
                <div className="portal-form-grid" key={draftKey}>
                  <Field
                    clear={clear}
                    defaultValue={draft.previousValue}
                    error={errors.previousValue}
                    label="เลขครั้งก่อน"
                    min={0}
                    name="previousValue"
                    readOnly
                    required
                    step="0.01"
                    type="number"
                  />
                  <Field
                    clear={clear}
                    defaultValue={draft.currentValue}
                    error={errors.currentValue}
                    label="เลขครั้งนี้"
                    min={draft.previousValue || 0}
                    name="currentValue"
                    required
                    step="0.01"
                    type="number"
                  />
                </div>
              </>
            )}
          </PortalForm>
        </Modal>
      ) : null}
    </>
  );
}
