import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (error, _request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { recordMonitorEvent } = await import("@/lib/monitor/events");
  const digest = error && typeof error === "object" && "digest" in error ? String(error.digest).slice(0, 120) : null;
  await recordMonitorEvent({ action: `${context.routeType}:${context.routePath}`.slice(0, 160), outcome: "error", source: "nextjs",
    request_id: digest, message: "เกิดข้อผิดพลาดที่ไม่ได้จัดการ ตรวจสอบ digest ใน server log" });
};
