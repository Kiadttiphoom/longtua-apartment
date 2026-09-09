import { createClient } from "@/lib/supabase/server";
import { readPrivateSlip } from "@/lib/storage/private-r2";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const baseHeaders = {
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox",
  };

  if (!auth?.claims?.sub) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { ...baseHeaders, "Cache-Control": "private, no-store" },
    });
  }

  const { id } = await params;
  const { data: file } = await supabase
    .from("tenant_contract_uploads")
    .select("tenant_id,organization_id,file_uri,content_type")
    .eq("id", id)
    .maybeSingle();

  if (!file) {
    return new Response("Not found", {
      status: 404,
      headers: { ...baseHeaders, "Cache-Control": "private, no-store" },
    });
  }

  const { data: account } = await supabase
    .from("tenant_accounts")
    .select("tenant_id")
    .eq("auth_user_id", auth.claims.sub)
    .eq("tenant_id", file.tenant_id)
    .eq("organization_id", file.organization_id)
    .eq("status", "active")
    .maybeSingle();

  if (!account) {
    return new Response("Not found", {
      status: 404,
      headers: { ...baseHeaders, "Cache-Control": "private, no-store" },
    });
  }

  try {
    const object = await readPrivateSlip(file.file_uri);
    if (!object.Body) throw new Error();

    const extension =
      file.content_type === "application/pdf"
        ? "pdf"
        : file.content_type === "image/png"
        ? "png"
        : "jpg";

    const isDownload = new URL(request.url).searchParams.has("download");

    return new Response(object.Body.transformToWebStream(), {
      headers: {
        ...baseHeaders,
        // แคชไว้ใน Browser ของผู้ใช้ 7 วัน ทำให้ไม่ต้องดึงจาก R2 ซ้ำเมื่อเปิดดู
        "Cache-Control": "private, max-age=604800, immutable",
        "Content-Type": file.content_type,
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="contract.${extension}"`,
      },
    });
  } catch {
    return new Response("File unavailable", {
      status: 404,
      headers: { ...baseHeaders, "Cache-Control": "private, no-store" },
    });
  }
}

