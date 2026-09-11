"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { loginAction, type AuthActionState } from "@/app/auth/actions";

const initialAuthActionState: AuthActionState = { status: "idle" };

export function LoginForm({ supportUrl = "https://longtua.com/contact" }: { supportUrl?: string }) {
  const [state, action] = useActionState(loginAction, initialAuthActionState);
  const [showPassword, setShowPassword] = useState(false);
  const fields = state.error?.fields ?? {};

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
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">ยินดีต้อนรับกลับ</h1>
            <p className="text-sm leading-relaxed text-slate-600">
              เข้าสู่ระบบเพื่อจัดการหอพักของคุณ
            </p>
          </div>

          <form action={action} className="space-y-6" noValidate>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="username">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <input
                  aria-invalid={Boolean(fields.username)}
                  aria-describedby={fields.username ? "login-username-error" : undefined}
                  autoComplete="username"
                  className={`w-full h-13 px-3.5 rounded-xl border bg-slate-50/50 text-slate-900 text-base placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                    fields.username ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                  }`}
                  defaultValue={state.values?.username}
                  id="username"
                  name="username"
                  placeholder="เช่น somchai.owner หรือ admin"
                />
              </div>
              {fields.username ? (
                <small id="login-username-error" className="text-sm text-rose-700 font-medium block">{fields.username}</small>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  aria-invalid={Boolean(fields.password)}
                  aria-describedby={fields.password ? "login-password-error" : undefined}
                  autoComplete="current-password"
                  className={`w-full h-13 pl-3.5 pr-11 rounded-xl border bg-slate-50/50 text-slate-900 text-base placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                    fields.password ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                  }`}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={showPassword}
                  className="absolute right-0 top-0 h-13 w-12 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-r-xl focus-visible:outline-2 focus-visible:outline-blue-600 transition-colors cursor-pointer"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fields.password ? (
                <small id="login-password-error" className="text-sm text-rose-700 font-medium block">{fields.password}</small>
              ) : null}
            </div>

            {state.error && state.error.code !== "validation_failed" ? (
              <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium" role="alert">
                {state.error.message}
              </p>
            ) : null}

            <div className="pt-1 [&>button]:h-13 [&>button]:text-base [&>button]:shadow-none">
              <SubmitButton>เข้าสู่ระบบ</SubmitButton>
            </div>
          </form>

          <div className="border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
            <p>ยังไม่มีบัญชี? <Link className="inline-flex min-h-11 items-center font-semibold text-blue-700 underline-offset-4 hover:underline" href="/register">สมัครสมาชิก</Link></p>
            <p>
              <Link className="inline-flex min-h-11 items-center text-slate-600 underline underline-offset-4 hover:text-blue-700" href={supportUrl}>
                ติดต่อผู้ดูแลระบบ
              </Link>
            </p>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500"><ShieldCheck size={14} aria-hidden="true" /> เข้าสู่ระบบอย่างปลอดภัย</p>
            <p className="mt-2 text-xs text-slate-500">© 2026 Longtua Apartment</p>
          </div>
        </div>
      </section>
    </main>
  );
}
