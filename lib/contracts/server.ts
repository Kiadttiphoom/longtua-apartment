import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { ThaiResidentialLeaseDocumentProps } from "@/components/contracts/ThaiResidentialLeaseDocument";

export async function loadLeaseSnapshot(supabase: Awaited<ReturnType<typeof createClient>>, organizationId: string, leaseId: string) {
  const { data: lease, error } = await supabase.from("leases").select("*").eq("organization_id", organizationId).eq("id", leaseId).single();
  if (error || !lease) throw new Error("ไม่พบสัญญาหรือไม่มีสิทธิ์เข้าถึง");
  const results = await Promise.all([
    supabase.from("properties").select("name,address,phone").eq("organization_id", organizationId).eq("id", lease.property_id).single(),
    supabase.from("rooms").select("room_number,floor").eq("organization_id", organizationId).eq("id", lease.room_id).single(),
    supabase.from("tenants").select("full_name,address,phone,id_card_last4").eq("organization_id", organizationId).eq("id", lease.primary_tenant_id).single(),
    supabase.from("property_settings").select("due_day,electric_rate,water_rate,water_billing_method,account_name").eq("organization_id", organizationId).eq("property_id", lease.property_id).single(),
    supabase.from("organizations").select("name").eq("id", organizationId).single(),
  ]);
  if (results.some(result => result.error || !result.data)) throw new Error("โหลดข้อมูลประกอบสัญญาไม่ครบ กรุณาตรวจสิทธิ์เข้าถึงหอพัก ห้อง และผู้เช่า");
  const property = results[0].data!;
  const room = results[1].data!;
  const tenant = results[2].data!;
  const settings = results[3].data!;
  const organization = results[4].data!;
  const snapshot: ThaiResidentialLeaseDocumentProps = {
    leaseNumber: lease.lease_number, contractDate: lease.start_date, startDate: lease.start_date, endDate: lease.end_date,
    propertyName: String(property.name), propertyAddress: String(property.address ?? ""), propertyPhone: String(property.phone ?? ""),
    landlordName: String(organization.name), landlordRepresentative: String(settings.account_name ?? ""),
    tenantName: String(tenant.full_name), tenantAddress: String(tenant.address ?? ""), tenantPhone: String(tenant.phone ?? ""),
    tenantIdCard: tenant.id_card_last4 ? `${"·".repeat(9)}${tenant.id_card_last4}` : null,
    roomNumber: String(room.room_number), floor: String(room.floor ?? ""), occupantCount: Number(lease.occupant_count),
    rentAmount: Number(lease.rent_amount), depositAmount: Number(lease.deposit_amount), advanceAmount: Number(lease.advance_amount),
    dueDay: Number(settings.due_day), electricRate: Number(settings.electric_rate), waterRate: Number(settings.water_rate),
    waterBillingMethod: settings.water_billing_method as ThaiResidentialLeaseDocumentProps["waterBillingMethod"], customTerms: lease.terms,
  };
  return { lease, snapshot };
}
