import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, error: "Health check is not configured." },
      { status: 503, headers: noStoreHeaders },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: noStoreHeaders,
    });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: "Health check is not configured." },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabase
    .from("health_checks")
    .select("id")
    .limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false },
      { status: 500, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: noStoreHeaders },
  );
}
