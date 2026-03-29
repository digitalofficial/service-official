-- Add customer SMS notification columns to sms settings
ALTER TABLE organization_sms_settings
  ADD COLUMN IF NOT EXISTS notify_customer_booked BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_customer_en_route BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_customer_completed BOOLEAN DEFAULT FALSE;
