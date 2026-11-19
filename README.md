# Longtua Apartment

ระบบจริงและ Demo แยก route, component และ data source ออกจากกันชัดเจน

- Demo: `/demo/login`, `/demo/register`, `/demo`
- ระบบจริง: `/login`, `/register`, `/dashboard`

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000/demo` หรือเริ่มจากหน้าเข้าสู่ระบบที่ `http://localhost:3000/demo/login`

บัญชีตัวอย่างถูกกรอกไว้ให้แล้ว รหัสผ่านคือ `longtua-demo` ข้อมูลหอพัก มิเตอร์ สัญญา และการตั้งค่าหลักจะถูกเก็บใน `localStorage` ของเบราว์เซอร์ กดปุ่มรีเซ็ตด้านขวาของตัวเลือกสถานะบริการเพื่อกลับสู่ข้อมูลเริ่มต้น

## Flow สำหรับพรีเซนต์

1. สลับหอพักจากแถบด้านซ้าย
2. เปิดหน้ามิเตอร์และกรอกเลขมิเตอร์ใหม่ให้ครบทุกห้องที่มีผู้เช่า
3. กดสร้างบิลทุกห้อง แล้วเปิดดูใบแจ้งหนี้และสั่งพิมพ์/PDF
4. เปิดหน้ารับชำระและบันทึกรายการเพื่อออกเลขที่ใบเสร็จ
5. ทดลองสลับบทบาทและสถานะบริการเพื่อดูสิทธิ์และโหมดหมดอายุ

## ตรวจสอบก่อนส่งเดโม

```bash
npm run lint
npm test
npm run build
```

Super Admin มีโค้ดรองรับภายใน แต่ตั้งใจไม่แสดงเป็นตัวเลือกในเดโมสาธารณะ

## สถาปัตยกรรม Database และ Authentication (Decoupled PostgreSQL)

ระบบเชื่อมต่อฐานข้อมูลตรงผ่าน **PostgreSQL (`DATABASE_URL`) ฝั่งเซิร์ฟเวอร์** โดยถอดการพึ่งพา Supabase SDK, Auth API และ Storage ออกจากตัวแอปพลิเคชันอย่างสมบูรณ์:
- **Database Connection:** ใช้ `pg.Pool` ทำ parameterized queries 100% ปลอดภัยจาก SQL Injection รองรับทั้ง Direct Connection (พอร์ต 5432) และ Supabase Transaction Pooler / PgBouncer (พอร์ต 6543) ด้วยโหมด unnamed prepared statements
- **Authentication:** รองรับการล็อกอินด้วย `username + password` ผ่าน HTTP-Only Cookie Session ที่เข้ารหัสลายเซ็นแบบ HMAC-SHA256 รหัสผ่านถูกเข้ารหัสด้วย bcrypt ซึ่งเข้ากันได้ 100% กับ hash เดิมของ Supabase GoTrue ทำให้ผู้ใช้เดิมเข้าสู่ระบบได้ทันทีโดยไม่ต้องรีเซ็ตรหัสผ่าน
- **File Storage:** ใช้ **Cloudflare R2** (S3 Protocol) เก็บสลิปโอนเงิน สัญญาเช่า และเอกสารทั้งหมด ปลอดภัยด้วย Signed URLs และ Private API Routes
- **Multi-Tenant Isolation:** แยกสิทธิ์ข้อมูลระดับองค์กร (`organization_id`) ทั้งในระดับ Application Logic (Server Action Context) และ Database Functions/RLS

1. คัดลอกค่าจาก `.env.example` ไป `.env.local` และตั้งค่า:
   - `DATABASE_URL=postgresql://user:password@host:6543/postgres?sslmode=require`
   - `AUTH_SESSION_SECRET=รหัสสุ่มยาว32ตัวขึ้นไป`
   - `AUTH_INTERNAL_EMAIL_DOMAIN=auth.longtua.com`
   - ค่า Cloudflare R2 สำหรับจัดเก็บไฟล์เอกสาร
2. Apply migration ไปยังฐานข้อมูล PostgreSQL (รองรับทั้ง Supabase Cloud และ Standalone PostgreSQL บน VPS):
   - `supabase/migrations/20260828070647_auth_foundation.sql`
   - ...
   - `supabase/migrations/20261119000000_decouple_supabase_auth.sql`
3. สมัครทดลองใช้ที่หน้าลงทะเบียน; ระบบจะสร้าง profile, organization, owner membership และ trial ใน transaction เดียว

หน้าระบบจริงอยู่ใน route group `app/(portal)` และแยก route ตาม feature โดยไม่ใช้ข้อมูลตัวอย่างหรือ `localStorage` ข้อมูลทั้งหมดอ่าน/เขียนผ่าน PostgreSQL แบบมี Transaction คุ้มครองความสมบูรณ์ของข้อมูล

## สร้าง Super Admin คนแรก

หลัง apply migration ครบแล้ว ให้รันคำสั่งฝั่ง server เพียงครั้งเดียว โดยไม่เก็บรหัสผ่านลง Git:

```bash
npm run admin:create -- superadmin "รหัสผ่านที่ยาวและเดายาก" "Longtua Super Admin"
```

สคริปต์จะเชื่อมต่อผ่าน `DATABASE_URL`, แฮชรหัสผ่านด้วย bcrypt และบันทึกลงฐานข้อมูลใน atomic transaction เดียวกันทันที

## ย้ายสลิปเก่าจาก Supabase Storage ไป Cloudflare R2

หากมีสลิปเก่าในระบบที่ยังไม่ได้ย้ายไป Cloudflare R2 สามารถใช้สคริปต์ย้ายข้อมูลที่ทำงานแบบ idempotent:

```bash
# ตรวจสอบรายการสลิปที่ต้องย้ายโดยไม่เปลี่ยนแปลงข้อมูล (Dry run)
node scripts/migrate-slips-to-r2.mjs --dry-run

# ดำเนินการย้ายจริงและอัปเดตพาธในฐานข้อมูล
node scripts/migrate-slips-to-r2.mjs --apply
```

Super Admin เข้าสู่ระบบผ่าน `/login` เหมือนผู้ใช้ทั่วไป แต่จะถูกส่งไป `/admin` อัตโนมัติ หน้านี้จัดการกิจการ ผู้ใช้ Subscription, Role, Permission, เมนู, Audit Log และการเปิด/ปิดลงทะเบียนได้จริง การแก้ Role/Permission/เมนูมีผลกับเมนูและ Server Action ของระบบลูกค้า ส่วน `/demo/*` จะไม่แสดง Super Admin หรือการตั้งค่านี้

หากยังไม่ได้ตั้ง Supabase key หน้า demo ที่ `/demo` ยังใช้งานได้ตามปกติ แต่การสมัคร/ล็อกอินจริงจะแสดงว่า configuration ยังไม่ครบ
