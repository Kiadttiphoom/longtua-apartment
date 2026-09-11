insert into public.platform_menu_actions (menu_id, action_code, is_active)
select menu.id, 'delete', true
from public.platform_menus menu
where menu.code = 'customer_meters'
on conflict (menu_id, action_code) do update
set is_active = true, updated_at = now();

insert into public.platform_role_menu_actions (role_id, menu_id, action_code, is_allowed)
select role.id, menu.id, 'delete', true
from public.platform_roles role
cross join public.platform_menus menu
where role.code in ('super_admin', 'owner', 'manager', 'accounting')
  and menu.code = 'customer_meters'
on conflict (role_id, menu_id, action_code) do update
set is_allowed = true, updated_at = now();

create or replace function private.prevent_invoiced_meter_reading_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.meters meter
    join public.rent_invoices invoice
      on invoice.organization_id = old.organization_id
     and invoice.room_id = meter.room_id
     and invoice.billing_cycle_id = old.billing_cycle_id
     and invoice.status <> 'void'
    where meter.id = old.meter_id
      and meter.organization_id = old.organization_id
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'meter_reading_has_invoice';
  end if;
  return old;
end;
$$;

revoke all on function private.prevent_invoiced_meter_reading_delete() from public, anon, authenticated;

drop trigger if exists prevent_invoiced_meter_reading_delete on public.meter_readings;
create trigger prevent_invoiced_meter_reading_delete
before delete on public.meter_readings
for each row execute function private.prevent_invoiced_meter_reading_delete();
