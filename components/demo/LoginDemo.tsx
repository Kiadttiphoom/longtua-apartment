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
    <main className="login-page">
      <AuthBrandPanel />

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="login-form-logo">
            <BrandLogo className="login-brand-logo" />
          </div>
          <div className="login-heading">
            <span className="login-security"><ShieldCheck size={18} /> เข้าสู่ระบบอย่างปลอดภัย</span>
            <h2>ยินดีต้อนรับกลับ</h2>
            <p>กรอกข้อมูลบัญชีเพื่อเข้าสู่ Longtua Apartment</p>
          </div>
          <form className="login-form" onSubmit={submit} noValidate>
            <label>
              <span>อีเมล</span>
              <input aria-invalid={Boolean(errors.email)} value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
              {errors.email ? <small className="field-error">{errors.email}</small> : null}
            </label>
            <label>
              <span>รหัสผ่าน</span>
              <span className="password-field">
                <input aria-invalid={Boolean(errors.password)} value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} />
                <button type="button" aria-label="แสดงรหัสผ่าน" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
              {errors.password ? <small className="field-error">{errors.password}</small> : null}
            </label>
            <div className="login-row">
              <label className="check-label"><input type="checkbox" defaultChecked /> จดจำฉัน</label>
              <button className="text-button" type="button" onClick={() => setNotice("ส่งลิงก์ตั้งรหัสผ่านตัวอย่างไปยังอีเมลแล้ว")}>ลืมรหัสผ่าน?</button>
            </div>
            {notice ? <p className="form-notice" role="status">{notice}</p> : null}
            <button className="button primary large" type="submit">เข้าสู่ระบบ</button>
          </form>
          <p className="register-link">ยังไม่มีบัญชี? <Link href="/demo/register">สมัครใช้งานฟรี 30 วัน</Link></p>
          <p className="login-footer">© 2026 Longtua Apartment</p>
        </div>
      </section>
    </main>
  );
}
