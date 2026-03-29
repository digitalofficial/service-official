-- Add Google Maps API key to org SMS settings (reusing the table for all integration config)
ALTER TABLE organization_sms_settings
  ADD COLUMN IF NOT EXISTS google_maps_api_key TEXT;
