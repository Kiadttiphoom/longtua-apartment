import { Building2, CheckCircle2, Clock3, LogOut, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { getApplicantTrialRequest, supportContactUrl } from "@/lib/auth/trial-registration";
import { createClient } from "@/lib/supabase/server";

function thaiDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

export default async function RegistrationPendingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const request = await getApplicantTrialRequest(userId);
  if (request?.status === "approved") redirect("/dashboard");

  const rejected = request?.status === "rejected" || request?.status === "cancelled";
  return <main className="min-h-dvh bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-12">
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div aria-label="Longtua Apartment"><p className="text-2xl font-bold text-blue-700">Longtua<span className="text-slate-900">.</span></p><p className="mt-1 text-xs text-slate-600">ลงตัว อพาร์ตเมนต์</p></div>
        <form action={logoutAction}><button className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600" type="submit"><LogOut size={17} aria-hidden="true" /><span>ออกจากระบบ</span></button></form>
      </header>
      <div aria-hidden="true" className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${rejected ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}`}>
        {rejected ? <XCircle size={31} /> : <Clock3 size={31} />}
      </div>
      <h1 className="text-2xl font-bold leading-snug sm:text-3xl">{rejected ? "คำขอยังไม่ได้รับการอนุมัติ" : "กำลังรอผู้ดูแลตรวจสอบ"}</h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">{rejected
        ? "ระบบยังไม่ได้สร้างกิจการหรือเริ่มนับช่วงทดลองใช้ฟรี หากข้อมูลไม่ถูกต้องสามารถติดต่อผู้ดูแลเพื่อขอตรวจสอบอีกครั้ง"
        : "เราได้รับข้อมูลแล้ว ระบบจะเริ่มทดลองใช้ฟรี 30 วันหลังจากคำขอได้รับการอนุมัติเท่านั้น"}</p>

      {request ? <dl className="my-7 divide-y divide-slate-200 rounded-xl bg-slate-50 px-4 [&>div]:grid [&>div]:gap-1 [&>div]:py-4 sm:[&>div]:grid-cols-[160px_1fr] [&_dt]:text-sm [&_dt]:text-slate-600 [&_dd]:flex [&_dd]:min-w-0 [&_dd]:items-start [&_dd]:gap-2 [&_dd]:text-sm [&_dd]:font-medium [&_dd]:break-words [&_svg]:shrink-0">
        <div><dt>ผู้ประกอบการ</dt><dd>{request.operator_name}</dd></div>
        <div><dt>หอพักที่ขอเปิดใช้</dt><dd><Building2 size={16} />{request.property_name}</dd></div>
        <div><dt>จำนวนห้อง</dt><dd>{request.requested_room_count.toLocaleString("th-TH")} ห้อง</dd></div>
        <div><dt>ส่งคำขอเมื่อ</dt><dd>{thaiDate(request.submitted_at)}</dd></div>
      </dl> : <div className="my-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="alert">ไม่พบรายละเอียดคำขอ กรุณาติดต่อผู้ดูแลระบบ</div>}

      {rejected && request?.rejection_reason ? <div className="mb-6 space-y-2 rounded-xl bg-rose-50 p-4 text-sm leading-relaxed text-rose-900 [&>span]:block [&>span]:break-words"><strong>เหตุผลจากผู้ตรวจสอบ</strong><span>{request.rejection_reason}</span></div> : null}

      <div className="space-y-3 text-sm leading-relaxed text-slate-700 [&>strong]:block [&>span]:flex [&>span]:items-start [&>span]:gap-2 [&_svg]:mt-0.5 [&_svg]:shrink-0 [&_svg]:text-blue-700">
        <strong>{rejected ? "ขั้นตอนถัดไป" : "เมื่ออนุมัติแล้ว"}</strong>
        <span><CheckCircle2 size={16} />{rejected ? "ติดต่อผู้ดูแลพร้อมแจ้งชื่อผู้ใช้ของคุณ" : "ระบบจะสร้างกิจการและหอพัก 1 แห่งให้โดยอัตโนมัติ"}</span>
        {!rejected ? <span><CheckCircle2 size={16} />รองรับสูงสุด 10 ห้อง และเริ่มทดลองใช้ฟรี 30 วันในวันอนุมัติ</span> : null}
      </div>
      <a className="mt-8 flex min-h-13 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" href={supportContactUrl()}>ติดต่อผู้ดูแลระบบ</a>
    </section>
  </main>;
}
