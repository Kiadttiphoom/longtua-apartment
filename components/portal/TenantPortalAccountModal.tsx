"use client";

import { KeyRound, Lock, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { createTenantPortalAccountAction, updateTenantPortalAccountAction } from "@/app/(portal)/resource-actions";
import { Modal, PortalForm } from "@/components/portal/PortalUI";
import type { Tenant } from "@/components/portal/types";
import type { TenantPortalAccountSummary } from "@/lib/portal/tenant-accounts";

export function TenantPortalAccountModal({
  organizationId,
  tenant,
  account,
  roomNumber,
  onClose,
}: {
  organizationId: string;
  tenant: Tenant;
  account?: TenantPortalAccountSummary;
  roomNumber?: string;
  onClose: () => void;
}) {
  const context = roomNumber ? ` · ห้อง ${roomNumber}` : "";
  const editing = Boolean(account);

  return (
    <Modal
      description={`กำหนดชื่อผู้ใช้และรหัสผ่านสำหรับเข้าสู่ระบบ Tenant Portal ของ ${tenant.full_name}${context}`}
      onClose={onClose}
      title={editing ? "จัดการบัญชี Tenant Portal" : "เปิดบัญชี Tenant Portal"}
    >
      <PortalForm
        action={editing ? updateTenantPortalAccountAction : createTenantPortalAccountAction}
        onCancel={onClose}
        onSuccess={onClose}
        organizationId={organizationId}
        submitLabel={editing ? "บันทึกการแก้ไขบัญชี" : "ยืนยันเปิดบัญชีผู้เช่า"}
        validate={(values) => {
          const errors: Record<string, string> = {};
          const username = String(values.username ?? "").trim();
          const password = String(values.temporaryPassword ?? "").trim();
          if (!/^[a-z0-9][a-z0-9._-]{2,28}[a-z0-9]$/.test(username)) {
            errors.username = "ใช้ภาษาอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง 4–30 ตัว (ตัวพิมพ์เล็ก)";
          }
          if ((!editing || password) && password.length < 8) {
            errors.temporaryPassword = "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร";
          }
          return errors;
        }}
      >
        {(errors, clear) => (
          <div className="space-y-4 text-xs">
            <input name="tenantId" type="hidden" value={tenant.id} />
            
            {/* Value Banner */}
            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Sparkles size={13} strokeWidth={2.2} />
              </span>
              <div className="leading-relaxed">
                <strong className="font-bold block text-purple-950">
                  {editing ? "การจัดการบัญชีผู้เช่า" : "สิทธิ์การเข้าใช้งาน Tenant Portal"}
                </strong>
                <span className="text-[11px] text-purple-800/80">
                  {editing
                    ? "คุณสามารถแก้ไข Username หรือกรอกรหัสผ่านใหม่เพื่อทำการรีเซ็ตรหัสผ่านได้ทันที"
                    : "บัญชีนี้จะผูกกับตัวบุคคลของผู้เช่า สามารถดูสัญญา แจ้งชำระเงิน และดูใบเสร็จออนไลน์ได้"}
                </span>
              </div>
            </div>

            {/* Tenant Info Pill */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <UserRound size={15} className="text-slate-400" />
                <span>ผู้เช่า</span>
              </span>
              <strong className="text-slate-900 font-bold text-xs">{tenant.full_name}</strong>
            </div>

            {roomNumber ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">ห้องพักตามสัญญาปัจจุบัน</span>
                <strong className="text-blue-700 font-bold font-mono">ห้อง {roomNumber}</strong>
              </div>
            ) : null}

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound size={14} className="text-slate-500" />
                  <span>ชื่อผู้ใช้ (Username) <span className="text-rose-500">*</span></span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal font-mono">
                  {roomNumber ? `เช่น tenant.${roomNumber}` : "เช่น tenant.101"}
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <KeyRound size={16} strokeWidth={2.2} />
                </span>
                <input
                  autoFocus
                  aria-invalid={Boolean(errors.username)}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-500/15 outline-none text-slate-900 text-xs font-bold font-mono transition-all placeholder:text-slate-400"
                  defaultValue={account?.username}
                  name="username"
                  onChange={() => clear("username")}
                  placeholder={roomNumber ? `เช่น tenant.${roomNumber}` : "เช่น somchai.101"}
                />
              </div>
              {errors.username ? (
                <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.username}</p>
              ) : null}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock size={14} className="text-slate-500" />
                  <span>{editing ? "รหัสผ่านใหม่ (หากต้องการเปลี่ยน)" : "รหัสผ่านเริ่มต้น (Temporary Password) *"}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">อย่างน้อย 8 ตัวอักษร</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock size={16} strokeWidth={2.2} />
                </span>
                <input
                  aria-invalid={Boolean(errors.temporaryPassword)}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-500/15 outline-none text-slate-900 text-xs font-bold transition-all placeholder:text-slate-400"
                  name="temporaryPassword"
                  onChange={() => clear("temporaryPassword")}
                  placeholder={editing ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน" : "กำหนดรหัสผ่าน 8 ตัวอักษรขึ้นไป"}
                  type="password"
                />
              </div>
              {errors.temporaryPassword ? (
                <p className="mt-1 text-rose-600 text-[11px] font-bold">{errors.temporaryPassword}</p>
              ) : null}
            </div>
          </div>
        )}
      </PortalForm>
    </Modal>
  );
}
