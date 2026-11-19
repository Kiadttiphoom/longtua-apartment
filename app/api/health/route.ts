import { NextResponse } from "next/server";
import { query } from "@/lib/db/pool";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const databaseUrl = process.env.DATABASE_URL;

  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, error: "Health check is not configured (missing CRON_SECRET)." },
      { status: 503, headers: noStoreHeaders },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: noStoreHeaders,
    });
  }

  if (!databaseUrl) {
    return NextResponse.json(
      { ok: false, error: "Health check is not configured (missing DATABASE_URL)." },
      { status: 503, headers: noStoreHeaders },
    );
  }

  try {
    // Verify database connectivity
    await query("SELECT 1 FROM health_checks LIMIT 1");

    return NextResponse.json(
      { ok: true, timestamp: new Date().toISOString() },
      { status: 200, headers: noStoreHeaders },
    );
  } catch (err: unknown) {
    console.error("[health] Database health check failed:", err);
    return NextResponse.json(
      { ok: false, error: "Database connectivity check failed" },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
