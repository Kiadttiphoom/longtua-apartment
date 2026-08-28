import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
  if (!isSupabaseConfigured()) return <RegisterForm />;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect("/dashboard");

  return <RegisterForm />;
}
