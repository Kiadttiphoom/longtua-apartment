-- Keep existing installations in sync with the complete Super Admin navigation.
insert into public.platform_menus
  (code, label, href, icon, sort_order, required_permission, audience, status)
values
  ('admin_overview', 'ภาพรวมระบบ', '/admin?view=overview', 'LayoutDashboard', 10, 'platform.manage', 'admin', 'active'),
  ('admin_organizations', 'กิจการ', '/admin?view=organizations', 'Building2', 20, 'organization.manage', 'admin', 'active'),
  ('admin_properties', 'หอพัก', '/admin?view=properties', 'Hotel', 30, 'property.manage', 'admin', 'active'),
  ('admin_users', 'ผู้ใช้งาน', '/admin?view=users', 'Users', 40, 'user.manage', 'admin', 'active'),
  ('admin_rooms', 'ห้องพัก', '/admin?view=rooms', 'KeyRound', 50, 'room.manage', 'admin', 'active'),
  ('admin_tenants', 'ผู้เช่า', '/admin?view=tenants', 'Users', 60, 'tenant.manage', 'admin', 'active'),
  ('admin_leases', 'สัญญาเช่า', '/admin?view=leases', 'CalendarRange', 70, 'lease.manage', 'admin', 'active'),
  ('admin_meters', 'มิเตอร์', '/admin?view=meters', 'Gauge', 80, 'meter.manage', 'admin', 'active'),
  ('admin_invoices', 'ใบแจ้งหนี้', '/admin?view=invoices', 'FileText', 90, 'invoice.manage', 'admin', 'active'),
  ('admin_payments', 'รับชำระ', '/admin?view=payments', 'WalletCards', 100, 'payment.manage', 'admin', 'active'),
  ('admin_receivables', 'ยอดค้าง', '/admin?view=receivables', 'ReceiptText', 110, 'invoice.manage', 'admin', 'active'),
  ('admin_reports', 'รายงาน', '/admin?view=reports', 'BookOpenCheck', 120, 'report.view', 'admin', 'active'),
  ('admin_line', 'LINE แจ้งเตือน', '/admin?view=line', 'MessageCircle', 130, 'platform.manage', 'admin', 'active'),
  ('admin_subscriptions', 'แพ็กเกจและบริการ', '/admin?view=subscriptions', 'CircleDollarSign', 140, 'subscription.manage', 'admin', 'active'),
  ('admin_roles', 'Role', '/admin?view=roles', 'UserCog', 150, 'platform.manage', 'admin', 'active'),
  ('admin_permissions', 'Permission', '/admin?view=permissions', 'KeyRound', 160, 'platform.manage', 'admin', 'active'),
  ('admin_menus', 'เมนูระบบ', '/admin?view=menus', 'Menu', 170, 'platform.manage', 'admin', 'active'),
  ('admin_audit', 'Audit Log', '/admin?view=audit', 'Activity', 180, 'platform.manage', 'admin', 'active'),
  ('admin_settings', 'ตั้งค่าระบบ', '/admin?view=settings', 'Settings', 190, 'settings.manage', 'admin', 'active')
on conflict (code) do update set
  label = excluded.label,
  href = excluded.href,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  required_permission = excluded.required_permission,
  audience = excluded.audience,
  status = excluded.status,
  updated_at = now();
