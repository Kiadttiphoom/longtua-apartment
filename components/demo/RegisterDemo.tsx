"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { validateRegistration } from "@/components/demo/demo-domain.mjs";

const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  accepted: false,
};

export function RegisterDemo() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRegistration(form) as unknown as Record<string, string>;
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
              <ShieldCheck size={14} /> ทดลองใช้ฟรี 30 วัน
            </span>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">สร้างบัญชีของคุณ</h1>
            <p className="text-xs sm:text-sm text-slate-500">เริ่มต้นจัดการกิจการและหอพักบน Longtua Apartment</p>
          </div>

          <form className="space-y-4" onSubmit={submit} noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">ชื่อ *</label>
                <input
                  aria-invalid={Boolean(errors.firstName)}
                  className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                    errors.firstName ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                  }`}
                  onChange={(event) => update("firstName", event.target.value)}
                  placeholder="ชื่อ"
                  value={form.firstName}
                />
                {errors.firstName ? <small className="text-xs text-rose-600 font-medium block">{errors.firstName}</small> : null}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">นามสกุล *</label>
                <input
                  aria-invalid={Boolean(errors.lastName)}
                  className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                    errors.lastName ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                  }`}
                  onChange={(event) => update("lastName", event.target.value)}
                  placeholder="นามสกุล"
                  value={form.lastName}
                />
                {errors.lastName ? <small className="text-xs text-rose-600 font-medium block">{errors.lastName}</small> : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">เบอร์โทร *</label>
              <input
                aria-invalid={Boolean(errors.phone)}
                className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  errors.phone ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                }`}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="08x-xxx-xxxx"
                value={form.phone}
              />
              {errors.phone ? <small className="text-xs text-rose-600 font-medium block">{errors.phone}</small> : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">อีเมล *</label>
              <input
                aria-invalid={Boolean(errors.email)}
                className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  errors.email ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                }`}
                onChange={(event) => update("email", event.target.value)}
                placeholder="owner@example.com"
                type="email"
                value={form.email}
              />
              {errors.email ? <small className="text-xs text-rose-600 font-medium block">{errors.email}</small> : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">รหัสผ่าน *</label>
                <input
                  aria-invalid={Boolean(errors.password)}
                  className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                    errors.password ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                  }`}
                  onChange={(event) => update("password", event.target.value)}
                  placeholder="อย่างน้อย 8 ตัว"
                  type="password"
                  value={form.password}
                />
                {errors.password ? <small className="text-xs text-rose-600 font-medium block">{errors.password}</small> : null}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">ยืนยันรหัสผ่าน *</label>
                <input
                  aria-invalid={Boolean(errors.confirmPassword)}
                  className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                    errors.confirmPassword ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                  }`}
                  onChange={(event) => update("confirmPassword", event.target.value)}
                  placeholder="กรอกอีกครั้ง"
                  type="password"
                  value={form.confirmPassword}
                />
                {errors.confirmPassword ? <small className="text-xs text-rose-600 font-medium block">{errors.confirmPassword}</small> : null}
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
              <input
                checked={form.accepted}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                onChange={(event) => update("accepted", event.target.checked)}
                type="checkbox"
              />
              <span>ฉันยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว</span>
            </label>
            {errors.accepted ? <small className="text-xs text-rose-600 font-medium block">{errors.accepted}</small> : null}

            <div className="pt-2">
              <button
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                type="submit"
              >
                สมัครและเริ่มทดลองใช้งาน
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-center text-xs text-slate-500">
            <p>
              มีบัญชีแล้ว?{" "}
              <Link className="font-semibold text-blue-600 hover:text-blue-700" href="/demo/login">
                เข้าสู่ระบบ
              </Link>
            </p>
            <p className="text-[11px] text-slate-400">© 2026 Longtua Apartment</p>
          </div>
        </div>
      </section>
    </main>
  );
}
