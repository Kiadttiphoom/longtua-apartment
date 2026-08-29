import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { isPendingApplicant } from "@/lib/auth/trial-registration";

export default async function Home() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (userId && await isPendingApplicant(userId)) redirect("/registration/pending");
  redirect(userId ? "/dashboard" : "/login");
}
