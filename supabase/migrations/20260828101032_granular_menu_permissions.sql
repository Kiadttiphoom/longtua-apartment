create table public.platform_permission_actions (
  code text primary key,
  name text not null,
  is_mutation boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_permission_actions_code_format check (code ~ '^[a-z][a-z0-9_]{1,29}$')
);

create table public.platform_menu_actions (
  menu_id uuid not null references public.platform_menus(id) on delete cascade,
  action_code text not null references public.platform_permission_actions(code) on delete cascade,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (menu_id, action_code)
);

create table public.platform_role_menu_actions (
  role_id uuid not null references public.platform_roles(id) on delete cascade,
  menu_id uuid not null references public.platform_menus(id) on delete cascade,
  action_code text not null references public.platform_permission_actions(code) on delete cascade,
  is_allowed boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (role_id, menu_id, action_code),
  foreign key (menu_id, action_code) references public.platform_menu_actions(menu_id, action_code) on delete cascade
);

create table public.platform_user_menu_actions (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  menu_id uuid not null references public.platform_menus(id) on delete cascade,
  action_code text not null references public.platform_permission_actions(code) on delete cascade,
  is_allowed boolean not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (organization_id, user_id, menu_id, action_code),
  foreign key (organization_id, user_id) references public.organization_members(organization_id, user_id) on delete cascade,
  foreign key (menu_id, action_code) references public.platform_menu_actions(menu_id, action_code) on delete cascade
);

alter table public.organization_members drop constraint if exists organization_members_role_code_check;
alter table public.organization_members add constraint organization_members_role_code_fkey
  foreign key (role_code) references public.platform_roles(code) on update cascade on delete restrict;

create index platform_role_menu_actions_lookup_idx on public.platform_role_menu_actions (role_id, is_allowed, menu_id);
create index platform_user_menu_actions_lookup_idx on public.platform_user_menu_actions (organization_id, user_id, menu_id);

create trigger platform_permission_actions_set_updated_at before update on public.platform_permission_actions
for each row execute function private.set_updated_at();
create trigger platform_menu_actions_set_updated_at before update on public.platform_menu_actions
for each row execute function private.set_updated_at();
create trigger platform_role_menu_actions_set_updated_at before update on public.platform_role_menu_actions
for each row execute function private.set_updated_at();
create trigger platform_user_menu_actions_set_updated_at before update on public.platform_user_menu_actions
for each row execute function private.set_updated_at();

alter table public.platform_permission_actions enable row level security;
alter table public.platform_menu_actions enable row level security;
alter table public.platform_role_menu_actions enable row level security;
alter table public.platform_user_menu_actions enable row level security;

revoke all on table public.platform_permission_actions, public.platform_menu_actions,
  public.platform_role_menu_actions, public.platform_user_menu_actions from public, anon, authenticated;
grant all on table public.platform_permission_actions, public.platform_menu_actions,
  public.platform_role_menu_actions, public.platform_user_menu_actions to service_role;

insert into public.platform_permission_actions (code, name, is_mutation, sort_order) values
  ('menu_view', 'เห็นเมนู', false, 10), ('view', 'เปิดหน้า', false, 20),
  ('create', 'เพิ่ม', true, 30), ('update', 'แก้ไข', true, 40),
  ('delete', 'ลบ', true, 50), ('report', 'รายงาน', false, 60),
  ('export', 'Export', false, 70), ('approve', 'อนุมัติ', true, 80),
  ('cancel', 'ยกเลิก', true, 90);

