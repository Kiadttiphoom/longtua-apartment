create or replace function public.create_rooms_with_meters(
  target_organization_id uuid,
  target_property_id uuid,
  requested_room_numbers text[],
  room_floor text,
  room_base_rent numeric
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  requested_number text;
  normalized_number text;
  created_room_id uuid;
  processed_numbers text[] := array[]::text[];
  created_numbers text[] := array[]::text[];
  skipped_numbers text[] := array[]::text[];
begin
  if target_organization_id is null or target_property_id is null then
    raise exception using errcode = '22023', message = 'organization and property are required';
  end if;

  if not private.has_menu_action(target_organization_id, 'customer_rooms', 'create') then
    raise exception using errcode = '42501', message = 'room create permission is required';
  end if;

  if requested_room_numbers is null
    or cardinality(requested_room_numbers) < 1
    or cardinality(requested_room_numbers) > 200 then
    raise exception using errcode = '22023', message = 'room count must be between 1 and 200';
  end if;

  if room_base_rent is null or room_base_rent < 0 then
    raise exception using errcode = '22023', message = 'base rent must be zero or greater';
  end if;

  if room_floor is not null and length(btrim(room_floor)) > 40 then
    raise exception using errcode = '22023', message = 'floor is too long';
  end if;

  foreach requested_number in array requested_room_numbers loop
    normalized_number := btrim(coalesce(requested_number, ''));

    if length(normalized_number) < 1 or length(normalized_number) > 40 then
      raise exception using errcode = '22023', message = 'room number must contain 1 to 40 characters';
    end if;

    if normalized_number = any(processed_numbers) then
      skipped_numbers := array_append(skipped_numbers, normalized_number);
      continue;
    end if;
    processed_numbers := array_append(processed_numbers, normalized_number);

    created_room_id := null;
    insert into public.rooms (
      organization_id,
      property_id,
      room_number,
      floor,
      base_rent
    )
    values (
      target_organization_id,
      target_property_id,
      normalized_number,
      nullif(btrim(room_floor), ''),
      room_base_rent
    )
    on conflict (organization_id, property_id, room_number) do nothing
    returning id into created_room_id;

    if created_room_id is null then
      skipped_numbers := array_append(skipped_numbers, normalized_number);
      continue;
    end if;

    insert into public.meters (
      organization_id,
      property_id,
      room_id,
      meter_type
    )
    values
      (target_organization_id, target_property_id, created_room_id, 'electric'),
      (target_organization_id, target_property_id, created_room_id, 'water');

    created_numbers := array_append(created_numbers, normalized_number);
  end loop;

  if cardinality(created_numbers) > 0 then
    insert into public.audit_logs (
      organization_id,
      action,
      entity_type,
      metadata
    )
    values (
      target_organization_id,
      'rooms.created_bulk',
      'room',
      jsonb_build_object(
        'property_id', target_property_id,
        'room_numbers', to_jsonb(created_numbers),
        'created_count', cardinality(created_numbers),
        'skipped_count', cardinality(skipped_numbers)
      )
    );
  end if;

  return jsonb_build_object(
    'created_count', cardinality(created_numbers),
    'skipped_count', cardinality(skipped_numbers),
    'created_room_numbers', to_jsonb(created_numbers),
    'skipped_room_numbers', to_jsonb(skipped_numbers)
  );
end;
$$;

revoke all on function public.create_rooms_with_meters(uuid, uuid, text[], text, numeric)
  from public, anon;
grant execute on function public.create_rooms_with_meters(uuid, uuid, text[], text, numeric)
  to authenticated, service_role;

comment on function public.create_rooms_with_meters(uuid, uuid, text[], text, numeric)
  is 'Creates up to 200 rooms and their electric/water meters atomically while respecting caller RLS permissions.';
