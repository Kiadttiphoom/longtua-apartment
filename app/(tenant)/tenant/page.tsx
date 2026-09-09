import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Phone,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wrench,
  Layers,
} from "lucide-react";
import { loadTenantPortalData } from "@/lib/tenant/data";
import { money, thaiDate } from "@/lib/format";

export default async function TenantHomePage() {
  const data = await loadTenantPortalData();
  const { supabase, organizationId, tenantId } = data.context;

  // Active lease & room
  const primaryLease = data.leases.find((l) => l.status === "active") ?? data.leases[0];
  const primaryRoom = data.rooms.find((r) => r.id === primaryLease?.room_id);
  const primaryProperty = data.properties.find((p) => p.id === primaryLease?.property_id) ?? data.properties[0];

  // Invoices & Submissions
  const outstanding = data.invoices.filter((i) => i.status !== "void" && Number(i.balance_due) > 0);
  const totalBalance = outstanding.reduce((sum, i) => sum + Number(i.balance_due), 0);
  const pendingSubmissions = data.submissions.filter((i) => i.status === "pending");
  const nextInvoice = outstanding.slice().sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  const latestNonVoidInvoice = data.invoices.find((i) => i.status !== "void");

  // Fetch active repair requests
  const { data: repairs } = await supabase
    .from("repair_requests")
    .select("id, title, status, created_at")
    .eq("organization_id", organizationId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(3);

  const activeRepairs = (repairs ?? []).filter((r) => ["pending", "in_progress"].includes(r.status));

  // Today's date in Thai
  const todayFormatted = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "full",
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Resident Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                <Sparkles size={13} className="text-blue-600" />
                <span>ยินดีต้อนรับสู่หอพัก</span>
              </span>
              <span className="text-xs text-slate-600 font-medium hidden sm:inline">
                {todayFormatted}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              สวัสดี, {data.tenant.full_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-semibold pt-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold">
                <Building2 size={13} className="text-slate-500" />
                <span>{primaryProperty?.name ?? "หอพัก"}</span>
              </span>
              {primaryRoom && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 font-bold">
                  <Layers size={13} className="text-blue-600" />
                  <span>ห้อง {primaryRoom.room_number} (ชั้น {primaryRoom.floor || 1})</span>
                </span>
              )}
              {primaryLease && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>สัญญาเช่าปกติ</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Hero Outstanding Balance Card */}
      {totalBalance > 0 ? (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c244d] via-[#103066] to-[#1e488f] text-white p-6 sm:p-7 shadow-lg shadow-blue-950/15">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-400/20 text-blue-200 text-xs font-semibold backdrop-blur-xs border border-blue-300/20">
                  <ReceiptText size={13} />
                  <span>ยอดค้างชำระทั้งหมด ({outstanding.length} ใบแจ้งหนี้)</span>
                </span>
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight tabular-nums text-white">
                {money(totalBalance)}
              </div>
              {nextInvoice && (
                <div className="flex items-center gap-2 text-xs text-blue-200">
                  <Clock size={14} className="text-amber-300" />
                  <span>
                    กำหนดชำระบิลถัดไป:{" "}
                    <strong className="text-white font-bold">{thaiDate(nextInvoice.due_at)}</strong>{" "}
                    ({nextInvoice.invoice_number})
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/tenant/bills"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-blue-900 shadow-md transition-all hover:bg-blue-50 hover:shadow-lg active:scale-98"
              >
                <span>ชำระเงินและแนบสลิป</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-7 shadow-lg shadow-emerald-950/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-xs shadow-inner">
                <CheckCircle2 size={26} strokeWidth={2.5} />
              </span>
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  สถานะการเงินปกติ
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight">
                  ไม่มีบิลค้างชำระ 🎉
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed max-w-lg">
                  ขอบคุณที่ชำระค่าเช่าและค่าน้ำ-ไฟตรงเวลา คุณสามารถดูประวัติใบเสร็จย้อนหลังได้ตลอดเวลา
                </p>
              </div>
            </div>
            <Link
              href="/tenant/bills"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 hover:bg-white/25 px-5 py-3 text-xs font-bold text-white backdrop-blur-xs border border-white/20 transition active:scale-98 shrink-0"
            >
              <span>ดูประวัติการชำระ</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}

      {/* Pending Slip Verification Notification Banner */}
      {pendingSubmissions.length > 0 && (
        <section className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-amber-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock size={18} />
            </span>
            <div>
              <strong className="block text-xs font-bold">
                มีหลักฐานการโอนรอเจ้าหน้าที่ตรวจสอบ ({pendingSubmissions.length} รายการ)
              </strong>
              <span className="text-[11px] text-amber-700 leading-snug block">
                ระบบได้รับสลิปเรียบร้อยแล้ว ยอดค้างชำระจะปรับลดลงทันทีเมื่อเจ้าหน้าที่ยืนยันยอด
              </span>
            </div>
          </div>
          <Link
            href="/tenant/bills"
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-xs font-bold transition"
          >
            ดูสลิป
          </Link>
        </section>
      )}

      {/* Quick Action Grid (Flutter Mobile App Style) */}
      <div>
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 px-1">
          เมนูลัดบริการห้องพัก
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Action 1: Bills & Payments */}
          <Link
            href="/tenant/bills"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 transition-all hover:border-blue-400 hover:shadow-md active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <ReceiptText size={22} strokeWidth={2.2} />
              </span>
              {outstanding.length > 0 && (
                <span className="h-2 w-2 rounded-full bg-rose-500 ring-4 ring-rose-100" />
              )}
            </div>
            <div className="mt-3">
              <strong className="block text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">
                บิลและชำระ
              </strong>
              <span className="block text-[11px] text-slate-600 mt-0.5">
                {outstanding.length > 0 ? `${outstanding.length} บิลรอชำระ` : "ชำระครบถ้วน"}
              </span>
            </div>
          </Link>

          {/* Action 2: Repairs */}
          <Link
            href="/tenant/repairs"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 transition-all hover:border-blue-400 hover:shadow-md active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-white">
                <Wrench size={22} strokeWidth={2.2} />
              </span>
              {activeRepairs.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                  {activeRepairs.length}
                </span>
              )}
            </div>
            <div className="mt-3">
              <strong className="block text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">
                แจ้งซ่อมด่วน
              </strong>
              <span className="block text-[11px] text-slate-600 mt-0.5">
                {activeRepairs.length > 0 ? "มีงานกำลังซ่อม" : "แจ้งปัญหาอุปกรณ์"}
              </span>
            </div>
          </Link>

          {/* Action 3: Lease Contract */}
          <Link
            href="/tenant/lease"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 transition-all hover:border-blue-400 hover:shadow-md active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                <FileText size={22} strokeWidth={2.2} />
              </span>
            </div>
            <div className="mt-3">
              <strong className="block text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">
                สัญญาของฉัน
              </strong>
              <span className="block text-[11px] text-slate-600 mt-0.5">
                ค่าเช่าและเอกสาร
              </span>
            </div>
          </Link>

          {/* Action 4: Contact Landlord */}
          {primaryProperty?.phone ? (
            <a
              href={`tel:${primaryProperty.phone}`}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 transition-all hover:border-emerald-400 hover:shadow-md active:scale-98"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                  <Phone size={22} strokeWidth={2.2} />
                </span>
              </div>
              <div className="mt-3">
                <strong className="block text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition">
                  โทรติดต่อหอพัก
                </strong>
                <span className="block text-[11px] text-slate-600 mt-0.5 font-mono">
                  {primaryProperty.phone}
                </span>
              </div>
            </a>
          ) : (
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 opacity-70">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-200 text-slate-600">
                <Phone size={22} />
              </span>
              <div className="mt-3">
                <strong className="block text-sm font-bold text-slate-700">ติดต่อหอพัก</strong>
                <span className="block text-[11px] text-slate-600 mt-0.5">ติดต่อสำนักงาน</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Recent Invoices & Ongoing Repairs */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Latest Invoice Summary */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <ReceiptText size={15} />
                </span>
                <strong className="text-sm font-bold text-slate-800">
                  บิลล่าสุด
                </strong>
              </div>
              <Link
                href="/tenant/bills"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition flex items-center gap-0.5"
              >
                <span>ดูทั้งหมด</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {nextInvoice ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">เลขที่ใบแจ้งหนี้</span>
                  <strong className="text-xs font-bold font-mono text-slate-800">
                    {nextInvoice.invoice_number}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">วันที่ครบกำหนด</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {thaiDate(nextInvoice.due_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-100">
                  <span className="text-xs font-bold text-slate-800">ยอดที่ต้องชำระ</span>
                  <strong className="text-lg font-black text-blue-700 tabular-nums">
                    {money(Number(nextInvoice.balance_due))}
                  </strong>
                </div>
              </div>
            ) : latestNonVoidInvoice ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">บิลรอบล่าสุด</span>
                  <strong className="text-xs font-bold font-mono text-slate-800">
                    {latestNonVoidInvoice.invoice_number}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">สถานะ</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 size={13} />
                    <span>ชำระเรียบร้อยแล้ว</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-600">
                ยังไม่มีรายการบิลในระบบ
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/tenant/bills"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 py-2.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
            >
              <span>จัดการบิลและแนบสลิป</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </section>

        {/* Ongoing Repairs Tracker */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Wrench size={15} />
                </span>
                <strong className="text-sm font-bold text-slate-800">
                  สถานะการแจ้งซ่อม
                </strong>
              </div>
              <Link
                href="/tenant/repairs"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition flex items-center gap-0.5"
              >
                <span>แจ้งเรื่อง</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {repairs && repairs.length > 0 ? (
              <div className="space-y-2.5">
                {repairs.map((r) => {
                  const statusMap: Record<string, { label: string; badge: string }> = {
                    pending: { label: "รอรับเรื่อง", badge: "bg-amber-50 text-amber-800 border-amber-200" },
                    in_progress: { label: "กำลังดำเนินการ", badge: "bg-blue-50 text-blue-800 border-blue-200" },
                    completed: { label: "เสร็จสิ้น", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                    cancelled: { label: "ยกเลิก", badge: "bg-slate-50 text-slate-700 border-slate-200" },
                  };
                  const current = statusMap[r.status] ?? statusMap.pending;
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="min-w-0 flex-1">
                        <strong className="block text-xs font-bold text-slate-800 truncate">
                          {r.title}
                        </strong>
                        <span className="text-[10px] text-slate-600 mt-0.5 block">
                          {thaiDate(r.created_at)}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${current.badge}`}>
                        {current.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-600">
                ไม่มีรายการแจ้งซ่อมที่รอดำเนินการ
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/tenant/repairs"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 py-2.5 text-xs font-bold text-slate-700 hover:text-amber-800 transition"
            >
              <span>เปิดคำขอแจ้งซ่อมใหม่</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </section>
      </div>

      {/* Room & Dormitory Details Card */}
      {primaryLease && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5 mb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Building2 size={16} />
            </span>
            <strong className="text-sm font-bold text-slate-800">
              ข้อมูลห้องพักและสัญญาเช่า
            </strong>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-600 block">เลขที่ห้อง</span>
              <strong className="text-base font-black text-slate-800 mt-0.5 block">
                {primaryRoom?.room_number ?? "—"}
              </strong>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-600 block">ค่าเช่ารายเดือน</span>
              <strong className="text-base font-black text-blue-700 mt-0.5 block">
                {money(Number(primaryLease.rent_amount))}
              </strong>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-600 block">เงินประกัน</span>
              <strong className="text-base font-black text-slate-800 mt-0.5 block">
                {money(Number(primaryLease.deposit_amount))}
              </strong>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-600 block">สิ้นสุดสัญญา</span>
              <strong className="text-sm font-black text-slate-800 mt-1 block">
                {primaryLease.end_date ? thaiDate(primaryLease.end_date) : "ไม่ระบุ"}
              </strong>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
