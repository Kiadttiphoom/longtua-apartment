import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { isRegistrationEnabled } from "@/lib/auth/system-admin";
import { isSystemAdmin } from "@/lib/auth/system-admin";

export default async function RegisterPage() {
  if (!isSupabaseConfigured()) return <RegisterForm />;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect(await isSystemAdmin(data.claims.sub) ? "/admin" : "/dashboard");

  const registration = await isRegistrationEnabled();
  return <RegisterForm registrationEnabled={registration.enabled} />;
}
