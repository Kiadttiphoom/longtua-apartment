"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";

export function LoginDemo() {
  const [email, setEmail] = useState("owner@somchai.com");
  const [showPassword, setShowPassword] = useState(false);

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
          <form className="login-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              <span>อีเมล</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
            </label>
            <label>
              <span>รหัสผ่าน</span>
              <span className="password-field">
                <input defaultValue="longtua-demo" type={showPassword ? "text" : "password"} />
                <button type="button" aria-label="แสดงรหัสผ่าน" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <div className="login-row">
              <label className="check-label"><input type="checkbox" defaultChecked /> จดจำฉัน</label>
              <button className="text-button" type="button">ลืมรหัสผ่าน?</button>
            </div>
            <Link className="button primary large" href="/dashboard">เข้าสู่ระบบ</Link>
          </form>
          <p className="register-link">ยังไม่มีบัญชี? <Link href="/register">สมัครใช้งานฟรี 30 วัน</Link></p>
          <p className="login-footer">© 2026 Longtua Apartment</p>
        </div>
      </section>
    </main>
  );
}
