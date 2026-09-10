"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/app/register/actions";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { BrandLogo } from "@/components/brand/BrandLogo";

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
  const [state, action, pending] = useActionState(registerAction, initialState);
  const fields = state.fields ?? {};

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-[1fr_520px] lg:grid-cols-[1fr_560px] bg-[#f8fafc]">
      <AuthBrandPanel />
      <section className="flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 bg-white">
        <div className="w-full max-w-sm space-y-6">
          <div className="md:hidden flex justify-center"><BrandLogo className="max-h-11 w-auto object-contain" /></div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">สมัครสมาชิก</h1>
            <p className="text-sm text-slate-500">ส่งคำขอทดลองใช้ Longtua Apartment เมื่อผู้ดูแลอนุมัติแล้วจึงเริ่มใช้งานได้</p>
          </div>
          {state.status === "success" ? (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{state.message}</p>
          ) : !enabled ? (
            <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{full ? "ขณะนี้ครบจำนวน 20 กิจการแล้ว จึงปิดรับสมัครใหม่ชั่วคราว" : "ขณะนี้ระบบปิดรับคำขอทดลองใช้ กรุณากลับมาใหม่ภายหลัง"}</p>
          ) : (
            <form action={action} className="space-y-4" noValidate>
              <p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">แพ็กเกจทดลองใช้ฟรี 30 วัน สำหรับ 1 หอพัก สูงสุด 10 ห้อง เริ่มนับเมื่อผู้ดูแลอนุมัติ</p>
              <fieldset disabled={pending} className="space-y-4 disabled:opacity-70">
                {inputs.map(({ label, ...input }) => (
                  <div key={input.name} className="space-y-1.5">
                    <label htmlFor={input.name} className="text-xs font-semibold text-slate-700">{label} *</label>
                    <input {...input} id={input.name} required
                      defaultValue={input.type === "password" ? undefined : state.values?.[input.name]}
                      aria-invalid={Boolean(fields[input.name])}
                      aria-describedby={fields[input.name] ? `${input.name}-error` : input.name === "username" || input.name === "password" ? `${input.name}-hint` : undefined}
                      className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fields[input.name] ? "border-rose-400" : "border-slate-200"}`} />
                    {input.name === "username" && <p id="username-hint" className="text-xs text-slate-500">4–30 ตัว ใช้ a-z, 0-9, จุด, _ หรือ - โดยขึ้นต้นและลงท้ายด้วยตัวอักษรหรือตัวเลข</p>}
                    {input.name === "password" && <p id="password-hint" className="text-xs text-slate-500">อย่างน้อย 8 ตัว มีทั้งตัวอักษรภาษาอังกฤษและตัวเลข</p>}
                    {fields[input.name] && <p id={`${input.name}-error`} className="text-xs text-rose-600">{fields[input.name]}</p>}
                  </div>
                ))}
                <label className="flex items-start gap-2 text-xs text-slate-600">
                  <input type="checkbox" name="accepted" required className="mt-0.5" aria-invalid={Boolean(fields.accepted)} aria-describedby={fields.accepted ? "accepted-error" : undefined} />
                  <span>ฉันยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว</span>
                </label>
                {fields.accepted && <p id="accepted-error" className="text-xs text-rose-600">{fields.accepted}</p>}
                {state.message && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{state.message}</p>}
                <SubmitButton>ส่งคำขอทดลองใช้</SubmitButton>
              </fieldset>
            </form>
          )}
          <p className="border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
            มีบัญชีแล้ว? <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">เข้าสู่ระบบ</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
