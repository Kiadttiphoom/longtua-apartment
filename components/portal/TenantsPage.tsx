"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CreditCard,
  Hash,
  KeyRound,
  LayoutGrid,
  ListFilter,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserMinus,
  UserRound,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { createTenantAction, deleteTenantAction, updateTenantAction } from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  DeleteConfirmation,
  EmptyState,
  Modal,
  PageHeader,
  PortalForm,
  StatusBadge,
} from "@/components/portal/PortalUI";
import { SelectControl } from "@/components/ui/SelectControl";
import { TenantPortalAccountModal } from "@/components/portal/TenantPortalAccountModal";
import type { Lease, Tenant } from "@/components/portal/types";
import type { TenantPortalAccountSummary } from "@/lib/portal/tenant-accounts";
import { validateTenant } from "@/lib/portal/validation.mjs";

export function TenantsPage({
  organizationId,
  items,
  leases = [],
  portalAccounts,
  canCreate,
  canEdit,
  canDelete = false,
}: {
  organizationId: string;
  items: Tenant[];
  leases?: Lease[];
  portalAccounts: TenantPortalAccountSummary[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete?: boolean;
}) {
  const [selected, setSelected] = useState<Tenant | "create" | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [portalTarget, setPortalTarget] = useState<Tenant | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editingStatus, setEditingStatus] = useState("active");

  const editing = selected && selected !== "create" ? selected : null;
  const accountMap = useMemo(
    () => new Map(portalAccounts.map((account) => [account.tenantId, account])),
    [portalAccounts]
  );

  const activeCount = useMemo(() => items.filter((item) => item.status === "active").length, [items]);
  const formerCount = useMemo(() => items.filter((item) => item.status === "former").length, [items]);
  const portalCount = useMemo(() => portalAccounts.length, [portalAccounts]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th");
    return items.filter(
      (item) =>
        (status === "all" || item.status === status) &&
        (!keyword ||
          [item.full_name, item.phone, item.email, item.address].some((value) =>
            value?.toLocaleLowerCase("th").includes(keyword)
          ))
    );
  }, [items, query, status]);

  return (
    <>
      <PageHeader
        actionLabel={canCreate ? "เพิ่มผู้เช่า" : undefined}
        description="ทะเบียนผู้เช่า ข้อมูลติดต่อ และสถานะผู้พักอาศัยของทุกอาคาร"
        onAction={() => {
          setEditingStatus("active");
          setSelected("create");
        }}
        title="ผู้เช่า"
      />

      {/* 4-Metric Hero Stat Cards (Identical style to /users and /guestrooms) */}
      <section aria-label="ภาพรวมผู้เช่า" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Tenants */}
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
              <Users size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ผู้เช่าทั้งหมด</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {items.length.toLocaleString("th-TH")} คน
              </strong>
            </div>
          </div>
        </button>

        {/* Card 2: Active Tenants */}
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
              <UserCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">กำลังพักอาศัย</span>
              <strong className="text-2xl font-black text-emerald-800 tracking-tight tabular-nums mt-0.5 block">
                {activeCount.toLocaleString("th-TH")} คน
              </strong>
            </div>
          </div>
        </button>

        {/* Card 3: Former Tenants */}
        <button
          className={`relative overflow-hidden p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            status === "former"
              ? "bg-white border-slate-600 shadow-md ring-2 ring-slate-500/20"
              : "bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300"
          }`}
          onClick={() => setStatus("former")}
          type="button"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-slate-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-600 to-slate-700 text-white shadow-md shadow-slate-500/25 flex items-center justify-center shrink-0">
              <UserMinus size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ผู้เช่าเดิม</span>
              <strong className="text-2xl font-black text-slate-800 tracking-tight tabular-nums mt-0.5 block">
                {formerCount.toLocaleString("th-TH")} คน
              </strong>
            </div>
          </div>
        </button>

        {/* Card 4: Tenant Portal Accounts */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 text-white shadow-md shadow-purple-500/25 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">บัญชี Tenant Portal</span>
              <strong className="text-2xl font-black text-purple-900 tracking-tight tabular-nums mt-0.5 block">
                {portalCount.toLocaleString("th-TH")} บัญชี
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Collection Toolbar */}
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
        description={`พบ ${filtered.length.toLocaleString("th-TH")} จาก ${items.length.toLocaleString("th-TH")} คน`}
        filter={{
          label: "กรองสถานะผู้เช่า",
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "ทุกสถานะ" },
            { value: "active", label: "กำลังใช้งาน" },
            { value: "former", label: "ผู้เช่าเดิม" },
            { value: "blocked", label: "ระงับการใช้งาน" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาชื่อ เบอร์โทร อีเมล หรือที่อยู่"
        query={query}
        title="รายชื่อผู้เช่า"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full mb-6">
            <DataTable
              headers={[
                "ชื่อผู้เช่า / บัตรประชาชน",
                "เบอร์โทรศัพท์ / อีเมล",
                "ที่อยู่ติดต่อ",
                "บัญชีเข้าใช้",
                "สถานะ",
                "การจัดการ",
              ]}
              rows={filtered.map((item) => {
                const account = accountMap.get(item.id);
                return [
                  <div className="flex items-center gap-3.5" key="name">
                    <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 font-bold text-sm shadow-2xs">
                      {item.full_name.slice(0, 1)}
                    </span>
                    <div className="flex flex-col text-xs min-w-0">
                      <strong className="text-slate-900 font-bold truncate">{item.full_name}</strong>
                      <small className="text-slate-400 mt-0.5 font-medium font-mono">
                        {item.id_card_last4
                          ? `บัตร ปชช. •••• ${item.id_card_last4}`
                          : "ไม่ระบุบัตร ปชช."}
                      </small>
                    </div>
                  </div>,
                  <div className="flex flex-col text-xs" key="contact">
                    <strong className="text-slate-800 font-bold font-mono">{item.phone ? `โทร. ${item.phone}` : "ไม่มีเบอร์โทร"}</strong>
                    <small className="text-slate-400 mt-0.5">{item.email || "ไม่มีอีเมล"}</small>
                  </div>,
                  <span className="text-xs text-slate-600 max-w-xs truncate" key="addr">
                    {item.address || "—"}
                  </span>,
                  <div key="account">
                    {account ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs">
                        <UserRoundCheck size={13} strokeWidth={2.2} />
                        <span>{account.username}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-400 bg-slate-100">
                        ยังไม่มีบัญชี
                      </span>
                    )}
                  </div>,
                  <StatusBadge key="status" status={item.status} />,
                  <div className="inline-flex items-center gap-1.5 justify-end" key="actions">
                    <button
                      className="h-8.5 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                      onClick={() => setPortalTarget(item)}
                      title={account ? "จัดการบัญชีผู้เช่า" : "สร้างบัญชีผู้เช่า"}
                      type="button"
                    >
                      <UserRoundCheck size={14} strokeWidth={2.2} />
                      <span>{account ? "จัดการบัญชี" : "สร้างบัญชี"}</span>
                    </button>
                    {canEdit ? (
                      <button
                        aria-label={`แก้ไขข้อมูล ${item.full_name}`}
                        className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                        onClick={() => {
                          setEditingStatus(item.status);
                          setSelected(item);
                        }}
                        title="แก้ไขข้อมูลผู้เช่า"
                        type="button"
                      >
                        <Pencil size={14} strokeWidth={2.2} />
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        aria-label={`ลบข้อมูล ${item.full_name}`}
                        className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                        onClick={() => setDeletingTenant(item)}
                        title="ลบข้อมูลผู้เช่า"
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
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {filtered.map((item) => {
              const account = accountMap.get(item.id);
              return (
                <article
                  className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  key={item.id}
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                  <div>
                    {/* Header */}
                    <header className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0 group-hover:scale-105 transition-transform">
                          {item.full_name.slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <h2 className="text-base font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {item.full_name}
                          </h2>
                          <span className="text-xs font-mono font-medium text-slate-400 block truncate mt-0.5">
                            {item.id_card_last4
                              ? `บัตร ปชช. •••• ${item.id_card_last4}`
                              : "ไม่ระบุบัตร ปชช."}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </header>

                    {/* Contact info list */}
                    <div className="space-y-2 my-4">
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                        <Phone size={14} className="text-slate-400 shrink-0" strokeWidth={2.2} />
                        <span className="font-bold text-slate-800 font-mono">{item.phone || "ยังไม่มีเบอร์โทรศัพท์"}</span>
                      </div>
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                        <Mail size={14} className="text-slate-400 shrink-0" strokeWidth={2.2} />
                        <span className="text-slate-700 truncate font-medium">{item.email || "ยังไม่มีอีเมล"}</span>
                      </div>
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                        <MapPin size={14} className="text-slate-400 shrink-0" strokeWidth={2.2} />
                        <span className="text-slate-600 truncate">{item.address || "ยังไม่มีที่อยู่"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <footer className="mt-2 pt-3.5 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-slate-400 font-medium">สถานะบัญชี</span>
                      {account ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <UserRoundCheck size={13} strokeWidth={2.2} />
                          <span>{account.username}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-normal">ยังไม่มีบัญชีเข้าใช้</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        aria-label={`${account ? "จัดการ" : "เปิด"}บัญชี Tenant Portal ให้ ${item.full_name}`}
                        className="h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                        onClick={() => setPortalTarget(item)}
                        title={account ? "จัดการบัญชีผู้เช่า" : "เปิดบัญชีผู้เช่า"}
                        type="button"
                      >
                        <UserRoundCheck size={14} strokeWidth={2.2} />
                        <span>{account ? "จัดการบัญชี" : "สร้างบัญชี"}</span>
                      </button>
                      {canEdit ? (
                        <button
                          aria-label={`แก้ไขข้อมูล ${item.full_name}`}
                          className="h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                          onClick={() => {
                            setEditingStatus(item.status);
                            setSelected(item);
                          }}
                          title="แก้ไขผู้เช่า"
                          type="button"
                        >
                          <Pencil size={14} strokeWidth={2.2} />
                          <span>แก้ไขข้อมูล</span>
                        </button>
                      ) : null}
                    </div>
                    {canDelete ? (
                      <button
                        aria-label={`ลบข้อมูล ${item.full_name}`}
                        className="w-full mt-2 h-8 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                        onClick={() => setDeletingTenant(item)}
                        title="ลบข้อมูลผู้เช่า"
                        type="button"
                      >
                        <Trash2 size={13} strokeWidth={2.2} />
                        <span>ลบข้อมูลผู้เช่า</span>
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
          actionLabel={canCreate ? "เพิ่มผู้เช่าแรก" : undefined}
          description={
            items.length
              ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ"
              : "เพิ่มผู้เช่าก่อนนำไปผูกกับห้องพักในสัญญาเช่า"
          }
          onAction={() => {
            setEditingStatus("active");
            setSelected("create");
          }}
          title={items.length ? "ไม่พบผู้เช่าที่ค้นหา" : "ยังไม่มีผู้เช่า"}
        />
      )}

      {/* Add / Edit Tenant Modal */}
      {selected ? (
        <Modal
          description={
            editing
              ? `ปรับปรุงข้อมูลและช่องทางติดต่อของ ${editing.full_name}`
              : "กรอกข้อมูลผู้เช่าเพื่อใช้ในการทำสัญญา ออกใบแจ้งหนี้ และสร้างบัญชีเข้าใช้"
          }
          onClose={() => setSelected(null)}
          title={editing ? "แก้ไขข้อมูลผู้เช่า" : "เพิ่มผู้เช่าใหม่"}
        >
          <PortalForm
            action={editing ? updateTenantAction : createTenantAction}
            onCancel={() => setSelected(null)}
            onSuccess={() => setSelected(null)}
            organizationId={organizationId}
            submitLabel={editing ? "บันทึกการแก้ไข" : "ยืนยันเพิ่มผู้เช่า"}
            validate={validateTenant}
          >
            {(errors, clear) => (
              <div className="space-y-4 text-xs">
                {editing ? <input name="tenantId" type="hidden" value={editing.id} /> : null}
                
                {/* Value Banner */}
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles size={13} strokeWidth={2.2} />
                  </span>
                  <div className="leading-relaxed">
                    <strong className="font-bold block text-blue-950">ข้อมูลผู้เช่าและเอกสารสัญญา</strong>
                    <span className="text-[11px] text-blue-800/80">
                      ระบบจะเชื่อมโยงข้อมูลผู้เช่าเพื่อใช้ทำสัญญาเช่า ออกใบแจ้งหนี้ และเปิดสิทธิ์ Tenant Portal
                    </span>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UserRound size={14} className="text-slate-500" />
                      <span>ชื่อ-นามสกุล <span className="text-rose-500">*</span></span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">เช่น นายสมมุติ ศรีสระเกษ</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <UserRound size={16} strokeWidth={2.2} />
                    </span>
                    <input
                      autoFocus
                      aria-invalid={Boolean(errors.fullName)}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all placeholder:text-slate-400"
                      defaultValue={editing?.full_name}
                      name="fullName"
                      onChange={() => clear("fullName")}
                      placeholder="กรอกชื่อและนามสกุลผู้เช่า"
                    />
                  </div>
                  {errors.fullName ? (
                    <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.fullName}</p>
                  ) : null}
                </div>

                {/* Phone & Email */}
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

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail size={14} className="text-slate-500" />
                        <span>อีเมล (Email)</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">รับใบแจ้งหนี้</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Mail size={16} strokeWidth={2.2} />
                      </span>
                      <input
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-medium transition-all placeholder:text-slate-400"
                        defaultValue={editing?.email ?? ""}
                        name="email"
                        onChange={() => clear("email")}
                        placeholder="example@email.com"
                        type="email"
                      />
                    </div>
                    {errors.email ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.email}</p>
                    ) : null}
                  </div>
                </div>

                {/* ID Card & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CreditCard size={14} className="text-slate-500" />
                        <span>เลขบัตร ปชช. 4 ตัวท้าย</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">เช่น 1234</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <CreditCard size={16} strokeWidth={2.2} />
                      </span>
                      <input
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold font-mono transition-all placeholder:text-slate-400"
                        defaultValue={editing?.id_card_last4 ?? ""}
                        maxLength={4}
                        name="idCardLast4"
                        onChange={() => clear("idCardLast4")}
                        placeholder="ระบุ 4 ตัวท้าย"
                      />
                    </div>
                    {errors.idCardLast4 ? (
                      <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.idCardLast4}</p>
                    ) : null}
                  </div>

                  {editing ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span>สถานะการพักอาศัย</span>
                        <span className="text-[11px] text-slate-400 font-normal">Status</span>
                      </label>
                      <input name="status" type="hidden" value={editingStatus} />
                      <SelectControl
                        ariaLabel="สถานะการพักอาศัย"
                        onValueChange={(val) => setEditingStatus(val)}
                        options={[
                          { value: "active", label: "กำลังใช้งาน (Active)" },
                          { value: "former", label: "ผู้เช่าเดิม (Former)" },
                          { value: "blocked", label: "ระงับการใช้งาน (Blocked)" },
                        ]}
                        value={editingStatus}
                      />
                    </div>
                  ) : null}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-500" />
                      <span>ที่อยู่ติดต่อ / ตามทะเบียนบ้าน</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">สำหรับพิมพ์ลงสัญญา</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <MapPin size={16} strokeWidth={2.2} />
                    </span>
                    <input
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all placeholder:text-slate-400"
                      defaultValue={editing?.address ?? ""}
                      name="address"
                      onChange={() => clear("address")}
                      placeholder="บ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                    />
                  </div>
                  {errors.address ? (
                    <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.address}</p>
                  ) : null}
                </div>
              </div>
            )}
          </PortalForm>
        </Modal>
      ) : null}

      {portalTarget ? (
        <TenantPortalAccountModal
          account={accountMap.get(portalTarget.id)}
          onClose={() => setPortalTarget(null)}
          organizationId={organizationId}
          tenant={portalTarget}
        />
      ) : null}

      {deletingTenant ? (
        <DeleteConfirmation
          action={deleteTenantAction}
          detail={`คุณต้องการลบข้อมูลผู้เช่า "${deletingTenant.full_name}" หรือไม่? หากผู้เช่านี้เคยมีประวัติสัญญาเช่าหรือใบแจ้งหนี้ ระบบจะป้องกันเพื่อรักษาประวัติ และแนะนำให้เปลี่ยนสถานะเป็น "ผู้เช่าเดิม" แทน`}
          entityField="tenantId"
          entityId={deletingTenant.id}
          onClose={() => setDeletingTenant(null)}
          organizationId={organizationId}
          subject={`กำลังจะลบผู้เช่า "${deletingTenant.full_name}"`}
          submitLabel="ยืนยันลบผู้เช่า"
          title={`ลบผู้เช่า ${deletingTenant.full_name}?`}
        />
      ) : null}
    </>
  );
}
