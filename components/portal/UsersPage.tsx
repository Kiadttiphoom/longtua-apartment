"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LayoutGrid,
  List,
  Lock,
  Pencil,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  createOrganizationMemberAction,
  deleteOrganizationMemberAction,
  updateOrganizationMemberAction,
} from "@/app/(portal)/resource-actions";
import { CollectionToolbar } from "@/components/portal/CollectionToolbar";
import { SelectControl } from "@/components/ui/SelectControl";
import {
  DataTable,
  DeleteButton,
  EditButton,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  SelectField,
  StatusBadge,
} from "@/components/portal/PortalUI";

export type PortalMember = {
  id: string;
  userId: string;
  name: string;
  username: string;
  roleCode: string;
  roleName: string;
  scope?: string;
  status: "active" | "pending" | "inactive";
  joinedAt: string;
};

export function UsersPage({
  organizationId,
  members: initialMembers,
  properties = [],
  canCreate,
  canEdit,
}: {
  organizationId: string;
  members: PortalMember[];
  properties?: Array<{ id: string; name: string }>;
  canCreate: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [members, setMembers] = useState<PortalMember[]>(initialMembers);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<PortalMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<PortalMember | null>(null);

  // Invite modal form states
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState("staff");
  const [inviteScope, setInviteScope] = useState("all");
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Edit / Password reset state
  const [resetPassword, setResetPassword] = useState("");

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  function showToast(msg: string) {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(""), 2800);
  }

  const propertyOptions = useMemo(() => {
    const list = [{ value: "all", label: "ทุกหอพักของกิจการ (ดูแลทั้งหมด)" }];
    properties.forEach((p) => {
      list.push({ value: p.name, label: p.name });
    });
    return list;
  }, [properties]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return members.filter((m) => {
      const matchesSearch =
        !keyword ||
        [m.name, m.username, m.roleName, m.scope].some((v) =>
          v?.toLowerCase().includes(keyword)
        );
      const matchesRole = roleFilter === "all" || m.roleCode === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, query, roleFilter]);

  const roleColors: Record<string, { bg: string; text: string; border: string; badgeBg: string }> = {
    owner: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badgeBg: "bg-purple-600 text-white shadow-purple-500/25" },
    manager: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badgeBg: "bg-blue-600 text-white shadow-blue-500/25" },
    accounting: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badgeBg: "bg-emerald-600 text-white shadow-emerald-500/25" },
    staff: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badgeBg: "bg-amber-600 text-white shadow-amber-500/25" },
  };

  const inviteRoleOptions = useMemo(() => [
    { value: "manager", label: "ผู้จัดการ (Manager)", description: "ดูแลสัญญาและห้องพัก" },
    { value: "accounting", label: "ฝ่ายการเงิน (Accounting)", description: "ออกบิลและรับชำระ" },
    { value: "staff", label: "เจ้าหน้าที่ (Staff)", description: "จดมิเตอร์และดูสถานะ" },
  ], []);

  const editRoleOptions = useMemo(() => [
    { value: "owner", label: "เจ้าของกิจการ (Owner)", description: "สิทธิ์สูงสุดดูแลทุกส่วน" },
    { value: "manager", label: "ผู้จัดการ (Manager)", description: "ดูแลสัญญาและห้องพัก" },
    { value: "accounting", label: "ฝ่ายการเงิน (Accounting)", description: "ออกบิลและรับชำระ" },
    { value: "staff", label: "เจ้าหน้าที่ (Staff)", description: "จดมิเตอร์และดูสถานะ" },
  ], []);

  function handleSendInvite() {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast("กรุณากรอกชื่อและชื่อผู้ใช้/อีเมล");
      return;
    }

    if (!invitePassword || invitePassword.length < 6) {
      showToast("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    const formData = new FormData();
    formData.set("organizationId", organizationId);
    formData.set("fullName", inviteName.trim());
    formData.set("username", inviteEmail.trim());
    formData.set("password", invitePassword);
    formData.set("roleCode", inviteRole);

    startTransition(async () => {
      const res = await createOrganizationMemberAction(formData);
      if (res.ok) {
        setShowInviteModal(false);
        setInviteName("");
        setInviteEmail("");
        setInvitePassword("");
        setInviteRole("staff");
        setInviteScope("all");
        showToast(res.message);
        router.refresh();
      } else {
        showToast(res.message);
      }
    });
  }

  function handleSaveEdit() {
    if (!editingMember) return;

    const updatedMember = {
      ...editingMember,
      scope: editingMember.scope === "all" ? "ทุกหอพัก" : editingMember.scope,
    };
    setMembers((prev) =>
      prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
    );

    const formData = new FormData();
    formData.set("organizationId", organizationId);
    formData.set("memberId", editingMember.id);
    formData.set("roleCode", editingMember.roleCode);
    if (resetPassword.trim()) {
      formData.set("newPassword", resetPassword.trim());
    }

    startTransition(async () => {
      const res = await updateOrganizationMemberAction(formData);
      if (res.ok) {
        setEditingMember(null);
        setResetPassword("");
        showToast(res.message);
        router.refresh();
      } else {
        showToast(res.message);
      }
    });
  }

  function handleDeleteUser() {
    if (!deletingMember) return;

    const formData = new FormData();
    formData.set("organizationId", organizationId);
    formData.set("memberId", deletingMember.id);

    startTransition(async () => {
      const res = await deleteOrganizationMemberAction(formData);
      if (res.ok) {
        setDeletingMember(null);
        showToast(res.message);
        router.refresh();
      } else {
        showToast(res.message);
      }
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {toastMessage ? (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      {/* Page Header */}
      <PageHeader
        actionLabel={canCreate ? "เพิ่มผู้ใช้ใหม่" : undefined}
        description="กำหนดระดับสิทธิ์ รหัสผ่านเข้าใช้งาน ขอบเขตสาขา/หอพัก และสถานะ"
        onAction={() => setShowInviteModal(true)}
        title="ผู้ใช้งาน"
      />

      {/* 4-Metric Hero Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0">
              <Users size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ผู้ใช้งานทั้งหมด</span>
              <strong className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 block">
                {members.length.toLocaleString("th-TH")} คน
              </strong>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <UserCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">เปิดใช้งานอยู่</span>
              <strong className="text-2xl font-black text-emerald-800 tracking-tight tabular-nums mt-0.5 block">
                {members.filter((m) => m.status === "active").length.toLocaleString("th-TH")} คน
              </strong>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 text-white shadow-md shadow-purple-500/25 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">เจ้าของกิจการ</span>
              <strong className="text-2xl font-black text-purple-900 tracking-tight tabular-nums mt-0.5 block">
                {members.filter((m) => m.roleCode === "owner").length.toLocaleString("th-TH")} คน
              </strong>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
              <KeyRound size={20} strokeWidth={2.2} />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-500 block">ทีมงาน & เจ้าหน้าที่</span>
              <strong className="text-2xl font-black text-amber-900 tracking-tight tabular-nums mt-0.5 block">
                {members.filter((m) => m.roleCode !== "owner").length.toLocaleString("th-TH")} คน
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
              <List size={15} strokeWidth={2.2} />
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
        description={`แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${members.length.toLocaleString("th-TH")} ผู้ใช้งาน`}
        filter={{
          label: "กรองระดับผู้ใช้งาน",
          value: roleFilter,
          onChange: setRoleFilter,
          options: [
            { value: "all", label: "ทุกระดับ" },
            { value: "owner", label: "เจ้าของกิจการ" },
            { value: "manager", label: "ผู้จัดการ" },
            { value: "accounting", label: "ฝ่ายการเงิน" },
            { value: "staff", label: "เจ้าหน้าที่" },
          ],
        }}
        onQueryChange={setQuery}
        placeholder="ค้นหาชื่อ อีเมล ระดับ หรือชื่อหอพัก"
        query={query}
        title="รายชื่อผู้ใช้งาน"
      />

      {filtered.length ? (
        viewMode === "table" ? (
          <div className="w-full">
            <DataTable
              headers={["ผู้ใช้งาน", "ชื่อผู้ใช้ / อีเมล", "ระดับสิทธิ์", "หอพักที่ดูแล", "สถานะ", "การจัดการ"]}
              rows={filtered.map((row) => {
                const color = roleColors[row.roleCode] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
                return [
                  <div className="flex items-center gap-3.5" key="user">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${color.bg} ${color.text} ${color.border} shadow-2xs`}>
                      {row.name.slice(0, 1)}
                    </span>
                    <div>
                      <strong className="text-slate-900 font-bold text-sm block">{row.name}</strong>
                      <span className="text-[11px] text-slate-400 block mt-0.5">เข้าร่วมเมื่อ: {row.joinedAt || "—"}</span>
                    </div>
                  </div>,
                  <span key="username" className="text-slate-700 font-mono text-xs font-semibold bg-slate-100/80 px-2 py-1 rounded-md border border-slate-200/60">
                    {row.username}
                  </span>,
                  <span key="role" className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${color.bg} ${color.text} ${color.border}`}>
                    {row.roleName}
                  </span>,
                  <div key="scope" className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                    <Building2 size={13} className="text-slate-400 shrink-0" />
                    <span>{row.scope || "ทุกหอพัก"}</span>
                  </div>,
                  <StatusBadge key="status" status={row.status} />,
                  <div className="inline-flex items-center gap-2 justify-end" key="actions">
                    <button
                      className="h-8.5 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs"
                      onClick={() => setEditingMember(row)}
                      title="แก้ไขข้อมูล / เปลี่ยนรหัสผ่าน"
                      type="button"
                    >
                      <Pencil size={13} strokeWidth={2.2} />
                      <span>แก้ไข</span>
                    </button>
                    {row.roleCode !== "owner" ? (
                      <button
                        className="h-8.5 w-8.5 rounded-xl flex items-center justify-center text-xs font-bold bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                        onClick={() => setDeletingMember(row)}
                        title="ลบผู้ใช้งาน"
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
            {filtered.map((m) => {
              const color = roleColors[m.roleCode] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", badgeBg: "bg-slate-600 text-white" };
              return (
                <article
                  className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  key={m.id}
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                  <div>
                    {/* Header */}
                    <header className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-md shrink-0 ${color.badgeBg} group-hover:scale-105 transition-transform`}>
                          {m.name.slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <h2 className="text-base font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {m.name}
                          </h2>
                          <span className="text-xs font-mono font-medium text-slate-500 block truncate mt-0.5">
                            {m.username}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={m.status} />
                    </header>

                    {/* Role & Scope Badges */}
                    <div className="space-y-2.5 my-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                        <span className="text-slate-400 font-medium">ระดับสิทธิ์</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold border ${color.bg} ${color.text} ${color.border}`}>
                          {m.roleName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                        <span className="text-slate-400 font-medium">หอพักที่ดูแล</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Building2 size={13} className="text-slate-400" />
                          {m.scope || "ทุกหอพัก"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <footer className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <button
                      className="h-9.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all shadow-2xs cursor-pointer"
                      onClick={() => setEditingMember(m)}
                      title="แก้ไข / เปลี่ยนรหัสผ่าน"
                      type="button"
                    >
                      <Pencil size={14} strokeWidth={2.2} />
                      <span>แก้ไข / รีเซ็ต</span>
                    </button>
                    {m.roleCode !== "owner" ? (
                      <button
                        aria-label={`ลบผู้ใช้ ${m.name}`}
                        className="h-9.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
                        onClick={() => setDeletingMember(m)}
                        title="ลบผู้ใช้"
                        type="button"
                      >
                        <Trash2 size={14} strokeWidth={2.2} />
                        <span>ลบผู้ใช้</span>
                      </button>
                    ) : (
                      <div className="h-9.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 select-none">
                        <ShieldCheck size={14} strokeWidth={2.2} />
                        <span>เจ้าของหลัก</span>
                      </div>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        )
      ) : (
        <EmptyState
          description="ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา"
          title="ไม่พบผู้ใช้งาน"
        />
      )}

      {/* Modal: Invite User */}
      {showInviteModal ? (
        <Modal
          description="กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้ใหม่ กำหนดระดับสิทธิ์ และตั้งรหัสผ่านเริ่มต้น"
          onClose={() => setShowInviteModal(false)}
          title="เพิ่มผู้ใช้งานใหม่"
        >
          <div className="p-6 space-y-4 text-xs">
            {/* Value / Security Banner */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Sparkles size={13} strokeWidth={2.2} />
              </span>
              <div className="leading-relaxed">
                <strong className="font-bold block text-blue-950">กำหนดสิทธิ์ตามบทบาทงาน</strong>
                <span className="text-[11px] text-blue-800/80">ระบบจะจำกัดการเข้าถึงข้อมูลตามระดับสิทธิ์และหอพักที่มอบหมายอย่างปลอดภัย</span>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>ชื่อ-นามสกุล <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-400 font-normal">เช่น นายสมศักดิ์ จัดการดี</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Users size={16} strokeWidth={2.2} />
                </span>
                <input
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all placeholder:text-slate-400"
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุลผู้ใช้งาน"
                  type="text"
                  value={inviteName}
                  autoFocus
                />
              </div>
            </div>

            {/* Username / Email */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>ชื่อผู้ใช้ / อีเมล (Login Username) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-400 font-normal">ใช้สำหรับเข้าสู่ระบบ</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <UserCheck size={16} strokeWidth={2.2} />
                </span>
                <input
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-mono font-bold transition-all placeholder:text-slate-400"
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="เช่น somsak@apartment.com หรือ somsak01"
                  type="text"
                  value={inviteEmail}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>รหัสผ่านเริ่มต้น <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-400 font-normal">อย่างน้อย 6 ตัวอักษร</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock size={16} strokeWidth={2.2} />
                </span>
                <input
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none text-slate-900 text-xs font-bold transition-all placeholder:text-slate-400"
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านเริ่มต้น (สามารถเปลี่ยนภายหลังได้)"
                  type={showPassword ? "text" : "password"}
                  value={invitePassword}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  type="button"
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}
                </button>
              </div>
            </div>

            {/* Role / ระดับสิทธิ์ */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Shield size={14} className="text-slate-500" />
                  <span>ระดับสิทธิ์การใช้งาน</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">กำหนดขอบเขตอำนาจ</span>
              </label>
              <SelectControl
                ariaLabel="ระดับสิทธิ์การใช้งาน"
                options={inviteRoleOptions}
                value={inviteRole}
                onValueChange={(val) => setInviteRole(val)}
                placeholder="เลือกระดับสิทธิ์"
              />
            </div>

            {/* Scope / Property Assigned */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-slate-500" />
                  <span>หอพักที่มอบหมายให้ดูแล</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">ขอบเขตสาขา</span>
              </label>
              <SelectControl
                ariaLabel="หอพักที่มอบหมายให้ดูแล"
                options={propertyOptions}
                value={inviteScope}
                onValueChange={(val) => setInviteScope(val)}
                placeholder="เลือกหอพักที่ดูแล"
              />
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                className="px-4.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                onClick={() => setShowInviteModal(false)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-98"
                disabled={isPending || !inviteName.trim() || !inviteEmail.trim() || invitePassword.length < 6}
                onClick={handleSendInvite}
                type="button"
              >
                <UserPlus size={15} strokeWidth={2.2} />
                <span>{isPending ? "กำลังบันทึก..." : "ยืนยันสร้างผู้ใช้งาน"}</span>
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Modal: Edit Member & Password Reset */}
      {editingMember ? (
        <Modal
          description={`แก้ไขระดับสิทธิ์และหอพักที่ดูแลสำหรับ ${editingMember.name}`}
          onClose={() => {
            setEditingMember(null);
            setResetPassword("");
          }}
          title={`แก้ไขผู้ใช้งาน: ${editingMember.name}`}
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
              <input
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-not-allowed"
                disabled
                type="text"
                value={editingMember.name}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อผู้ใช้ / อีเมล</label>
              <input
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 cursor-not-allowed"
                disabled
                type="text"
                value={editingMember.username}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Shield size={13} className="text-slate-500" />
                  <span>ระดับสิทธิ์</span>
                </label>
                <SelectControl
                  ariaLabel="ระดับสิทธิ์"
                  disabled={editingMember.roleCode === "owner"}
                  options={editRoleOptions}
                  value={editingMember.roleCode}
                  onValueChange={(val) =>
                    setEditingMember({
                      ...editingMember,
                      roleCode: val,
                      roleName: val === "owner" ? "เจ้าของกิจการ" : val === "manager" ? "ผู้จัดการ" : val === "accounting" ? "ฝ่ายการเงิน" : "เจ้าหน้าที่",
                    })
                  }
                  placeholder="เลือกระดับสิทธิ์"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">หอพักที่ดูแล</label>
                <SelectControl
                  ariaLabel="หอพักที่ดูแล"
                  disabled={editingMember.roleCode === "owner"}
                  options={propertyOptions}
                  value={editingMember.scope === "ทุกหอพัก" ? "all" : editingMember.scope || "all"}
                  onValueChange={(val) =>
                    setEditingMember({
                      ...editingMember,
                      scope: val === "all" ? "ทุกหอพัก" : val,
                    })
                  }
                  placeholder="เลือกหอพักที่ดูแล"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Lock size={13} className="text-amber-600" />
                ตั้งรหัสผ่านใหม่ (Reset Password)
              </label>
              <input
                className="w-full h-9 px-3 rounded-lg border border-amber-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน"
                type="text"
                value={resetPassword}
              />
              <p className="text-[11px] text-amber-700/80">กรอกรหัสผ่านใหม่ที่นี่เพื่อตั้งรหัสผ่านให้ผู้ใช้รายนี้ทันที</p>
            </div>

            <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                onClick={() => {
                  setEditingMember(null);
                  setResetPassword("");
                }}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                disabled={isPending}
                onClick={handleSaveEdit}
                type="button"
              >
                {isPending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Modal: Delete Member */}
      {deletingMember ? (
        <Modal
          description={`คุณแน่ใจหรือไม่ว่าต้องการลบ ${deletingMember.name} ออกจากระบบ?`}
          onClose={() => setDeletingMember(null)}
          title="ยืนยันการลบผู้ใช้งาน"
        >
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              ผู้ใช้รายนี้จะไม่สามารถเข้าสู่ระบบและจัดการข้อมูลของกิจการได้อีกต่อไป การดำเนินการนี้ไม่สามารถเรียกคืนได้
            </p>
            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                onClick={() => setDeletingMember(null)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
                disabled={isPending}
                onClick={handleDeleteUser}
                type="button"
              >
                {isPending ? "กำลังลบ..." : "ยืนยันลบผู้ใช้งาน"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
