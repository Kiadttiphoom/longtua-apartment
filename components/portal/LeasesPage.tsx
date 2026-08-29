"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Home, UserRoundCheck, UsersRound } from "lucide-react";
import { createLeaseAction, updateLeaseAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import { EditButton, EmptyState, Field, Modal, PageHeader, PortalForm, SelectField, StatusBadge } from "@/components/portal/PortalUI";
import { TenantPortalAccountModal } from "@/components/portal/TenantPortalAccountModal";
import { money, thaiDate } from "@/lib/format";
import type { Lease, Property, Room, Tenant } from "@/components/portal/types";
import type { TenantPortalAccountSummary } from "@/lib/portal/tenant-accounts";
import { validateLease } from "@/lib/portal/validation.mjs";

type LeasePortalTarget = { lease: Lease; tenant: Tenant; room?: Room };

export function LeasesPage({ organizationId, leases, properties, rooms, tenants, portalAccounts, canCreate, canEdit, canManageTenantPortal }: {
  organizationId: string;
  leases: Lease[];
  properties: Property[];
  rooms: Room[];
  tenants: Tenant[];
  portalAccounts: TenantPortalAccountSummary[];
  canCreate: boolean;
  canEdit: boolean;
  canManageTenantPortal: boolean;
}) {
  const [selected, setSelected] = useState<Lease | "create" | null>(null);
  const [portalTarget, setPortalTarget] = useState<LeasePortalTarget | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const editing = selected && selected !== "create" ? selected : null;
  const propertyMap = useMemo(() => new Map(properties.map((item) => [item.id, item.name])), [properties]);
  const roomMap = useMemo(() => new Map(rooms.map((item) => [item.id, item])), [rooms]);
  const tenantById = useMemo(() => new Map(tenants.map((item) => [item.id, item])), [tenants]);
  const tenantMap = useMemo(() => new Map(tenants.map((item) => [item.id, item.full_name])), [tenants]);
  const portalAccountMap = useMemo(() => new Map(portalAccounts.map((account) => [account.tenantId, account])), [portalAccounts]);
  const availableRooms = rooms.filter((room) => room.status === "vacant" && (!propertyId || room.property_id === propertyId));
  const filtered = useMemo(() => { const keyword = query.trim().toLocaleLowerCase("th"); return leases.filter((item) => { const room = roomMap.get(item.room_id); return (status === "all" || item.status === status) && (!keyword || [item.lease_number, propertyMap.get(item.property_id), room?.room_number, tenantMap.get(item.primary_tenant_id)].some((value) => value?.toLocaleLowerCase("th").includes(keyword))); }); }, [leases, propertyMap, query, roomMap, status, tenantMap]);
  return <>
    <PageHeader title="สัญญาเช่า" description="จัดการเงื่อนไขสัญญา ผู้เช่า ห้องพัก เงินประกัน และช่วงเวลาเช่า" actionLabel={canCreate ? "สร้างสัญญา" : undefined} onAction={() => { setSelected("create"); setPropertyId(""); }} />
    <section className="portal-summary-strip"><div><strong>{leases.length.toLocaleString("th-TH")}</strong><span>สัญญาทั้งหมด</span></div><div><strong>{leases.filter((item) => item.status === "active").length.toLocaleString("th-TH")}</strong><span>กำลังใช้งาน</span></div><div><strong>{leases.filter((item) => item.status === "draft").length.toLocaleString("th-TH")}</strong><span>ฉบับร่าง</span></div></section>
    <CollectionToolbar title="รายการสัญญา" description={`พบ ${filtered.length.toLocaleString("th-TH")} ฉบับ`} query={query} onQueryChange={setQuery} placeholder="ค้นหาเลขสัญญา หอ ห้อง หรือผู้เช่า" filter={{ label: "กรองสถานะสัญญา", value: status, onChange: setStatus, options: [{ value: "all", label: "ทุกสถานะ" }, { value: "active", label: "ใช้งาน" }, { value: "draft", label: "ฉบับร่าง" }, { value: "ended", label: "สิ้นสุด" }, { value: "cancelled", label: "ยกเลิก" }] }} />
    {filtered.length ? <section className="portal-collection-grid">{filtered.map((item) => { const room = roomMap.get(item.room_id); const tenant = tenantById.get(item.primary_tenant_id); const account = portalAccountMap.get(item.primary_tenant_id); return <article className="portal-record-card" key={item.id}><header><span className="portal-record-icon"><CalendarRange aria-hidden="true" size={20} /></span><div><h2>{item.lease_number}</h2><small>{propertyMap.get(item.property_id) ?? "ไม่พบหอพัก"}</small></div><StatusBadge status={item.status} /></header><div className="portal-record-highlight"><Home aria-hidden="true" size={17} /><div><small>ห้องพัก</small><strong>ห้อง {room?.room_number ?? "—"}</strong></div><span>{money(Number(item.rent_amount))}/เดือน</span></div><dl className="portal-record-metrics"><div><dt>ผู้เช่า</dt><dd>{tenant?.full_name ?? "—"}</dd></div><div><dt>ผู้พัก</dt><dd><UsersRound aria-hidden="true" size={14} /> {item.occupant_count} คน</dd></div><div className="wide"><dt>ระยะเวลาสัญญา</dt><dd>{thaiDate(item.start_date)} – {thaiDate(item.end_date)}</dd></div></dl><footer><span>{account ? `บัญชี ${account.username || "Tenant Portal"}` : `เงินประกัน ${money(Number(item.deposit_amount))}`}</span><div className="portal-card-actions">{tenant && canManageTenantPortal && ["draft", "active"].includes(item.status) ? <button aria-label={`${account ? "จัดการ" : "สร้าง"}บัญชีเข้าใช้ให้ ${tenant.full_name}`} className="portal-room-account-action" onClick={() => setPortalTarget({ lease: item, tenant, room })} type="button"><UserRoundCheck size={15} /><span>{account ? "จัดการบัญชี" : "สร้างบัญชี"}</span></button> : null}{canEdit ? <EditButton label={item.lease_number} onClick={() => setSelected(item)} /> : null}</div></footer></article>; })}</section> : <EmptyState title={leases.length ? "ไม่พบสัญญาที่ค้นหา" : "ยังไม่มีสัญญาเช่า"} description={leases.length ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ" : "ต้องมีห้องว่างและข้อมูลผู้เช่าก่อนจึงจะสร้างสัญญาได้"} />}
    {selected ? <Modal title={editing ? `แก้ไขสัญญา ${editing.lease_number}` : "สร้างสัญญาเช่า"} description={editing ? "การเปลี่ยนห้องหรือผู้เช่าควรปิดสัญญาเดิมแล้วสร้างสัญญาใหม่" : "เลือกห้องว่างและผู้เช่า พร้อมระบุเงื่อนไขทางการเงิน"} onClose={() => setSelected(null)}>
      <PortalForm action={editing ? updateLeaseAction : createLeaseAction} organizationId={organizationId} validate={validateLease} onSuccess={() => setSelected(null)} submitLabel={editing ? "บันทึกการแก้ไข" : "สร้างสัญญา"}>
        {(errors, clear) => <>
          {editing ? <><input name="leaseId" type="hidden" value={editing.id} /><input name="propertyId" type="hidden" value={editing.property_id} /><input name="roomId" type="hidden" value={editing.room_id} /><input name="tenantId" type="hidden" value={editing.primary_tenant_id} /><div className="portal-readonly-grid"><div><span>หอ/ห้อง</span><strong>{propertyMap.get(editing.property_id)} / {roomMap.get(editing.room_id)?.room_number}</strong></div><div><span>ผู้เช่า</span><strong>{tenantMap.get(editing.primary_tenant_id)}</strong></div></div></> : <><SelectField label="หอพัก" name="propertyId" required error={errors.propertyId} clear={clear} options={properties.map((item) => ({ value: item.id, label: item.name }))} onChange={setPropertyId} /><div className="portal-form-grid"><SelectField label="ห้องพัก" name="roomId" required error={errors.roomId} clear={clear} options={availableRooms.map((item) => ({ value: item.id, label: `ห้อง ${item.room_number}` }))} /><SelectField label="ผู้เช่า" name="tenantId" required error={errors.tenantId} clear={clear} options={tenants.filter((item) => item.status === "active").map((item) => ({ value: item.id, label: item.full_name }))} /></div></>}
          <Field label="เลขที่สัญญา" name="leaseNumber" required defaultValue={editing?.lease_number} error={errors.leaseNumber} clear={clear} />
          <div className="portal-form-grid"><Field label="วันเริ่มสัญญา" name="startDate" required type="date" defaultValue={editing?.start_date} error={errors.startDate} clear={clear} /><Field label="วันสิ้นสุด" name="endDate" type="date" defaultValue={editing?.end_date} error={errors.endDate} clear={clear} /></div>
          <Field label="จำนวนผู้พัก" name="occupantCount" required type="number" min={1} max={50} step="1" defaultValue={editing?.occupant_count ?? 1} error={errors.occupantCount} clear={clear} />
          <div className="portal-form-grid portal-form-grid-three"><Field label="ค่าเช่าต่อเดือน" name="rentAmount" required type="number" min={0} step="0.01" defaultValue={editing?.rent_amount} error={errors.rentAmount} clear={clear} /><Field label="เงินประกัน" name="depositAmount" required type="number" min={0} step="0.01" defaultValue={editing?.deposit_amount ?? 0} error={errors.depositAmount} clear={clear} /><Field label="ค่าเช่าล่วงหน้า" name="advanceAmount" required type="number" min={0} step="0.01" defaultValue={editing?.advance_amount ?? 0} error={errors.advanceAmount} clear={clear} /></div>
          <Field label="เงื่อนไขเพิ่มเติม" name="terms" defaultValue={editing?.terms} error={errors.terms} clear={clear} />
          {editing ? <SelectField label="สถานะสัญญา" name="status" defaultValue={editing.status} error={errors.status} clear={clear} options={[{ value: "draft", label: "ฉบับร่าง" }, { value: "active", label: "ใช้งาน" }, { value: "ended", label: "สิ้นสุด" }, { value: "cancelled", label: "ยกเลิก" }]} /> : null}
        </>}
      </PortalForm>
    </Modal> : null}
    {portalTarget ? <TenantPortalAccountModal organizationId={organizationId} tenant={portalTarget.tenant} account={portalAccountMap.get(portalTarget.tenant.id)} roomNumber={portalTarget.room?.room_number} onClose={() => setPortalTarget(null)} /> : null}
  </>;
}
