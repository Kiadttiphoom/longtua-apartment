"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { registerAction, type AuthActionState } from "@/app/auth/actions";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { BrandLogo } from "@/components/brand/BrandLogo";

const initialAuthActionState: AuthActionState = { status: "idle" };

export function RegisterForm({ registrationEnabled = true }: { registrationEnabled?: boolean }) {
  const [state, action] = useActionState(registerAction, initialAuthActionState);
  const [organizationName, setOrganizationName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const fields = state.error?.fields ?? {};

  return (
    <main className="login-page">
      <AuthBrandPanel />
      <section className="login-form-panel">
        <div className="login-form-wrap register-auth-card">
          <div className="login-form-logo"><BrandLogo className="login-brand-logo" /></div>
          <div className="login-heading">
            <span className="login-security"><ShieldCheck size={18} /> ทดลองใช้ฟรี 30 วัน</span>
            <h1>สร้างบัญชีของคุณ</h1>
            <p>สร้างบัญชีธุรกิจหนึ่งครั้ง แล้วเพิ่มหอพักได้หลายแห่งภายหลัง</p>
          </div>
          {!registrationEnabled ? (
            <div className="registration-closed" role="status">
              <h2>ปิดรับสมัครสมาชิกชั่วคราว</h2>
              <p>ผู้ดูแลระบบปิดการสร้างบัญชีใหม่อยู่ บัญชีเดิมยังเข้าสู่ระบบได้ตามปกติ</p>
            </div>
          ) : null}
          {registrationEnabled ? (
          <form action={action} className="register-form" noValidate>
            <label><span>ชื่อธุรกิจหรือชื่อผู้ประกอบการ *</span><input aria-describedby="business-name-hint" aria-invalid={Boolean(fields.organizationName)} name="organizationName" onChange={(event) => setOrganizationName(event.target.value)} placeholder="เช่น บริษัท สมชายบริหารทรัพย์ หรือ คุณสมชาย" value={organizationName} /><small className="field-hint" id="business-name-hint">ไม่ใช่ชื่อหอพัก — ใช้เป็นชื่อบัญชีหลักสำหรับรวมทุกหอ</small>{fields.organizationName ? <small className="field-error">{fields.organizationName}</small> : null}</label>
            <label><span>ชื่อของคุณ (แสดงในระบบ) *</span><input aria-invalid={Boolean(fields.displayName)} autoComplete="name" name="displayName" onChange={(event) => setDisplayName(event.target.value)} placeholder="เช่น สมชาย ใจดี" value={displayName} />{fields.displayName ? <small className="field-error">{fields.displayName}</small> : null}</label>
            <label><span>Username สำหรับเข้าสู่ระบบ *</span><input aria-describedby="username-hint" aria-invalid={Boolean(fields.username)} autoCapitalize="none" autoComplete="username" lang="en" maxLength={30} name="username" onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))} pattern="[a-z0-9][a-z0-9._-]{2,28}[a-z0-9]" placeholder="เช่น somchai.owner" spellCheck={false} value={username} /><small className="field-hint" id="username-hint">ใช้ตัวอักษรอังกฤษ ตัวเลข จุด ขีดล่าง หรือขีดกลาง 4–30 ตัว</small>{fields.username ? <small className="field-error">{fields.username}</small> : null}</label>
            <label><span>เบอร์โทร (ไม่บังคับ)</span><input aria-invalid={Boolean(fields.phone)} autoComplete="tel" name="phone" onChange={(event) => setPhone(event.target.value)} placeholder="08x-xxx-xxxx" value={phone} />{fields.phone ? <small className="field-error">{fields.phone}</small> : null}</label>
            <div className="field-row">
              <label><span>รหัสผ่าน *</span><span className="password-field"><input aria-invalid={Boolean(fields.password)} autoComplete="new-password" name="password" onChange={(event) => setPassword(event.target.value)} placeholder="อย่างน้อย 8 ตัว มีตัวอักษรและตัวเลข" type={showPassword ? "text" : "password"} value={password} /><button aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} onClick={() => setShowPassword((value) => !value)} type="button">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>{fields.password ? <small className="field-error">{fields.password}</small> : null}</label>
              <label><span>ยืนยันรหัสผ่าน *</span><span className="password-field"><input aria-invalid={Boolean(fields.confirmPassword)} autoComplete="new-password" name="confirmPassword" onChange={(event) => setConfirmPassword(event.target.value)} type={showConfirmPassword ? "text" : "password"} value={confirmPassword} /><button aria-label={showConfirmPassword ? "ซ่อนรหัสผ่านยืนยัน" : "แสดงรหัสผ่านยืนยัน"} onClick={() => setShowConfirmPassword((value) => !value)} type="button">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>{fields.confirmPassword ? <small className="field-error">{fields.confirmPassword}</small> : null}</label>
            </div>
            <label className="check-label register-consent"><input checked={accepted} name="accepted" onChange={(event) => setAccepted(event.target.checked)} type="checkbox" /> ฉันยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว</label>
            {fields.accepted ? <small className="field-error">{fields.accepted}</small> : null}
            {state.error && state.error.code !== "validation_failed" ? (
              <p className="form-error" role="alert">{state.error.message}<small>รหัสอ้างอิง {state.error.requestId}</small></p>
            ) : null}
            <SubmitButton>สมัครและเริ่มทดลองใช้งาน</SubmitButton>
          </form>
          ) : null}
          <p className="register-link">มีบัญชีแล้ว? <Link href="/login">เข้าสู่ระบบ</Link></p>
          <p className="login-footer">© 2026 Longtua Apartment</p>
        </div>
      </section>
    </main>
  );
}
