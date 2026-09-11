import { SubscriptionPage } from "@/components/portal/SubscriptionPage";
import { requirePortalContext } from "@/lib/portal/context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const context = await requirePortalContext();
  const supabase = await createClient();

  const [propRes, roomRes, userRes] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organization.id),
    supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organization.id),
    supabase
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", context.organization.id)
      .eq("status", "active"),
  ]);
  if (propRes.error || roomRes.error || userRes.error || propRes.count === null || roomRes.count === null || userRes.count === null) {
    throw new Error("ไม่สามารถตรวจสอบการใช้งานแพ็กเกจได้ กรุณาลองอีกครั้ง");
  }

  return (
    <SubscriptionPage
      subscription={context.subscription}
      usage={{
        propertyCount: propRes.count ?? 0,
        roomCount: roomRes.count ?? 0,
        userCount: userRes.count ?? 0,
      }}
    />
  );
}

