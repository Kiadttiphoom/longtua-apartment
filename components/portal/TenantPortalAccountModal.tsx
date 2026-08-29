"use client";

import { createTenantPortalAccountAction, updateTenantPortalAccountAction } from "@/app/(portal)/resource-actions";
import { Field, Modal, PortalForm } from "@/components/portal/PortalUI";
import type { Tenant } from "@/components/portal/types";
import type { TenantPortalAccountSummary } from "@/lib/portal/tenant-accounts";

export function TenantPortalAccountModal({ organizationId, tenant, account, roomNumber, onClose }: {
  organizationId: string;
  tenant: Tenant;
  account?: TenantPortalAccountSummary;
  roomNumber?: string;
  onClose: () => void;
}) {
  const context = roomNumber ? ` ผู้เช่าหลักของห้อง ${roomNumber}` : "";
  const editing = Boolean(account);

  return <Modal title={editing ? "จัดการบัญชี Tenant Portal" : "เปิดบัญชี Tenant Portal"} description={`กำหนดข้อมูลเข้าสู่ระบบให้ ${tenant.full_name}${context}`} onClose={onClose}>
    <PortalForm
      action={editing ? updateTenantPortalAccountAction : createTenantPortalAccountAction}
      organizationId={organizationId}
      validate={(values) => {
        const errors: Record<string, string> = {};
        const username = String(values.username ?? "");
        const password = String(values.temporaryPassword ?? "");
        if (!/^[a-z0-9][a-z0-9._-]{2,28}[a-z0-9]$/.test(username)) errors.username = "ใช้ภาษาอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง 4–30 ตัว";
        if ((!editing || password) && password.length < 8) errors.temporaryPassword = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
        return errors;
      }}
      onSuccess={onClose}
      submitLabel={editing ? "บันทึกบัญชี" : "เปิดบัญชีผู้เช่า"}
    >
      {(errors, clear) => <>
        <input name="tenantId" type="hidden" value={tenant.id} />
        <div className="portal-readonly"><span>ผู้เช่า</span><strong>{tenant.full_name}</strong></div>
        {roomNumber ? <div className="portal-readonly"><span>ห้องตามสัญญาปัจจุบัน</span><strong>{roomNumber}</strong></div> : null}
        <Field label="ชื่อผู้ใช้" name="username" required defaultValue={account?.username} placeholder={roomNumber ? `เช่น tenant.${roomNumber}` : "เช่น tenant.101"} error={errors.username} clear={clear} />
        <Field label={editing ? "รหัสผ่านใหม่" : "รหัสผ่านชั่วคราว"} name="temporaryPassword" required={!editing} type="password" placeholder={editing ? "เว้นว่างหากไม่ต้องการเปลี่ยน" : "อย่างน้อย 8 ตัวอักษร"} error={errors.temporaryPassword} clear={clear} />
        <div className="billing-method-hint">{editing ? "แก้ชื่อผู้ใช้ได้ หรือกรอกรหัสผ่านใหม่เพื่อรีเซ็ตรหัสผ่านของผู้เช่า" : "บัญชีนี้เป็นของผู้เช่า ไม่ได้ติดกับห้อง เมื่อย้ายห้องระบบจะอ้างอิงสัญญาใหม่โดยใช้บัญชีเดิม"}</div>
      </>}
    </PortalForm>
  </Modal>;
}
