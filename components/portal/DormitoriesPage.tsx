"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  DoorOpen,
  Eye,
  KeyRound,
  Layers,
  LayoutGrid,
  ListFilter,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
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
import { SelectControl } from "@/components/ui/SelectControl";
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
  const [editingStatus, setEditingStatus] = useState("active");

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

  const totalOccupied = rooms.filter((r) => r.status === "occupied").length;
  const totalVacant = rooms.filter((r) => r.status === "vacant").length;
  const overallOccupancy = rooms.length ? Math.round((totalOccupied / rooms.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <PageHeader
        actionLabel={canCreate ? "เพิ่มหอพัก" : undefined}
        description="จัดการข้อมูลอาคาร ที่อยู่ ช่องทางติดต่อ และสถานะการใช้งานของหอพักทั้งหมด"
        onAction={() => setSelected("create")}
        title="หอพัก"
      />

      {/* Hero Stat Matrix */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0">
              <Building2 size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">หอพักทั้งหมด</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {items.length.toLocaleString("th-TH")} แห่ง
              </strong>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">เปิดใช้งานอยู่</span>
              <strong className="text-2xl font-black text-emerald-800 tracking-tight tabular-nums mt-0.5 block">
                {items.filter((item) => item.status === "active").length.toLocaleString("th-TH")} แห่ง
              </strong>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 text-white shadow-md shadow-purple-500/25 flex items-center justify-center shrink-0">
              <KeyRound size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ห้องพักรวมทุกหอ</span>
              <strong className="text-2xl font-black text-purple-900 tracking-tight tabular-nums mt-0.5 block">
                {rooms.length.toLocaleString("th-TH")} ห้อง
              </strong>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/25 flex items-center justify-center shrink-0">
              <Activity size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">อัตราเข้าพักเฉลี่ย</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {overallOccupancy}%
              </strong>
            </div>
          </div>
        </div>
      </section>

      {items.length ? (
        <>
          <CollectionToolbar
            actions={
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100/80 border border-slate-200 gap-1">
                <button
                  aria-label="มุมมองตาราง"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    viewMode === "table" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                  onClick={() => setViewMode("table")}
                  type="button"
                >
                  <ListFilter size={15} strokeWidth={2.2} />
                  <span>ตาราง</span>
                </button>
                <button
                  aria-label="มุมมองการ์ด"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                  onClick={() => setViewMode("grid")}
                  type="button"
                >
                  <LayoutGrid size={15} strokeWidth={2.2} />
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
              <div className="w-full">
                <DataTable
                  headers={[
                    "หอพัก / อาคาร",
                    "ที่อยู่ / เบอร์โทร",
                    "จำนวนห้องพัก",
                    "อัตราการเข้าพัก",
                    "สถานะ",
                    "การจัดการ",
                  ]}
                  rows={visibleItems.map((item) => {
                    const propertyRooms = rooms.filter((room) => room.property_id === item.id);
                    const vacantRooms = propertyRooms.filter((room) => room.status === "vacant").length;
                    const occupiedRooms = propertyRooms.filter((room) => room.status === "occupied").length;
                    const propOccupancy = propertyRooms.length ? Math.round((occupiedRooms / propertyRooms.length) * 100) : 0;

                    return [
                      <div className="flex items-center gap-3.5" key="prop">
                        <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                          <Building2 size={19} strokeWidth={2.2} />
                        </span>
                        <div>
                          <strong className="text-slate-900 text-sm font-bold block">{item.name}</strong>
                          <span className="text-[11px] text-slate-400 block mt-0.5">ID: {item.id.slice(0, 8)}...</span>
                        </div>
                      </div>,
                      <div className="flex flex-col text-xs" key="contact">
                        <span className="text-slate-700 font-medium">{item.address || "—"}</span>
                        <small className="text-slate-400 mt-0.5">{item.phone ? `โทร. ${item.phone}` : "ไม่มีเบอร์โทร"}</small>
                      </div>,
                      <div className="flex flex-col text-xs font-medium" key="rooms">
                        <strong className="text-slate-900 font-black tabular-nums">{propertyRooms.length} ห้อง</strong>
                        <small className="text-slate-400 mt-0.5">
                          (ว่าง {vacantRooms} • มีผู้เช่า {occupiedRooms})
                        </small>
                      </div>,
                      <div className="flex flex-col gap-1 min-w-[120px]" key="occ">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-700">{propOccupancy}%</span>
                          <span className="text-[11px] text-slate-400">{occupiedRooms}/{propertyRooms.length}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200/50">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${propOccupancy}%` }} />
                        </div>
                      </div>,
                      <StatusBadge key="status" status={item.status} />,
                      <div className="inline-flex items-center gap-2 justify-end" key="actions">
                        <button
                          className="h-8.5 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs"
                          onClick={() => router.push(`/guestrooms`)}
                          title="ดูห้องพักในหอพักนี้"
                          type="button"
                        >
                          <DoorOpen size={14} strokeWidth={2.2} />
                          <span>ห้องพัก</span>
                        </button>
                        {canEdit ? (
                          <button
                            aria-label={`แก้ไขหอพัก ${item.name}`}
                            className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0"
                            onClick={() => setSelected(item)}
                            title="แก้ไขหอพัก"
                            type="button"
                          >
                            <Pencil size={14} strokeWidth={2.2} />
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            aria-label={`ลบหอพัก ${item.name}`}
                            className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer shadow-2xs shrink-0"
                            onClick={() => setDeleteTarget(item)}
                            title="ลบหอพัก"
                            type="button"
                          >
                            <Trash2 size={14} strokeWidth={2.2} />
                          </button>
                        ) : null}
                      </div>,
                    ];
                  })}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleItems.map((item) => {
                  const propertyRooms = rooms.filter((room) => room.property_id === item.id);
                  const vacantRooms = propertyRooms.filter((room) => room.status === "vacant").length;
                  const occupiedRooms = propertyRooms.filter((room) => room.status === "occupied").length;
                  const propOccupancy = propertyRooms.length ? Math.round((occupiedRooms / propertyRooms.length) * 100) : 0;

                  return (
                    <article
                      className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                      key={item.id}
                    >
                      {/* Ambient corner glow */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                      <div>
                        {/* Card Header */}
                        <header className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <Building2 size={22} strokeWidth={2.2} />
                            </span>
                            <div className="min-w-0">
                              <h2 className="text-base font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                {item.name}
                              </h2>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-400 truncate flex items-center gap-1">
                                  <Phone size={11} className="text-slate-400" />
                                  {item.phone || "ไม่มีเบอร์โทร"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={item.status} />
                        </header>

                        {/* Address Box */}
                        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs mb-4">
                          <span className="text-slate-400 block text-[10px] font-bold tracking-wide uppercase">ที่ตั้ง / ที่อยู่</span>
                          <p className="text-slate-700 font-medium mt-1 line-clamp-2 leading-relaxed">
                            {item.address || "ยังไม่ได้ระบุที่อยู่ของอาคาร"}
                          </p>
                        </div>

                        {/* Occupancy Progress Bar */}
                        <div className="space-y-1.5 mb-4">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">อัตราการเข้าพัก</span>
                            <strong className="text-slate-900 font-black">{propOccupancy}%</strong>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200/60">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                              style={{ width: `${propOccupancy}%` }}
                            />
                          </div>
                        </div>

                        {/* 3 Metrics Mini Grid */}
                        <dl className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-center mb-5">
                          <div className="flex flex-col">
                            <dt className="text-[11px] text-slate-400 font-medium">ห้องทั้งหมด</dt>
                            <dd className="text-lg font-black text-slate-900 mt-0.5 tabular-nums">{propertyRooms.length}</dd>
                          </div>
                          <div className="flex flex-col border-x border-slate-200/60">
                            <dt className="text-[11px] text-slate-400 font-medium">มีผู้เช่า</dt>
                            <dd className="text-lg font-black text-emerald-600 mt-0.5 tabular-nums">{occupiedRooms}</dd>
                          </div>
                          <div className="flex flex-col">
                            <dt className="text-[11px] text-slate-400 font-medium">ห้องว่าง</dt>
                            <dd className="text-lg font-black text-blue-600 mt-0.5 tabular-nums">{vacantRooms}</dd>
                          </div>
                        </dl>
                      </div>

                      {/* Footer Actions */}
                      <footer className="pt-4 border-t border-slate-100 flex items-center gap-2">
                        <button
                          className="flex-1 h-9.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all shadow-2xs cursor-pointer"
                          onClick={() => router.push(`/guestrooms`)}
                          title="ดูห้องพัก"
                          type="button"
                        >
                          <DoorOpen size={15} strokeWidth={2.2} />
                          <span>ดูห้องพัก ({propertyRooms.length})</span>
                        </button>
                        {canEdit ? (
                          <button
                            aria-label={`แก้ไขหอพัก ${item.name}`}
                            className="h-9.5 px-3 rounded-xl flex items-center justify-center gap-1 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs"
                            onClick={() => setSelected(item)}
                            title="แก้ไขหอพัก"
                            type="button"
                          >
                            <Pencil size={14} strokeWidth={2.2} />
                            <span>แก้ไข</span>
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            aria-label={`ลบหอพัก ${item.name}`}
                            className="h-9.5 px-3 rounded-xl flex items-center justify-center text-xs font-bold bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                            onClick={() => setDeleteTarget(item)}
                            title="ลบหอพัก"
                            type="button"
                          >
                            <Trash2 size={14} strokeWidth={2.2} />
                          </button>
                        ) : null}
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
          actionLabel={canCreate ? "เพิ่มหอพักแรก" : undefined}
          description="เพิ่มหอพักแรก แล้วจึงสร้างห้องพักและตั้งค่าอัตราค่าน้ำค่าไฟ"
          onAction={() => setSelected("create")}
          title="ยังไม่มีหอพักในระบบ"
        />
      )}

      {selected ? (
        <Modal
          description={
            editing
              ? `ปรับปรุงข้อมูลอาคาร ${editing.name}`
              : "กรอกข้อมูลหลักของหอพัก ระบบจะสร้างโครงสร้างและเปิดใช้งานให้อัตโนมัติ"
          }
          onClose={() => setSelected(null)}
          title={editing ? "แก้ไขหอพัก" : "เพิ่มหอพักใหม่"}
        >
          <PortalForm
            action={editing ? updatePropertyAction : createPropertyAction}
            onCancel={() => setSelected(null)}
            onSuccess={() => setSelected(null)}
            organizationId={organizationId}
            submitLabel={editing ? "บันทึกการแก้ไข" : "ยืนยันเพิ่มหอพัก"}
            validate={validateDormitory}
          >
            {(errors, clear) => (
              <div className="space-y-4 text-xs">
                {editing ? <input name="propertyId" type="hidden" value={editing.id} /> : null}
                
                {!editing ? (
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Sparkles size={13} strokeWidth={2.2} />
                    </span>
                    <div className="leading-relaxed">
                      <strong className="font-bold block text-blue-950">พร้อมใช้งานทันที</strong>
                      <span className="text-[11px] text-blue-800/80">ระบบจะสร้างการตั้งค่าเริ่มต้น อัตราค่าน้ำค่าไฟ และพร้อมสำหรับการสร้างห้องพักทันที</span>
                    </div>
                  </div>
                ) : null}

                {/* Dormitory Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-500" />
                      <span>ชื่อหอพัก / อาคาร <span className="text-rose-500">*</span></span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">เช่น ลงตัว เรสซิเดนซ์ 2</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Building2 size={16} strokeWidth={2.2} />
                    </span>
                    <input
                      autoFocus
                      aria-invalid={Boolean(errors.name)}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all placeholder:text-slate-400"
                      defaultValue={editing?.name}
                      name="name"
                      onChange={() => clear("name")}
                      placeholder="กรอกชื่อหอพัก หรือชื่ออาคาร"
                    />
                  </div>
                  {errors.name ? (
                    <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.name}</p>
                  ) : null}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-500" />
                      <span>ที่ตั้ง / ที่อยู่หอพัก</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <MapPin size={16} strokeWidth={2.2} />
                    </span>
                    <input
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all placeholder:text-slate-400"
                      defaultValue={editing?.address}
                      name="address"
                      onChange={() => clear("address")}
                      placeholder="เช่น 123/45 ซ.สุขุมวิท 71 แขวงพระโขนงเหนือ เขตวัฒนา กรุงเทพฯ 10110"
                    />
                  </div>
                  {errors.address ? (
                    <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.address}</p>
                  ) : null}
                </div>

                {/* Phone & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone size={14} className="text-slate-500" />
                        <span>เบอร์โทรศัพท์ติดต่อ</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">เช่น 081-234-5678</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Phone size={16} strokeWidth={2.2} />
                      </span>
                      <input
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold font-mono transition-all placeholder:text-slate-400"
                        defaultValue={editing?.phone ?? ""}
                        name="phone"
                        onChange={() => clear("phone")}
                        placeholder="08x-xxx-xxxx"
                      />
                    </div>
                    {errors.phone ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.phone}</p>
                    ) : null}
                  </div>

                  {editing ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span>สถานะการใช้งาน</span>
                        <span className="text-[11px] text-slate-400 font-normal">Status</span>
                      </label>
                      <input name="status" type="hidden" value={editingStatus} />
                      <SelectControl
                        ariaLabel="สถานะการใช้งาน"
                        onValueChange={(val) => setEditingStatus(val)}
                        options={[
                          { value: "active", label: "ใช้งาน (Active)" },
                          { value: "inactive", label: "ไม่ใช้งาน (Inactive)" },
                        ]}
                        value={editingStatus}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
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
    </div>
  );
}
