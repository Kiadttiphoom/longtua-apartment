"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  CalendarCheck,
  CalendarRange,
  CheckCircle2,
  Coins,
  CreditCard,
  DoorOpen,
  Eye,
  FileText,
  Home,
  LayoutGrid,
  List,
  Pencil,
  Phone,
  Plus,
  Printer,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserRoundCheck,
  UsersRound,
  X,
} from "lucide-react";
import { createLeaseAction, updateLeaseAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  EditButton,
  EmptyState,
  Modal,
  PageHeader,
  PortalForm,
  StatusBadge,
} from "@/components/portal/PortalUI";
import { SelectControl } from "@/components/ui/SelectControl";
import { TenantPortalAccountModal } from "@/components/portal/TenantPortalAccountModal";
import { money, thaiBahtText, thaiDate } from "@/lib/format";
import type { Lease, Property, Room, Tenant } from "@/components/portal/types";
import type { TenantPortalAccountSummary } from "@/lib/portal/tenant-accounts";
import { validateLease } from "@/lib/portal/validation.mjs";

type LeasePortalTarget = { lease: Lease; tenant: Tenant; room?: Room };
type ViewingLeaseTarget = {
  lease: Lease;
  tenant?: Tenant;
  room?: Room;
  propertyName?: string;
};

