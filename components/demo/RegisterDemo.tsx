import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";

export function RegisterDemo() {
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
          <form className="register-form">
            <div className="field-row">
              <label><span>ชื่อ *</span><input placeholder="ชื่อ" /></label>
              <label><span>นามสกุล *</span><input placeholder="นามสกุล" /></label>
            </div>
            <label><span>เบอร์โทร *</span><input placeholder="08x-xxx-xxxx" /></label>
            <label><span>อีเมล *</span><input type="email" placeholder="owner@example.com" /></label>
            <div className="field-row">
              <label><span>รหัสผ่าน *</span><input type="password" placeholder="อย่างน้อย 8 ตัวอักษร" /></label>
              <label><span>ยืนยันรหัสผ่าน *</span><input type="password" placeholder="กรอกอีกครั้ง" /></label>
            </div>
            <label className="check-label register-consent"><input type="checkbox" /> ฉันยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว</label>
            <Link className="button primary large" href="/demo">สมัครและเริ่มทดลองใช้งาน</Link>
          </form>
          <p className="register-link">มีบัญชีแล้ว? <Link href="/demo/login">เข้าสู่ระบบ</Link></p>
          <p className="login-footer">© 2026 Longtua Apartment</p>
        </div>
      </section>
    </main>
  );
}
