-- ============================================================
-- SAMPLE JOBS — Tucson, AZ addresses for demo purposes
-- Run after creating an organization and at least one profile.
-- Replace the UUIDs below with your actual org/profile/customer IDs.
-- ============================================================

-- Usage:
--   1. Get your organization_id:  SELECT id FROM organizations LIMIT 1;
--   2. Get a profile_id:          SELECT id FROM profiles LIMIT 1;
--   3. Replace 'YOUR_ORG_ID' and 'YOUR_PROFILE_ID' below
--   4. Run this script in Supabase SQL Editor

DO $$
DECLARE
  v_org_id UUID;
  v_profile_id UUID;
BEGIN
  -- Auto-detect first org and profile
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  SELECT id INTO v_profile_id FROM profiles WHERE organization_id = v_org_id LIMIT 1;

  INSERT INTO jobs (organization_id, job_number, title, description, status, priority, scheduled_start, scheduled_end, address_line1, city, state, zip, coordinates, assigned_to, created_by, instructions) VALUES

  -- Scheduled jobs
  (v_org_id, 'JOB-1001', 'Roof Inspection — Grant Rd Office', 'Full roof inspection for commercial office building. Check for storm damage and drainage issues.', 'scheduled', 'high',
   NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 3 hours',
   '4001 E Grant Rd', 'Tucson', 'AZ', '85712',
   '{"lat": 32.2530, "lng": -110.9127}',
   v_profile_id, v_profile_id, 'Access via rear parking lot. Ask for building manager Jose.'),

  (v_org_id, 'JOB-1002', 'Tile Roof Repair — Catalina Foothills', 'Replace cracked tiles on south-facing slope. Customer reported leak in master bedroom.', 'scheduled', 'urgent',
   NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 4 hours',
   '6320 N Campbell Ave', 'Tucson', 'AZ', '85718',
   '{"lat": 32.2870, "lng": -110.9420}',
   v_profile_id, v_profile_id, 'Gated community — code is #4521. Park on street.'),

  (v_org_id, 'JOB-1003', 'Flat Roof Coating — Speedway Plaza', 'Apply elastomeric roof coating to 3,200 sq ft flat roof. Prep and seal all penetrations.', 'scheduled', 'normal',
   NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 6 hours',
   '2910 E Speedway Blvd', 'Tucson', 'AZ', '85716',
   '{"lat": 32.2364, "lng": -110.9387}',
   v_profile_id, v_profile_id, 'Coordinate with tenant — restaurant below. Start early before it gets hot.'),

  -- In Progress
  (v_org_id, 'JOB-1004', 'Re-Roof — Rita Ranch Residence', 'Full tear-off and re-roof with 30-year architectural shingles. 2,800 sq ft.', 'in_progress', 'high',
   NOW() - INTERVAL '4 hours', NOW() + INTERVAL '2 days',
   '10450 E Rita Rd', 'Tucson', 'AZ', '85747',
   '{"lat": 32.1047, "lng": -110.8133}',
   v_profile_id, v_profile_id, 'Dumpster is in driveway. Tarps on landscaping.'),

  (v_org_id, 'JOB-1005', 'Skylight Install — Oro Valley Home', 'Install two Velux skylights in kitchen area. Cut, frame, flash, and finish.', 'in_progress', 'normal',
   NOW() - INTERVAL '2 hours', NOW() + INTERVAL '1 day',
   '1255 W Magee Rd', 'Tucson', 'AZ', '85704',
   '{"lat": 32.3390, "lng": -110.9912}',
   v_profile_id, v_profile_id, 'Materials staged in garage. Homeowner is home all day.'),

  -- Completed
  (v_org_id, 'JOB-1006', 'Gutter Installation — Marana', 'Install 6" seamless aluminum gutters with downspouts on all four sides.', 'completed', 'normal',
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '5 hours',
   '8370 N Cortaro Rd', 'Tucson', 'AZ', '85743',
   '{"lat": 32.3530, "lng": -111.1190}',
   v_profile_id, v_profile_id, 'Completed. Customer signed off. Invoice pending.'),

  (v_org_id, 'JOB-1007', 'Emergency Tarp — Monsoon Damage', 'Emergency tarp placement after monsoon blew off ridge cap tiles.', 'completed', 'urgent',
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '2 hours',
   '3640 S 12th Ave', 'Tucson', 'AZ', '85713',
   '{"lat": 32.1950, "lng": -110.9720}',
   v_profile_id, v_profile_id, 'Tarp secured. Follow-up repair needed — see JOB-1010.'),

  -- Unscheduled
  (v_org_id, 'JOB-1008', 'Roof Estimate — Broadway Village', 'Provide estimate for full commercial re-roof. TPO single-ply system.', 'unscheduled', 'normal',
   NULL, NULL,
   '16 S Eastbourne Ave', 'Tucson', 'AZ', '85716',
   '{"lat": 32.2193, "lng": -110.9490}',
   v_profile_id, v_profile_id, 'Contact property manager Maria to schedule walkthrough.'),

  (v_org_id, 'JOB-1009', 'Solar Panel Removal & Re-Roof', 'Remove 24 solar panels, re-roof, reinstall panels. Coordinate with solar company.', 'unscheduled', 'high',
   NULL, NULL,
   '5775 E River Rd', 'Tucson', 'AZ', '85750',
   '{"lat": 32.3270, "lng": -110.8750}',
   v_profile_id, v_profile_id, 'Solar company: SunTech AZ, contact Mike at 520-555-0199.'),

  -- Needs Follow Up
  (v_org_id, 'JOB-1010', 'Follow-Up Repair — 12th Ave Monsoon', 'Permanent repair for ridge cap tiles blown off during monsoon. Follow-up to JOB-1007.', 'needs_follow_up', 'high',
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '3 hours',
   '3640 S 12th Ave', 'Tucson', 'AZ', '85713',
   '{"lat": 32.1950, "lng": -110.9720}',
   v_profile_id, v_profile_id, 'Need to order matching tiles before scheduling. Customer waiting on insurance approval.'),

  (v_org_id, 'JOB-1011', 'Leak Investigation — Downtown Loft', 'Water stain appeared on ceiling after rain. Need to locate source and assess damage.', 'needs_follow_up', 'urgent',
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '2 hours',
   '100 E Congress St', 'Tucson', 'AZ', '85701',
   '{"lat": 32.2217, "lng": -110.9665}',
   v_profile_id, v_profile_id, 'Penthouse unit 4B. Doorman will let you up. Possible flashing failure at parapet.'),

  -- More scheduled for a full-looking calendar
  (v_org_id, 'JOB-1012', 'Fascia & Soffit Repair — Midvale Park', 'Replace rotted fascia boards and repaint soffit on south and west sides.', 'scheduled', 'low',
   NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 4 hours',
   '4802 E 22nd St', 'Tucson', 'AZ', '85711',
   '{"lat": 32.2156, "lng": -110.9040}',
   v_profile_id, v_profile_id, 'Lumber pre-ordered at Home Depot on Valencia.');

END $$;
