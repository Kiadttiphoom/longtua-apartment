-- Add customer_users menu to platform_menus and configure granular permissions
insert into public.platform_menus (code, label, href, icon, sort_order, required_permission, audience)
values ('customer_users', 'ผู้ใช้งาน', '/users', 'Users', 225, 'user.manage', 'customer')
on conflict (code) do update set
  label = excluded.label,
  href = excluded.href,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  audience = excluded.audience;

insert into public.platform_menu_actions (menu_id, action_code, is_active)
select m.id, a.code, true
from public.platform_menus m
cross join (values ('menu_view'), ('view'), ('create'), ('update'), ('delete')) as a(code)
where m.code = 'customer_users'
on conflict (menu_id, action_code) do nothing;

insert into public.platform_role_menu_actions (role_id, menu_id, action_code, is_allowed)
select r.id, m.id, a.code, true
from public.platform_roles r
cross join public.platform_menus m
cross join (values ('menu_view'), ('view'), ('create'), ('update'), ('delete')) as a(code)
where m.code = 'customer_users'
  and r.code in ('owner', 'super_admin')
on conflict (role_id, menu_id, action_code) do update set is_allowed = true;
