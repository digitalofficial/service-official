-- 016: Add job_id to purchase_orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_job ON purchase_orders(job_id) WHERE job_id IS NOT NULL;
