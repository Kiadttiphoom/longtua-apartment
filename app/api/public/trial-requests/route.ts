import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createTrialRequest, type TrialRequestBody } from "@/lib/auth/create-trial-request";

export const runtime = "nodejs";

function hasValidApiSecret(request: NextRequest) {
  const configured = process.env.TRIAL_REQUEST_API_SECRET?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!configured || !supplied) return false;
  const expectedHash = createHash("sha256").update(configured).digest();
  const suppliedHash = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(expectedHash, suppliedHash);
}

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!hasValidApiSecret(request)) {
    return json({ error: "unauthorized", message: "ไม่สามารถส่งคำขอทดลองใช้ได้" }, 401);
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: "unsupported_media_type", message: "รองรับเฉพาะ application/json" }, 415);
  }

  let body: TrialRequestBody;
  try {
    body = await request.json() as TrialRequestBody;
  } catch {
    return json({ error: "invalid_json", message: "รูปแบบข้อมูลไม่ถูกต้อง" }, 400);
  }

  return createTrialRequest(body, request.nextUrl.origin);
}
