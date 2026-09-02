"use client";

import { useMemo, useState } from "react";
import {
  CreditCard,
  Hash,
  LayoutGrid,
  ListFilter,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserMinus,
  UserRound,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import {
  DataTable,
  PageHeader,
  StatusBadge,
} from "@/components/portal/PortalUI";
import type { PageContentProps } from "../types";

export function TenantsPage({ isLocked, onToast }: PageContentProps) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const tenants = useMemo(() => {
    return [
      {
        id: "t-001",
        full_name: "สมมุต ศรีสระเกษ",
        id_card_last4: "6811",
        phone: "089-123-4567",
        email: "sommut@gmail.com",
        address: "51/22 หมู่ 3 ต.บางเขน อ.เมือง จ.นนทบุรี 11000",
        username: "k101",
        status: "active" as const,
      },
    ];
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tenants.filter((item) => {
      const matchesSearch =
        !needle ||
        `${item.full_name} ${item.phone} ${item.email} ${item.address}`.toLowerCase().includes(needle);
      const matchesStatus = status === "all" || item.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [tenants, query, status]);

  const activeCount = useMemo(() => tenants.filter((t) => t.status === "active").length, [tenants]);
  const formerCount = useMemo(() => tenants.filter((t) => t.status !== "active").length, [tenants]);
  const portalCount = useMemo(() => tenants.filter((t) => Boolean(t.username)).length, [tenants]);

  return (
    <>
      <PageHeader
        actionLabel={!isLocked ? "เพิ่มผู้เช่า" : undefined}
        description="ทะเบียนผู้เช่า ข้อมูลติดต่อ และสถานะผู้พักอาศัยของทุกอาคาร"
        onAction={() => onToast("เปิดหน้าต่างเพิ่มผู้เช่าใหม่แล้ว")}
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
                {tenants.length.toLocaleString("th-TH")} คน
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
        description={`พบ ${filtered.length.toLocaleString("th-TH")} จาก ${tenants.length.toLocaleString("th-TH")} คน`}
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
              rows={filtered.map((item) => [
                <div className="flex items-center gap-3.5" key="name">
                  <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 font-bold text-sm shadow-2xs">
                    {item.full_name.slice(0, 1)}
                  </span>
                  <div className="flex flex-col text-xs min-w-0">
                    <strong className="text-slate-900 font-bold truncate">{item.full_name}</strong>
                    <small className="text-slate-400 mt-0.5 font-medium font-mono">
                      {item.id_card_last4 ? `บัตร ปชช. •••• ${item.id_card_last4}` : "ไม่ระบุบัตร ปชช."}
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
                  {item.username ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs">
                      <UserRoundCheck size={13} strokeWidth={2.2} />
                      <span>{item.username}</span>
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
                    onClick={() => onToast(`จัดการบัญชีผู้เช่า ${item.full_name}`)}
                    title="จัดการบัญชีผู้เช่า"
                    type="button"
                  >
                    <UserRoundCheck size={14} strokeWidth={2.2} />
                    <span>จัดการบัญชี</span>
                  </button>
                  <button
                    aria-label={`แก้ไขข้อมูล ${item.full_name}`}
                    className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                    onClick={() => onToast(`เปิดแบบฟอร์มแก้ไขข้อมูล ${item.full_name}`)}
                    title="แก้ไขข้อมูลผู้เช่า"
                    type="button"
                  >
                    <Pencil size={14} strokeWidth={2.2} />
                  </button>
                  <button
                    aria-label={`ลบข้อมูล ${item.full_name}`}
                    className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                    onClick={() => onToast(`ลบข้อมูลผู้เช่า ${item.full_name} เรียบร้อยแล้ว`)}
                    title="ลบข้อมูลผู้เช่า"
                    type="button"
                  >
                    <Trash2 size={14} strokeWidth={2.2} />
                  </button>
                </div>,
              ])}
            />
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {filtered.map((item) => (
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
                          {item.id_card_last4 ? `บัตร ปชช. •••• ${item.id_card_last4}` : "ยังไม่ได้ระบุบัตรประชาชน"}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </header>

                  {/* Contact Info List */}
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
                    {item.username ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <UserRoundCheck size={13} strokeWidth={2.2} />
                        <span>{item.username}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-normal">ยังไม่มีบัญชีเข้าใช้</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      aria-label={`จัดการบัญชีให้ ${item.full_name}`}
                      className="h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                      onClick={() => onToast(`จัดการบัญชีผู้เช่า ${item.full_name}`)}
                      title="จัดการบัญชีผู้เช่า"
                      type="button"
                    >
                      <UserRoundCheck size={14} strokeWidth={2.2} />
                      <span>จัดการบัญชี</span>
                    </button>
                    <button
                      aria-label={`แก้ไขข้อมูล ${item.full_name}`}
                      className="h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                      onClick={() => onToast(`เปิดแก้ไขข้อมูล ${item.full_name}`)}
                      title="แก้ไขผู้เช่า"
                      type="button"
                    >
                      <Pencil size={14} strokeWidth={2.2} />
                      <span>แก้ไขข้อมูล</span>
                    </button>
                  </div>
                  <button
                    aria-label={`ลบข้อมูล ${item.full_name}`}
                    className="w-full mt-2 h-8 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                    onClick={() => onToast(`ลบข้อมูลผู้เช่า ${item.full_name} เรียบร้อยแล้ว`)}
                    title="ลบข้อมูลผู้เช่า"
                    type="button"
                  >
                    <Trash2 size={13} strokeWidth={2.2} />
                    <span>ลบข้อมูลผู้เช่า</span>
                  </button>
                </footer>
              </article>
            ))}
          </section>
        )
      ) : null}
    </>
  );
}
