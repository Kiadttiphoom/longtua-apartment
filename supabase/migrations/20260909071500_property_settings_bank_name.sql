alter table public.property_settings
  add column if not exists bank_name text;

comment on column public.property_settings.bank_name is 'ชื่อหรือรหัสธนาคารสำหรับรับชำระเงิน เช่น kbank, scb, promptpay';
