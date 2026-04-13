ALTER TABLE photos ADD COLUMN IF NOT EXISTS estimate_id uuid REFERENCES estimates(id);
CREATE INDEX IF NOT EXISTS idx_photos_estimate_id ON photos(estimate_id) WHERE deleted_at IS NULL;
