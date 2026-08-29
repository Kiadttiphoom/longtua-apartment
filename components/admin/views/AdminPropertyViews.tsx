import { AdminTable, money } from "@/components/admin/AdminPrimitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminViewContentProps } from "@/components/admin/admin-types";

export function AdminPropertiesView({ properties, rooms, organizationMap, propertiesReady }: Pick<AdminViewContentProps, "properties" | "rooms" | "organizationMap" | "propertiesReady">) {
  return <section className="admin-card"><AdminTable headers={["กิจการ", "ชื่อหอพัก", "ที่อยู่", "โทรศัพท์", "จำนวนห้อง", "สถานะ"]} rows={properties.map((item) => [organizationMap.get(item.organization_id) ?? "—", item.name, item.address || "—", item.phone || "—", rooms.filter((room) => room.property_id === item.id).length, <StatusBadge compact key="s" status={item.status} />])} empty={!propertiesReady ? "ตารางหอพักยังไม่พร้อม" : "ยังไม่มีหอพักในระบบ"} /></section>;
}

export function AdminRoomsView({ rooms, organizationMap, propertyMap, roomsReady }: Pick<AdminViewContentProps, "rooms" | "organizationMap" | "propertyMap" | "roomsReady">) {
  return <section className="admin-card"><AdminTable headers={["กิจการ", "หอพัก", "ห้อง", "ชั้น", "ค่าเช่า", "สถานะ"]} rows={rooms.map((item) => [organizationMap.get(item.organization_id) ?? "—", propertyMap.get(item.property_id) ?? "—", item.room_number, item.floor || "—", money(Number(item.base_rent)), <StatusBadge compact key="s" status={item.status} />])} empty={!roomsReady ? "ตารางห้องพักยังไม่พร้อม" : "ยังไม่มีห้องพัก"} /></section>;
}
