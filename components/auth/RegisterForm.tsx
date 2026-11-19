"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { registerAction, type RegisterState } from "@/app/register/actions";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: RegisterState = { status: "idle" };
const inputs = [
  { name: "operatorName", label: "ชื่อผู้ประกอบการ", type: "text", autoComplete: "name", maxLength: 120 },
  { name: "propertyName", label: "ชื่อหอพัก", type: "text", autoComplete: "organization", maxLength: 160 },
  { name: "contactEmail", label: "อีเมลติดต่อ", type: "email", autoComplete: "email", maxLength: 254 },
  { name: "phone", label: "เบอร์โทรศัพท์", type: "tel", autoComplete: "tel", maxLength: 20 },
  { name: "username", label: "ชื่อผู้ใช้", type: "text", autoComplete: "username", maxLength: 30 },
  { name: "password", label: "รหัสผ่าน", type: "password", autoComplete: "new-password" },
  { name: "confirmPassword", label: "ยืนยันรหัสผ่าน", type: "password", autoComplete: "new-password" },
];

export function RegisterForm({ enabled, full = false }: { enabled: boolean; full?: boolean }) {
  const [passwords, setPasswords] = useState<Record<string, string>>({ password: "", confirmPassword: "" });
  const [accepted, setAccepted] = useState(false);
  const [state, action, pending] = useActionState(async (previous: RegisterState, formData: FormData) => {
    const result = await registerAction(previous, formData);
    if (result.status === "success") {
      setPasswords({ password: "", confirmPassword: "" });
      setAccepted(false);
    }
    return result;
  }, initialState);
  const fields = state.fields ?? {};

  return (
    <main className="min-h-dvh grid grid-cols-1 md:grid-cols-[1fr_520px] lg:grid-cols-[1fr_560px] bg-white selection:bg-blue-100 selection:text-blue-950">
      <AuthBrandPanel />
      <section className="flex min-w-0 flex-col items-center bg-white md:justify-center md:p-10 lg:p-14">
        <div className="w-full max-w-md px-6 pt-10 sm:px-8 md:hidden">
          <div className="border-b border-slate-100 pb-7" aria-label="Longtua Apartment">
            <p className="text-3xl font-bold tracking-tight text-blue-700">Longtua<span className="text-slate-900">.</span></p>
            <p className="mt-1 text-sm text-slate-600">ลงตัว อพาร์ตเมนต์</p>
          </div>
        </div>
        <div className="w-full max-w-md space-y-6 px-6 pb-8 pt-8 sm:px-8 md:px-0 md:py-0">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold leading-tight text-slate-900">
              {state.status === "success" ? "ลงทะเบียนสำเร็จ" : "สมัครทดลองใช้งานฟรี"}
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              {state.status === "success"
                ? "ขอบคุณที่สนใจเริ่มต้นใช้งานระบบบริหารหอพัก Longtua Apartment"
                : "เริ่มต้นใช้งานระบบบริหารหอพัก Longtua Apartment ฟรี 10 ห้องแรก โดยไม่มีค่าใช้จ่าย"}
            </p>
          </div>
          {state.status === "success" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-7 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-13 h-13 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                <CheckCircle2 size={30} />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-slate-900">ส่งคำขอทดลองใช้เรียบร้อยแล้ว</h2>
                <div role="status" className="text-sm text-slate-600 leading-relaxed space-y-1">
                  <p>ระบบได้รับข้อมูลการลงทะเบียนเรียบร้อยแล้ว</p>
                  <p className="text-slate-800 font-medium">
                    เจ้าหน้าที่จะตรวจสอบและติดต่อกลับ<br className="hidden sm:inline" /> เพื่อเปิดใช้งานระบบให้ท่านโดยเร็วที่สุด
                  </p>
                </div>
              </div>

              {/* LINE QR Code Section */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-2xs">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#06C755]/10 text-[#06C755]">
                    LINE Official Account
                  </span>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                    ติดต่อเจ้าหน้าที่ผ่าน LINE เพื่อแจ้งเปิดใช้งานทันที<br className="hidden sm:inline" /> หรือสอบถามข้อมูลเพิ่มเติม
                  </p>
                </div>
                <div className="py-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/qr_code.jpg"
                    alt="LINE Official QR Code"
                    className="w-36 h-36 object-contain mx-auto rounded-xl border border-slate-200 bg-white p-1 shadow-2xs"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    สแกน QR Code หรือเพิ่มเพื่อนใน LINE เพื่อติดต่อเจ้าหน้าที่
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-sm"
                >
                  <span>ไปที่หน้าเข้าสู่ระบบ (Login)</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : !enabled ? (
            <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{full ? "ขณะนี้ครบจำนวน 20 กิจการแล้ว จึงปิดรับสมัครใหม่ชั่วคราว" : "ขณะนี้ระบบปิดรับคำขอทดลองใช้ กรุณากลับมาใหม่ภายหลัง"}</p>
          ) : (
            <form action={action} className="space-y-4" noValidate>
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/90 to-indigo-50/50 p-4 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
                    <Sparkles size={13} /> แพลนฟรี 10 ห้อง (0 บาท)
                  </span>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">ไม่มีข้อผูกมัด</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ทดลองใช้ฟรีทุกฟังก์ชัน หากมีห้องเพิ่มขึ้น สามารถอัปเกรดเป็น Starter (99 บ.) หรือ Growth (199 บ.) ได้ตลอดเวลาในระบบ
                </p>
              </div>

              <fieldset disabled={pending} className="space-y-5 disabled:opacity-70 [&>button]:h-12 [&>button]:text-base [&>button]:shadow-none">
                {inputs.map(({ label, ...input }) => (
                  <div key={input.name} className="space-y-1.5">
                    <label htmlFor={input.name} className="text-sm font-semibold text-slate-700">{label} <span className="text-rose-500">*</span></label>
                    <input {...input} id={input.name} required
                      {...(input.type === "password" ? {
                        value: passwords[input.name],
                        onChange: (event: React.ChangeEvent<HTMLInputElement>) => setPasswords((current) => ({ ...current, [input.name]: event.target.value })),
                      } : { defaultValue: state.values?.[input.name] })}
                      aria-invalid={Boolean(fields[input.name])}
                      aria-describedby={fields[input.name] ? `${input.name}-error` : input.name === "username" || input.name === "password" ? `${input.name}-hint` : undefined}
                      className={`w-full h-12 px-3.5 rounded-xl border bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors ${fields[input.name] ? "border-rose-400" : "border-slate-200"}`} />
                    {input.name === "username" && <p id="username-hint" className="text-[11px] text-slate-500">4–30 ตัว ใช้ a-z, 0-9, จุด, _ หรือ - โดยขึ้นต้นและลงท้ายด้วยตัวอักษรหรือตัวเลข</p>}
                    {input.name === "password" && <p id="password-hint" className="text-[11px] text-slate-500">อย่างน้อย 8 ตัว มีทั้งตัวอักษรภาษาอังกฤษและตัวเลข</p>}
                    {fields[input.name] && <p id={`${input.name}-error`} className="text-xs text-rose-600">{fields[input.name]}</p>}
                  </div>
                ))}
                <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-sm leading-relaxed text-slate-600">
                  <input type="checkbox" name="accepted" required checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 rounded text-blue-600 focus:ring-blue-500" aria-invalid={Boolean(fields.accepted)} aria-describedby={fields.accepted ? "accepted-error" : undefined} />
                  <span>ฉันยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว</span>
                </label>
                {fields.accepted && <p id="accepted-error" className="text-xs text-rose-600">{fields.accepted}</p>}
                {state.message && <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{state.message}</p>}
                <SubmitButton>สมัครทดลองใช้งานฟรี</SubmitButton>
              </fieldset>
            </form>
          )}
          <p className="border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
            มีบัญชีแล้ว? <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-blue-700 underline-offset-4 hover:underline">เข้าสู่ระบบ</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
