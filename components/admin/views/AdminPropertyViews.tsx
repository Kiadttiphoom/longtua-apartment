import { AdminManageOrganizationButton } from "@/components/admin/AdminManageOrganization";
import { AdminTable, money } from "@/components/admin/AdminPrimitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminViewContentProps } from "@/components/admin/admin-types";

export function AdminPropertiesView({ properties, rooms, organizationMap, propertiesReady }: Pick<AdminViewContentProps, "properties" | "rooms" | "organizationMap" | "propertiesReady">) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายชื่อหอพัก</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">หอพักทั้งหมดในระบบ</h2>
      </div>

      <AdminTable
        headers={["กิจการ", "ชื่อหอพัก", "ที่อยู่", "โทรศัพท์", "จำนวนห้อง", "สถานะ"]}
        rows={properties.map((item) => [
          <div key="organization" className="space-y-2"><span>{organizationMap.get(item.organization_id) ?? "—"}</span><AdminManageOrganizationButton organizationId={item.organization_id} section="properties" /></div>,
          item.name,
          item.address || "—",
          item.phone || "—",
          rooms.filter((room) => room.property_id === item.id).length,
          <StatusBadge compact key="s" status={item.status} />,
        ])}
        empty={!propertiesReady ? "ตารางหอพักยังไม่พร้อม" : "ยังไม่มีหอพักในระบบ"}
      />
    </section>
  );
}

export function AdminRoomsView({ rooms, organizationMap, propertyMap, roomsReady }: Pick<AdminViewContentProps, "rooms" | "organizationMap" | "propertyMap" | "roomsReady">) {
  return (
    <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รายชื่อห้องพัก</span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">ห้องพักทั้งหมดในระบบ</h2>
      </div>

      <AdminTable
        headers={["กิจการ", "หอพัก", "ห้อง", "ชั้น", "ค่าเช่า", "สถานะ"]}
        rows={rooms.map((item) => [
          <div key="organization" className="space-y-2"><span>{organizationMap.get(item.organization_id) ?? "—"}</span><AdminManageOrganizationButton organizationId={item.organization_id} section="rooms" /></div>,
          propertyMap.get(item.property_id) ?? "—",
          item.room_number,
          item.floor || "—",
          money(Number(item.base_rent)),
          <StatusBadge compact key="s" status={item.status} />,
        ])}
        empty={!roomsReady ? "ตารางห้องพักยังไม่พร้อม" : "ยังไม่มีห้องพัก"}
      />
    </section>
  );
}
