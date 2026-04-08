-- Internal team messaging (no SMS costs)
CREATE TABLE team_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  -- NULL recipient = broadcast to all
  recipient_id UUID REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  -- Optional job/project context
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_messages_org ON team_messages(organization_id, created_at DESC);
CREATE INDEX idx_team_messages_recipient ON team_messages(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_team_messages_sender ON team_messages(sender_id, created_at DESC);

ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own team messages"
  ON team_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = team_messages.organization_id
    )
    AND (recipient_id = auth.uid() OR recipient_id IS NULL OR sender_id = auth.uid())
  );

CREATE POLICY "Users can send team messages"
  ON team_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = team_messages.organization_id
    )
    AND sender_id = auth.uid()
  );

CREATE POLICY "Users can mark their messages as read"
  ON team_messages FOR UPDATE
  USING (recipient_id = auth.uid() OR recipient_id IS NULL);
