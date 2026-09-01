"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, FilePlus, FileText, LayoutGrid, ListFilter, Pencil, Search, Trash2, UserRound, UserRoundCheck } from "lucide-react";
import { createRoomAction, deleteRoomAction, updateRoomAction } from "@/app/(portal)/resource-actions";
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
  type FieldErrors,
} from "@/components/portal/PortalUI";
import { TenantPortalAccountModal } from "@/components/portal/TenantPortalAccountModal";
import { SelectControl } from "@/components/ui/SelectControl";
import { money } from "@/lib/format";
import type { Lease, Property, Room, Tenant } from "@/components/portal/types";
import { buildRoomNumberRange } from "@/lib/rooms/room-number-range.mjs";
import { validateGuestroom } from "@/lib/portal/validation.mjs";
import type { TenantPortalAccountSummary } from "@/lib/portal/tenant-accounts";

const NO_FLOOR = "__no_floor__";
const floorKey = (room: Room) => room.floor?.trim() || NO_FLOOR;
const floorLabel = (value: string) => (value === NO_FLOOR ? "ไม่ระบุชั้น" : `ชั้น ${value}`);

type PortalTarget = { room: Room; tenant: Tenant };

export function GuestroomsPage({
  organizationId,
  items,
  properties,
  leases,
  tenants,
  portalAccounts,
  canCreate,
  canEdit,
  canDelete,
  canManageTenantPortal,
}: {
  organizationId: string;
  items: Room[];
  properties: Property[];
  leases: Lease[];
  tenants: Tenant[];
  portalAccounts: TenantPortalAccountSummary[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageTenantPortal: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Room | "create" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [portalTarget, setPortalTarget] = useState<PortalTarget | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activePropertyId, setActivePropertyId] = useState(properties[0]?.id ?? "");
  const [formPropertyId, setFormPropertyId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [floor, setFloor] = useState("all");
  const [prefix, setPrefix] = useState("");
  const [start, setStart] = useState("101");
  const [end, setEnd] = useState("110");
  const [padding, setPadding] = useState("0");

  const editing = selected && selected !== "create" ? selected : null;
  const propertyMap = useMemo(() => new Map(properties.map((item) => [item.id, item.name])), [properties]);
  const tenantMap = useMemo(() => new Map(tenants.map((item) => [item.id, item])), [tenants]);

  const activeLeaseMap = useMemo(() => {
    const result = new Map<string, Lease>();
    for (const lease of leases) {
      if (lease.status === "active" && !result.has(lease.room_id)) {
        result.set(lease.room_id, lease);
      }
    }
    return result;
  }, [leases]);

  const portalAccountMap = useMemo(
    () => new Map(portalAccounts.map((account) => [account.tenantId, account])),
    [portalAccounts]
  );

  const activeProperty = properties.find((item) => item.id === activePropertyId) ?? properties[0];
  const resolvedPropertyId = activeProperty?.id ?? "";

  const propertyStats = useMemo(() => {
    const stats = new Map(properties.map((item) => [item.id, { total: 0, vacant: 0, occupied: 0 }]));
    for (const room of items) {
      const value = stats.get(room.property_id);
      if (!value) continue;
      value.total += 1;
      if (room.status === "vacant") value.vacant += 1;
      if (room.status === "occupied") value.occupied += 1;
    }
    return stats;
  }, [items, properties]);

  const activeRooms = useMemo(
    () =>
      items
        .filter((room) => room.property_id === resolvedPropertyId)
        .sort((left, right) =>
          left.room_number.localeCompare(right.room_number, "th", { numeric: true, sensitivity: "base" })
        ),
    [items, resolvedPropertyId]
  );

  const floorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const room of activeRooms) {
      counts.set(floorKey(room), (counts.get(floorKey(room)) ?? 0) + 1);
    }
    return Array.from(counts, ([value, count]) => ({ value, count, label: floorLabel(value) })).sort(
      (left, right) => {
        if (left.value === NO_FLOOR) return 1;
        if (right.value === NO_FLOOR) return -1;
        return left.value.localeCompare(right.value, "th", { numeric: true, sensitivity: "base" });
      }
    );
  }, [activeRooms]);

  const visibleRooms = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("th-TH");
    return activeRooms.filter(
      (room) =>
        (floor === "all" || floorKey(room) === floor) &&
        (status === "all" || room.status === status) &&
        (!needle || `${room.room_number} ${room.floor ?? ""}`.toLocaleLowerCase("th-TH").includes(needle))
    );
  }, [activeRooms, floor, query, status]);

  const visibleFloorGroups = useMemo(
    () =>
      floorOptions
        .filter((option) => floor === "all" || option.value === floor)
        .map((option) => ({
          ...option,
          rooms: visibleRooms.filter((room) => floorKey(room) === option.value),
        }))
        .filter((group) => group.rooms.length > 0),
    [floor, floorOptions, visibleRooms]
  );

  const selectedFloorTotal =
    floor === "all" ? activeRooms.length : floorOptions.find((option) => option.value === floor)?.count ?? 0;
  const activeStats = propertyStats.get(resolvedPropertyId) ?? { total: 0, vacant: 0, occupied: 0 };
  const generated = useMemo(
    () => buildRoomNumberRange({ prefix, start, end, padding: Number(padding) }),
    [prefix, start, end, padding]
  );
  const existing = useMemo(
    () => new Set(items.filter((room) => room.property_id === formPropertyId).map((room) => room.room_number)),
    [items, formPropertyId]
  );
  const duplicateCount = generated.roomNumbers.filter((roomNumber: string) => existing.has(roomNumber)).length;

  return (
    <>
      <PageHeader
        actionLabel={
          canCreate ? (properties.length ? "เพิ่มห้องพัก" : "เพิ่มหอพัก") : undefined
        }
        description="เลือกหอพักเพื่อดู ค้นหา และจัดการห้องของแต่ละอาคารแยกจากกัน"
        onAction={() => {
          if (!properties.length) {
            router.push("/dormitories");
            return;
          }
          setFormPropertyId(resolvedPropertyId);
          setSelected("create");
        }}
        title="ห้องพัก"
      />

      {properties.length ? (
        <>
          <section aria-label="เลือกหอพัก" className="portal-property-switcher">
            <header>
              <div>
                <strong>เลือกหอพัก</strong>
                <span>แสดงห้องเฉพาะอาคารที่เลือก</span>
              </div>
              <small>
                {properties.length} หอพัก · {items.length} ห้องทั้งหมด
              </small>
            </header>
            <div aria-label="รายชื่อหอพัก" role="tablist">
              {properties.map((property) => {
                const stats = propertyStats.get(property.id) ?? { total: 0, vacant: 0, occupied: 0 };
                const active = property.id === resolvedPropertyId;
                return (
                  <button
                    aria-controls="guestrooms-property-panel"
                    aria-selected={active}
                    className={active ? "active" : ""}
                    key={property.id}
                    onClick={() => {
                      setActivePropertyId(property.id);
                      setQuery("");
                      setStatus("all");
                      setFloor("all");
                    }}
                    role="tab"
                    type="button"
                  >
                    <span>
                      <Building2 size={19} />
                    </span>
                    <div>
                      <strong>{property.name}</strong>
                      <small>
                        {stats.total} ห้อง · ว่าง {stats.vacant}
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section
            aria-label={`ห้องพัก ${activeProperty?.name ?? ""}`}
            id="guestrooms-property-panel"
            role="tabpanel"
          >
            <nav aria-label="เลือกชั้น" className="portal-floor-switcher">
              <span>เลือกชั้น</span>
              <div role="tablist">
                <button
                  aria-controls="guestrooms-floor-content"
                  aria-selected={floor === "all"}
                  className={floor === "all" ? "active" : ""}
                  onClick={() => setFloor("all")}
                  role="tab"
                  type="button"
                >
                  ทุกชั้น <small>{activeRooms.length}</small>
                </button>
                {floorOptions.map((option) => (
                  <button
                    aria-controls="guestrooms-floor-content"
                    aria-selected={floor === option.value}
                    className={floor === option.value ? "active" : ""}
                    key={option.value}
                    onClick={() => setFloor(option.value)}
                    role="tab"
                    type="button"
                  >
                    {option.label} <small>{option.count}</small>
                  </button>
                ))}
              </div>
            </nav>

            <div className="portal-room-toolbar">
              <div>
                <strong>{activeProperty?.name}</strong>
                <span>
                  แสดง {visibleRooms.length} จาก {selectedFloorTotal} ห้อง
                </span>
              </div>
              <label className="portal-room-search">
                <Search aria-hidden="true" size={17} />
                <input
                  aria-label="ค้นหาหมายเลขห้องหรือชั้น"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ค้นหาห้องหรือชั้น"
                  type="search"
                  value={query}
                />
              </label>
              <SelectControl
                ariaLabel="กรองสถานะห้อง"
                onValueChange={setStatus}
                options={[
                  { value: "all", label: "ทุกสถานะ" },
                  { value: "vacant", label: "ห้องว่าง" },
                  { value: "occupied", label: "มีผู้เช่า" },
                  { value: "maintenance", label: "ซ่อมบำรุง" },
                  { value: "inactive", label: "ไม่ใช้งาน" },
                ]}
                value={status}
              />
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
            </div>

            <section className="portal-summary-strip">
              <div>
                <strong>{activeStats.total}</strong>
                <span>ห้องในหอนี้</span>
              </div>
              <div>
                <strong>{activeStats.vacant}</strong>
                <span>ห้องว่าง</span>
              </div>
              <div>
                <strong>{activeStats.occupied}</strong>
                <span>มีผู้เช่า</span>
              </div>
            </section>

            <div id="guestrooms-floor-content">
              {visibleRooms.length ? (
                viewMode === "table" ? (
                  <div className="portal-table-wrap">
                    <DataTable
                      headers={[
                        "หมายเลขห้อง",
                        "ชั้น",
                        "ค่าเช่า / เดือน",
                        "สถานะ",
                        "ผู้เช่าปัจจุบัน",
                        "การจัดการ",
                      ]}
                      rows={visibleRooms.map((item) => {
                        const activeLease = activeLeaseMap.get(item.id);
                        const tenant = activeLease ? tenantMap.get(activeLease.primary_tenant_id) : undefined;
                        const portalAccount = tenant ? portalAccountMap.get(tenant.id) : undefined;

                        return [
                          <div className="portal-room-number-pill" key="room">
                            <strong>{item.room_number}</strong>
                          </div>,
                          <span key="floor">{item.floor ? `ชั้น ${item.floor}` : "ไม่ระบุ"}</span>,
                          <strong key="rent">{money(Number(item.base_rent))}/ด.</strong>,
                          <StatusBadge key="status" status={item.status} />,
                          <div className="portal-room-tenant-cell" key="tenant">
                            {tenant ? (
                              <>
                                <strong>{tenant.full_name}</strong>
                                <small>
                                  {portalAccount ? `บัญชี: ${portalAccount.username}` : "ยังไม่มีบัญชีเข้าใช้"}
                                </small>
                              </>
                            ) : (
                              <span style={{ color: "#94a3b8", fontSize: "12px" }}>— ว่าง —</span>
                            )}
                          </div>,
                          <div className="portal-table-actions" key="actions">
                            {item.status === "vacant" ? (
                              <button
                                className="portal-table-action-btn view"
                                onClick={() => router.push(`/leases`)}
                                title="ทำสัญญาเช่าใหม่"
                                type="button"
                              >
                                <FilePlus size={14} />
                                <span>ทำสัญญา</span>
                              </button>
                            ) : null}
                            {tenant && canManageTenantPortal ? (
                              <button
                                className="portal-table-action-btn account"
                                onClick={() => setPortalTarget({ room: item, tenant })}
                                title={portalAccount ? "จัดการบัญชีผู้เช่า" : "สร้างบัญชีผู้เช่า"}
                                type="button"
                              >
                                <UserRoundCheck size={14} />
                              </button>
                            ) : null}
                            {canEdit ? (
                              <button
                                className="portal-table-action-btn edit"
                                onClick={() => setSelected(item)}
                                title="แก้ไขข้อมูลห้อง"
                                type="button"
                              >
                                <Pencil size={14} />
                              </button>
                            ) : null}
                            {canDelete && !activeLease ? (
                              <button
                                aria-label={`ลบห้อง ${item.room_number}`}
                                className="portal-table-action-btn delete"
                                onClick={() => setDeleteTarget(item)}
                                title="ลบห้องพัก"
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
                  visibleFloorGroups.map((group) => (
                    <section className="portal-room-floor-section" key={group.value}>
                      <header>
                        <h2>{group.label}</h2>
                        <span>{group.rooms.length} ห้อง</span>
                      </header>
                      <div className="portal-room-grid">
                        {group.rooms.map((item) => {
                          const activeLease = activeLeaseMap.get(item.id);
                          const tenant = activeLease ? tenantMap.get(activeLease.primary_tenant_id) : undefined;
                          const portalAccount = tenant ? portalAccountMap.get(tenant.id) : undefined;
                          const hasPortalAccount = Boolean(portalAccount);

                          return (
                            <article className="portal-room-card" data-status={item.status} key={item.id}>
                              <header>
                                <div>
                                  <span>ห้อง</span>
                                  <strong>{item.room_number}</strong>
                                </div>
                                <StatusBadge status={item.status} />
                              </header>

                              <dl>
                                <div>
                                  <dt>ชั้น</dt>
                                  <dd>{item.floor || "ไม่ระบุ"}</dd>
                                </div>
                                <div>
                                  <dt>ค่าเช่าต่อเดือน</dt>
                                  <dd>{money(Number(item.base_rent))}</dd>
                                </div>
                              </dl>

                              <div className="portal-room-tenant-strip">
                                {tenant ? (
                                  <div>
                                    <UserRound size={14} />
                                    <span>
                                      <strong>{tenant.full_name}</strong>
                                      <small>
                                        {hasPortalAccount
                                          ? ` · บัญชี: ${portalAccount?.username}`
                                          : " · ยังไม่มีบัญชีเข้าใช้"}
                                      </small>
                                    </span>
                                  </div>
                                ) : (
                                  <span className="vacant-note">ห้องว่าง พร้อมทำสัญญาเช่า</span>
                                )}
                              </div>

                              <footer className="portal-room-card-footer">
                                <div className="portal-lease-card-actions-grid">
                                  {item.status === "vacant" ? (
                                    <button
                                      className="portal-lease-card-btn view"
                                      onClick={() => router.push(`/leases`)}
                                      title="ทำสัญญาเช่า"
                                      type="button"
                                    >
                                      <FilePlus size={14} />
                                      <span>ทำสัญญา</span>
                                    </button>
                                  ) : (
                                    <button
                                      className="portal-lease-card-btn view"
                                      onClick={() => router.push(`/leases`)}
                                      title="ดูสัญญาเช่า"
                                      type="button"
                                    >
                                      <FileText size={14} />
                                      <span>ดูสัญญา</span>
                                    </button>
                                  )}

                                  {canEdit ? (
                                    <button
                                      className="portal-lease-card-btn edit"
                                      onClick={() => setSelected(item)}
                                      title="แก้ไขห้องพัก"
                                      type="button"
                                    >
                                      <Pencil size={14} />
                                      <span>แก้ไข</span>
                                    </button>
                                  ) : null}

                                  {tenant && canManageTenantPortal ? (
                                    <button
                                      className="portal-lease-card-btn account"
                                      onClick={() => setPortalTarget({ room: item, tenant })}
                                      style={{ gridColumn: !canDelete || activeLease ? "span 2" : undefined }}
                                      title={hasPortalAccount ? "จัดการบัญชีผู้เช่า" : "สร้างบัญชีผู้เช่า"}
                                      type="button"
                                    >
                                      <UserRoundCheck size={14} />
                                      <span>{hasPortalAccount ? "จัดการบัญชี" : "สร้างบัญชี"}</span>
                                    </button>
                                  ) : null}

                                  {canDelete && !activeLease ? (
                                    <button
                                      aria-label={`ลบห้อง ${item.room_number}`}
                                      className="portal-lease-card-btn delete"
                                      onClick={() => setDeleteTarget(item)}
                                      style={{ gridColumn: "span 2" }}
                                      title="ลบห้องพัก"
                                      type="button"
                                    >
                                      <Trash2 size={14} />
                                      <span>ลบห้องพัก</span>
                                    </button>
                                  ) : null}
                                </div>
                              </footer>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))
                )
              ) : (
                <EmptyState
                  description={
                    activeRooms.length
                      ? "ลองเปลี่ยนชั้น คำค้นหา หรือตัวกรองสถานะ"
                      : "กดเพิ่มห้องพักเพื่อสร้างห้องแบบช่วง เช่น 101–120"
                  }
                  title={activeRooms.length ? "ไม่พบห้องที่ค้นหา" : "หอนี้ยังไม่มีห้องพัก"}
                />
              )}
            </div>
          </section>
        </>
      ) : (
        <EmptyState
          description="เพิ่มหอพักก่อน แล้วจึงสร้างห้องแยกตามแต่ละอาคาร"
          title="ยังไม่มีหอพัก"
        />
      )}

      {selected ? (
        <Modal
          description={
            editing
              ? "ปรับหมายเลข ชั้น ค่าเช่า หรือสถานะห้อง"
              : "กำหนดช่วงหมายเลข ระบบจะสร้างมิเตอร์น้ำและไฟให้ทุกห้อง"
          }
          onClose={() => setSelected(null)}
          title={editing ? `แก้ไขห้อง ${editing.room_number}` : "เพิ่มห้องหลายห้อง"}
        >
          <PortalForm
            action={editing ? updateRoomAction : createRoomAction}
            onSuccess={() => setSelected(null)}
            organizationId={organizationId}
            submitLabel={
              editing
                ? "บันทึกการแก้ไข"
                : `เพิ่ม ${Math.max(0, generated.roomNumbers.length - duplicateCount)} ห้อง`
            }
            validate={(values) => {
              const errors = validateGuestroom(values) as unknown as FieldErrors;
              if (editing) {
                if (!String(values.roomNumber ?? "").trim()) {
                  errors.roomNumber = "กรุณากรอกหมายเลขห้อง";
                }
              } else {
                if (generated.error) errors.roomNumbers = generated.error;
                else if (generated.roomNumbers.length === duplicateCount) {
                  errors.roomNumbers = "หมายเลขห้องทั้งหมดมีอยู่แล้ว";
                }
              }
              return errors;
            }}
          >
            {(errors, clear) =>
              editing ? (
                <>
                  <input name="roomId" type="hidden" value={editing.id} />
                  <input name="propertyId" type="hidden" value={editing.property_id} />
                  <div className="portal-readonly">
                    <span>หอพัก</span>
                    <strong>{propertyMap.get(editing.property_id)}</strong>
                  </div>
                  <div className="portal-form-grid">
                    <Field
                      clear={clear}
                      defaultValue={editing.room_number}
                      error={errors.roomNumber}
                      label="หมายเลขห้อง"
                      name="roomNumber"
                      required
                    />
                    <Field
                      clear={clear}
                      defaultValue={editing.floor}
                      error={errors.floor}
                      label="ชั้น"
                      name="floor"
                    />
                  </div>
                  <div className="portal-form-grid">
                    <Field
                      clear={clear}
                      defaultValue={editing.base_rent}
                      error={errors.baseRent}
                      label="ค่าเช่าต่อเดือน"
                      min={0}
                      name="baseRent"
                      required
                      step="0.01"
                      type="number"
                    />
                    <SelectField
                      clear={clear}
                      defaultValue={editing.status}
                      error={errors.status}
                      label="สถานะ"
                      name="status"
                      options={[
                        { value: "vacant", label: "ว่าง" },
                        { value: "occupied", label: "มีผู้เช่า" },
                        { value: "maintenance", label: "ซ่อมบำรุง" },
                        { value: "inactive", label: "ไม่ใช้งาน" },
                      ]}
                    />
                  </div>
                </>
              ) : (
                <>
                  <SelectField
                    clear={clear}
                    error={errors.propertyId}
                    label="หอพัก"
                    name="propertyId"
                    onChange={(value) => setFormPropertyId(value)}
                    options={properties.map((item) => ({ value: item.id, label: item.name }))}
                    required
                    value={formPropertyId}
                  />
                  <div className="portal-form-grid">
                    <label className="portal-field">
                      <span>คำนำหน้า</span>
                      <input
                        onChange={(event) => {
                          setPrefix(event.target.value);
                          clear("roomNumbers");
                        }}
                        placeholder="เช่น A"
                        value={prefix}
                      />
                    </label>
                    <SelectField
                      clear={clear}
                      label="จำนวนหลัก"
                      name="padding"
                      onChange={(nextValue) => {
                        setPadding(nextValue);
                        clear("roomNumbers");
                      }}
                      options={[
                        { value: "0", label: "อัตโนมัติ" },
                        { value: "2", label: "2 หลัก (01)" },
                        { value: "3", label: "3 หลัก (001)" },
                        { value: "4", label: "4 หลัก (0001)" },
                      ]}
                      value={padding}
                    />
                  </div>
                  <div className="portal-form-grid">
                    <label className="portal-field">
                      <span>เลขเริ่มต้น *</span>
                      <input
                        aria-invalid={Boolean(errors.roomNumbers)}
                        min="0"
                        onChange={(event) => {
                          setStart(event.target.value);
                          clear("roomNumbers");
                        }}
                        type="number"
                        value={start}
                      />
                    </label>
                    <label className="portal-field">
                      <span>เลขสิ้นสุด *</span>
                      <input
                        aria-invalid={Boolean(errors.roomNumbers)}
                        min="0"
                        onChange={(event) => {
                          setEnd(event.target.value);
                          clear("roomNumbers");
                        }}
                        type="number"
                        value={end}
                      />
                    </label>
                  </div>
                  {errors.roomNumbers ? (
                    <small className="field-error">{errors.roomNumbers}</small>
                  ) : null}
                  <div className="portal-form-grid">
                    <Field clear={clear} error={errors.floor} label="ชั้น" name="floor" />
                    <Field
                      clear={clear}
                      error={errors.baseRent}
                      label="ค่าเช่าต่อเดือน"
                      min={0}
                      name="baseRent"
                      required
                      step="0.01"
                      type="number"
                    />
                  </div>
                  <input
                    name="roomNumbers"
                    type="hidden"
                    value={JSON.stringify(generated.roomNumbers)}
                  />
                  <div className={`portal-room-preview ${generated.error ? "error" : ""}`}>
                    <div>
                      <strong>ตัวอย่างหมายเลขห้อง</strong>
                      <span>
                        {generated.error ??
                          `สร้างใหม่ ${generated.roomNumbers.length - duplicateCount} · ซ้ำ ${duplicateCount}`}
                      </span>
                    </div>
                    {!generated.error ? (
                      <div>
                        {generated.roomNumbers.slice(0, 14).map((roomNumber: string) => (
                          <span
                            className={existing.has(roomNumber) ? "duplicate" : ""}
                            key={roomNumber}
                          >
                            {roomNumber}
                          </span>
                        ))}
                        {generated.roomNumbers.length > 14 ? (
                          <i>+{generated.roomNumbers.length - 14}</i>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </>
              )
            }
          </PortalForm>
        </Modal>
      ) : null}

      {deleteTarget ? (
        <DeleteConfirmation
          action={deleteRoomAction}
          detail="มิเตอร์ที่ยังไม่มีประวัติจะถูกลบพร้อมห้อง หากห้องนี้มีสัญญา ใบแจ้งหนี้ หรือประวัติมิเตอร์ ระบบจะไม่อนุญาตให้ลบ"
          entityField="roomId"
          entityId={deleteTarget.id}
          onClose={() => setDeleteTarget(null)}
          organizationId={organizationId}
          subject={`กำลังจะลบห้อง “${deleteTarget.room_number}”`}
          submitLabel="ยืนยันลบห้อง"
          title={`ลบห้อง ${deleteTarget.room_number}?`}
        />
      ) : null}

      {portalTarget ? (
        <TenantPortalAccountModal
          account={portalAccountMap.get(portalTarget.tenant.id)}
          onClose={() => setPortalTarget(null)}
          organizationId={organizationId}
          roomNumber={portalTarget.room.room_number}
          tenant={portalTarget.tenant}
        />
      ) : null}
    </>
  );
}
