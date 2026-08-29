alter table public.property_settings
  add column water_billing_method text not null default 'meter'
  constraint property_settings_water_billing_method_check
  check (water_billing_method in ('meter', 'per_person', 'flat_room'));

alter table public.leases
  add column occupant_count smallint not null default 1
  constraint leases_occupant_count_check
  check (occupant_count between 1 and 50);

comment on column public.property_settings.water_billing_method is
  'How water is billed for the property: meter, per_person, or flat_room.';

comment on column public.leases.occupant_count is
  'Number of occupants used as the billing snapshot source for per-person water charges.';
