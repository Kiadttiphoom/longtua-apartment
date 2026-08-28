"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { loginAction, type AuthActionState } from "@/app/auth/actions";

const initialAuthActionState: AuthActionState = { status: "idle" };

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initialAuthActionState);
  const [showPassword, setShowPassword] = useState(false);
  const fields = state.error?.fields ?? {};

  return (
    <main className="login-page">
      <AuthBrandPanel />
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="login-form-logo"><BrandLogo className="login-brand-logo" /></div>
          <div className="login-heading">
            <span className="login-security"><ShieldCheck size={18} /> เข้าสู่ระบบอย่างปลอดภัย</span>
            <h1>ยินดีต้อนรับกลับ</h1>
            <p>ใช้ชื่อผู้ใช้และรหัสผ่านของ Longtua โดยไม่ต้องกรอกอีเมล</p>
          </div>
          <form action={action} className="login-form" noValidate>
            <label>
              <span>ชื่อผู้ใช้</span>
              <input aria-invalid={Boolean(fields.username)} autoComplete="username" defaultValue={state.values?.username} name="username" placeholder="เช่น somchai.owner" />
              {fields.username ? <small className="field-error">{fields.username}</small> : null}
            </label>
            <label>
              <span>รหัสผ่าน</span>
              <span className="password-field">
                <input aria-invalid={Boolean(fields.password)} autoComplete="current-password" name="password" type={showPassword ? "text" : "password"} />
                <button aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} onClick={() => setShowPassword((value) => !value)} type="button">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
              {fields.password ? <small className="field-error">{fields.password}</small> : null}
            </label>
            {state.error && state.error.code !== "validation_failed" ? (
              <p className="form-error" role="alert">{state.error.message}</p>
            ) : null}
            <SubmitButton>เข้าสู่ระบบ</SubmitButton>
          </form>
          <p className="register-link">ยังไม่มีบัญชี? <Link href="/register">สมัครใช้ฟรี 30 วัน</Link></p>
          <p className="login-footer">© 2026 Longtua Apartment</p>
        </div>
      </section>
    </main>
  );
}