export function LeasesPage({
  organizationId,
  leases,
  properties,
  rooms,
  tenants,
  portalAccounts,
  canCreate,
  canEdit,
  canManageTenantPortal,
}: {
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
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [selected, setSelected] = useState<Lease | "create" | null>(null);
  const [viewingLease, setViewingLease] = useState<ViewingLeaseTarget | null>(null);
  const [portalTarget, setPortalTarget] = useState<LeasePortalTarget | null>(null);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [modalPropertyId, setModalPropertyId] = useState("");
  const [formRoomId, setFormRoomId] = useState("");
  const [formTenantId, setFormTenantId] = useState("");
  const [formStatus, setFormStatus] = useState("active");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const editing = selected && selected !== "create" ? selected : null;
  const propertyMap = useMemo(() => new Map(properties.map((item) => [item.id, item.name])), [properties]);
  const roomMap = useMemo(() => new Map(rooms.map((item) => [item.id, item])), [rooms]);
  const tenantById = useMemo(() => new Map(tenants.map((item) => [item.id, item])), [tenants]);
  const tenantMap = useMemo(() => new Map(tenants.map((item) => [item.id, item.full_name])), [tenants]);
  const portalAccountMap = useMemo(
    () => new Map(portalAccounts.map((account) => [account.tenantId, account])),
    [portalAccounts]
  );

  const availableRooms = useMemo(
    () => rooms.filter((room) => room.status === "vacant" && (!modalPropertyId || room.property_id === modalPropertyId)),
    [rooms, modalPropertyId]
  );

  const totalCount = leases.length;
  const activeCount = useMemo(() => leases.filter((item) => item.status === "active").length, [leases]);
  const draftCount = useMemo(() => leases.filter((item) => item.status === "draft").length, [leases]);
  const endedCount = useMemo(() => leases.filter((item) => item.status === "ended" || item.status === "cancelled").length, [leases]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th-TH");
    return leases.filter((item) => {
      const room = roomMap.get(item.room_id);
      const matchesProperty = propertyFilter === "all" || item.property_id === propertyFilter;
      const matchesStatus =
        status === "all"
          ? true
          : status === "ended"
          ? item.status === "ended" || item.status === "cancelled"
          : item.status === status;

      const matchesSearch =
        !keyword ||
        [
          item.lease_number,
          propertyMap.get(item.property_id),
          room?.room_number,
          tenantMap.get(item.primary_tenant_id),
          tenantById.get(item.primary_tenant_id)?.phone,
          item.terms,
        ].some((value) => value?.toLocaleLowerCase("th-TH").includes(keyword));

      return matchesProperty && matchesStatus && matchesSearch;
    });
  }, [leases, propertyFilter, propertyMap, query, roomMap, status, tenantById, tenantMap]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        actionLabel={canCreate ? "สร้างสัญญาเช่า" : undefined}
        description="จัดการข้อมูลสัญญาเช่า ห้องพัก ผู้เช่า เงินประกัน และข้อตกลงการอยู่อาศัย"
        onAction={() => {
          setSelected("create");
          setModalPropertyId(properties[0]?.id ?? "");
          setFormRoomId("");
          setFormTenantId("");
          setFormStatus("active");
        }}
        title="สัญญาเช่า"
      />

      <section aria-label="ภาพรวมสัญญาเช่า" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            status === "all"
              ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setStatus("all")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0">
              <FileText size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">สัญญาทั้งหมด</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {totalCount.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            status === "active"
              ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setStatus("active")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">กำลังมีผลใช้งาน</span>
              <strong className="text-2xl font-black text-emerald-800 tracking-tight tabular-nums mt-0.5 block">
                {activeCount.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            status === "draft"
              ? "bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setStatus("draft")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
              <Pencil size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ร่างสัญญารอดำเนินการ</span>
              <strong className="text-2xl font-black text-amber-800 tracking-tight tabular-nums mt-0.5 block">
                {draftCount.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>

        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            status === "ended"
              ? "bg-white border-slate-500 shadow-md ring-2 ring-slate-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setStatus("ended")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-slate-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-600 to-slate-800 text-white shadow-md shadow-slate-500/25 flex items-center justify-center shrink-0">
              <CalendarCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">สิ้นสุด/ยกเลิกแล้ว</span>
              <strong className="text-2xl font-black text-slate-800 tracking-tight tabular-nums mt-0.5 block">
                {endedCount.toLocaleString("th-TH")} ฉบับ
              </strong>
            </div>
          </div>
        </button>
      </section>

      {properties.length > 1 ? (
        <section aria-label="เลือกหอพัก" className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              propertyFilter === "all"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                : "bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            }`}
            onClick={() => setPropertyFilter("all")}
            type="button"
          >
            <Building2 size={14} />
            <span>ทุกหอพัก ({leases.length})</span>
          </button>
          {properties.map((prop) => {
            const propLeaseCount = leases.filter((l) => l.property_id === prop.id).length;
            const isSelected = propertyFilter === prop.id;
            return (
              <button
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                    : "bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}
                key={prop.id}
                onClick={() => setPropertyFilter(prop.id)}
                type="button"
              >
                <Building2 size={14} />
                <span>{prop.name} ({propLeaseCount})</span>
              </button>
            );
          })}
        </section>
      ) : null}

      <CollectionToolbar
        actions={
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
            <button
              aria-label="มุมมองตาราง"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("table")}
              type="button"
            >
              <List size={14} />
              <span>ตาราง</span>
            </button>
            <button
              aria-label="มุมมองการ์ด"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              <LayoutGrid size={14} />
              <span>การ์ด</span>
            </button>
          </div>
        }
        description={`แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${leases.length.toLocaleString("th-TH")} ฉบับ`}
        filter={{
          label: "กรองสถานะ",
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "ทุกสถานะสัญญา" },
            { value: "active", label: "กำลังมีผลใช้งาน (Active)" },
            { value: "draft", label: "ฉบับร่าง (Draft)" },
            { value: "ended", label: "สิ้นสุด / ยกเลิกแล้ว" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาเลขสัญญา, ห้อง, ผู้เช่า, เบอร์โทร หรือข้อตกลง..."
        query={query}
        title="รายการสัญญาเช่า"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full">
            <DataTable
              headers={[
                "เลขที่สัญญา",
                "ห้อง / หอพัก",
                "ผู้เช่าหลัก",
                "ระยะเวลาสัญญา",
                "ค่าเช่า / ประกัน",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => {
                const room = roomMap.get(item.room_id);
                const tenant = tenantById.get(item.primary_tenant_id);
                const account = portalAccountMap.get(item.primary_tenant_id);
                const propName = propertyMap.get(item.property_id);

                return [
                  <div className="flex items-center gap-2" key="lease_number">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                      <FileText size={15} strokeWidth={2.2} />
                    </span>
                    <div>
                      <strong className="text-slate-900 text-xs font-mono font-bold block">{item.lease_number}</strong>
                      <span className="text-[10px] text-slate-400">เริ่ม {thaiDate(item.start_date)}</span>
                    </div>
                  </div>,

                  <div className="flex items-center gap-2.5" key="room">
                    <span className="inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-lg bg-blue-50/80 text-blue-900 border border-blue-200 text-xs font-black">
                      {room?.room_number ?? "—"}
                    </span>
                    <div className="flex flex-col text-xs min-w-0">
                      <span className="text-slate-800 font-bold truncate">{propName ?? "หอพัก"}</span>
                      <small className="text-slate-400">ชั้น {room?.floor ?? "1"}</small>
                    </div>
                  </div>,

                  <div className="flex items-center gap-2.5" key="tenant">
                    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-black text-[11px] flex items-center justify-center shrink-0 border border-slate-200">
                      {(tenant?.full_name || "ผ").slice(0, 1)}
                    </span>
                    <div className="flex flex-col text-xs min-w-0">
                      <strong className="text-slate-900 font-bold truncate">{tenant?.full_name ?? "—"}</strong>
                      <small className="text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> {tenant?.phone || "ไม่มีเบอร์โทร"}
                      </small>
                    </div>
                  </div>,

                  <div className="flex flex-col text-xs" key="dates">
                    <strong className="text-slate-800 font-bold flex items-center gap-1">
                      <CalendarRange size={12} className="text-slate-400" />
                      {thaiDate(item.start_date)}
                    </strong>
                    <small className="text-slate-400 mt-0.5">
                      {item.end_date ? `ถึง ${thaiDate(item.end_date)}` : "ไม่ระบุสิ้นสุด"}
                    </small>
                  </div>,

                  <div className="flex flex-col text-xs" key="financials">
                    <strong className="text-slate-900 font-bold text-xs">{money(Number(item.rent_amount))}/ด.</strong>
                    <small className="text-slate-400 mt-0.5">ประกัน {money(Number(item.deposit_amount))}</small>
                  </div>,

                  <StatusBadge key="status" status={item.status} />,

                  <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                    <button
                      className="h-8.5 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer shadow-2xs"
                      onClick={() =>
                        setViewingLease({
                          lease: item,
                          tenant,
                          room,
                          propertyName: propName,
                        })
                      }
                      title="ดูรายละเอียดสัญญา"
                      type="button"
                    >
                      <Eye size={14} strokeWidth={2.2} />
                      <span>ดูสัญญา</span>
                    </button>
                    <button
                      className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs shrink-0"
                      onClick={() => {
                        setViewingLease({
                          lease: item,
                          tenant,
                          room,
                          propertyName: propName,
                        });
                        setTimeout(() => window.print(), 150);
                      }}
                      title="พิมพ์สัญญาเช่า A4"
                      type="button"
                    >
                      <Printer size={14} strokeWidth={2.2} />
                    </button>
                    {canEdit ? (
                      <button
                        aria-label={`แก้ไขสัญญา ${item.lease_number}`}
                        className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0"
                        onClick={() => {
                          setSelected(item);
                          setModalPropertyId(item.property_id);
                          setFormStatus(item.status);
                        }}
                        title="แก้ไขสัญญา"
                        type="button"
                      >
                        <Pencil size={14} strokeWidth={2.2} />
                      </button>
                    ) : null}
                    {tenant && canManageTenantPortal && ["draft", "active"].includes(item.status) ? (
                      <button
                        aria-label={`${account ? "จัดการ" : "สร้าง"}บัญชีเข้าใช้ให้ ${tenant.full_name}`}
                        className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all cursor-pointer shadow-2xs shrink-0"
                        onClick={() => setPortalTarget({ lease: item, tenant, room })}
                        title={account ? "จัดการบัญชีผู้เช่า" : "สร้างบัญชีผู้เช่า"}
                        type="button"
                      >
                        <UserRoundCheck size={15} strokeWidth={2.2} />
                      </button>
                    ) : null}
                  </div>,
                ];
              })}
            />
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => {
              const room = roomMap.get(item.room_id);
              const tenant = tenantById.get(item.primary_tenant_id);
              const account = portalAccountMap.get(item.primary_tenant_id);
              const propName = propertyMap.get(item.property_id);

              return (
                <article
                  className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  key={item.id}
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                  <div>
                    <header className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {room?.room_number ?? "—"}
                        </span>
                        <div className="min-w-0">
                          <h2 className="text-sm font-bold text-slate-900 font-mono truncate group-hover:text-blue-600 transition-colors">
                            {item.lease_number}
                          </h2>
                          <span className="text-xs text-slate-400 block truncate mt-0.5">
                            {propName ?? "หอพัก"} · ชั้น {room?.floor ?? "1"}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </header>

                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-white text-blue-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0 shadow-2xs">
                          {(tenant?.full_name || "ผ").slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <strong className="text-xs font-bold text-slate-900 block truncate">{tenant?.full_name ?? "—"}</strong>
                          <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                            {tenant?.phone ? `โทร. ${tenant.phone}` : "ไม่มีเบอร์โทร"}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200/80 shrink-0 shadow-2xs">
                        <UsersRound size={12} className="text-slate-400" /> {item.occupant_count} คน
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                        <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ค่าเช่ารายเดือน</dt>
                        <dd className="text-sm font-black text-slate-900 mt-1">{money(Number(item.rent_amount))}</dd>
                        <span className="text-[10px] text-slate-400 block mt-0.5">ประกัน {money(Number(item.deposit_amount))}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                        <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ระยะเวลาสัญญา</dt>
                        <dd className="text-xs font-bold text-slate-800 mt-1 truncate">{thaiDate(item.start_date)}</dd>
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                          ถึง {item.end_date ? thaiDate(item.end_date) : "ไม่ระบุ"}
                        </span>
                      </div>
                    </dl>

                    {item.terms ? (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-950 line-clamp-2 mb-4 leading-relaxed">
                        <strong className="font-bold">ข้อตกลง:</strong> {item.terms}
                      </div>
                    ) : null}
                  </div>

                  <footer className="pt-4 border-t border-slate-100 flex items-center gap-2">
                    <button
                      className="flex-1 h-9.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all shadow-2xs cursor-pointer"
                      onClick={() =>
                        setViewingLease({
                          lease: item,
                          tenant,
                          room,
                          propertyName: propName,
                        })
                      }
                      title="ดูรายละเอียดสัญญา"
                      type="button"
                    >
                      <Eye size={15} strokeWidth={2.2} />
                      <span>ดูสัญญา</span>
                    </button>
                    <button
                      className="h-9.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                      onClick={() => {
                        setViewingLease({
                          lease: item,
                          tenant,
                          room,
                          propertyName: propName,
                        });
                        setTimeout(() => window.print(), 150);
                      }}
                      title="พิมพ์สัญญาเช่า"
                      type="button"
                    >
                      <Printer size={15} strokeWidth={2.2} />
                      <span>พิมพ์</span>
                    </button>
                    {canEdit ? (
                      <button
                        aria-label={`แก้ไขสัญญา ${item.lease_number}`}
                        className="h-9.5 px-3 rounded-xl flex items-center justify-center gap-1 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs"
                        onClick={() => {
                          setSelected(item);
                          setModalPropertyId(item.property_id);
                          setFormStatus(item.status);
                        }}
                        title="แก้ไขสัญญา"
                        type="button"
                      >
                        <Pencil size={14} strokeWidth={2.2} />
                      </button>
                    ) : null}
                    {tenant && canManageTenantPortal && ["draft", "active"].includes(item.status) ? (
                      <button
                        aria-label={`${account ? "จัดการ" : "สร้าง"}บัญชีเข้าใช้ให้ ${tenant.full_name}`}
                        className="w-9.5 h-9.5 rounded-xl flex items-center justify-center border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all cursor-pointer shadow-2xs shrink-0"
                        onClick={() => setPortalTarget({ lease: item, tenant, room })}
                        title={account ? "จัดการบัญชีผู้เช่า" : "สร้างบัญชีผู้เช่า"}
                        type="button"
                      >
                        <UserRoundCheck size={16} strokeWidth={2.2} />
                      </button>
                    ) : null}
                  </footer>
                </article>
              );
            })}
          </section>
        )
      ) : (
        <EmptyState
          description={
            leases.length
              ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ"
              : "ต้องมีห้องว่างและข้อมูลผู้เช่าก่อนจึงจะสร้างสัญญาได้"
          }
          title={leases.length ? "ไม่พบสัญญาที่ค้นหา" : "ยังไม่มีสัญญาเช่า"}
        />
      )}

      {viewingLease ? (
        <Modal
          className="contract-modal"
          headerActions={
            <>
              {canEdit ? (
                <button
                  className="h-8.5 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
                  onClick={() => {
                    const leaseToEdit = viewingLease.lease;
                    setViewingLease(null);
                    setSelected(leaseToEdit);
                    setModalPropertyId(leaseToEdit.property_id);
                    setFormStatus(leaseToEdit.status);
                  }}
                  type="button"
                >
                  <Pencil size={14} strokeWidth={2.2} />
                  <span>แก้ไขสัญญา</span>
                </button>
              ) : null}
              <button
                className="h-8.5 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs print:hidden"
                onClick={() => window.print()}
                type="button"
              >
                <Printer size={14} strokeWidth={2.2} />
                <span>พิมพ์สัญญา A4</span>
              </button>
            </>
          }
          maxWidth={840}
          onClose={() => setViewingLease(null)}
          title={`สัญญาเช่าเลขที่ ${viewingLease.lease.lease_number}`}
        >
          <div className="p-6 sm:p-10 overflow-y-auto text-slate-800 text-xs sm:text-[13px] leading-relaxed space-y-5 font-sans" id="print-area">
            <div className="text-center pb-5 border-b border-slate-200 space-y-1">
              <div className="flex justify-center mb-2">
                <span className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                  <Building2 size={24} strokeWidth={2.2} />
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {viewingLease.propertyName || "หนังสือสัญญาเช่าห้องพักอาศัย"}
              </h1>
              <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                หนังสือสัญญาเช่าห้องพักอาศัย (Residential Lease Agreement)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-700 font-medium border border-slate-200">
              <div><strong>เลขที่สัญญา:</strong> {viewingLease.lease.lease_number}</div>
              <div><strong>วันเริ่มสัญญา:</strong> {thaiDate(viewingLease.lease.start_date)}</div>
              <div><strong>ห้องพัก:</strong> ห้อง {viewingLease.room?.room_number ?? "—"}</div>
              <div>
                <strong>สถานะ:</strong>{" "}
                <span className="font-bold text-blue-600 uppercase">{viewingLease.lease.status}</span>
              </div>
            </div>

            <div className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                สัญญาเช่าฉบับนี้ทำขึ้นระหว่าง <strong>ผู้ให้เช่า</strong> กับ{" "}
                <strong>{viewingLease.tenant?.full_name || "..................................................."}</strong>{" "}
                (ผู้เช่า) {viewingLease.tenant?.phone ? `เบอร์โทรศัพท์ ${viewingLease.tenant.phone}` : ""}{" "}
                {viewingLease.tenant?.id_card_last4 ? `(เลขบัตรประชาชนลงท้าย ${viewingLease.tenant.id_card_last4})` : ""}{" "}
                โดยมีข้อตกลงและเงื่อนไขการเช่าดังต่อไปนี้:
              </p>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <strong>1. ทรัพย์สินที่เช่า:</strong> ห้องพักหมายเลข <strong>{viewingLease.room?.room_number ?? "—"}</strong> ชั้น {viewingLease.room?.floor ?? "1"}
                  </div>
                  <div>
                    <strong>2. จำนวนผู้พักอาศัย:</strong> {viewingLease.lease.occupant_count} คน
                  </div>
                  <div>
                    <strong>3. วันที่เริ่มสัญญา:</strong> {thaiDate(viewingLease.lease.start_date)}
                  </div>
                  <div>
                    <strong>4. วันที่สิ้นสุดสัญญา:</strong> {viewingLease.lease.end_date ? thaiDate(viewingLease.lease.end_date) : "ไม่ได้ระบุวันสิ้นสุด (ต่อสัญญาแบบเดือนต่อเดือน)"}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2 text-xs">
                <h3 className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Coins size={14} className="text-blue-600" />
                  <span>เงื่อนไขทางการเงิน</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-white border border-blue-100">
                    <span className="text-[11px] text-slate-500 block">อัตราค่าเช่า</span>
                    <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                      {money(Number(viewingLease.lease.rent_amount))} / เดือน
                    </strong>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      ({thaiBahtText(Number(viewingLease.lease.rent_amount))})
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-blue-100">
                    <span className="text-[11px] text-slate-500 block">เงินประกันความเสียหาย</span>
                    <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                      {money(Number(viewingLease.lease.deposit_amount))}
                    </strong>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      ({thaiBahtText(Number(viewingLease.lease.deposit_amount))})
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-blue-100">
                    <span className="text-[11px] text-slate-500 block">ค่าเช่าล่วงหน้า</span>
                    <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                      {money(Number(viewingLease.lease.advance_amount))}
                    </strong>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      ({thaiBahtText(Number(viewingLease.lease.advance_amount))})
                    </span>
                  </div>
                </div>
              </div>

              {viewingLease.lease.terms ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <h3 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>ข้อกำหนดและระเบียบปฏิบัติเพิ่มเติม</span>
                  </h3>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                    {viewingLease.lease.terms}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
              <div className="space-y-8">
                <div className="border-b border-slate-300 w-48 mx-auto" />
                <p>ลงชื่อ ........................................................... ผู้ให้เช่า</p>
              </div>
              <div className="space-y-8">
                <div className="border-b border-slate-300 w-48 mx-auto" />
                <p>ลงชื่อ ........................................................... ผู้เช่า</p>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {selected ? (
        <Modal
          description={
            editing
              ? `แก้ไขข้อมูลสัญญาเช่าเลขที่ ${editing.lease_number}`
              : "ระบุหอพัก ห้องว่าง ผู้เช่า และเงื่อนไขการเงินเพื่อเปิดใช้งานสัญญาเช่า"
          }
          maxWidth={640}
          onClose={() => {
            setSelected(null);
            setModalPropertyId("");
            setFormRoomId("");
            setFormTenantId("");
          }}
          title={editing ? "แก้ไขสัญญาเช่า" : "สร้างสัญญาเช่าใหม่"}
        >
          <PortalForm
            action={editing ? updateLeaseAction : createLeaseAction}
            onCancel={() => {
              setSelected(null);
              setModalPropertyId("");
              setFormRoomId("");
              setFormTenantId("");
            }}
            onSuccess={() => {
              setSelected(null);
              setModalPropertyId("");
              setFormRoomId("");
              setFormTenantId("");
            }}
            organizationId={organizationId}
            submitLabel={editing ? "บันทึกการแก้ไขสัญญา" : "บันทึกและเปิดสัญญา"}
            validate={(values) => {
              const errors = validateLease(values) as unknown as Record<string, string>;
              if (!editing && !values.propertyId) errors.propertyId = "กรุณาเลือกหอพัก";
              if (!editing && !values.roomId) errors.roomId = "กรุณาเลือกห้องพัก";
              if (!editing && !values.tenantId) errors.tenantId = "กรุณาเลือกผู้เช่า";
              return errors;
            }}
          >
            {(errors, clear) => (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles size={13} strokeWidth={2.2} />
                  </span>
                  <div className="leading-relaxed">
                    <strong className="font-bold block text-blue-950">
                      {editing ? "ข้อมูลข้อตกลงและสัญญาเช่า" : "สร้างข้อตกลงและเปิดสัญญาเช่า"}
                    </strong>
                    <span className="text-[11px] text-blue-800/80">
                      {editing
                        ? "ปรับปรุงข้อมูลทางการเงิน เงื่อนไข และระยะเวลาของสัญญาเช่า"
                        : "ระบบจะผูกผู้เช่าเข้ากับห้องพัก และนำอัตราค่าเช่าไปใช้คำนวณบิลรายเดือนอัตโนมัติ"}
                    </span>
                  </div>
                </div>

                {editing ? (
                  <>
                    <input name="leaseId" type="hidden" value={editing.id} />
                    <input name="status" type="hidden" value={formStatus} />

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">หอพัก</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">
                          {propertyMap.get(editing.property_id)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">ห้องพัก</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">
                          ห้อง {roomMap.get(editing.room_id)?.room_number ?? "—"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">ผู้เช่า</span>
                        <strong className="text-slate-800 font-bold block mt-0.5 truncate">
                          {tenantMap.get(editing.primary_tenant_id)}
                        </strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <FileText size={14} className="text-slate-500" />
                            <span>เลขที่สัญญา <span className="text-rose-500">*</span></span>
                          </span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <FileText size={16} strokeWidth={2.2} />
                          </span>
                          <input
                            className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all placeholder:text-slate-400"
                            defaultValue={editing.lease_number}
                            name="leaseNumber"
                            onChange={() => clear("leaseNumber")}
                            placeholder="กรอกเลขที่สัญญา"
                          />
                        </div>
                        {errors.leaseNumber ? (
                          <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.leaseNumber}</p>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-slate-500" />
                            <span>สถานะสัญญา <span className="text-rose-500">*</span></span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">Status</span>
                        </label>
                        <SelectControl
                          ariaLabel="สถานะสัญญา"
                          onValueChange={(val) => {
                            setFormStatus(val);
                            clear("status");
                          }}
                          options={[
                            { value: "draft", label: "ฉบับร่าง (Draft)" },
                            { value: "active", label: "มีผลอยู่ (Active)" },
                            { value: "ended", label: "สิ้นสุด (Ended)" },
                            { value: "cancelled", label: "ยกเลิก (Cancelled)" },
                          ]}
                          value={formStatus}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <input name="propertyId" type="hidden" value={modalPropertyId} />
                    <input name="roomId" type="hidden" value={formRoomId} />
                    <input name="tenantId" type="hidden" value={formTenantId} />

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-slate-500" />
                          <span>เลือกหอพัก / อาคาร <span className="text-rose-500">*</span></span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">สาขาที่ทำสัญญา</span>
                      </label>
                      <SelectControl
                        ariaLabel="หอพัก"
                        onValueChange={(val) => {
                          setModalPropertyId(val);
                          setFormRoomId("");
                          clear("propertyId");
                        }}
                        options={properties.map((item) => ({ value: item.id, label: item.name }))}
                        placeholder="เลือกหอพัก"
                        value={modalPropertyId}
                      />
                      {errors.propertyId ? (
                        <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.propertyId}</p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <DoorOpen size={14} className="text-slate-500" />
                            <span>ห้องพักที่ว่าง <span className="text-rose-500">*</span></span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">เฉพาะห้องว่าง</span>
                        </label>
                        <SelectControl
                          ariaLabel="ห้องพัก"
                          disabled={!modalPropertyId}
                          onValueChange={(val) => {
                            setFormRoomId(val);
                            clear("roomId");
                          }}
                          options={availableRooms.map((item) => ({
                            value: item.id,
                            label: `ห้อง ${item.room_number} (ชั้น ${item.floor})`,
                          }))}
                          placeholder={modalPropertyId ? (availableRooms.length ? "เลือกห้องพัก" : "ไม่มีห้องว่างในหอนี้") : "กรุณาเลือกหอพักก่อน"}
                          value={formRoomId}
                        />
                        {errors.roomId ? (
                          <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.roomId}</p>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <UserRound size={14} className="text-slate-500" />
                            <span>ผู้เช่าหลัก <span className="text-rose-500">*</span></span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">คู่สัญญา</span>
                        </label>
                        <SelectControl
                          ariaLabel="ผู้เช่า"
                          onValueChange={(val) => {
                            setFormTenantId(val);
                            clear("tenantId");
                          }}
                          options={tenants
                            .filter((item) => item.status === "active")
                            .map((item) => ({ value: item.id, label: item.full_name }))}
                          placeholder="เลือกผู้เช่า"
                          value={formTenantId}
                        />
                        {errors.tenantId ? (
                          <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.tenantId}</p>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FileText size={14} className="text-slate-500" />
                          <span>เลขที่สัญญา <span className="text-rose-500">*</span></span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">สร้างอัตโนมัติ</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <FileText size={16} strokeWidth={2.2} />
                        </span>
                        <input
                          className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all placeholder:text-slate-400"
                          defaultValue={`CONT-${new Date().toISOString().slice(0, 4)}-${String(leases.length + 1).padStart(3, "0")}`}
                          name="leaseNumber"
                          onChange={() => clear("leaseNumber")}
                          placeholder="ระบุเลขที่สัญญา"
                        />
                      </div>
                      {errors.leaseNumber ? (
                        <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.leaseNumber}</p>
                      ) : null}
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <CalendarRange size={13} className="text-slate-500" />
                        <span>วันเริ่มสัญญา <span className="text-rose-500">*</span></span>
                      </span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all"
                      defaultValue={editing?.start_date || new Date().toISOString().slice(0, 10)}
                      name="startDate"
                      onChange={() => clear("startDate")}
                      type="date"
                    />
                    {errors.startDate ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.startDate}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <CalendarCheck size={13} className="text-slate-500" />
                        <span>วันสิ้นสุดสัญญา</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">ถ้ามี</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all"
                      defaultValue={editing?.end_date ?? ""}
                      name="endDate"
                      onChange={() => clear("endDate")}
                      type="date"
                    />
                    {errors.endDate ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.endDate}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <UsersRound size={13} className="text-slate-500" />
                        <span>จำนวนผู้พัก (คน) <span className="text-rose-500">*</span></span>
                      </span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all"
                      defaultValue={editing?.occupant_count ?? 1}
                      max={50}
                      min={1}
                      name="occupantCount"
                      onChange={() => clear("occupantCount")}
                      step="1"
                      type="number"
                    />
                    {errors.occupantCount ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.occupantCount}</p>
                    ) : null}
                  </div>
                </div>

                {/* Financial Amounts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Banknote size={13} className="text-slate-500" />
                        <span>ค่าเช่า/เดือน <span className="text-rose-500">*</span></span>
                      </span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                      defaultValue={editing?.rent_amount}
                      min={0}
                      name="rentAmount"
                      onChange={() => clear("rentAmount")}
                      placeholder="เช่น 3500"
                      step="0.01"
                      type="number"
                    />
                    {errors.rentAmount ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.rentAmount}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={13} className="text-slate-500" />
                        <span>เงินประกัน <span className="text-rose-500">*</span></span>
                      </span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                      defaultValue={editing?.deposit_amount ?? 0}
                      min={0}
                      name="depositAmount"
                      onChange={() => clear("depositAmount")}
                      placeholder="เช่น 5000"
                      step="0.01"
                      type="number"
                    />
                    {errors.depositAmount ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.depositAmount}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Coins size={13} className="text-slate-500" />
                        <span>ค่าเช่าล่วงหน้า <span className="text-rose-500">*</span></span>
                      </span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all"
                      defaultValue={editing?.advance_amount ?? 0}
                      min={0}
                      name="advanceAmount"
                      onChange={() => clear("advanceAmount")}
                      placeholder="เช่น 3500"
                      step="0.01"
                      type="number"
                    />
                    {errors.advanceAmount ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.advanceAmount}</p>
                    ) : null}
                  </div>
                </div>

                {/* Terms */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>เงื่อนไขและข้อตกลงเพิ่มเติม</span>
                    <span className="text-[11px] text-slate-400 font-normal">พิมพ์ลงท้ายสัญญา</span>
                  </label>
                  <textarea
                    className="w-full p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-medium transition-all placeholder:text-slate-400 resize-none h-20"
                    defaultValue={editing?.terms ?? ""}
                    name="terms"
                    onChange={() => clear("terms")}
                    placeholder="เช่น ห้ามเลี้ยงสัตว์ทุกชนิด, ห้ามส่งเสียงดังหลังเวลา 22:00 น."
                  />
                  {errors.terms ? (
                    <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.terms}</p>
                  ) : null}
                </div>
              </div>
            )}
          </PortalForm>
        </Modal>
      ) : null}

      {portalTarget ? (
        <TenantPortalAccountModal
          account={portalAccountMap.get(portalTarget.tenant.id)}
          onClose={() => setPortalTarget(null)}
          organizationId={organizationId}
          roomNumber={portalTarget.room?.room_number}
          tenant={portalTarget.tenant}
        />
      ) : null}
    </div>
  );
}
