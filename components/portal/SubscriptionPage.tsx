"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  Crown,
  DoorClosed,
  HelpCircle,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/portal/PortalUI";
import { getPlanByQuota, SUBSCRIPTION_PLANS, type SubscriptionPlanCode } from "@/lib/portal/plans";

type SubscriptionPageProps = {
  subscription: {
    status: string;
    trial_ends_at: string | null;
    max_properties?: number | null;
    max_rooms?: number | null;
  };
  usage?: {
    propertyCount: number;
    roomCount: number;
    userCount: number;
  };
};

export function SubscriptionPage({ subscription, usage }: SubscriptionPageProps) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState<string | null>(null);

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

  const currentStatus = statusConfig[subscription.status] ?? {
    label: subscription.status,
    badgeBg: "bg-slate-50 border-slate-200",
    badgeText: "text-slate-700",
    desc: "ข้อมูลสถานะบริการ",
  };

  const currentPlan = getPlanByQuota(subscription.max_properties, subscription.max_rooms);

  const propertyCount = usage?.propertyCount ?? 1;
  const roomCount = usage?.roomCount ?? 0;
  const userCount = usage?.userCount ?? 1;

  const maxProperties = subscription.max_properties ?? currentPlan.maxProperties;
  const maxRooms = subscription.max_rooms ?? currentPlan.maxRooms;
  const maxUsers = currentPlan.maxUsers;

  const propPct = Math.min(100, Math.round((propertyCount / maxProperties) * 100));
  const roomPct = Math.min(100, Math.round((roomCount / maxRooms) * 100));
  const userPct = maxUsers > 0 ? Math.min(100, Math.round((userCount / maxUsers) * 100)) : 0;

  const formattedDate = subscription.trial_ends_at
    ? new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(new Date(subscription.trial_ends_at))
    : "ไม่ระบุวันหมดอายุ";

  const allIncludedFeatures = [
    "สัญญาเช่า & ประวัติผู้เช่าไม่จำกัด",
    "จดมิเตอร์น้ำ-ไฟ คำนวณหน่วยอัตโนมัติ",
    "ออกใบแจ้งหนี้พร้อม QR PromptPay รับเงิน",
    "พอร์ทัลผู้เช่า (Tenant Portal) ดูบิล & แจ้งชำระ",
    "ระบบตรวจสอบสลิปโอนเงิน",
    "รายงานสถิติรายรับและอัตราการเข้าพัก",
  ];

  const paidPlans: SubscriptionPlanCode[] = ["starter", "growth", "pro", "business"];

  function handleUpgradeClick(planName: string) {
    setSelectedPlanToUpgrade(planName);
    setShowContactModal(true);
  }

  return (
    <>
      <div className="portal-refined-page space-y-8 max-w-6xl mx-auto">
      <PageHeader
        description="ตรวจสอบสถานะการใช้งาน โควตาหอพักและห้องพัก พร้อมเลือกแพ็กเกจที่เหมาะสมกับธุรกิจของคุณ"
        title="แพ็กเกจและบริการ"
      />

      {/* Hero: Current Plan & Quota Usage Overview */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 lg:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
              <Crown size={28} />
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight">
                  แพ็กเกจ {currentPlan.name}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStatus.badgeBg} ${currentStatus.badgeText}`}>
                  {currentStatus.label}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">{currentPlan.description} — {currentPlan.targetAudience}</p>
              {subscription.trial_ends_at && (
                <p className="text-xs text-blue-200 pt-0.5">
                  ระยะทดลองใช้งานถึงวันที่: <strong className="text-white underline decoration-blue-400">{formattedDate}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleUpgradeClick(currentPlan.name)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Zap size={16} />
              <span>อัปเกรด / ต่ออายุแพ็กเกจ</span>
            </button>
          </div>
        </div>

        {/* Quota Usage Gauge Meters */}
        <div className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Properties Quota */}
          <div className="pt-4 md:pt-0 md:px-4 first:pt-0 first:px-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                <Building2 className="text-blue-600" size={18} />
                <span>จำนวนหอพัก</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {propertyCount} / {maxProperties >= 999 ? "ไม่จำกัด" : `${maxProperties} หอ`}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  propPct >= 100 ? "bg-rose-500" : propPct >= 80 ? "bg-amber-500" : "bg-blue-600"
                }`}
                style={{ width: `${maxProperties >= 999 ? 10 : propPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{maxProperties >= 999 ? "เปิดหอพักได้ไม่จำกัด" : `ใช้ไปแล้ว ${propPct}% ของโควตา`}</span>
              {propPct >= 100 && maxProperties < 999 && (
                <span className="text-rose-600 font-semibold">โควตาเต็ม</span>
              )}
            </div>
          </div>

          {/* Rooms Quota */}
          <div className="pt-4 md:pt-0 md:px-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                <DoorClosed className="text-indigo-600" size={18} />
                <span>จำนวนห้องพักรวม</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {roomCount} / {maxRooms} ห้อง
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  roomPct >= 100 ? "bg-rose-500" : roomPct >= 80 ? "bg-amber-500" : "bg-indigo-600"
                }`}
                style={{ width: `${roomPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>ใช้ไปแล้ว {roomPct}% ของโควตา</span>
              {roomPct >= 100 ? (
                <span className="text-rose-600 font-semibold">โควตาห้องเต็ม</span>
              ) : (
                <span>เหลืออีก {Math.max(0, maxRooms - roomCount)} ห้อง</span>
              )}
            </div>
          </div>

          {/* Users Quota */}
          <div className="pt-4 md:pt-0 md:px-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                <Users className="text-emerald-600" size={18} />
                <span>ผู้ใช้งานในระบบ</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {userCount} / {maxUsers > 0 ? `${maxUsers} คน` : "ไม่จำกัด"}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  userPct >= 100 ? "bg-rose-500" : userPct >= 80 ? "bg-amber-500" : "bg-emerald-600"
                }`}
                style={{ width: `${maxUsers > 0 ? userPct : 15}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{maxUsers > 0 ? `ใช้ไปแล้ว ${userPct}% ของโควตา` : "เพิ่มทีมงานได้ไม่จำกัด"}</span>
              {maxUsers > 0 && userPct >= 100 && (
                <span className="text-rose-600 font-semibold">ครบตามโควตา</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Tier Cards */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/70 inline-block">
            เลือกแพ็กเกจที่ตรงกับขนาดหอพักของคุณ
          </span>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
            อัตราค่าบริการรายเดือนแบบเหมาจ่าย
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            ไม่มีค่าธรรมเนียมแอบแฝง ไม่ต้องคอยซื้อเครดิตเพิ่ม ได้ครบทุกฟังก์ชันตั้งแต่แพ็กเกจแรก
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paidPlans.map((code) => {
            const plan = SUBSCRIPTION_PLANS[code];
            const isCurrent = currentPlan.code === code;
            const isPopular = plan.popular;

            return (
              <div
                key={code}
                className={`relative rounded-2xl bg-white transition-all duration-200 flex flex-col justify-between border ${
                  isPopular
                    ? "border-blue-500 shadow-md ring-2 ring-blue-500/20"
                    : isCurrent
                    ? "border-emerald-500 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 shadow-xs"
                } p-6`}
              >
                {/* Popular or Current Badge */}
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold tracking-wide shadow-sm">
                    ยอดนิยม คุ้มค่าที่สุด
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold tracking-wide shadow-sm">
                    แพ็กเกจปัจจุบัน
                  </div>
                )}

                <div className="space-y-4">
                  {/* Plan Name & Target */}
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-slate-800">{plan.name}</h4>
                    <p className="text-xs text-slate-500 min-h-[32px]">{plan.targetAudience}</p>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        ฿{plan.priceMonthly.toLocaleString("th-TH")}
                      </span>
                      <span className="text-xs text-slate-500">/ เดือน</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">ชำระรายเดือน ยกเลิกเมื่อใดก็ได้</p>
                  </div>

                  {/* Quota Highlights */}
                  <div className="space-y-2.5 pt-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2 font-medium">
                      <Building2 size={16} className="text-blue-600 shrink-0" />
                      <span>
                        {plan.maxProperties >= 999
                          ? "ไม่จำกัดจำนวนหอพัก"
                          : `สูงสุด ${plan.maxProperties} หอพัก`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <DoorClosed size={16} className="text-indigo-600 shrink-0" />
                      <span>รวมสูงสุด {plan.maxRooms} ห้อง</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Users size={16} className="text-emerald-600 shrink-0" />
                      <span>
                        {plan.maxUsers > 0 ? `ผู้ใช้งาน ${plan.maxUsers} คน` : "ผู้ใช้งานไม่จำกัด"}
                      </span>
                    </div>
                  </div>

                  {/* Feature Checkmarks */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>จดมิเตอร์น้ำไฟ & คำนวณยอด</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>ใบแจ้งหนี้พร้อม PromptPay QR</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>พอร์ทัลผู้เช่า ดูบิลและแจ้งโอน</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>พิมพ์สัญญาเช่า & ใบเสร็จ</span>
                    </div>
                  </div>
                </div>

                {/* Upgrade Button */}
                <div className="pt-6 mt-4 border-t border-slate-100">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-default"
                    >
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>กำลังใช้งานแพ็กเกจนี้</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpgradeClick(plan.name)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isPopular
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      <span>เลือกแพ็กเกจ {plan.name}</span>
                      <ArrowUpRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Included Features Banner */}
      <section className="p-6 lg:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </span>
          <div>
            <h4 className="text-base font-bold text-slate-800">ฟังก์ชันหลักครบครันทุกแพ็กเกจ</h4>
            <p className="text-xs text-slate-500">
              ทุกระดับราคาได้รับเครื่องมือบริหารหอพักอย่างเต็มประสิทธิภาพโดยไม่มีข้อจำกัดฟังก์ชัน
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs sm:text-sm text-slate-700">
          {allIncludedFeatures.map((feat) => (
            <div key={feat} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </section>
      </div>

      {/* Contact & Support Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Crown size={20} className="text-blue-600" />
                  <span>ติดต่ออัปเกรด / ต่ออายุแพ็กเกจ</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {selectedPlanToUpgrade
                  ? `ท่านสนใจแพ็กเกจ: ${selectedPlanToUpgrade}`
                  : "ติดต่อทีมงานฝ่ายบริการลูกค้าเพื่อแจ้งปรับเปลี่ยนแพ็กเกจหรือชำระเงิน"}
              </p>
            </div>

            <div className="space-y-3">
              {/* LINE Contact */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <MessageCircle size={16} className="text-emerald-600" />
                    <span>LINE (แจ้งชำระเงิน / ปรับโควตา)</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                    ตอบเร็วสุด
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  แอดไลน์เพื่อส่งสลิปโอนเงิน แจ้งชื่อหอพัก หรือขอคำปรึกษาได้ทันที
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <a
                    href="https://line.me/ti/p/~p.pond29"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-xs transition-colors"
                  >
                    <span>ID: p.pond29</span>
                    <ArrowUpRight size={13} />
                  </a>
                  <span className="text-[11px] text-slate-400">(คลิกเพื่อเปิด LINE)</span>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Phone size={15} className="text-blue-600" />
                    <span>โทรศัพท์สายตรง</span>
                  </div>
                  <a
                    href="tel:0630907500"
                    className="block text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline pt-0.5"
                  >
                    063-090-7500
                  </a>
                  <p className="text-[10px] text-slate-400">ทุกวัน 08:30 - 20:00 น.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span className="text-blue-600 font-bold">@</span>
                    <span>อีเมลติดต่อ</span>
                  </div>
                  <a
                    href="mailto:official.longtua@gmail.com"
                    className="block text-xs font-bold text-slate-700 hover:text-blue-600 hover:underline pt-0.5 truncate"
                    title="official.longtua@gmail.com"
                  >
                    official.longtua@gmail.com
                  </a>
                  <p className="text-[10px] text-slate-400">ตอบกลับภายใน 24 ชม.</p>
                </div>
              </div>

              {/* Payment notification guide */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-blue-600" />
                  <span>ขั้นตอนการแจ้งชำระเงิน</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  โอนชำระเงินตามแพ็กเกจที่เลือก และส่งสลิปพร้อมแจ้งชื่อหอพักหรือ Username ทาง LINE <strong>p.pond29</strong> แอดมินจะทำการปรับสิทธิ์และขยายโควตาให้ทันทีครับ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </>
  );
}