with supported(menu_code, action_codes) as (values
  ('admin_overview', array['menu_view','view']),
  ('admin_organizations', array['menu_view','view','update']),
  ('admin_properties', array['menu_view','view','update']),
  ('admin_users', array['menu_view','view','create','update']),
  ('admin_rooms', array['menu_view','view','update']),
  ('admin_tenants', array['menu_view','view','update']),
  ('admin_leases', array['menu_view','view','update','cancel']),
  ('admin_meters', array['menu_view','view','update']),
  ('admin_invoices', array['menu_view','view','update','cancel','report','export']),
  ('admin_payments', array['menu_view','view','update','cancel','report','export']),
  ('admin_receivables', array['menu_view','view','report','export']),
  ('admin_reports', array['menu_view','view','report','export']),
  ('admin_line', array['menu_view','view','update']),
  ('admin_subscriptions', array['menu_view','view','update']),
  ('admin_roles', array['menu_view','view','create','update']),
  ('admin_permissions', array['menu_view','view','update']),
  ('admin_menus', array['menu_view','view','create','update']),
  ('admin_audit', array['menu_view','view','export']),
  ('admin_settings', array['menu_view','view','update']),
  ('customer_overview', array['menu_view','view']),
  ('customer_properties', array['menu_view','view','create','update','delete']),
  ('customer_rooms', array['menu_view','view','create','update','delete']),
  ('customer_tenants', array['menu_view','view','create','update','delete']),
  ('customer_leases', array['menu_view','view','create','update','cancel']),
  ('customer_meters', array['menu_view','view','create','update']),
  ('customer_invoices', array['menu_view','view','create','update','cancel','report','export']),
  ('customer_payments', array['menu_view','view','create','cancel','report','export']),
  ('customer_receivables', array['menu_view','view','report','export']),
  ('customer_reports', array['menu_view','view','report','export']),
  ('customer_settings', array['menu_view','view','update']),
  ('customer_subscription', array['menu_view','view'])
)
insert into public.platform_menu_actions (menu_id, action_code)
select menu.id, unnest(supported.action_codes)
from supported join public.platform_menus menu on menu.code = supported.menu_code;

insert into public.platform_role_menu_actions (role_id, menu_id, action_code, is_allowed)
select role.id, mapping.menu_id, mapping.action_code, true
from public.platform_roles role cross join public.platform_menu_actions mapping
where role.code = 'super_admin';

insert into public.platform_role_menu_actions (role_id, menu_id, action_code, is_allowed)
select role.id, menu.id, mapping.action_code, true
from public.platform_roles role
join public.platform_menus menu on menu.audience in ('customer', 'all')
join public.platform_menu_actions mapping on mapping.menu_id = menu.id and mapping.is_active
where
  role.code = 'owner'
  or (role.code = 'manager' and menu.code in ('customer_overview','customer_properties','customer_rooms','customer_tenants','customer_leases','customer_meters','customer_invoices','customer_receivables','customer_reports','customer_settings'))
  or (role.code = 'accounting' and menu.code in ('customer_overview','customer_meters','customer_invoices','customer_payments','customer_receivables','customer_reports'))
  or (role.code = 'staff' and menu.code in ('customer_overview','customer_rooms','customer_tenants','customer_leases','customer_meters') and mapping.action_code not in ('delete','cancel','approve','report','export'));

create or replace function private.has_menu_action(target_organization_id uuid, target_menu_code text, target_action_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    join public.profiles profile on profile.id = membership.user_id and profile.status = 'active'
    join public.organizations organization on organization.id = membership.organization_id and organization.status = 'active'
    join public.subscriptions subscription on subscription.organization_id = membership.organization_id
    join public.platform_roles role on role.code = membership.role_code and role.status = 'active'
    join public.platform_menus menu on menu.code = target_menu_code and menu.status = 'active' and menu.audience in ('customer','all')
    join public.platform_permission_actions action on action.code = target_action_code and action.status = 'active'
    join public.platform_menu_actions mapping on mapping.menu_id = menu.id and mapping.action_code = action.code and mapping.is_active
    left join public.platform_user_menu_actions user_value on user_value.organization_id = membership.organization_id and user_value.user_id = membership.user_id and user_value.menu_id = menu.id and user_value.action_code = action.code
    left join public.platform_role_menu_actions role_value on role_value.role_id = role.id and role_value.menu_id = menu.id and role_value.action_code = action.code
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and coalesce(user_value.is_allowed, role_value.is_allowed, false)
      and (
        not action.is_mutation
        or subscription.status in ('trialing','active')
        or (subscription.status = 'past_due' and coalesce(subscription.access_until, subscription.grace_ends_at) > now())
      )
  );
