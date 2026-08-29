"use client";

import { useMemo, useState } from "react";
import { Building2, MapPin, Phone, Search } from "lucide-react";
import { createPropertyAction, deletePropertyAction, updatePropertyAction } from "@/app/(portal)/resource-actions";
import { DeleteButton, DeleteConfirmation, EditButton, EmptyState, Field, Modal, PageHeader, PortalForm, SelectField, StatusBadge } from "@/components/portal/PortalUI";
import { SelectControl } from "@/components/ui/SelectControl";
import type { Property, Room } from "@/components/portal/types";
import { validateDormitory } from "@/lib/portal/validation.mjs";

export function DormitoriesPage({ organizationId, items, rooms, canCreate, canEdit, canDelete }: { organizationId: string; items: Property[]; rooms: Room[]; canCreate: boolean; canEdit: boolean; canDelete: boolean }) {
  const [selected, setSelected] = useState<Property | "create" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const editing = selected && selected !== "create" ? selected : null;
  const visibleItems = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("th-TH");
    return items.filter((item) => (status === "all" || item.status === status)
      && (!needle || `${item.name} ${item.address} ${item.phone ?? ""}`.toLocaleLowerCase("th-TH").includes(needle)));
  }, [items, query, status]);
  return <>
    <PageHeader title="หอพัก" description="จัดการข้อมูลอาคาร ที่อยู่ ช่องทางติดต่อ และสถานะการใช้งาน" actionLabel={canCreate ? "เพิ่มหอพัก" : undefined} onAction={() => setSelected("create")} />
    <section className="portal-summary-strip"><div><strong>{items.length}</strong><span>หอพักทั้งหมด</span></div><div><strong>{items.filter((item) => item.status === "active").length}</strong><span>กำลังใช้งาน</span></div><div><strong>{rooms.length}</strong><span>ห้องพักรวม</span></div></section>
    {items.length ? <><div className="portal-room-toolbar portal-dormitory-toolbar"><div><strong>ค้นหาหอพัก</strong><span>แสดง {visibleItems.length} จาก {items.length} หอพัก</span></div><label className="portal-room-search"><Search aria-hidden="true" size={17} /><input aria-label="ค้นหาชื่อหอ ที่อยู่ หรือเบอร์โทร" onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อหอ ที่อยู่ หรือเบอร์โทร" type="search" value={query} /></label><SelectControl ariaLabel="กรองสถานะหอพัก" onValueChange={setStatus} options={[{ value: "all", label: "ทุกสถานะ" }, { value: "active", label: "กำลังใช้งาน" }, { value: "inactive", label: "ไม่ใช้งาน" }]} value={status} /></div>{visibleItems.length ? <div className="portal-dormitory-grid">{visibleItems.map((item) => {
      const propertyRooms = rooms.filter((room) => room.property_id === item.id);
      const vacantRooms = propertyRooms.filter((room) => room.status === "vacant").length;
      const occupiedRooms = propertyRooms.filter((room) => room.status === "occupied").length;
      return <article className="portal-dormitory-card" key={item.id}>
        <header><span><Building2 aria-hidden="true" size={22} /></span><div><h2>{item.name}</h2><StatusBadge status={item.status} /></div><div className="portal-card-actions">{canEdit ? <EditButton label={item.name} onClick={() => setSelected(item)} /> : null}{canDelete ? <DeleteButton label={item.name} onClick={() => setDeleteTarget(item)} /> : null}</div></header>
        <div className="portal-dormitory-contact"><p><MapPin aria-hidden="true" size={16} /><span>{item.address || "ยังไม่ได้ระบุที่อยู่"}</span></p><p><Phone aria-hidden="true" size={16} /><span>{item.phone || "ยังไม่ได้ระบุเบอร์โทรศัพท์"}</span></p></div>
        <dl><div><dt>ห้องทั้งหมด</dt><dd>{propertyRooms.length}</dd></div><div><dt>ห้องว่าง</dt><dd>{vacantRooms}</dd></div><div><dt>มีผู้เช่า</dt><dd>{occupiedRooms}</dd></div></dl>
      </article>;
    })}</div> : <EmptyState title="ไม่พบหอพักที่ค้นหา" description="ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ" />}</> : <EmptyState title="ยังไม่มีหอพัก" description="เพิ่มหอพักแรก แล้วจึงสร้างห้องพักและตั้งค่าอัตราค่าน้ำค่าไฟ" />}
    {selected ? <Modal title={editing ? "แก้ไขหอพัก" : "เพิ่มหอพัก"} description={editing ? `ปรับปรุงข้อมูล ${editing.name}` : "กรอกข้อมูลหลักของหอพัก ระบบจะสร้างการตั้งค่าเริ่มต้นให้ทันที"} onClose={() => setSelected(null)}>
      <PortalForm action={editing ? updatePropertyAction : createPropertyAction} organizationId={organizationId} validate={validateDormitory} onSuccess={() => setSelected(null)} submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มหอพัก"}>
        {(errors, clear) => <>
          {editing ? <input name="propertyId" type="hidden" value={editing.id} /> : null}
          <Field label="ชื่อหอพัก" name="name" required defaultValue={editing?.name} error={errors.name} clear={clear} placeholder="เช่น ลองตัว เรสซิเดนซ์" />
          <Field label="ที่อยู่" name="address" defaultValue={editing?.address} error={errors.address} clear={clear} placeholder="บ้านเลขที่ ถนน ตำบล/แขวง จังหวัด" />
          <div className="portal-form-grid">
            <Field label="โทรศัพท์" name="phone" defaultValue={editing?.phone} error={errors.phone} clear={clear} placeholder="08x-xxx-xxxx" />
            {editing ? <SelectField label="สถานะ" name="status" defaultValue={editing.status} error={errors.status} clear={clear} options={[{ value: "active", label: "ใช้งาน" }, { value: "inactive", label: "ไม่ใช้งาน" }]} /> : null}
          </div>
        </>}
      </PortalForm>
    </Modal> : null}
    {deleteTarget ? <DeleteConfirmation action={deletePropertyAction} organizationId={organizationId} entityId={deleteTarget.id} entityField="propertyId" title={`ลบหอพัก ${deleteTarget.name}?`} subject={`กำลังจะลบ “${deleteTarget.name}”`} detail="ห้องพัก มิเตอร์ และการตั้งค่าที่ยังไม่มีประวัติจะถูกลบด้วย หากมีสัญญา ใบแจ้งหนี้ การรับชำระ หรือประวัติมิเตอร์ ระบบจะไม่อนุญาตให้ลบ" submitLabel="ยืนยันลบหอพัก" onClose={() => setDeleteTarget(null)} /> : null}
  </>;
}
