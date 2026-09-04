-- Migration: 20260904170000_subscription_plans_and_usage.sql
-- Description: Create subscription_plans and subscription_usage tables, link to subscriptions, and seed initial plans

-- 1. Create subscription_plans table
create table if not exists public.subscription_plans (
  code text primary key,
  name text not null,
  badge text,
  popular boolean not null default false,
  price_monthly integer not null default 0,
  period text not null default 'เดือน',
  target_audience text not null default '',
  max_properties integer not null default 1,
  max_properties_label text not null default '',
  max_rooms integer not null default 10,
  max_rooms_label text not null default '',
  max_users integer not null default 1,
  max_users_label text not null default '',
  max_slip_verifications integer not null default 15,
  max_slip_verifications_label text not null default '',
  features jsonb not null default '[]'::jsonb,
  cta_label text not null default '',
  cta_href text not null default '',
  cta_variant text not null default 'secondary',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Alter subscriptions table to reference subscription_plans and add max_slip_verifications
alter table public.subscriptions
  add column if not exists plan_code text references public.subscription_plans(code),
  add column if not exists max_slip_verifications integer default 15;

-- 3. Create subscription_usage table
create table if not exists public.subscription_usage (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_start timestamptz not null default now(),
  period_end timestamptz not null default (now() + interval '1 month'),
  used_properties integer not null default 0,
  used_rooms integer not null default 0,
  used_users integer not null default 0,
  used_slip_verifications integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscription_usage_org_period
  on public.subscription_usage (organization_id, period_start, period_end);

-- 4. Enable RLS and define policies
alter table public.subscription_plans enable row level security;
alter table public.subscription_usage enable row level security;

-- subscription_plans is readable by everyone (active plans), and editable only by service_role
create policy "Allow public read active subscription_plans"
  on public.subscription_plans
  for select
  using (is_active = true);

-- subscription_usage is readable by members of the organization
create policy "Allow organization members read their subscription_usage"
  on public.subscription_usage
  for select
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = subscription_usage.organization_id
        and om.user_id = auth.uid()
        and om.status = 'active'
    )
  );

