"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { validateLogin } from "@/components/demo/demo-domain.mjs";

export function LoginDemo() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@somchai.com");
  const [password, setPassword] = useState("longtua-demo");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLogin({ email, password }) as unknown as Record<string, string>;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) router.push("/demo");
  }

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
              <ShieldCheck size={14} /> เข้าสู่ระบบ Demo
            </span>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ยินดีต้อนรับกลับ</h1>
            <p className="text-xs sm:text-sm text-slate-500">กรอกข้อมูลบัญชีเพื่อเข้าสู่ Longtua Apartment Demo</p>
          </div>

          <form className="space-y-4" onSubmit={submit} noValidate>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">อีเมล</label>
              <input
                aria-invalid={Boolean(errors.email)}
                className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  errors.email ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                }`}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
              {errors.email ? <small className="text-xs text-rose-600 font-medium block">{errors.email}</small> : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">รหัสผ่าน</label>
              <div className="relative">
                <input
                  aria-invalid={Boolean(errors.password)}
                  className={`w-full h-11 pl-3.5 pr-11 rounded-xl border bg-slate-50/50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                    errors.password ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                  }`}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label="แสดงรหัสผ่าน"
                  className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password ? <small className="text-xs text-rose-600 font-medium block">{errors.password}</small> : null}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked type="checkbox" />
                <span>จดจำฉัน</span>
              </label>
              <button
                className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                onClick={() => setNotice("ส่งลิงก์ตั้งรหัสผ่านตัวอย่างไปยังอีเมลแล้ว")}
                type="button"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            {notice ? (
              <p className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium" role="status">
                {notice}
              </p>
            ) : null}

            <div className="pt-2">
              <button
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                type="submit"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-center text-xs text-slate-500">
            <p>
              ยังไม่มีบัญชี?{" "}
              <Link className="font-semibold text-blue-600 hover:text-blue-700" href="/demo/register">
                สมัครใช้งานฟรี 30 วัน
              </Link>
            </p>
            <p className="text-[11px] text-slate-400">© 2026 Longtua Apartment</p>
          </div>
        </div>
      </section>
    </main>
  );
}
