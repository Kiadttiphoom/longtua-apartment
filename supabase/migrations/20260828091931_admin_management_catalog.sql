create table public.platform_roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  scope_type text not null check (scope_type in ('platform', 'organization', 'property')),
  description text,
  is_system boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1 check (version > 0),
  constraint platform_roles_code_format check (code ~ '^[a-z][a-z0-9_]{2,49}$'),
  constraint platform_roles_name_not_blank check (length(btrim(name)) between 2 and 100)
);

create table public.platform_permissions (
  code text primary key,
  module text not null,
  action text not null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint platform_permissions_code_format check (code ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  unique (module, action)
);

create table public.platform_role_permissions (
  role_id uuid not null references public.platform_roles(id) on delete cascade,
  permission_code text not null references public.platform_permissions(code) on delete cascade,
  allowed boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (role_id, permission_code)
);

create index platform_role_permissions_permission_idx
  on public.platform_role_permissions (permission_code, role_id);

create table public.platform_menus (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  href text not null,
  icon text not null default 'Circle',
  parent_id uuid references public.platform_menus(id) on delete set null,
  sort_order integer not null default 0,
  required_permission text references public.platform_permissions(code) on delete set null,
  audience text not null default 'customer' check (audience in ('admin', 'customer', 'all')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1 check (version > 0),
  constraint platform_menus_code_format check (code ~ '^[a-z][a-z0-9_]{2,49}$'),
  constraint platform_menus_href_format check (href ~ '^/')
);

create index platform_menus_audience_order_idx
  on public.platform_menus (audience, status, sort_order, code);

create table public.platform_audit_logs (
  id bigint generated always as identity primary key,
  request_id uuid not null unique,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index platform_audit_logs_created_idx on public.platform_audit_logs (created_at desc);
create index platform_audit_logs_actor_created_idx on public.platform_audit_logs (actor_user_id, created_at desc);

create trigger platform_roles_set_updated_at before update on public.platform_roles
for each row execute function private.set_updated_at();
create trigger platform_permissions_set_updated_at before update on public.platform_permissions
for each row execute function private.set_updated_at();
create trigger platform_role_permissions_set_updated_at before update on public.platform_role_permissions
for each row execute function private.set_updated_at();
create trigger platform_menus_set_updated_at before update on public.platform_menus
for each row execute function private.set_updated_at();

alter table public.platform_roles enable row level security;
alter table public.platform_permissions enable row level security;
alter table public.platform_role_permissions enable row level security;
alter table public.platform_menus enable row level security;
alter table public.platform_audit_logs enable row level security;

revoke all on table public.platform_roles, public.platform_permissions,
  public.platform_role_permissions, public.platform_menus, public.platform_audit_logs
  from public, anon, authenticated;
grant all on table public.platform_roles, public.platform_permissions,
  public.platform_role_permissions, public.platform_menus, public.platform_audit_logs
  to service_role;
grant usage, select on sequence public.platform_audit_logs_id_seq to service_role;

insert into public.platform_roles (code, name, scope_type, description, is_system) values
  ('super_admin', 'Super Admin', 'platform', 'จัดการแพลตฟอร์ม Longtua ทั้งระบบ', true),
  ('owner', 'เจ้าของกิจการ', 'organization', 'จัดการข้อมูลทั้งหมดภายในกิจการ', true),
  ('manager', 'ผู้จัดการ', 'property', 'จัดการหอพักที่ได้รับมอบหมาย', true),
  ('accounting', 'ฝ่ายบัญชี', 'property', 'จัดการงานการเงินและรายงาน', true),
  ('staff', 'พนักงาน', 'property', 'จัดการงานปฏิบัติการประจำวัน', true);

insert into public.platform_permissions (code, module, action, name) values
  ('platform.manage', 'platform', 'manage', 'จัดการแพลตฟอร์ม'),
  ('organization.manage', 'organization', 'manage', 'จัดการกิจการ'),
  ('user.manage', 'user', 'manage', 'จัดการผู้ใช้งาน'),
  ('subscription.manage', 'subscription', 'manage', 'จัดการ Subscription'),
  ('property.manage', 'property', 'manage', 'จัดการหอพัก'),
  ('room.manage', 'room', 'manage', 'จัดการห้องพัก'),
  ('tenant.manage', 'tenant', 'manage', 'จัดการผู้เช่า'),
  ('lease.manage', 'lease', 'manage', 'จัดการสัญญาเช่า'),
  ('meter.manage', 'meter', 'manage', 'จัดการมิเตอร์'),
  ('invoice.manage', 'invoice', 'manage', 'จัดการใบแจ้งหนี้'),
  ('payment.manage', 'payment', 'manage', 'จัดการรับชำระ'),
  ('report.view', 'report', 'view', 'ดูรายงาน'),
  ('settings.manage', 'settings', 'manage', 'จัดการการตั้งค่า');

insert into public.platform_role_permissions (role_id, permission_code, allowed)
select role.id, permission.code, true
from public.platform_roles role
cross join public.platform_permissions permission
where role.code = 'super_admin';

insert into public.platform_role_permissions (role_id, permission_code, allowed)
select role.id, permission_code, true
from public.platform_roles role
cross join lateral unnest(case role.code
  when 'owner' then array['organization.manage','user.manage','subscription.manage','property.manage','room.manage','tenant.manage','lease.manage','meter.manage','invoice.manage','payment.manage','report.view','settings.manage']
  when 'manager' then array['property.manage','room.manage','tenant.manage','lease.manage','meter.manage','invoice.manage','report.view']
  when 'accounting' then array['meter.manage','invoice.manage','payment.manage','report.view']
  when 'staff' then array['room.manage','tenant.manage','lease.manage','meter.manage']
  else array[]::text[]
end) as permission_list(permission_code)
where role.code <> 'super_admin';

insert into public.platform_menus (code, label, href, icon, sort_order, required_permission, audience) values
  ('admin_overview', 'ภาพรวมระบบ', '/admin?view=overview', 'LayoutDashboard', 10, 'platform.manage', 'admin'),
  ('admin_organizations', 'กิจการ', '/admin?view=organizations', 'Building2', 20, 'organization.manage', 'admin'),
  ('admin_properties', 'หอพัก', '/admin?view=properties', 'Hotel', 30, 'property.manage', 'admin'),
  ('admin_users', 'ผู้ใช้งาน', '/admin?view=users', 'Users', 40, 'user.manage', 'admin'),
  ('admin_rooms', 'ห้องพัก', '/admin?view=rooms', 'KeyRound', 50, 'room.manage', 'admin'),
  ('admin_tenants', 'ผู้เช่า', '/admin?view=tenants', 'Users', 60, 'tenant.manage', 'admin'),
  ('admin_leases', 'สัญญาเช่า', '/admin?view=leases', 'CalendarRange', 70, 'lease.manage', 'admin'),
  ('admin_meters', 'มิเตอร์', '/admin?view=meters', 'Gauge', 80, 'meter.manage', 'admin'),
  ('admin_invoices', 'ใบแจ้งหนี้', '/admin?view=invoices', 'FileText', 90, 'invoice.manage', 'admin'),
  ('admin_payments', 'รับชำระ', '/admin?view=payments', 'WalletCards', 100, 'payment.manage', 'admin'),
  ('admin_receivables', 'ยอดค้าง', '/admin?view=receivables', 'ReceiptText', 110, 'invoice.manage', 'admin'),
  ('admin_reports', 'รายงาน', '/admin?view=reports', 'BookOpenCheck', 120, 'report.view', 'admin'),
  ('admin_line', 'LINE แจ้งเตือน', '/admin?view=line', 'MessageCircle', 130, 'platform.manage', 'admin'),
  ('admin_subscriptions', 'แพ็กเกจและบริการ', '/admin?view=subscriptions', 'CircleDollarSign', 140, 'subscription.manage', 'admin'),
  ('admin_roles', 'Role', '/admin?view=roles', 'UserCog', 150, 'platform.manage', 'admin'),
  ('admin_permissions', 'Permission', '/admin?view=permissions', 'KeyRound', 160, 'platform.manage', 'admin'),
  ('admin_menus', 'เมนูระบบ', '/admin?view=menus', 'Menu', 170, 'platform.manage', 'admin'),
  ('admin_audit', 'Audit Log', '/admin?view=audit', 'Activity', 180, 'platform.manage', 'admin'),
  ('admin_settings', 'ตั้งค่าระบบ', '/admin?view=settings', 'Settings', 190, 'settings.manage', 'admin'),
  ('customer_overview', 'แดชบอร์ด', '/dashboard?page=overview', 'LayoutDashboard', 210, null, 'customer'),
  ('customer_properties', 'หอพัก', '/dashboard?page=properties', 'Building2', 220, 'property.manage', 'customer'),
  ('customer_rooms', 'ห้องพัก', '/dashboard?page=rooms', 'KeyRound', 230, 'room.manage', 'customer'),
  ('customer_tenants', 'ผู้เช่า', '/dashboard?page=tenants', 'Users', 240, 'tenant.manage', 'customer'),
  ('customer_leases', 'สัญญาเช่า', '/dashboard?page=leases', 'CalendarRange', 250, 'lease.manage', 'customer'),
  ('customer_meters', 'มิเตอร์', '/dashboard?page=meters', 'Gauge', 260, 'meter.manage', 'customer'),
  ('customer_invoices', 'ใบแจ้งหนี้', '/dashboard?page=invoices', 'FileText', 270, 'invoice.manage', 'customer'),
  ('customer_payments', 'รับชำระ', '/dashboard?page=payments', 'WalletCards', 280, 'payment.manage', 'customer'),
  ('customer_receivables', 'ยอดค้าง', '/dashboard?page=receivables', 'ReceiptText', 290, 'invoice.manage', 'customer'),
  ('customer_reports', 'รายงาน', '/dashboard?page=reports', 'CircleDollarSign', 300, 'report.view', 'customer'),
  ('customer_settings', 'ตั้งค่าหอพัก', '/dashboard?page=settings', 'Settings', 310, 'settings.manage', 'customer'),
  ('customer_subscription', 'แพ็กเกจและบริการ', '/dashboard?page=subscription', 'CircleDollarSign', 320, 'subscription.manage', 'customer');
