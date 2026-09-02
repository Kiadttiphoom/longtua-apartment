import { AdminTable, money, thaiDate } from "@/components/admin/AdminPrimitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminViewContentProps } from "@/components/admin/admin-types";

export function AdminTenantViews({ tenants, organizationMap, tenantsReady }: Pick<AdminViewContentProps, "tenants" | "organizationMap" | "tenantsReady">) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายชื่อผู้เช่า</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">ผู้เช่าทั้งหมดในระบบ</h2>
      </div>

      <AdminTable
        headers={["กิจการ", "ชื่อผู้เช่า", "โทรศัพท์", "อีเมล", "สถานะ", "วันที่สร้าง"]}
        rows={tenants.map((item) => [
          organizationMap.get(item.organization_id) ?? "—",
          item.full_name,
          item.phone || "—",
          item.email || "—",
          <StatusBadge compact key="s" status={item.status} />,
          thaiDate(item.created_at),
        ])}
        empty={!tenantsReady ? "ตารางผู้เช่ายังไม่พร้อม" : "ยังไม่มีผู้เช่า"}
      />
    </section>
  );
}

export function AdminLeasesView({ leases, organizationMap, propertyMap, roomMap, tenantMap, leasesReady }: Pick<AdminViewContentProps, "leases" | "organizationMap" | "propertyMap" | "roomMap" | "tenantMap" | "leasesReady">) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">สัญญาเช่า</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">สัญญาเช่าทั้งหมดในระบบ</h2>
      </div>

      <AdminTable
        headers={["กิจการ", "เลขที่สัญญา", "หอ/ห้อง", "ผู้เช่า", "ระยะเวลา", "ค่าเช่า", "สถานะ"]}
        rows={leases.map((item) => [
          organizationMap.get(item.organization_id) ?? "—",
          item.lease_number,
          `${propertyMap.get(item.property_id) ?? "—"} / ${roomMap.get(item.room_id) ?? "—"}`,
          tenantMap.get(item.primary_tenant_id) ?? "—",
          `${thaiDate(item.start_date)} – ${thaiDate(item.end_date)}`,
          money(Number(item.rent_amount)),
          <StatusBadge compact key="s" status={item.status} />,
        ])}
        empty={!leasesReady ? "ตารางสัญญาเช่ายังไม่พร้อม" : "ยังไม่มีสัญญาเช่า"}
      />
    </section>
  );
}
