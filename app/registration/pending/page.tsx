import { Building2, CheckCircle2, Clock3, LogOut, ShieldCheck, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { BrandLogo } from "@/components/brand/BrandLogo";
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
  return <main className="pending-registration-page">
    <section className="pending-registration-card">
      <header>
        <BrandLogo className="pending-registration-logo" />
        <form action={logoutAction}><button className="pending-logout" type="submit"><LogOut size={17} /><span>ออกจากระบบ</span></button></form>
      </header>
      <div className={`pending-status-icon ${rejected ? "rejected" : "waiting"}`}>
        {rejected ? <XCircle size={31} /> : <Clock3 size={31} />}
      </div>
      <span className="pending-eyebrow"><ShieldCheck size={15} /> คำขอทดลองใช้ Longtua Apartment</span>
      <h1>{rejected ? "คำขอยังไม่ได้รับการอนุมัติ" : "กำลังรอผู้ดูแลตรวจสอบ"}</h1>
      <p>{rejected
        ? "ระบบยังไม่ได้สร้างกิจการหรือเริ่มนับช่วงทดลองใช้ฟรี หากข้อมูลไม่ถูกต้องสามารถติดต่อผู้ดูแลเพื่อขอตรวจสอบอีกครั้ง"
        : "เราได้รับข้อมูลแล้ว ระบบจะเริ่มทดลองใช้ฟรี 30 วันหลังจากคำขอได้รับการอนุมัติเท่านั้น"}</p>

      {request ? <dl className="pending-request-summary">
        <div><dt>ผู้ประกอบการ</dt><dd>{request.operator_name}</dd></div>
        <div><dt>หอพักที่ขอเปิดใช้</dt><dd><Building2 size={16} />{request.property_name}</dd></div>
        <div><dt>จำนวนห้อง</dt><dd>{request.requested_room_count.toLocaleString("th-TH")} ห้อง</dd></div>
        <div><dt>ส่งคำขอเมื่อ</dt><dd>{thaiDate(request.submitted_at)}</dd></div>
      </dl> : <div className="pending-request-missing" role="alert">ไม่พบรายละเอียดคำขอ กรุณาติดต่อผู้ดูแลระบบ</div>}

      {rejected && request?.rejection_reason ? <div className="pending-rejection-reason"><strong>เหตุผลจากผู้ตรวจสอบ</strong><span>{request.rejection_reason}</span></div> : null}

      <div className="pending-next-steps">
        <strong>{rejected ? "ขั้นตอนถัดไป" : "เมื่ออนุมัติแล้ว"}</strong>
        <span><CheckCircle2 size={16} />{rejected ? "ติดต่อผู้ดูแลพร้อมแจ้งชื่อผู้ใช้ของคุณ" : "ระบบจะสร้างกิจการและหอพัก 1 แห่งให้โดยอัตโนมัติ"}</span>
        {!rejected ? <span><CheckCircle2 size={16} />รองรับสูงสุด 100 ห้อง และเริ่ม Trial 30 วันในวันอนุมัติ</span> : null}
      </div>
      <a className="pending-contact" href={supportContactUrl()}>ติดต่อผู้ดูแลระบบ</a>
    </section>
  </main>;
}
