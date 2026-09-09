-- Add dedicated bank account columns to property_settings if not already present
alter table public.property_settings
  add column if not exists bank_name text,
  add column if not exists bank_account_no text,
  add column if not exists bank_account_name text;

comment on column public.property_settings.bank_name is 'รหัสธนาคาร เช่น kbank, scb, bbl, promptpay';
comment on column public.property_settings.bank_account_no is 'เลขที่บัญชีเงินฝากธนาคาร';
comment on column public.property_settings.bank_account_name is 'ชื่อบัญชีเงินฝากธนาคาร';
