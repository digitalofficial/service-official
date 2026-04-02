-- ============================================================
-- 008: Make audit_logs.organization_id NOT NULL
-- Ensures all audit entries are scoped to an organization
-- ============================================================

-- Backfill any existing NULL rows (assign from the user's org)
UPDATE audit_logs
SET organization_id = (SELECT organization_id FROM profiles WHERE id = audit_logs.user_id)
WHERE organization_id IS NULL AND user_id IS NOT NULL;

-- Delete any remaining orphaned rows with no org
DELETE FROM audit_logs WHERE organization_id IS NULL;

-- Now enforce NOT NULL
ALTER TABLE audit_logs ALTER COLUMN organization_id SET NOT NULL;
