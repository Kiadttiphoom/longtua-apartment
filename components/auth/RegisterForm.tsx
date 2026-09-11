"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
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
        <div className="w-full max-w-md space-y-7 px-6 pb-8 pt-8 sm:px-8 md:px-0 md:py-0">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold leading-tight text-slate-900">สมัครสมาชิก</h1>
            <p className="text-sm leading-relaxed text-slate-600">ส่งคำขอทดลองใช้ Longtua Apartment เมื่อผู้ดูแลอนุมัติแล้วจึงเริ่มใช้งานได้</p>
          </div>
          {state.status === "success" ? (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{state.message}</p>
          ) : !enabled ? (
            <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{full ? "ขณะนี้ครบจำนวน 20 กิจการแล้ว จึงปิดรับสมัครใหม่ชั่วคราว" : "ขณะนี้ระบบปิดรับคำขอทดลองใช้ กรุณากลับมาใหม่ภายหลัง"}</p>
          ) : (
            <form action={action} className="space-y-4" noValidate>
              <p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">แพ็กเกจทดลองใช้ฟรี 30 วัน สำหรับ 1 หอพัก สูงสุด 10 ห้อง เริ่มนับเมื่อผู้ดูแลอนุมัติ</p>
              <fieldset disabled={pending} className="space-y-6 disabled:opacity-70 [&>button]:h-13 [&>button]:text-base [&>button]:shadow-none">
                {inputs.map(({ label, ...input }) => (
                  <div key={input.name} className="space-y-1.5">
                    <label htmlFor={input.name} className="text-sm font-semibold text-slate-700">{label} *</label>
                    <input {...input} id={input.name} required
                      {...(input.type === "password" ? {
                        value: passwords[input.name],
                        onChange: (event: React.ChangeEvent<HTMLInputElement>) => setPasswords((current) => ({ ...current, [input.name]: event.target.value })),
                      } : { defaultValue: state.values?.[input.name] })}
                      aria-invalid={Boolean(fields[input.name])}
                      aria-describedby={fields[input.name] ? `${input.name}-error` : input.name === "username" || input.name === "password" ? `${input.name}-hint` : undefined}
                      className={`w-full h-13 px-3.5 rounded-xl border bg-slate-50/50 text-base text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors ${fields[input.name] ? "border-rose-400" : "border-slate-200"}`} />
                    {input.name === "username" && <p id="username-hint" className="text-xs text-slate-500">4–30 ตัว ใช้ a-z, 0-9, จุด, _ หรือ - โดยขึ้นต้นและลงท้ายด้วยตัวอักษรหรือตัวเลข</p>}
                    {input.name === "password" && <p id="password-hint" className="text-xs text-slate-500">อย่างน้อย 8 ตัว มีทั้งตัวอักษรภาษาอังกฤษและตัวเลข</p>}
                    {fields[input.name] && <p id={`${input.name}-error`} className="text-xs text-rose-600">{fields[input.name]}</p>}
                  </div>
                ))}
                <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm leading-relaxed text-slate-600">
                  <input type="checkbox" name="accepted" required checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5" aria-invalid={Boolean(fields.accepted)} aria-describedby={fields.accepted ? "accepted-error" : undefined} />
                  <span>ฉันยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว</span>
                </label>
                {fields.accepted && <p id="accepted-error" className="text-xs text-rose-600">{fields.accepted}</p>}
                {state.message && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{state.message}</p>}
                <SubmitButton>ส่งคำขอทดลองใช้</SubmitButton>
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
