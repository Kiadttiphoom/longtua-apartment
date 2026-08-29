import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type TrialRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type ApplicantTrialRequest = {
  id: string;
  operator_name: string;
  property_name: string;
  contact_email: string;
  phone: string;
  requested_room_count: number;
  status: TrialRequestStatus;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
};

export function marketingRegistrationUrl() {
  return process.env.MARKETING_REGISTRATION_URL?.trim()
    || "https://longtua.com/apartment/register";
}

export function supportContactUrl() {
  return process.env.LONGTUA_SUPPORT_URL?.trim()
    || "https://longtua.com/contact";
}

export async function getApplicantTrialRequest(userId: string): Promise<ApplicantTrialRequest | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("trial_requests")
    .select("id, operator_name, property_name, contact_email, phone, requested_room_count, status, submitted_at, reviewed_at, rejection_reason")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) {
    console.error(`[trial] ${JSON.stringify({ stage: "applicant_request.read", userId, code: error.code, message: error.message })}`);
    return null;
  }
  return data as ApplicantTrialRequest | null;
}

export async function isPendingApplicant(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .maybeSingle();
  return !error && data?.status === "pending";
}
