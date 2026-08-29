import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { isSystemAdmin } from "@/lib/auth/system-admin";
import { isTenantUser } from "@/lib/auth/tenant-access";
import { isPendingApplicant, supportContactUrl } from "@/lib/auth/trial-registration";

export default async function LoginPage() {
  if (!isSupabaseConfigured()) return <LoginForm supportUrl={supportContactUrl()} />;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (userId && await isPendingApplicant(userId)) redirect("/registration/pending");
  if (userId && await isSystemAdmin(userId)) redirect("/admin");
  if (userId && await isTenantUser(userId)) redirect("/tenant");
  if (userId) redirect("/dashboard");

  return <LoginForm supportUrl={supportContactUrl()} />;
}
