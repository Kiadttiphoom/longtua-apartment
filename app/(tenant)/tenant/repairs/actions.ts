"use server";
import { requireTenantContext } from "@/lib/auth/tenant-access";
import { revalidatePath } from "next/cache";

export async function submitRepair(data: FormData) {
  const context = await requireTenantContext();
  const leaseId = String(data.get("leaseId") ?? "");
  const title = String(data.get("title") ?? "").trim();
  const detail = String(data.get("detail") ?? "").trim();
  if (title.length < 3 || title.length > 160 || detail.length < 5 || detail.length > 3000) return { ok: false, message: "กรุณากรอกหัวข้อ 3–160 ตัวอักษร และรายละเอียด 5–3,000 ตัวอักษร" };
  const { data: lease } = await context.supabase.from("leases").select("id,room_id,property_id").eq("id",leaseId).eq("organization_id",context.organizationId).eq("primary_tenant_id",context.tenantId).eq("status","active").maybeSingle();
  if (!lease) return { ok: false, message: "ไม่พบสัญญาห้องพักที่ใช้งานอยู่" };
  const { error } = await context.supabase.from("repair_requests").insert({ organization_id: context.organizationId, tenant_id: context.tenantId, room_id: lease.room_id, property_id: lease.property_id, title, detail });
  if (error) return { ok: false, message: "ส่งคำขอไม่สำเร็จ กรุณาติดต่อหอพักหรือลองอีกครั้ง" };
  revalidatePath("/tenant/repairs");
  return { ok: true, message: "ส่งคำขอแจ้งซ่อมแล้ว" };
}
