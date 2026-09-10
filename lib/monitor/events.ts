import "server-only";
import { after } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_ORGANIZATION_COOKIE, IMPERSONATE_ORGANIZATION_COOKIE } from "@/lib/portal/context";

type MonitorEvent = {
  action: string;
  outcome: "success" | "error";
  source: string;
  actor_user_id?: string | null;
  organization_id?: string | null;
  error_code?: string | null;
  request_id?: string | null;
  message?: string;
};

export async function recordMonitorEvent(event: MonitorEvent) {
  try {
    const { error } = await createAdminClient().from("monitor_events").insert(event);
    if (error) console.error("[monitor] Unable to persist event", error.code);
  } catch {
    console.error("[monitor] Event storage unavailable");
  }
}

export function scheduleMonitorEvent(action: string, outcome: "success" | "error", requestId?: string, error?: unknown, message?: string, organizationId?: string) {
  // Do not persist raw exception messages, form values, headers or credentials.
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  after(async () => {
    let actor: string | null = null;
    let organization: string | null = null;
    try {
      const client = await createClient();
      const { data } = await client.auth.getClaims();
      actor = data?.claims?.sub ?? null;
      const store = await cookies();
      let requested = organizationId ?? store.get(IMPERSONATE_ORGANIZATION_COOKIE)?.value ?? store.get(ACTIVE_ORGANIZATION_COOKIE)?.value;
      if (actor && !requested) {
        const { data: membership } = await client.from("organization_members").select("organization_id").eq("user_id", actor).eq("status", "active").order("created_at").limit(1).maybeSingle();
        requested = membership?.organization_id;
      }
      if (actor && requested && /^[0-9a-f-]{36}$/i.test(requested)) {
        const { data: accessible } = await client.from("organizations").select("id").eq("id", requested).maybeSingle();
        organization = accessible?.id ?? null;
      }
    } catch { /* Some failures occur before authentication is available. */ }
    await recordMonitorEvent({ action: action.slice(0, 160), outcome, source: "server", actor_user_id: actor,
      organization_id: organization, request_id: requestId?.slice(0, 120),
      error_code: /^[A-Za-z0-9_-]{1,40}$/.test(code) ? code : null,
      message: message ?? (outcome === "error" ? "เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์ ตรวจสอบรหัสอ้างอิงใน server log" : "ดำเนินการสำเร็จ") });
  });
}