-- 5. Seed initial subscription_plans
insert into public.subscription_plans (
  code, name, badge, popular, price_monthly, period, target_audience,
  max_properties, max_properties_label, max_rooms, max_rooms_label,
  max_users, max_users_label, max_slip_verifications, max_slip_verifications_label,
  features, cta_label, cta_href, cta_variant, sort_order, is_active
) values
(
  'trial',
  'ทดลองใช้ฟรี',
  'ฟรี 30 วัน',
  false,
  0,
  '30 วัน',
  'ทดลองระบบกับตึกแรก ไม่ต้องใช้บัตรเครดิต',
  1,
  '1 หอพัก',
  10,
  'สูงสุด 10 ห้อง',
  1,
  'ผู้ใช้งาน 1 คน',
  15,
  'ตรวจสลิป 15 ครั้ง (ฟรี)',
  '["ฟังก์ชันครบทุกอย่างเหมือนแพ็กเกจจริง", "ระบบตรวจสลิปโอนเงินอัตโนมัติ 15 ครั้ง", "จดมิเตอร์น้ำ-ไฟ คำนวณยอดอัตโนมัติ", "ออกใบแจ้งหนี้พร้อม QR PromptPay", "พอร์ทัลผู้เช่า ดูบิลและแจ้งชำระเงิน", "พิมพ์สัญญาเช่ามาตรฐาน"]'::jsonb,
  'เริ่มทดลองใช้ฟรี 30 วัน',
  'https://apartment.longtua.com/register',
  'secondary',
  1,
  true
),
(
  'starter',
  'Starter',
  null,
  false,
  199,
  'เดือน',
  'เจ้าของหอเดี่ยวขนาดเล็ก เริ่มต้นระบบดิจิทัล',
  1,
  '1 หอพัก',
  30,
  'สูงสุด 30 ห้อง',
  2,
  'ผู้ใช้งาน 2 คน',
  45,
  'ตรวจสลิป 45 ครั้ง / เดือน',
  '["ตรวจสลิปโอนเงินอัตโนมัติ 45 ครั้ง/เดือน", "บันทึกมิเตอร์น้ำ-ไฟ ประจำงวด", "ใบแจ้งหนี้ & ใบเสร็จรับเงินดิจิทัล", "QR PromptPay รับเงินเข้าบัญชีโดยตรง", "พอร์ทัลผู้เช่า ดูบิลผ่านมือถือ", "รายงานสรุปรายรับและอัตราเข้าพัก"]'::jsonb,
  'เลือกแพ็กเกจ Starter',
  '/contact?plan=starter',
  'secondary',
  2,
  true
),
(
  'growth',
  'Growth',
  '⭐ ยอดนิยม คุ้มค่าที่สุด',
  true,
  399,
  'เดือน',
  'เจ้าของหลายอาคาร หรือหอพักขนาดกลาง',
  3,
  'สูงสุด 3 หอพัก',
  100,
  'รวมสูงสุด 100 ห้อง',
  5,
  'ผู้ใช้งาน 5 คน',
  150,
  'ตรวจสลิป 150 ครั้ง / เดือน',
  '["ทุกฟังก์ชันในแพ็กเกจ Starter", "ตรวจสลิปโอนเงินอัตโนมัติ 150 ครั้ง/เดือน", "บริหารแยกหลายตึกในบัญชีเดียว", "กำหนดสิทธิ์ทีมงาน (ผู้จัดการ / บัญชี / ช่าง)", "รายงานวิเคราะห์กระแสเงินสดแยกอาคาร"]'::jsonb,
  'เลือกแพ็กเกจ Growth',
  '/contact?plan=growth',
  'primary',
  3,
  true
),
(
  'pro',
  'Pro',
  null,
  false,
  699,
  'เดือน',
  'ธุรกิจหอพักมืออาชีพ และทีมบริหารจัดการ',
  10,
  'สูงสุด 10 หอพัก',
  300,
  'รวมสูงสุด 300 ห้อง',
  -1,
  'ผู้ใช้งานไม่จำกัด',
  450,
  'ตรวจสลิป 450 ครั้ง / เดือน',
  '["ทุกฟังก์ชันในแพ็กเกจ Growth", "ตรวจสลิปโอนเงินอัตโนมัติ 450 ครั้ง/เดือน", "รองรับเครือข่ายหอพักขนาดใหญ่", "เพิ่มทีมงานและผู้ดูแลได้ไม่จำกัด", "รายงานสรุปบัญชีและภาษีระดับมืออาชีพ", "บริการดูแลและซัพพอร์ตระดับพรีเมียม"]'::jsonb,
  'เลือกแพ็กเกจ Pro',
  '/contact?plan=pro',
  'secondary',
  4,
  true
),
(
  'business',
  'Business',
  'สำหรับองค์กร',
  false,
  1299,
  'เดือน (เริ่มต้น)',
  'เครืออพาร์ตเมนต์ขนาดใหญ่ หรือนิติบุคคล',
  999,
  'ไม่จำกัดจำนวนหอพัก',
  500,
  'รวม 500 ห้องขึ้นไป',
  -1,
  'ผู้ใช้งานไม่จำกัด',
  1000,
  'ตรวจสลิป 1,000+ ครั้ง / เดือน',
  '["ไม่จำกัดจำนวนอาคารและผู้ใช้งาน", "ตรวจสลิป 1,000+ ครั้ง หรือเชื่อม API Key ตัวเอง", "บริการช่วยนำเข้าข้อมูลห้องพักและผู้เช่าตั้งต้น", "ปรับแต่งฟอร์มสัญญาและใบเสร็จเฉพาะองค์กร", "ทีมวิศวกรดูแลระบบและสำรองข้อมูลพิเศษ", "Service Level Agreement (SLA) ดูแลด่วน"]'::jsonb,
  'ติดต่อปรึกษาฝ่ายขาย',
  '/contact?plan=business',
  'outline',
  5,
  true
)
on conflict (code) do update set
  name = excluded.name,
  badge = excluded.badge,
  popular = excluded.popular,
  price_monthly = excluded.price_monthly,
  period = excluded.period,
  target_audience = excluded.target_audience,
  max_properties = excluded.max_properties,
  max_properties_label = excluded.max_properties_label,
  max_rooms = excluded.max_rooms,
  max_rooms_label = excluded.max_rooms_label,
  max_users = excluded.max_users,
  max_users_label = excluded.max_users_label,
  max_slip_verifications = excluded.max_slip_verifications,
  max_slip_verifications_label = excluded.max_slip_verifications_label,
  features = excluded.features,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  cta_variant = excluded.cta_variant,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();
