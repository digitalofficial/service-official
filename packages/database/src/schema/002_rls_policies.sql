-- ============================================================
-- RLS POLICIES — Run this in Supabase SQL Editor
-- ============================================================

-- Helper: get the current user's org_id
CREATE OR REPLACE FUNCTION public.get_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── PROFILES ────────────────────────────────────────────────
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  organization_id = public.get_org_id() OR id = auth.uid()
);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (
  id = auth.uid()
);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  id = auth.uid() OR organization_id = public.get_org_id()
);

-- ── ORGANIZATIONS ───────────────────────────────────────────
CREATE POLICY "org_select" ON organizations FOR SELECT USING (
  id = public.get_org_id() OR id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "org_update" ON organizations FOR UPDATE USING (
  id = public.get_org_id()
);
CREATE POLICY "org_insert" ON organizations FOR INSERT WITH CHECK (true);

-- ── CUSTOMERS ───────────────────────────────────────────────
CREATE POLICY "customers_select" ON customers FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "customers_update" ON customers FOR UPDATE USING (organization_id = public.get_org_id());
CREATE POLICY "customers_delete" ON customers FOR DELETE USING (organization_id = public.get_org_id());

-- ── PROJECTS (drop existing policy first) ───────────────────
DROP POLICY IF EXISTS "org_isolation" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (organization_id = public.get_org_id());
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (organization_id = public.get_org_id());

-- ── LEADS ───────────────────────────────────────────────────
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_select" ON leads FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "leads_insert" ON leads FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "leads_update" ON leads FOR UPDATE USING (organization_id = public.get_org_id());
CREATE POLICY "leads_delete" ON leads FOR DELETE USING (organization_id = public.get_org_id());

-- ── JOBS ────────────────────────────────────────────────────
CREATE POLICY "jobs_select" ON jobs FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "jobs_insert" ON jobs FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "jobs_update" ON jobs FOR UPDATE USING (organization_id = public.get_org_id());
CREATE POLICY "jobs_delete" ON jobs FOR DELETE USING (organization_id = public.get_org_id());

-- ── ESTIMATES ───────────────────────────────────────────────
CREATE POLICY "estimates_select" ON estimates FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "estimates_insert" ON estimates FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "estimates_update" ON estimates FOR UPDATE USING (organization_id = public.get_org_id());

-- ── INVOICES ────────────────────────────────────────────────
CREATE POLICY "invoices_select" ON invoices FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "invoices_insert" ON invoices FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "invoices_update" ON invoices FOR UPDATE USING (organization_id = public.get_org_id());

-- ── PAYMENTS ────────────────────────────────────────────────
CREATE POLICY "payments_select" ON payments FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (organization_id = public.get_org_id());

-- ── EXPENSES ────────────────────────────────────────────────
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (organization_id = public.get_org_id());

-- ── FILES ───────────────────────────────────────────────────
CREATE POLICY "files_select" ON files FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "files_insert" ON files FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "files_delete" ON files FOR DELETE USING (organization_id = public.get_org_id());

-- ── PHOTOS ──────────────────────────────────────────────────
CREATE POLICY "photos_select" ON photos FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "photos_insert" ON photos FOR INSERT WITH CHECK (organization_id = public.get_org_id());

-- ── NOTIFICATIONS ───────────────────────────────────────────
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ── MESSAGES ────────────────────────────────────────────────
CREATE POLICY "messages_select" ON messages FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (organization_id = public.get_org_id());

-- ── TABLES WITHOUT ORG_ID (project-scoped) ──────────────────
-- These need RLS based on the parent project's org

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'project_phases', 'project_milestones', 'project_team',
    'project_materials', 'daily_logs', 'punch_list_items',
    'rfis', 'change_orders', 'submittals'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('
      CREATE POLICY "%1$s_select" ON %1$I FOR SELECT USING (
        project_id IN (SELECT id FROM projects WHERE organization_id = public.get_org_id())
      )', t);
    EXECUTE format('
      CREATE POLICY "%1$s_insert" ON %1$I FOR INSERT WITH CHECK (
        project_id IN (SELECT id FROM projects WHERE organization_id = public.get_org_id())
      )', t);
    EXECUTE format('
      CREATE POLICY "%1$s_update" ON %1$I FOR UPDATE USING (
        project_id IN (SELECT id FROM projects WHERE organization_id = public.get_org_id())
      )', t);
  END LOOP;
END;
$$;

-- ── REMAINING TABLES ────────────────────────────────────────

-- Estimate sections/line items
ALTER TABLE estimate_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "est_sections_select" ON estimate_sections FOR SELECT USING (
  estimate_id IN (SELECT id FROM estimates WHERE organization_id = public.get_org_id())
);
CREATE POLICY "est_sections_insert" ON estimate_sections FOR INSERT WITH CHECK (
  estimate_id IN (SELECT id FROM estimates WHERE organization_id = public.get_org_id())
);
CREATE POLICY "est_items_select" ON estimate_line_items FOR SELECT USING (
  estimate_id IN (SELECT id FROM estimates WHERE organization_id = public.get_org_id())
);
CREATE POLICY "est_items_insert" ON estimate_line_items FOR INSERT WITH CHECK (
  estimate_id IN (SELECT id FROM estimates WHERE organization_id = public.get_org_id())
);

-- Invoice line items
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_items_select" ON invoice_line_items FOR SELECT USING (
  invoice_id IN (SELECT id FROM invoices WHERE organization_id = public.get_org_id())
);
CREATE POLICY "inv_items_insert" ON invoice_line_items FOR INSERT WITH CHECK (
  invoice_id IN (SELECT id FROM invoices WHERE organization_id = public.get_org_id())
);

-- Blueprints, takeoffs, etc
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blueprints_select" ON blueprints FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "blueprints_insert" ON blueprints FOR INSERT WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "bp_sheets_select" ON blueprint_sheets FOR SELECT USING (
  blueprint_id IN (SELECT id FROM blueprints WHERE organization_id = public.get_org_id())
);

CREATE POLICY "takeoffs_select" ON takeoffs FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "takeoffs_insert" ON takeoffs FOR INSERT WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "takeoff_items_select" ON takeoff_items FOR SELECT USING (
  takeoff_id IN (SELECT id FROM takeoffs WHERE organization_id = public.get_org_id())
);

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (organization_id = public.get_org_id());

-- Automation
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_select" ON automation_rules FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "automation_insert" ON automation_rules FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "automation_update" ON automation_rules FOR UPDATE USING (organization_id = public.get_org_id());

CREATE POLICY "automation_logs_select" ON automation_logs FOR SELECT USING (
  rule_id IN (SELECT id FROM automation_rules WHERE organization_id = public.get_org_id())
);

-- Material catalog
ALTER TABLE material_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog_select" ON material_catalog FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "catalog_insert" ON material_catalog FOR INSERT WITH CHECK (organization_id = public.get_org_id());

-- Subcontractors
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_select" ON subcontractors FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "subs_insert" ON subcontractors FOR INSERT WITH CHECK (organization_id = public.get_org_id());

-- Audit logs, report snapshots
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select" ON audit_logs FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "reports_select" ON report_snapshots FOR SELECT USING (organization_id = public.get_org_id());
