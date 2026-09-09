-- The shared bump_record_version trigger writes updated_by on every update.
-- meter_readings was missing this audit column, so editing raised SQLSTATE 42703.
alter table public.meter_readings
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

-- Exercise the real UPDATE trigger without retaining any changes to readings.
do $$
begin
  begin
    update public.meter_readings
    set current_value = current_value
    where id = (select id from public.meter_readings limit 1);
    raise exception using errcode = 'ZX001', message = 'rollback verification update';
  exception when sqlstate 'ZX001' then
    null;
  end;
end;
$$;
