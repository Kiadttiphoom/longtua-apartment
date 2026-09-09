import { loadTenantPortalData } from "@/lib/tenant/data";
import { RepairForm } from "@/components/tenant/RepairForm";
import { thaiDate } from "@/lib/format";
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Flame,
  Zap,
  Droplets,
  Wind,
  XCircle,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

function getCategoryIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("แอร์") || lower.includes("พัดลม") || lower.includes("ปรับอากาศ")) {
    return Wind;
  }
  if (
    lower.includes("น้ำ") ||
    lower.includes("ประปา") ||
    lower.includes("ก๊อก") ||
    lower.includes("ท่อ") ||
    lower.includes("ชักโครก") ||
    lower.includes("ซิงค์")
  ) {
    return Droplets;
  }
  if (
    lower.includes("ไฟ") ||
    lower.includes("สวิตช์") ||
    lower.includes("ปลั๊ก") ||
    lower.includes("หลอด")
  ) {
    return Zap;
  }
  if (lower.includes("อุ่น") || lower.includes("ฮีตเตอร์")) {
    return Flame;
  }
  return Wrench;
}

export default async function RepairsPage() {
  const data = await loadTenantPortalData();
  const { data: requests, error } = await data.context.supabase
    .from("repair_requests")
    .select("id,title,detail,status,created_at,room_id")
    .eq("organization_id", data.context.organizationId)
    .eq("tenant_id", data.context.tenantId)
    .order("created_at", { ascending: false });

  const activeLeases = data.leases.filter((l) => l.status === "active");
  const leaseOptions = activeLeases.map((l) => {
    const room = data.rooms.find((r) => r.id === l.room_id);
    return {
      id: l.id,
      label: `ห้อง ${room?.room_number ?? "—"}${room?.floor ? ` (ชั้น ${room.floor})` : ""} · สัญญา ${l.lease_number}`,
    };
  });

  const property = data.properties[0];
  const emergencyPhone = property?.phone?.trim();

  // Metrics
  const totalCount = requests?.length ?? 0;
  const activeCount =
    requests?.filter((r) => r.status === "pending" || r.status === "in_progress").length ?? 0;
  const completedCount = requests?.filter((r) => r.status === "completed").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <header className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700">
              <Wrench size={14} />
              <span>ศูนย์แจ้งซ่อมและบริการ</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              แจ้งซ่อม & ติดตามสถานะ
            </h1>
            <p className="text-sm font-medium text-slate-500">
              แจ้งปัญหาอุปกรณ์ชำรุดภายในห้องพัก และติดตามความคืบหน้าของช่างแบบเรียลไทม์
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="flex flex-col items-center rounded-2xl border border-slate-200/80 bg-white px-4 py-2 text-center shadow-xs">
              <span className="text-[11px] font-bold text-slate-400">ทั้งหมด</span>
              <span className="text-lg font-black text-slate-800">{totalCount}</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-2 text-center shadow-xs">
              <span className="text-[11px] font-bold text-amber-700">รอดำเนินการ</span>
              <span className="text-lg font-black text-amber-800">{activeCount}</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-2 text-center shadow-xs">
              <span className="text-[11px] font-bold text-emerald-700">เสร็จสิ้น</span>
              <span className="text-lg font-black text-emerald-800">{completedCount}</span>
            </div>
          </div>
        </div>

        {/* Emergency Callout */}
        {emergencyPhone && (
          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-xs text-rose-900">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-xs">
                <ShieldAlert size={16} />
              </span>
              <div>
                <strong className="font-bold">เหตุด่วนฉุกเฉิน?</strong>
                <p className="text-[11px] text-rose-700">
                  เช่น ท่อประปาแตก น้ำรั่วรวดเร็ว หรือไฟฟ้าช็อต กรุณาโทรติดต่อผู้ดูแลโดยตรงทันที
                </p>
              </div>
            </div>
            <a
              href={`tel:${emergencyPhone}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-98 transition shrink-0"
            >
              <PhoneCall size={13} />
              <span>โทร {emergencyPhone}</span>
            </a>
          </div>
        )}
      </header>

      {/* New Request Form Card */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">ส่งคำขอแจ้งซ่อมใหม่</h2>
            <p className="text-xs text-slate-500">เลือกหมวดหมู่และกรอกรายละเอียดเพื่อให้ช่างเข้าดูแลได้รวดเร็ว</p>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900"
          >
            <AlertCircle className="shrink-0 text-amber-600" size={20} />
            <span>ระบบแจ้งซ่อมยังไม่พร้อมใช้งานชั่วคราว กรุณาติดต่อสำนักงานหอพัก</span>
          </div>
        ) : (
          <RepairForm leases={leaseOptions} />
        )}
      </section>

      {/* Repair History / Timeline Tracking */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">ประวัติและสถานะการแจ้งซ่อม</h2>
            <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-bold text-slate-700">
              {requests?.length ?? 0}
            </span>
          </div>
        </div>

        {!error && (!requests || requests.length === 0) && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <Sparkles size={26} />
            </div>
            <strong className="text-sm font-bold text-slate-800">ยังไม่มีรายการแจ้งซ่อม</strong>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              อุปกรณ์และห้องพักของคุณอยู่ในสภาพสมบูรณ์ หากพบปัญหา สามารถกรอกแบบฟอร์มด้านบนได้ตลอดเวลา
            </p>
          </div>
        )}

        {requests && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((r) => {
              const Icon = getCategoryIcon(r.title);
              const room = data.rooms.find((rm) => rm.id === r.room_id);

              const statusMeta = {
                pending: {
                  label: "รอรับเรื่อง",
                  color: "bg-amber-50 text-amber-700 border-amber-200",
                  dot: "bg-amber-500",
                  icon: Clock,
                  step: 1,
                },
                in_progress: {
                  label: "กำลังดำเนินการ",
                  color: "bg-blue-50 text-blue-700 border-blue-200",
                  dot: "bg-blue-500",
                  icon: Wrench,
                  step: 2,
                },
                completed: {
                  label: "ซ่อมเสร็จสิ้น",
                  color: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  dot: "bg-emerald-500",
                  icon: CheckCircle2,
                  step: 3,
                },
                cancelled: {
                  label: "ยกเลิกแล้ว",
                  color: "bg-slate-100 text-slate-600 border-slate-200",
                  dot: "bg-slate-400",
                  icon: XCircle,
                  step: 0,
                },
              }[r.status as "pending" | "in_progress" | "completed" | "cancelled"] ?? {
                label: r.status,
                color: "bg-slate-100 text-slate-700 border-slate-200",
                dot: "bg-slate-400",
                icon: AlertCircle,
                step: 1,
              };

              const StatusIcon = statusMeta.icon;

              return (
                <article
                  key={r.id}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition hover:border-slate-300"
                >
                  {/* Card Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Icon size={20} />
                      </div>
                      <div>
                        <strong className="block text-base font-bold text-slate-900 leading-tight">
                          {r.title}
                        </strong>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {room && (
                            <span className="font-semibold text-slate-700">
                              ห้อง {room.room_number}
                              {room.floor ? ` (ชั้น ${room.floor})` : ""}
                            </span>
                          )}
                          {room && <span>•</span>}
                          <span>แจ้งเมื่อ {thaiDate(r.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="self-start sm:self-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold ${statusMeta.color}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
                        <StatusIcon size={13} />
                        <span>{statusMeta.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Visual 3-step Timeline (if not cancelled) */}
                  {r.status !== "cancelled" ? (
                    <div className="py-4">
                      <div className="grid grid-cols-3 gap-2">
                        {/* Step 1 */}
                        <div className="space-y-1.5">
                          <div className="h-1.5 w-full rounded-full bg-emerald-500" />
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 size={12} />
                            <span>1. แจ้งเรื่องแล้ว</span>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="space-y-1.5">
                          <div
                            className={`h-1.5 w-full rounded-full transition-colors ${
                              statusMeta.step >= 2 ? "bg-blue-600" : "bg-slate-200"
                            }`}
                          />
                          <div
                            className={`flex items-center gap-1 text-[11px] font-bold ${
                              statusMeta.step >= 2 ? "text-blue-700" : "text-slate-400"
                            }`}
                          >
                            {statusMeta.step >= 2 ? <Wrench size={12} /> : <Clock size={12} />}
                            <span>2. ช่างรับเรื่อง/กำลังซ่อม</span>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="space-y-1.5">
                          <div
                            className={`h-1.5 w-full rounded-full transition-colors ${
                              statusMeta.step >= 3 ? "bg-emerald-500" : "bg-slate-200"
                            }`}
                          />
                          <div
                            className={`flex items-center gap-1 text-[11px] font-bold ${
                              statusMeta.step >= 3 ? "text-emerald-700" : "text-slate-400"
                            }`}
                          >
                            <CheckCircle2 size={12} />
                            <span>3. ซ่อมเสร็จสิ้น</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="my-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                      รายการแจ้งซ่อมนี้ถูกยกเลิกแล้ว
                    </div>
                  )}

                  {/* Problem Details */}
                  <div className="rounded-2xl bg-slate-50/70 p-3.5 text-xs text-slate-700">
                    <span className="block text-[11px] font-bold text-slate-400 mb-1">
                      รายละเอียดปัญหา & วันเวลาที่สะดวก:
                    </span>
                    <p className="whitespace-pre-wrap leading-relaxed font-medium">{r.detail}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
