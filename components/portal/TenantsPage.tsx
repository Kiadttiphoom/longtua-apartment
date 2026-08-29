"use client";

import { useMemo, useState } from "react";
import { Mail, MapPin, Phone, UserRound, UserRoundCheck } from "lucide-react";
import { createTenantAction, updateTenantAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import { EditButton, EmptyState, Field, Modal, PageHeader, PortalForm, SelectField, StatusBadge } from "@/components/portal/PortalUI";
import { TenantPortalAccountModal } from "@/components/portal/TenantPortalAccountModal";
import type { Tenant } from "@/components/portal/types";
import type { TenantPortalAccountSummary } from "@/lib/portal/tenant-accounts";
import { validateTenant } from "@/lib/portal/validation.mjs";

export function TenantsPage({ organizationId, items, portalAccounts, canCreate, canEdit }: { organizationId: string; items: Tenant[]; portalAccounts: TenantPortalAccountSummary[]; canCreate: boolean; canEdit: boolean }) {
  const [selected, setSelected] = useState<Tenant | "create" | null>(null);
  const [portalTarget, setPortalTarget] = useState<Tenant | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const editing = selected && selected !== "create" ? selected : null;
  const accountMap = useMemo(() => new Map(portalAccounts.map((account) => [account.tenantId, account])), [portalAccounts]);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th");
    return items.filter((item) => (status === "all" || item.status === status) && (!keyword || [item.full_name, item.phone, item.email, item.address].some((value) => value?.toLocaleLowerCase("th").includes(keyword))));
  }, [items, query, status]);
  return <>
    <PageHeader title="ผู้เช่า" description="ทะเบียนผู้เช่า ข้อมูลติดต่อ และสถานะผู้พักอาศัย" actionLabel={canCreate ? "เพิ่มผู้เช่า" : undefined} onAction={() => setSelected("create")} />
    <section className="portal-summary-strip"><div><strong>{items.length.toLocaleString("th-TH")}</strong><span>ผู้เช่าทั้งหมด</span></div><div><strong>{items.filter((item) => item.status === "active").length.toLocaleString("th-TH")}</strong><span>กำลังใช้งาน</span></div><div><strong>{items.filter((item) => item.status === "former").length.toLocaleString("th-TH")}</strong><span>ผู้เช่าเดิม</span></div></section>
    <CollectionToolbar title="รายชื่อผู้เช่า" description={`พบ ${filtered.length.toLocaleString("th-TH")} จาก ${items.length.toLocaleString("th-TH")} คน`} query={query} onQueryChange={setQuery} placeholder="ค้นหาชื่อ เบอร์โทร อีเมล หรือที่อยู่" filter={{ label: "กรองสถานะผู้เช่า", value: status, onChange: setStatus, options: [{ value: "all", label: "ทุกสถานะ" }, { value: "active", label: "ใช้งาน" }, { value: "former", label: "ผู้เช่าเดิม" }, { value: "blocked", label: "ระงับ" }] }} />
    {filtered.length ? <section className="portal-collection-grid">{filtered.map((item) => <article className="portal-record-card" key={item.id}>
      <header><span className="portal-record-icon"><UserRound aria-hidden="true" size={20} /></span><div><h2>{item.full_name}</h2><small>{item.id_card_last4 ? `บัตรประชาชน •••• ${item.id_card_last4}` : "ยังไม่ได้เก็บข้อมูลบัตรประชาชน"}</small></div><StatusBadge status={item.status} /></header>
      <div className="portal-record-details"><p><Phone aria-hidden="true" size={15} /><span>{item.phone || "ยังไม่มีเบอร์โทรศัพท์"}</span></p><p><Mail aria-hidden="true" size={15} /><span>{item.email || "ยังไม่มีอีเมล"}</span></p><p><MapPin aria-hidden="true" size={15} /><span>{item.address || "ยังไม่มีที่อยู่"}</span></p></div>
      <footer><span>{accountMap.has(item.id) ? `บัญชี ${accountMap.get(item.id)?.username || "Tenant Portal"}` : "ยังไม่มีบัญชี Tenant Portal"}</span><div className="portal-card-actions">{canEdit ? <button aria-label={`${accountMap.has(item.id) ? "จัดการ" : "เปิด"}บัญชี Tenant Portal ให้ ${item.full_name}`} className="portal-icon-button" onClick={() => setPortalTarget(item)} title={accountMap.has(item.id) ? "จัดการบัญชีผู้เช่า" : "เปิดบัญชีผู้เช่า"} type="button"><UserRoundCheck size={16} /></button> : null}{canEdit ? <EditButton label={item.full_name} onClick={() => setSelected(item)} /> : null}</div></footer>
    </article>)}</section> : <EmptyState title={items.length ? "ไม่พบผู้เช่าที่ค้นหา" : "ยังไม่มีผู้เช่า"} description={items.length ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ" : "เพิ่มผู้เช่าก่อนนำไปผูกกับห้องพักในสัญญาเช่า"} />}
    {selected ? <Modal title={editing ? "แก้ไขผู้เช่า" : "เพิ่มผู้เช่า"} description="ข้อมูลที่จำเป็นต่อการติดต่อและจัดทำสัญญา" onClose={() => setSelected(null)}>
      <PortalForm action={editing ? updateTenantAction : createTenantAction} organizationId={organizationId} validate={validateTenant} onSuccess={() => setSelected(null)} submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มผู้เช่า"}>
        {(errors, clear) => <>
          {editing ? <input name="tenantId" type="hidden" value={editing.id} /> : null}
          <Field label="ชื่อ-นามสกุล" name="fullName" required defaultValue={editing?.full_name} error={errors.fullName} clear={clear} />
          <div className="portal-form-grid"><Field label="โทรศัพท์" name="phone" defaultValue={editing?.phone} error={errors.phone} clear={clear} /><Field label="อีเมล" name="email" type="email" defaultValue={editing?.email} error={errors.email} clear={clear} /></div>
          <div className="portal-form-grid"><Field label="เลขบัตรประชาชน 4 ตัวท้าย" name="idCardLast4" defaultValue={editing?.id_card_last4} error={errors.idCardLast4} clear={clear} />{editing ? <SelectField label="สถานะ" name="status" defaultValue={editing.status} error={errors.status} clear={clear} options={[{ value: "active", label: "ใช้งาน" }, { value: "former", label: "ผู้เช่าเดิม" }, { value: "blocked", label: "ระงับ" }]} /> : null}</div>
          <Field label="ที่อยู่" name="address" defaultValue={editing?.address} error={errors.address} clear={clear} />
        </>}
      </PortalForm>
    </Modal> : null}
    {portalTarget ? <TenantPortalAccountModal organizationId={organizationId} tenant={portalTarget} account={accountMap.get(portalTarget.id)} onClose={() => setPortalTarget(null)} /> : null}
  </>;
}
