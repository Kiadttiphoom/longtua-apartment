-- Update approve_trial_request to default new trial subscriptions to 1 property and 10 rooms (Trial tier)
create or replace function public.approve_trial_request(
  target_request_id uuid,
  reviewer_user_id uuid
)
returns table (organization_id uuid, trial_ends_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_record public.trial_requests;
  created_organization_id uuid;
  created_property_id uuid;
  started_at timestamptz := clock_timestamp();
  ends_at timestamptz := started_at + interval '30 days';
begin
  if not exists (
    select 1 from public.system_admins system_admin
    where system_admin.user_id = reviewer_user_id and system_admin.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'Reviewer is not an active system administrator';
  end if;

  select * into request_record
  from public.trial_requests
  where id = target_request_id and status = 'pending'
  for update;

  if request_record.id is null then
    raise exception using errcode = 'P0002', message = 'Pending trial request was not found';
  end if;

  insert into public.organizations (name, slug, owner_user_id)
  values (
    request_record.operator_name,
    'org-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
    request_record.auth_user_id
  ) returning id into created_organization_id;

  insert into public.organization_members (
    organization_id, user_id, role_code, status, joined_at
  ) values (
    created_organization_id, request_record.auth_user_id, 'owner', 'active', started_at
  );

  insert into public.subscriptions (
    organization_id, status, trial_started_at, trial_ends_at, access_until,
    max_properties, max_rooms
  ) values (
    created_organization_id, 'trialing', started_at, ends_at, ends_at, 1, 10
  );

  insert into public.properties (
    organization_id, name, address, phone, created_by, updated_by
  ) values (
    created_organization_id,
    request_record.property_name,
    '',
    request_record.phone,
    request_record.auth_user_id,
    request_record.auth_user_id
  ) returning id into created_property_id;

  insert into public.property_settings (property_id, organization_id, updated_by)
  values (created_property_id, created_organization_id, request_record.auth_user_id);

  update public.profiles
  set status = 'active'
  where id = request_record.auth_user_id;

  update public.trial_requests
  set status = 'approved', reviewed_by = reviewer_user_id,
      reviewed_at = started_at, approved_organization_id = created_organization_id,
      rejection_reason = null
  where id = request_record.id;

  return query select created_organization_id, ends_at;
end;
$$;

revoke all on function public.approve_trial_request(uuid, uuid) from public, anon, authenticated;
grant execute on function public.approve_trial_request(uuid, uuid) to service_role;
