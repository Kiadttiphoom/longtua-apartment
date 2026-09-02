"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { loginAction, type AuthActionState } from "@/app/auth/actions";

const initialAuthActionState: AuthActionState = { status: "idle" };

export function LoginForm({ supportUrl = "https://longtua.com/contact" }: { supportUrl?: string }) {
  const [state, action] = useActionState(loginAction, initialAuthActionState);
  const [showPassword, setShowPassword] = useState(false);
  const fields = state.error?.fields ?? {};

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-[1fr_520px] lg:grid-cols-[1fr_560px] bg-[#f8fafc]">
      <AuthBrandPanel />

      <section className="flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 bg-white overflow-y-auto">
        <div className="w-full max-w-sm space-y-6">
          <div className="md:hidden flex justify-center pb-2">
            <BrandLogo className="max-h-11 w-auto object-contain" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <ShieldCheck size={14} /> เข้าสู่ระบบอย่างปลอดภัย
            </span>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ยินดีต้อนรับกลับ</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              ใช้ชื่อผู้ใช้และรหัสผ่านของ Longtua เพื่อเข้าใช้งาน
            </p>
          </div>

          <form action={action} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700" htmlFor="username">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <input
                  aria-invalid={Boolean(fields.username)}
                  autoComplete="username"
                  className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                    fields.username ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                  }`}
                  defaultValue={state.values?.username}
                  id="username"
                  name="username"
                  placeholder="เช่น somchai.owner หรือ admin"
                />
              </div>
              {fields.username ? (
                <small className="text-xs text-rose-600 font-medium block">{fields.username}</small>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700" htmlFor="password">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  aria-invalid={Boolean(fields.password)}
                  autoComplete="current-password"
                  className={`w-full h-11 pl-3.5 pr-11 rounded-xl border bg-slate-50/50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                    fields.password ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                  }`}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fields.password ? (
                <small className="text-xs text-rose-600 font-medium block">{fields.password}</small>
              ) : null}
            </div>

            {state.error && state.error.code !== "validation_failed" ? (
              <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium" role="alert">
                {state.error.message}
              </p>
            ) : null}

            <div className="pt-2">
              <SubmitButton>เข้าสู่ระบบ</SubmitButton>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-center text-xs text-slate-500">
            <p>
              ต้องการความช่วยเหลือ?{" "}
              <Link className="font-semibold text-blue-600 hover:text-blue-700" href={supportUrl}>
                ติดต่อผู้ดูแลระบบ
              </Link>
            </p>
            <p className="text-[11px] text-slate-400">© 2026 Longtua Apartment</p>
          </div>
        </div>
      </section>
    </main>
  );
}
