"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, CalendarDays, Droplets, Pencil, QrCode, Zap } from "lucide-react";
import { updatePropertySettingsAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  EmptyState,
  Field,
  Modal,
  PageHeader,
  PortalForm,
  SelectField,
} from "@/components/portal/PortalUI";
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
    <>
      <PageHeader
        actionLabel={canEdit ? (hasProperties ? "แก้ไขการตั้งค่า" : "เพิ่มหอพัก") : undefined}
        description={
          hasProperties
            ? "กำหนดสูตรค่าน้ำ ค่าไฟ รอบบิล ค่าปรับ และข้อมูลรับเงินแยกตามหอ"
            : "เพิ่มหอพักอย่างน้อย 1 แห่งก่อนกำหนดสูตรค่าน้ำ ค่าไฟ และรอบบิล"
        }
        onAction={() => (hasProperties ? openSettings(properties[0].id) : router.push("/dormitories"))}
        title="ตั้งค่าหอพัก"
      />

      <section className="portal-summary-strip">
        <div>
          <strong>{properties.length.toLocaleString("th-TH")}</strong>
          <span>หอพักทั้งหมด</span>
        </div>
        <div>
          <strong>{settings.length.toLocaleString("th-TH")}</strong>
          <span>ตั้งค่าแล้ว</span>
        </div>
        <div>
          <strong>
            {properties.filter((item) => settingsMap.get(item.id)?.promptpay_id).length.toLocaleString("th-TH")}
          </strong>
          <span>ผูก PromptPay</span>
        </div>
      </section>

      {hasProperties ? (
        <CollectionToolbar
          description={`พบ ${filtered.length.toLocaleString("th-TH")} หอพัก`}
          onQueryChange={setQuery}
          placeholder="ค้นหาชื่อหอ ที่อยู่ หรือเบอร์โทร"
          query={query}
          title="การตั้งค่าแยกตามหอ"
        />
      ) : null}

      {filtered.length ? (
        <section className="portal-dormitory-grid portal-settings-grid">
          {filtered.map((item) => {
            const value = settingsMap.get(item.id);
            const method = value?.water_billing_method ?? "meter";

            return (
              <article className="portal-dormitory-card portal-settings-card" key={item.id}>
                <header>
                  <span className="portal-dormitory-icon-pill">
                    <Building2 aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <h2>{item.name}</h2>
                    <small>
                      {value ? "พร้อมใช้สำหรับคำนวณใบแจ้งหนี้" : "ยังใช้ค่าเริ่มต้นของระบบ"}
                    </small>
                  </div>
                </header>

                <div className="portal-settings-rates">
                  <div>
                    <span>
                      <Zap aria-hidden="true" size={16} /> ค่าไฟ
                    </span>
                    <strong>
                      {money(Number(value?.electric_rate ?? 0))}
                      <small>/หน่วย</small>
                    </strong>
                  </div>
                  <div>
                    <span>
                      <Droplets aria-hidden="true" size={16} /> ค่าน้ำ
                    </span>
                    <strong>
                      {money(Number(value?.water_rate ?? 0))}
                      <small> · {waterMethodLabels[method]}</small>
                    </strong>
                  </div>
                </div>

                <dl className="portal-record-metrics">
                  <div>
                    <dt>
                      <CalendarDays aria-hidden="true" size={13} /> ออกบิล
                    </dt>
                    <dd>ทุกวันที่ {value?.bill_day ?? 1}</dd>
                  </div>
                  <div>
                    <dt>ครบกำหนด</dt>
                    <dd>ทุกวันที่ {value?.due_day ?? 5}</dd>
                  </div>
                  <div className="wide">
                    <dt>
                      <QrCode aria-hidden="true" size={13} /> พร้อมเพย์
                    </dt>
                    <dd className="settings-value">{value?.promptpay_id || "ยังไม่ตั้งค่า"}</dd>
                  </div>
                </dl>

                <footer className="portal-lease-card-footer">
                  <div className="portal-lease-card-actions-grid">
                    {canEdit ? (
                      <button
                        className="portal-lease-card-btn edit"
                        onClick={() => openSettings(item.id)}
                        style={{ gridColumn: "span 2" }}
                        title="แก้ไขการตั้งค่าหอพัก"
                        type="button"
                      >
                        <Pencil size={15} />
                        <span>แก้ไขอัตราค่าน้ำ/ค่าไฟ/รอบบิล</span>
                      </button>
                    ) : null}
                  </div>
                </footer>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState
          description={
            hasProperties
              ? "ลองใช้ชื่อหอ ที่อยู่ หรือเบอร์โทรอื่น"
              : "เพิ่มหอพักก่อนกำหนดอัตราค่าบริการ"
          }
          title={hasProperties ? "ไม่พบหอพักที่ค้นหา" : "ยังไม่มีหอพัก"}
        />
      )}

      {propertyId ? (
        <Modal
          description={properties.find((item) => item.id === propertyId)?.name}
          onClose={() => setPropertyId(null)}
          title="แก้ไขการตั้งค่าหอพัก"
        >
          <PortalForm
            action={updatePropertySettingsAction}
            onSuccess={() => setPropertyId(null)}
            organizationId={organizationId}
            submitLabel="บันทึกการตั้งค่า"
            validate={validateSettings}
          >
            {(errors, clear) => (
              <>
                <SelectField
                  clear={clear}
                  defaultValue={propertyId}
                  error={errors.propertyId}
                  label="หอพัก"
                  name="propertyId"
                  options={properties.map((item) => ({ value: item.id, label: item.name }))}
                  required
                />
                <div className="portal-form-grid">
                  <Field
                    clear={clear}
                    defaultValue={selected?.electric_rate ?? 8}
                    error={errors.electricRate}
                    label="ค่าไฟ/หน่วย"
                    min={0}
                    name="electricRate"
                    required
                    step="0.01"
                    type="number"
                  />
                  <SelectField
                    clear={clear}
                    error={errors.waterBillingMethod}
                    label="วิธีคิดค่าน้ำ"
                    name="waterBillingMethod"
                    onChange={(value) => setWaterMethod(value as PropertySettings["water_billing_method"])}
                    options={[
                      { value: "meter", label: "ตามมิเตอร์ (บาท/หน่วย)" },
                      { value: "per_person", label: "ตามจำนวนผู้พัก (บาท/คน)" },
                      { value: "flat_room", label: "เหมาจ่าย (บาท/ห้อง)" },
                    ]}
                    required
                    value={waterMethod}
                  />
                </div>
                <Field
                  clear={clear}
                  defaultValue={selected?.water_rate ?? 100}
                  error={errors.waterRate}
                  label={waterRateLabel}
                  min={0}
                  name="waterRate"
                  required
                  step="0.01"
                  type="number"
                />
                <div className="billing-method-hint" role="status">
                  {waterMethod === "meter"
                    ? "ค่าน้ำ = จำนวนหน่วยที่ใช้ × อัตราต่อหน่วย และต้องจดมิเตอร์น้ำก่อนออกบิล"
                    : waterMethod === "per_person"
                    ? "ค่าน้ำ = จำนวนผู้พักในสัญญา × อัตราต่อคน"
                    : "ค่าน้ำคิดเป็นยอดคงที่ต่อห้องในแต่ละรอบบิล"}
                </div>
                <div className="portal-form-grid">
                  <Field
                    clear={clear}
                    defaultValue={selected?.bill_day ?? 1}
                    error={errors.billDay}
                    label="วันออกบิล"
                    max={28}
                    min={1}
                    name="billDay"
                    required
                    type="number"
                  />
                  <Field
                    clear={clear}
                    defaultValue={selected?.due_day ?? 5}
                    error={errors.dueDay}
                    label="วันครบกำหนด"
                    max={28}
                    min={1}
                    name="dueDay"
                    required
                    type="number"
                  />
                </div>
                <Field
                  clear={clear}
                  defaultValue={selected?.late_fee ?? 0}
                  error={errors.lateFee}
                  label="ค่าปรับล่าช้า"
                  min={0}
                  name="lateFee"
                  required
                  step="0.01"
                  type="number"
                />
                <div className="portal-form-grid">
                  <Field
                    clear={clear}
                    defaultValue={selected?.promptpay_id}
                    error={errors.promptpayId}
                    label="PromptPay"
                    name="promptpayId"
                  />
                  <Field
                    clear={clear}
                    defaultValue={selected?.account_name}
                    error={errors.accountName}
                    label="ชื่อบัญชี"
                    name="accountName"
                  />
                </div>
                <Field
                  clear={clear}
                  defaultValue={selected?.invoice_note}
                  error={errors.invoiceNote}
                  label="หมายเหตุท้ายบิล"
                  name="invoiceNote"
                />
              </>
            )}
          </PortalForm>
        </Modal>
      ) : null}
    </>
  );
}
