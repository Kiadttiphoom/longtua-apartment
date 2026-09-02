import { CheckCircle2, Crown, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { PageHeader } from "@/components/portal/PortalUI";

export function SubscriptionPage({ subscription }: { subscription: { status: string; trial_ends_at: string | null } }) {
  const statusConfig: Record<string, { label: string; badgeBg: string; badgeText: string; desc: string }> = {
    trialing: {
      label: "ช่วงทดลองใช้ฟรี (Trial)",
      badgeBg: "bg-blue-50 border-blue-200",
      badgeText: "text-blue-700",
      desc: "ท่านกำลังใช้งานระบบในช่วงทดลองใช้งาน 30 วัน พร้อมฟังก์ชันเต็มรูปแบบ",
    },
    active: {
      label: "เปิดใช้งานแล้ว (Active)",
      badgeBg: "bg-emerald-50 border-emerald-200",
      badgeText: "text-emerald-700",
      desc: "แพ็กเกจของท่านเปิดใช้งานสมบูรณ์และพร้อมใช้งานได้ต่อเนื่อง",
    },
    past_due: {
      label: "เกินกำหนดชำระ (Past Due)",
      badgeBg: "bg-rose-50 border-rose-200",
      badgeText: "text-rose-700",
      desc: "กรุณาต่ออายุการใช้งานเพื่อการใช้งานที่ราบรื่นและต่อเนื่อง",
    },
    paused: {
      label: "หยุดชั่วคราว (Paused)",
      badgeBg: "bg-amber-50 border-amber-200",
      badgeText: "text-amber-700",
      desc: "สถานะแพ็กเกจถูกระงับการใช้งานชั่วคราว",
    },
  };

  const current = statusConfig[subscription.status] ?? {
    label: subscription.status,
    badgeBg: "bg-slate-50 border-slate-200",
    badgeText: "text-slate-700",
    desc: "ข้อมูลสถานะบริการ",
  };

  const formattedDate = subscription.trial_ends_at
    ? new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(new Date(subscription.trial_ends_at))
    : "ไม่ระบุวันหมดอายุ";

  const features = [
    "จัดการหอพักและห้องพักได้สูงสุด 100 ห้อง",
    "ออกสัญญาเช่าและใบเสร็จรับเงิน",
    "บันทึกมิเตอร์น้ำ-ไฟ คำนวณหน่วยอัตโนมัติ",
    "ออกใบแจ้งหนี้พร้อม QR PromptPay รับเงิน",
    "ระบบตรวจสอบสลิปโอนเงินของผู้เช่า",
    "พอร์ทัลผู้เช่า (Tenant Portal) ดูบิลและแจ้งชำระ",
    "รายงานสถิติรายรับและอัตราการเข้าพัก",
  ];

  return (
    <div className="portal-refined-page space-y-8">
      <PageHeader
        description="ตรวจสอบสถานะบริการ สิทธิ์การใช้งาน และแพ็กเกจของกิจการ"
        title="แพ็กเกจและบริการ"
      />

      <div className="space-y-6">
        {/* Main Status Hero Card */}
        <section className="p-6 lg:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Crown size={28} />
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Standard Package</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${current.badgeBg} ${current.badgeText}`}>
                  {current.label}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">{current.desc}</p>
              {subscription.trial_ends_at ? (
                <p className="text-xs font-medium text-slate-700 pt-1">
                  สิ้นสุดระยะทดลองใช้วันที่: <strong className="text-blue-600">{formattedDate}</strong>
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
            <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
            <span>ข้อมูลกิจการได้รับการปกป้องและแยกตามองค์กร</span>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-800 font-bold">
              <Sparkles className="text-blue-600" size={20} />
              <h3 className="text-base">ฟังก์ชันที่รวมในแพ็กเกจ</h3>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              {features.map((feat) => (
                <li className="flex items-center gap-2.5" key={feat}>
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0c1a30] text-white shadow-md flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs font-semibold text-blue-300">
                <Zap size={14} />
                <span>ติดต่อทีมงาน</span>
              </div>
              <h3 className="text-lg font-bold">ต้องการเพิ่มจำนวนห้อง หรือปรับแต่งระบบ?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                หากท่านต้องการปลดล็อกโควตาห้องพักมากกว่า 100 ห้อง หรือต้องการติดตั้ง LINE Notify แจ้งเตือนยอดชำระแบบอัตโนมัติ ติดต่อฝ่ายบริการลูกค้าได้ตลอด 24 ชั่วโมง
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>สายด่วน: 02-XXX-XXXX</span>
              <span className="font-semibold text-white">support@longtua.com</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
