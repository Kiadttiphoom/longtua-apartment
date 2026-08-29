import { redirect } from "next/navigation";
import { AdminPlatformShell } from "@/components/admin/AdminPlatformShell";
import { isSystemAdmin } from "@/lib/auth/system-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  if (!await isSystemAdmin(userId)) redirect("/dashboard");
  const { data: profile } = await createAdminClient().from("profiles").select("display_name").eq("id", userId).single();
  return <AdminPlatformShell profileName={profile?.display_name ?? "Super Admin"}>{children}</AdminPlatformShell>;
}
