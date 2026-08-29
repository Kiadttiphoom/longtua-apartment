import { CircleDollarSign, ShieldCheck } from "lucide-react";

export function SubscriptionPage({ subscription }: { subscription: { status: string; trial_ends_at: string | null } }) {
  const label = ({ trialing: "ทดลองใช้ฟรี", active: "ใช้งาน", past_due: "เกินกำหนดชำระ", paused: "หยุดชั่วคราว" } as Record<string, string>)[subscription.status] ?? subscription.status;
  return <><header className="portal-page-header"><div><h1>แพ็กเกจและบริการ</h1><p>ตรวจสอบสถานะบริการและสิทธิ์การใช้งานของกิจการ</p></div></header><section className="portal-plan"><span><CircleDollarSign size={26} /></span><div><small>สถานะปัจจุบัน</small><h2>{label}</h2><p>{subscription.trial_ends_at ? `ทดลองใช้ฟรีถึง ${new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(new Date(subscription.trial_ends_at))}` : "ระบบยังไม่ได้กำหนดวันสิ้นสุดบริการ"}</p></div><i><ShieldCheck size={18} />ข้อมูลได้รับการปกป้อง</i></section></>;
}
