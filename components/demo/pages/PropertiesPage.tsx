"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Building2,
  CheckCircle2,
  DoorOpen,
  KeyRound,
  LayoutGrid,
  ListFilter,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  DeleteButton,
  EditButton,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/portal/PortalUI";
import type { PageContentProps } from "../types";

export function PropertiesPage({
  isLocked,
  properties,
  activeProperty,
  onSwitchProperty,
  onAddProperty,
  onNavigate,
  onToast,
}: PageContentProps) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return properties.filter(
      (p) =>
        !needle ||
        `${p.name} ${p.address} ${p.phone}`.toLowerCase().includes(needle)
    );
  }, [properties, query]);

  const totalRooms = properties.reduce((s, p) => s + p.rooms.length, 0);
  const totalOccupied = properties.reduce((s, p) => s + p.rooms.filter((r) => Boolean(r.tenant)).length, 0);
  const overallOccupancy = totalRooms ? Math.round((totalOccupied / totalRooms) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        actionLabel={!isLocked ? "เพิ่มหอพัก" : undefined}
        description="จัดการข้อมูลอาคาร ที่อยู่ ช่องทางติดต่อ และสถานะการใช้งาน"
        onAction={onAddProperty}
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
                {properties.length.toLocaleString("th-TH")} แห่ง
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
              <span className="text-xs font-bold text-slate-500 block">กำลังใช้งาน</span>
              <strong className="text-2xl font-black text-emerald-800 tracking-tight tabular-nums mt-0.5 block">
                {properties.length.toLocaleString("th-TH")} แห่ง
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
              <span className="text-xs font-bold text-slate-500 block">ห้องพักรวม</span>
              <strong className="text-2xl font-black text-purple-900 tracking-tight tabular-nums mt-0.5 block">
                {totalRooms.toLocaleString("th-TH")} ห้อง
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

      {properties.length ? (
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
            description={`แสดง ${visibleItems.length.toLocaleString("th-TH")} จาก ${properties.length.toLocaleString("th-TH")} หอพัก`}
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
                    const vacantRooms = item.rooms.filter((room) => !room.tenant).length;
                    const occupiedRooms = item.rooms.filter((room) => Boolean(room.tenant)).length;
                    const propOccupancy = item.rooms.length ? Math.round((occupiedRooms / item.rooms.length) * 100) : 0;

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
                        <strong className="text-slate-900 font-black tabular-nums">{item.rooms.length} ห้อง</strong>
                        <small className="text-slate-400 mt-0.5">
                          (ว่าง {vacantRooms} • มีผู้เช่า {occupiedRooms})
                        </small>
                      </div>,
                      <div className="flex flex-col gap-1 min-w-[120px]" key="occ">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-700">{propOccupancy}%</span>
                          <span className="text-[11px] text-slate-400">{occupiedRooms}/{item.rooms.length}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200/50">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${propOccupancy}%` }} />
                        </div>
                      </div>,
                      <StatusBadge key="status" status="active" />,
                      <div className="inline-flex items-center gap-2 justify-end" key="actions">
                        <button
                          className="h-8.5 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs"
                          onClick={() => {
                            onSwitchProperty(item.id);
                            onNavigate("rooms");
                          }}
                          title="ดูห้องพักในหอพักนี้"
                          type="button"
                        >
                          <DoorOpen size={14} strokeWidth={2.2} />
                          <span>ห้องพัก</span>
                        </button>
                        <EditButton
                          disabled={isLocked}
                          label="แก้ไข"
                          onClick={() => onToast("แก้ไขข้อมูลหอพัก")}
                        />
                        <DeleteButton
                          disabled={isLocked || properties.length <= 1}
                          label="ลบ"
                          onClick={() => onToast("ไม่สามารถลบหอพักหลักได้ในโหมดตัวอย่าง")}
                        />
                      </div>,
                    ];
                  })}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleItems.map((item) => {
                  const vacantRooms = item.rooms.filter((room) => !room.tenant).length;
                  const occupiedRooms = item.rooms.filter((room) => Boolean(room.tenant)).length;
                  const propOccupancy = item.rooms.length ? Math.round((occupiedRooms / item.rooms.length) * 100) : 0;

                  return (
                    <article
                      className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                      key={item.id}
                    >
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                      <div>
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
                          <StatusBadge status="active" />
                        </header>

                        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs mb-4">
                          <span className="text-slate-400 block text-[10px] font-bold tracking-wide uppercase">ที่ตั้ง / ที่อยู่</span>
                          <p className="text-slate-700 font-medium mt-1 line-clamp-2 leading-relaxed">
                            {item.address || "ยังไม่ได้ระบุที่อยู่ของอาคาร"}
                          </p>
                        </div>

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

                        <dl className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-center mb-5">
                          <div className="flex flex-col">
                            <dt className="text-[11px] text-slate-400 font-medium">ห้องทั้งหมด</dt>
                            <dd className="text-lg font-black text-slate-900 mt-0.5 tabular-nums">{item.rooms.length}</dd>
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

                      <footer className="pt-4 border-t border-slate-100 flex items-center gap-2">
                        <button
                          className="flex-1 h-9.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all shadow-2xs cursor-pointer"
                          onClick={() => {
                            onSwitchProperty(item.id);
                            onNavigate("rooms");
                          }}
                          title="ดูห้องพัก"
                          type="button"
                        >
                          <DoorOpen size={15} strokeWidth={2.2} />
                          <span>ดูห้องพัก ({item.rooms.length})</span>
                        </button>
                        <EditButton
                          disabled={isLocked}
                          label="แก้ไข"
                          onClick={() => onToast("แก้ไขข้อมูลหอพัก")}
                        />
                        <DeleteButton
                          disabled={isLocked || properties.length <= 1}
                          label="ลบ"
                          onClick={() => onToast("ไม่สามารถลบหอพักหลักได้ในโหมดตัวอย่าง")}
                        />
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
          actionLabel={!isLocked ? "เพิ่มหอพักแรก" : undefined}
          description="เพิ่มหอพักแรก แล้วจึงสร้างห้องพักและตั้งค่าอัตราค่าน้ำค่าไฟ"
          onAction={onAddProperty}
          title="ยังไม่มีหอพักในระบบ"
        />
      )}
    </div>
  );
}
