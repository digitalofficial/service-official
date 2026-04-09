-- 013: Customer Portal Permissions
-- Adds configurable permissions for the customer portal per organization

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS customer_portal_permissions JSONB DEFAULT '{
  "view_invoices": true,
  "view_estimates": true,
  "view_projects": true,
  "view_payment_history": true,
  "pay_invoices": true,
  "send_messages": true,
  "view_photos": true,
  "view_files": true
}';
