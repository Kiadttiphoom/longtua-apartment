-- Preserve the authenticated administrator identity for RLS and audit logs.
create or replace function private.is_active_system_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.system_admins
    where user_id = (select auth.uid()) and status = 'active'
  );
$$;
revoke all on function private.is_active_system_admin() from public, anon;
grant execute on function private.is_active_system_admin() to authenticated, service_role;

create or replace function private.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (private.is_active_system_admin() and exists (select 1 from public.organizations where id = target_organization_id)) or exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

create or replace function private.has_menu_action(target_organization_id uuid, target_menu_code text, target_action_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (private.is_active_system_admin() and exists (select 1 from public.organizations where id = target_organization_id)) or exists (
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

revoke all on function private.is_organization_member(uuid) from public, anon;
revoke all on function private.has_menu_action(uuid, text, text) from public, anon;
grant execute on function private.is_organization_member(uuid) to authenticated, service_role;
grant execute on function private.has_menu_action(uuid, text, text) to authenticated, service_role;