$$;

create or replace function private.has_any_write_permission(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_menus menu
    join public.platform_menu_actions mapping on mapping.menu_id = menu.id and mapping.is_active
    join public.platform_permission_actions action on action.code = mapping.action_code and action.is_mutation and action.status = 'active'
    where menu.audience in ('customer','all') and menu.status = 'active'
      and private.has_menu_action(target_organization_id, menu.code, action.code)
  );
$$;

create or replace function private.can_write_organization(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select private.has_any_write_permission(target_organization_id); $$;

revoke all on function private.has_menu_action(uuid, text, text) from public;
revoke all on function private.has_any_write_permission(uuid) from public;
revoke all on function private.can_write_organization(uuid) from public;
grant execute on function private.has_menu_action(uuid, text, text) to authenticated;
grant execute on function private.has_any_write_permission(uuid) to authenticated;
grant execute on function private.can_write_organization(uuid) to authenticated;

do $$
declare item record;
begin
  for item in select * from (values
    ('properties','customer_properties'),
    ('rooms','customer_rooms'), ('tenants','customer_tenants'), ('leases','customer_leases'),
    ('meters','customer_meters'), ('billing_cycles','customer_meters'), ('meter_readings','customer_meters'),
    ('rent_invoices','customer_invoices'), ('rent_invoice_items','customer_invoices'),
    ('rent_payments','customer_payments'), ('rent_payment_allocations','customer_payments')
  ) as mapping(table_name, menu_code)
  loop
    execute format('drop policy if exists %I on public.%I', item.table_name || '_select_member', item.table_name);
    execute format('drop policy if exists %I on public.%I', item.table_name || '_insert_member', item.table_name);
    execute format('drop policy if exists %I on public.%I', item.table_name || '_update_member', item.table_name);
    execute format('drop policy if exists %I on public.%I', item.table_name || '_delete_member', item.table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select private.has_menu_action(organization_id, %L, %L)))', item.table_name || '_select_permission', item.table_name, item.menu_code, 'view');
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.has_menu_action(organization_id, %L, %L)))', item.table_name || '_insert_permission', item.table_name, item.menu_code, 'create');
    execute format('create policy %I on public.%I for update to authenticated using ((select private.has_menu_action(organization_id, %L, %L))) with check ((select private.has_menu_action(organization_id, %L, %L)))', item.table_name || '_update_permission', item.table_name, item.menu_code, 'update', item.menu_code, 'update');
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.has_menu_action(organization_id, %L, %L)))', item.table_name || '_delete_permission', item.table_name, item.menu_code, 'delete');
  end loop;
end;
$$;

drop policy if exists property_settings_insert_member on public.property_settings;
drop policy if exists property_settings_select_member on public.property_settings;
drop policy if exists property_settings_update_member on public.property_settings;
drop policy if exists property_settings_delete_member on public.property_settings;
create policy property_settings_select_permission on public.property_settings for select to authenticated
using ((select private.has_menu_action(organization_id, 'customer_settings', 'view')) or (select private.has_menu_action(organization_id, 'customer_properties', 'view')));
create policy property_settings_insert_permission on public.property_settings for insert to authenticated
with check ((select private.has_menu_action(organization_id, 'customer_properties', 'create')));
create policy property_settings_update_permission on public.property_settings for update to authenticated
using ((select private.has_menu_action(organization_id, 'customer_settings', 'update')))
with check ((select private.has_menu_action(organization_id, 'customer_settings', 'update')));
create policy property_settings_delete_permission on public.property_settings for delete to authenticated
using ((select private.has_menu_action(organization_id, 'customer_properties', 'delete')));

drop policy if exists audit_logs_insert_member on public.audit_logs;
create policy audit_logs_insert_permission on public.audit_logs for insert to authenticated
with check ((select private.has_any_write_permission(organization_id)));
