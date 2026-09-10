import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const REGISTRATION_ORGANIZATION_LIMIT = 20;
export const REGISTRATION_CAPACITY_MESSAGE = "ขณะนี้ครบจำนวน 20 กิจการแล้ว จึงปิดรับสมัครและอนุมัติกิจการใหม่ชั่วคราว";

export async function getRegistrationCapacity() {
  const { count, error } = await createAdminClient()
    .from("organizations")
    .select("id", { count: "exact", head: true });
  if (error || count === null) throw error ?? new Error("Organization count unavailable");
  return { count, full: count >= REGISTRATION_ORGANIZATION_LIMIT };
}
