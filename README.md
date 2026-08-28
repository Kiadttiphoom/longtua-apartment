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

## Auth และทดลองใช้ฟรีจริง

หน้า `/login`, `/register` และ `/dashboard` ใช้ Supabase Auth แบบ cookie session โดยผู้ใช้กรอกเฉพาะ `username + password` ระบบ map username ไป synthetic email ฝั่ง server จึงไม่เปิดเผย service role key หรืออีเมลภายในให้ browser

1. คัดลอกค่าจาก `.env.example` ไป `.env.local` และตั้ง `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` กับ `AUTH_INTERNAL_EMAIL_DOMAIN`
2. Apply migration ตามลำดับไปยัง Supabase project:
   - `supabase/migrations/20260828070647_auth_foundation.sql`
   - `supabase/migrations/20260828083714_apartment_core.sql`
3. สมัครที่ `/register`; ระบบจะสร้าง profile, organization, owner membership และ trial 30 วันใน transaction เดียว

หน้า `/dashboard` ไม่ใช้ข้อมูลตัวอย่างและไม่ใช้ `localStorage` ข้อมูลหอพัก ห้อง ผู้เช่า สัญญา มิเตอร์ ใบแจ้งหนี้ และการรับชำระทั้งหมดอ่าน/เขียน Supabase โดยมี RLS จำกัดตาม `organization_id`

หากยังไม่ได้ตั้ง Supabase key หน้า demo ที่ `/demo` ยังใช้งานได้ตามปกติ แต่การสมัคร/ล็อกอินจริงจะแสดงว่า configuration ยังไม่ครบ
