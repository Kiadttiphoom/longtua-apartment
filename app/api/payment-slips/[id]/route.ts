import { createClient } from "@/lib/supabase/server";
import { getOrganizationAccess } from "@/lib/auth/organization-access";
import { readPrivateSlip } from "@/lib/storage/private-r2";

export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const baseHeaders = {
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox",
    "Referrer-Policy": "no-referrer",
  };
  const denied = () =>
    new Response("ไม่พบไฟล์หรือไม่มีสิทธิ์เข้าถึง", {
      status: 404,
      headers: { ...baseHeaders, "Cache-Control": "private, no-store, max-age=0" },
    });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return denied();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId)
    return new Response("กรุณาเข้าสู่ระบบ", {
      status: 401,
      headers: { ...baseHeaders, "Cache-Control": "private, no-store, max-age=0" },
    });

  const { data: submission, error } = await supabase
    .from("payment_submissions")
    .select("tenant_id, organization_id, slip_path")
    .eq("id", id)
    .maybeSingle();

  if (error || !submission) return denied();
  const { data: account } = await supabase
    .from("tenant_accounts")
    .select("tenant_id")
    .eq("auth_user_id", userId)
    .eq("organization_id", submission.organization_id)
    .eq("tenant_id", submission.tenant_id)
    .eq("status", "active")
    .maybeSingle();

  if (!account) {
    const access = await getOrganizationAccess(userId, submission.organization_id);
    const allowed = access?.granularReady
      ? access.permissions.has("customer_payments:view")
      : access && ["owner", "manager", "accounting"].includes(access.roleCode);
    if (!allowed) return denied();
  }

  const url = new URL(request.url);
  const isDownload = url.searchParams.has("download");

  try {
    if (submission.slip_path.startsWith("r2://")) {
      const object = await readPrivateSlip(submission.slip_path);
      if (!object.Body) return denied();
      const contentType = object.ContentType || "application/octet-stream";
      const ext = contentType === "image/png" ? ".png" : ".jpg";
      const disposition = isDownload
        ? `attachment; filename="payment-slip-${id.slice(0, 8)}${ext}"`
        : 'inline; filename="payment-slip"';
      return new Response(object.Body.transformToWebStream(), {
        headers: {
          ...baseHeaders,
          "Cache-Control": "private, max-age=604800, immutable",
          "Content-Type": contentType,
          "Content-Disposition": disposition,
        },
      });
    }
    const { data: legacy } = await supabase.storage.from("payment-slips").download(submission.slip_path);
    if (!legacy) return denied();
    const ext = legacy.type === "image/png" ? ".png" : ".jpg";
    const disposition = isDownload
      ? `attachment; filename="payment-slip-${id.slice(0, 8)}${ext}"`
      : 'inline; filename="payment-slip"';
    return new Response(legacy, {
      headers: {
        ...baseHeaders,
        "Cache-Control": "private, max-age=604800, immutable",
        "Content-Type": legacy.type || "application/octet-stream",
        "Content-Disposition": disposition,
      },
    });
  } catch {
    return denied();
  }
}

