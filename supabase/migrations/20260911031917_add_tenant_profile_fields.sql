alter table public.tenants
  add column if not exists birth_date date,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_relationship text,
  add column if not exists emergency_contact_phone text,
  add column if not exists vehicle_plate text,
  add column if not exists line_id text,
  add column if not exists notes text;

alter table public.tenants
  add constraint tenants_birth_date_reasonable_check
    check (birth_date is null or birth_date >= date '1900-01-01'),
  add constraint tenants_emergency_contact_name_length_check
    check (emergency_contact_name is null or char_length(emergency_contact_name) <= 160),
  add constraint tenants_emergency_contact_relationship_length_check
    check (emergency_contact_relationship is null or char_length(emergency_contact_relationship) <= 80),
  add constraint tenants_emergency_contact_phone_length_check
    check (emergency_contact_phone is null or char_length(emergency_contact_phone) <= 30),
  add constraint tenants_vehicle_plate_length_check
    check (vehicle_plate is null or char_length(vehicle_plate) <= 40),
  add constraint tenants_line_id_length_check
    check (line_id is null or char_length(line_id) <= 100),
  add constraint tenants_notes_length_check
    check (notes is null or char_length(notes) <= 2000);
