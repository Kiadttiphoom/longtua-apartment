"use client";

import { useState } from "react";
import { impersonateOrganizationAction } from "@/app/(admin)/admin/actions";
import { SelectControl } from "@/components/ui/SelectControl";

export function AdminManageOrganizationButton({
  organizationId,
  section,
}: {
  organizationId: string;
  section: string;
}) {
  return (
    <form action={impersonateOrganizationAction}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="section" value={section} />
      <button
        type="submit"
        className="whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer"
      >
        จัดการข้อมูล
      </button>
    </form>
  );
}

export function AdminManageOrganization({
  organizations,
  section,
}: {
  organizations: Array<{ id: string; name: string }>;
  section: string;
}) {
  const [selectedOrgId, setSelectedOrgId] = useState("");

  return (
    <form
      action={impersonateOrganizationAction}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4"
    >
      <input type="hidden" name="section" value={section} />
      <div className="flex-1 min-w-48 space-y-2 text-xs font-semibold text-slate-700">
        <label className="block">เลือกกิจการที่ต้องการจัดการข้อมูล</label>
        <SelectControl
          name="organizationId"
          placeholder="เลือกกิจการ"
          ariaLabel="เลือกกิจการที่ต้องการจัดการข้อมูล"
          value={selectedOrgId}
          onValueChange={(val) => setSelectedOrgId(val)}
          options={organizations.map((organization) => ({
            value: organization.id,
            label: organization.name,
          }))}
        />
      </div>
      <button
        type="submit"
        disabled={!selectedOrgId || !organizations.length}
        className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
      >
        เปิดหน้าจัดการ
      </button>
      <p className="w-full text-xs text-slate-600">
        แก้ไขข้อมูลในฐานะ Super Admin โดยระบบจะแสดงชื่อกิจการที่กำลังจัดการ
      </p>
    </form>
  );
}
