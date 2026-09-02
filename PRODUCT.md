# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- เจ้าของหอพัก/อพาร์ตเมนต์ (Apartment Owners / Operators) ในประเทศไทยที่ต้องการระบบจัดการห้อง สัญญา และรายรับรายจ่าย
- ผู้จัดการ/แอดมินหอพัก (Property Managers) ที่ดูแลหน้างาน จดมิเตอร์ ออกบิล รับชำระเงิน
- ผู้ดูแลระบบแพลตฟอร์ม (Super Admin / Platform Admins) ตรวจสอบคำขอทดลองใช้ จัดการกิจการ กำหนดสิทธิ์ และดูภาพรวมแพลตฟอร์ม
- ผู้เช่าหอพัก (Tenants) เข้าดูบิล แจ้งชำระเงิน และตรวจสอบสัญญาผ่านพอร์ทัลผู้เช่า

## Product Purpose
ระบบบริหารจัดการหอพักและอพาร์ตเมนต์ครบวงจร (Longtua Apartment) สำหรับจัดการห้องพัก สัญญาเช่า ผู้เช่า จดมิเตอร์น้ำ-ไฟ ออกใบแจ้งหนี้ รับชำระเงิน บัญชีพอร์ทัลผู้เช่า และติดตามสถานะทางการเงินแบบเรียลไทม์

## Positioning
ระบบบริหารหอพักสัญชาติไทยที่เข้าใจ flow งานจริง ใช้งานง่าย รวดเร็ว รองรับการคิดค่าน้ำ-ไฟตามมิเตอร์ ออกใบแจ้งหนี้พร้อม PromptPay QR Code พิมพ์เอกสารสัญญาเช่า A4 ตามมาตรฐานกฎหมายไทย และรองรับ Multi-property ในกิจการเดียว

## Operating Context
- ผู้ใช้งานเข้าใช้งานผ่าน Web Browser บน Desktop, Tablet และ Smartphone
- ระบบออกใบแจ้งหนี้ ใบเสร็จรับเงิน และสัญญาเช่าแบบสั่งพิมพ์ A4 สวยงามพอดีหน้า 1 แผ่น
- เจ้าของหอพักดูสถานะห้อง (ว่าง/มีผู้เช่า/ซ่อมบำรุง) และบันทึกมิเตอร์ได้รวดเร็ว

## Capabilities and Constraints
- Multi-tenant architecture แยกข้อมูลตาม organization_id ปลอดภัยระดับ Row-Level Security
- ระบบ Granular Menu & Action Permissions ควบคุมสิทธิ์ละเอียดตามบทบาทและรายบุคคล
- ระบบคำนวณมิเตอร์น้ำ-ไฟรอบบิล ป้องกันการบันทึกค่าย้อนแย้ง
- รองรับการสั่งพิมพ์ A4 แบบ Single-page print styling
- พอร์ทัลผู้เช่า (Tenant Portal) พร้อมระบบสร้างบัญชีและจัดการรหัสผ่าน

## Brand Commitments
- Brand Name: Longtua Apartment (ลงตัว อพาร์ตเมนต์)
- Brand Colors: Deep Navy (`#0a1830`), Clean Blue (`#2457e6`, `#3157d5`), Slate Neutrals
- Professional, trustworthy, modern, scannable SaaS UI

## Product Principles
1. ความเรียบง่าย ชัดเจน และลด Cognitive Load ของเจ้าของหอพัก
2. ปุ่มและการควบคุมต้องเป็นเอกภาพ (Consistent & cohesive buttons across all cards)
3. การเว้นระยะห่าง (Spacing & Rhythm) สะอาดตา ไม่เบียดเสียด ไม่รกสายตา
4. แสดงข้อมูลทางการเงินและสถานะห้องอย่างแม่นยำ โปร่งใส
5. รองรับ Responsive ใช้งานได้ลื่นไหลทั้ง Desktop และ Mobile
