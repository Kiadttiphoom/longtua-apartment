create table public.monitor_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default clock_timestamp(),
  organization_id uuid,
  actor_user_id uuid,
  organization_name text,
  actor_name text,
  action text not null,
  outcome text not null check (outcome in ('success', 'error')),
  source text not null,
  entity_type text,
  entity_id text,
  error_code text,
  request_id text,
  message text
);
alter table public.monitor_events enable row level security;
revoke all on public.monitor_events from anon, authenticated;
grant select, insert on public.monitor_events to service_role;
grant usage, select on sequence public.monitor_events_id_seq to service_role;
create index monitor_events_time_idx on public.monitor_events (occurred_at desc, id desc);
create index monitor_events_org_time_idx on public.monitor_events (organization_id, occurred_at desc);
create index monitor_events_actor_time_idx on public.monitor_events (actor_user_id, occurred_at desc);
create index monitor_events_errors_idx on public.monitor_events (occurred_at desc) where outcome = 'error';

-- Snapshot display names so searches still work after accounts are removed.
create or replace function private.monitor_event_names()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.organization_name := coalesce(new.organization_name, (select name from public.organizations where id = new.organization_id));
  new.actor_name := coalesce(new.actor_name, (select concat_ws(' · ', display_name, username) from public.profiles where id = new.actor_user_id));
  return new;
end;
$$;
revoke all on function private.monitor_event_names() from public, anon, authenticated;
create trigger monitor_event_names before insert on public.monitor_events
for each row execute function private.monitor_event_names();

-- Store only identifiers and operation names, never row contents or secrets.
create or replace function private.monitor_row_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  row_data jsonb;
  org_id uuid;
begin
  if tg_op = 'DELETE' then row_data := to_jsonb(old); else row_data := to_jsonb(new); end if;
  org_id := case when tg_table_name = 'organizations' then (row_data->>'id')::uuid else (row_data->>'organization_id')::uuid end;
  insert into public.monitor_events (organization_id, actor_user_id, organization_name, action, outcome, source, entity_type, entity_id)
  values (org_id, auth.uid(), case when tg_table_name = 'organizations' then row_data->>'name' end,
    tg_table_name || '.' || lower(tg_op), 'success', 'database', tg_table_name, row_data->>'id');
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.monitor_row_change() from public, anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['organizations','profiles','organization_members','properties','property_settings','rooms','tenants','leases','meters','meter_readings','billing_cycles','rent_invoices','rent_invoice_items','rent_payments','rent_payment_allocations','subscriptions','trial_requests','tenant_accounts','payment_submissions','lease_document_versions','property_lease_templates','repair_requests','tenant_contract_uploads'] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('create trigger monitor_row_change after insert or update or delete on public.%I for each row execute function private.monitor_row_change()', table_name);
    end if;
  end loop;
end;
$$;

create or replace function private.monitor_platform_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.monitor_events (occurred_at, organization_id, actor_user_id, action, outcome, source, entity_type, entity_id, request_id)
  values (new.created_at, case when new.entity_type in ('organization','subscription') and new.entity_id ~ '^[0-9a-fA-F-]{36}$' then new.entity_id::uuid end,
    new.actor_user_id, new.action, 'success', 'admin', new.entity_type, new.entity_id, new.request_id::text);
  return new;
end;
$$;
revoke all on function private.monitor_platform_audit() from public, anon, authenticated;
create trigger monitor_platform_audit after insert on public.platform_audit_logs for each row execute function private.monitor_platform_audit();

-- Historical audit entries have only the coverage the previous system recorded.
insert into public.monitor_events (occurred_at, organization_id, actor_user_id, action, outcome, source, entity_type, entity_id)
select created_at, organization_id, actor_user_id, action, 'success', 'audit_history', entity_type, entity_id::text from public.audit_logs;
insert into public.monitor_events (occurred_at, actor_user_id, action, outcome, source, entity_type, entity_id, request_id)
select created_at, actor_user_id, action, 'success', 'admin_history', entity_type, entity_id, request_id::text from public.platform_audit_logs;

create or replace function public.query_admin_monitor(
  start_at timestamptz, end_at timestamptz,
  start_time time default '00:00', end_time time default '23:59',
  organization_search text default '', actor_search text default '', search_text text default '',
  result_filter text default 'all', bucket text default 'day', page_number integer default 1
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  if start_at is null or end_at is null or end_at <= start_at or end_at - start_at > interval '370 days'
    or start_time is null or end_time is null
    or bucket not in ('hour','day','month') or result_filter not in ('all','success','error')
    or page_number < 1 or page_number > 100000 then
    raise exception 'Invalid monitor filters';
  end if;
  if bucket = 'hour' and end_at - start_at > interval '2 days' then raise exception 'Hourly range too wide'; end if;
  with filtered as materialized (
    select * from public.monitor_events e
    where e.occurred_at >= start_at and e.occurred_at < end_at
      and (result_filter = 'all' or e.outcome = result_filter)
      and (case when start_time <= end_time
        then date_trunc('minute', e.occurred_at at time zone 'Asia/Bangkok')::time between start_time and end_time
        else date_trunc('minute', e.occurred_at at time zone 'Asia/Bangkok')::time >= start_time or date_trunc('minute', e.occurred_at at time zone 'Asia/Bangkok')::time <= end_time end)
      and strpos(lower(coalesce(e.organization_name, 'ระบบ / ไม่ระบุกิจการ')), lower(coalesce(organization_search,''))) > 0
      and strpos(lower(coalesce(e.actor_name, 'ระบบ / ไม่ระบุผู้ใช้')), lower(coalesce(actor_search,''))) > 0
      and strpos(lower(concat_ws(' ', e.action, e.entity_type, e.entity_id, e.error_code, e.request_id, e.message)), lower(coalesce(search_text,''))) > 0
  ), times as (
    select generate_series(date_trunc(bucket, start_at at time zone 'Asia/Bangkok'), date_trunc(bucket, (end_at - interval '1 microsecond') at time zone 'Asia/Bangkok'),
      case bucket when 'hour' then interval '1 hour' when 'month' then interval '1 month' else interval '1 day' end) as t
  ), counts as (
    select date_trunc(bucket, occurred_at at time zone 'Asia/Bangkok') as t,
      count(*) filter (where outcome = 'success') as success, count(*) filter (where outcome = 'error') as errors
    from filtered group by 1
  ), top_actions as (
    select action, count(*) as total from filtered group by action order by count(*) desc, action limit 10
  ), page_rows as (
    select * from filtered order by occurred_at desc, id desc limit 50 offset (page_number - 1) * 50
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'errors', (select count(*) from filtered where outcome = 'error'),
    'users', (select count(distinct actor_user_id) from filtered),
    'organizations', (select count(distinct organization_id) from filtered),
    'series', coalesce((select jsonb_agg(jsonb_build_object('time', to_char(times.t, 'YYYY-MM-DD HH24:MI'), 'success', coalesce(counts.success,0), 'errors', coalesce(counts.errors,0)) order by times.t) from times left join counts using(t)), '[]'::jsonb),
    'actions', coalesce((select jsonb_agg(to_jsonb(top_actions)) from top_actions), '[]'::jsonb),
    'rows', coalesce((select jsonb_agg(to_jsonb(page_rows)) from page_rows), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.query_admin_monitor(timestamptz,timestamptz,time,time,text,text,text,text,text,integer) from public, anon, authenticated;
grant execute on function public.query_admin_monitor(timestamptz,timestamptz,time,time,text,text,text,text,text,integer) to service_role;
