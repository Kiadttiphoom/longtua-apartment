"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, DoorOpen, LayoutGrid, ListFilter, MapPin, Pencil, Phone, Search, Trash2 } from "lucide-react";
import { createPropertyAction, deletePropertyAction, updatePropertyAction } from "@/app/(portal)/resource-actions";
import {
  DataTable,
  DeleteConfirmation,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  PortalForm,
  SelectField,
  StatusBadge,
} from "@/components/portal/PortalUI";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import type { Property, Room } from "@/components/portal/types";
import { validateDormitory } from "@/lib/portal/validation.mjs";

export function DormitoriesPage({
  organizationId,
  items,
  rooms,
  canCreate,
  canEdit,
  canDelete,
}: {
  organizationId: string;
  items: Property[];
  rooms: Room[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Property | "create" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const editing = selected && selected !== "create" ? selected : null;

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("th-TH");
    return items.filter(
      (item) =>
        (status === "all" || item.status === status) &&
        (!needle ||
          `${item.name} ${item.address} ${item.phone ?? ""}`
            .toLocaleLowerCase("th-TH")
            .includes(needle))
    );
  }, [items, query, status]);

  return (
    <>
      <PageHeader
        actionLabel={canCreate ? "เพิ่มหอพัก" : undefined}
        description="จัดการข้อมูลอาคาร ที่อยู่ ช่องทางติดต่อ และสถานะการใช้งาน"
        onAction={() => setSelected("create")}
        title="หอพัก"
      />

      <section className="portal-summary-strip">
        <div>
          <strong>{items.length.toLocaleString("th-TH")}</strong>
          <span>หอพักทั้งหมด</span>
        </div>
        <div>
          <strong>
            {items.filter((item) => item.status === "active").length.toLocaleString("th-TH")}
          </strong>
          <span>กำลังใช้งาน</span>
        </div>
        <div>
          <strong>{rooms.length.toLocaleString("th-TH")}</strong>
          <span>ห้องพักรวม</span>
        </div>
      </section>

      {items.length ? (
        <>
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
            description={`แสดง ${visibleItems.length.toLocaleString("th-TH")} จาก ${items.length.toLocaleString("th-TH")} หอพัก`}
            filter={{
              label: "กรองสถานะหอพัก",
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "ทุกสถานะ" },
                { value: "active", label: "กำลังใช้งาน" },
                { value: "inactive", label: "ไม่ใช้งาน" },
              ],
            }}
            onQueryChange={setQuery}
            placeholder="ค้นหาชื่อหอ ที่อยู่ หรือเบอร์โทร"
            query={query}
            title="ค้นหาหอพัก"
          />

          {visibleItems.length ? (
            viewMode === "table" ? (
              <div className="portal-table-wrap">
                <DataTable
                  headers={[
                    "หอพัก / อาคาร",
                    "ที่อยู่ / เบอร์โทร",
                    "จำนวนห้องพัก",
                    "สถานะ",
                    "การจัดการ",
                  ]}
                  rows={visibleItems.map((item) => {
                    const propertyRooms = rooms.filter((room) => room.property_id === item.id);
                    const vacantRooms = propertyRooms.filter((room) => room.status === "vacant").length;
                    const occupiedRooms = propertyRooms.filter((room) => room.status === "occupied").length;

                    return [
                      <div className="portal-dormitory-table-cell" key="prop">
                        <span className="portal-dormitory-icon-pill">
                          <Building2 size={16} />
                        </span>
                        <div>
                          <strong>{item.name}</strong>
                        </div>
                      </div>,
                      <div className="portal-dormitory-contact-cell" key="contact">
                        <span>{item.address || "—"}</span>
                        <small>{item.phone ? `โทร. ${item.phone}` : "ไม่มีเบอร์โทร"}</small>
                      </div>,
                      <div className="portal-dormitory-stats-cell" key="rooms">
                        <strong>{propertyRooms.length} ห้อง</strong>
                        <small>
                          (ว่าง {vacantRooms} · มีผู้เช่า {occupiedRooms})
                        </small>
                      </div>,
                      <StatusBadge key="status" status={item.status} />,
                      <div className="portal-table-actions" key="actions">
                        <button
                          className="portal-table-action-btn view"
                          onClick={() => router.push(`/guestrooms`)}
                          title="ดูห้องพักในหอพักนี้"
                          type="button"
                        >
                          <DoorOpen size={14} />
                          <span>ห้องพัก</span>
                        </button>
                        {canEdit ? (
                          <button
                            className="portal-table-action-btn edit"
                            onClick={() => setSelected(item)}
                            title="แก้ไขหอพัก"
                            type="button"
                          >
                            <Pencil size={14} />
                            <span>แก้ไข</span>
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            aria-label={`ลบ ${item.name}`}
                            className="portal-table-action-btn delete"
                            onClick={() => setDeleteTarget(item)}
                            title="ลบหอพัก"
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : null}
                      </div>,
                    ];
                  })}
                />
              </div>
            ) : (
              <div className="portal-dormitory-grid">
                {visibleItems.map((item) => {
                  const propertyRooms = rooms.filter((room) => room.property_id === item.id);
                  const vacantRooms = propertyRooms.filter((room) => room.status === "vacant").length;
                  const occupiedRooms = propertyRooms.filter((room) => room.status === "occupied").length;

                  return (
                    <article className="portal-dormitory-card" key={item.id}>
                      <header>
                        <span>
                          <Building2 aria-hidden="true" size={20} />
                        </span>
                        <div>
                          <h2>{item.name}</h2>
                          <StatusBadge status={item.status} />
                        </div>
                      </header>

                      <div className="portal-dormitory-contact">
                        <p>
                          <MapPin aria-hidden="true" size={15} />
                          <span>{item.address || "ยังไม่ได้ระบุที่อยู่"}</span>
                        </p>
                        <p>
                          <Phone aria-hidden="true" size={15} />
                          <span>{item.phone || "ยังไม่ได้ระบุเบอร์โทรศัพท์"}</span>
                        </p>
                      </div>

                      <dl>
                        <div>
                          <dt>ห้องทั้งหมด</dt>
                          <dd>{propertyRooms.length}</dd>
                        </div>
                        <div>
                          <dt>ห้องว่าง</dt>
                          <dd style={{ color: "#1d4ed8" }}>{vacantRooms}</dd>
                        </div>
                        <div>
                          <dt>มีผู้เช่า</dt>
                          <dd style={{ color: "#0d9488" }}>{occupiedRooms}</dd>
                        </div>
                      </dl>

                      <footer className="portal-dormitory-card-footer">
                        <div className="portal-lease-card-actions-grid">
                          <button
                            className="portal-lease-card-btn view"
                            onClick={() => router.push(`/guestrooms`)}
                            title="ดูห้องพัก"
                            type="button"
                          >
                            <DoorOpen size={15} />
                            <span>ดูห้องพัก ({propertyRooms.length})</span>
                          </button>
                          {canEdit ? (
                            <button
                              className="portal-lease-card-btn edit"
                              onClick={() => setSelected(item)}
                              title="แก้ไขหอพัก"
                              type="button"
                            >
                              <Pencil size={15} />
                              <span>แก้ไขข้อมูล</span>
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              className="portal-lease-card-btn delete"
                              onClick={() => setDeleteTarget(item)}
                              style={{ gridColumn: canEdit ? "span 2" : undefined }}
                              title="ลบหอพัก"
                              type="button"
                            >
                              <Trash2 size={15} />
                              <span>ลบหอพัก</span>
                            </button>
                          ) : null}
                        </div>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )
          ) : (
            <EmptyState
              description="ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ"
              title="ไม่พบหอพักที่ค้นหา"
            />
          )}
        </>
      ) : (
        <EmptyState
          description="เพิ่มหอพักแรก แล้วจึงสร้างห้องพักและตั้งค่าอัตราค่าน้ำค่าไฟ"
          title="ยังไม่มีหอพัก"
        />
      )}

      {selected ? (
        <Modal
          description={
            editing
              ? `ปรับปรุงข้อมูล ${editing.name}`
              : "กรอกข้อมูลหลักของหอพัก ระบบจะสร้างการตั้งค่าเริ่มต้นให้ทันที"
          }
          onClose={() => setSelected(null)}
          title={editing ? "แก้ไขหอพัก" : "เพิ่มหอพัก"}
        >
          <PortalForm
            action={editing ? updatePropertyAction : createPropertyAction}
            onSuccess={() => setSelected(null)}
            organizationId={organizationId}
            submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มหอพัก"}
            validate={validateDormitory}
          >
            {(errors, clear) => (
              <>
                {editing ? <input name="propertyId" type="hidden" value={editing.id} /> : null}
                <Field
                  clear={clear}
                  defaultValue={editing?.name}
                  error={errors.name}
                  label="ชื่อหอพัก"
                  name="name"
                  placeholder="เช่น ลองตัว เรสซิเดนซ์"
                  required
                />
                <Field
                  clear={clear}
                  defaultValue={editing?.address}
                  error={errors.address}
                  label="ที่อยู่"
                  name="address"
                  placeholder="บ้านเลขที่ ถนน ตำบล/แขวง จังหวัด"
                />
                <div className="portal-form-grid">
                  <Field
                    clear={clear}
                    defaultValue={editing?.phone}
                    error={errors.phone}
                    label="โทรศัพท์"
                    name="phone"
                    placeholder="08x-xxx-xxxx"
                  />
                  {editing ? (
                    <SelectField
                      clear={clear}
                      defaultValue={editing.status}
                      error={errors.status}
                      label="สถานะ"
                      name="status"
                      options={[
                        { value: "active", label: "ใช้งาน" },
                        { value: "inactive", label: "ไม่ใช้งาน" },
                      ]}
                    />
                  ) : null}
                </div>
              </>
            )}
          </PortalForm>
        </Modal>
      ) : null}

      {deleteTarget ? (
        <DeleteConfirmation
          action={deletePropertyAction}
          detail="ห้องพัก มิเตอร์ และการตั้งค่าที่ยังไม่มีประวัติจะถูกลบด้วย หากมีสัญญา ใบแจ้งหนี้ การรับชำระ หรือประวัติมิเตอร์ ระบบจะไม่อนุญาตให้ลบ"
          entityField="propertyId"
          entityId={deleteTarget.id}
          onClose={() => setDeleteTarget(null)}
          organizationId={organizationId}
          subject={`กำลังจะลบ “${deleteTarget.name}”`}
          submitLabel="ยืนยันลบหอพัก"
          title={`ลบหอพัก ${deleteTarget.name}?`}
        />
      ) : null}
    </>
  );
}
