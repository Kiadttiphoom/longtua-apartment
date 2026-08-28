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
    <main className="login-page">
      <AuthBrandPanel />
      <section className="login-form-panel">
        <div className="login-form-wrap register-auth-card">
          <div className="login-form-logo">
            <BrandLogo className="login-brand-logo" />
          </div>
          <div className="login-heading">
            <span className="login-security"><ShieldCheck size={18} /> ทดลองใช้ฟรี 30 วัน</span>
            <h2>สร้างบัญชีของคุณ</h2>
            <p>เริ่มต้นจัดการกิจการและหอพักบน Longtua Apartment</p>
          </div>
          <form className="register-form" onSubmit={submit} noValidate>
            <div className="field-row">
              <label><span>ชื่อ *</span><input aria-invalid={Boolean(errors.firstName)} value={form.firstName} onChange={(event) => update("firstName", event.target.value)} placeholder="ชื่อ" />{errors.firstName ? <small className="field-error">{errors.firstName}</small> : null}</label>
              <label><span>นามสกุล *</span><input aria-invalid={Boolean(errors.lastName)} value={form.lastName} onChange={(event) => update("lastName", event.target.value)} placeholder="นามสกุล" />{errors.lastName ? <small className="field-error">{errors.lastName}</small> : null}</label>
            </div>
            <label><span>เบอร์โทร *</span><input aria-invalid={Boolean(errors.phone)} value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="08x-xxx-xxxx" />{errors.phone ? <small className="field-error">{errors.phone}</small> : null}</label>
            <label><span>อีเมล *</span><input aria-invalid={Boolean(errors.email)} value={form.email} onChange={(event) => update("email", event.target.value)} type="email" placeholder="owner@example.com" />{errors.email ? <small className="field-error">{errors.email}</small> : null}</label>
            <div className="field-row">
              <label><span>รหัสผ่าน *</span><input aria-invalid={Boolean(errors.password)} value={form.password} onChange={(event) => update("password", event.target.value)} type="password" placeholder="อย่างน้อย 8 ตัวอักษร" />{errors.password ? <small className="field-error">{errors.password}</small> : null}</label>
              <label><span>ยืนยันรหัสผ่าน *</span><input aria-invalid={Boolean(errors.confirmPassword)} value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} type="password" placeholder="กรอกอีกครั้ง" />{errors.confirmPassword ? <small className="field-error">{errors.confirmPassword}</small> : null}</label>
            </div>
            <label className="check-label register-consent"><input checked={form.accepted} onChange={(event) => update("accepted", event.target.checked)} type="checkbox" /> ฉันยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว</label>
            {errors.accepted ? <small className="field-error">{errors.accepted}</small> : null}
            <button className="button primary large" type="submit">สมัครและเริ่มทดลองใช้งาน</button>
          </form>
          <p className="register-link">มีบัญชีแล้ว? <Link href="/demo/login">เข้าสู่ระบบ</Link></p>
          <p className="login-footer">© 2026 Longtua Apartment</p>
        </div>
      </section>
    </main>
  );
}
