-- Enable RLS on all relevant tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- Add other tables that have workspace_id or a relation to it
-- ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners as well
ALTER TABLE workspaces FORCE ROW LEVEL SECURITY;
ALTER TABLE workspace_members FORCE ROW LEVEL SECURITY;
ALTER TABLE user_invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;

-- Helper function to get the current user ID from the session variable
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_user_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- --- POLICIES ---
-- Drop existing policies if they exist, then create them.

-- WORKSPACES
DROP POLICY IF EXISTS "Users can view their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON workspaces;
CREATE POLICY "Users can view workspaces they are members of"
ON workspaces FOR SELECT
USING (id IN (SELECT workspace_id FROM workspace_members WHERE user_id = get_current_user_id()));

DROP POLICY IF EXISTS "Workspace owners can update their own workspaces" ON workspaces;
CREATE POLICY "Workspace owners can update their own workspaces"
ON workspaces FOR UPDATE
USING (owner_id = get_current_user_id());

DROP POLICY IF EXISTS "Workspace owners can delete their own workspaces" ON workspaces;
CREATE POLICY "Workspace owners can delete their own workspaces"
ON workspaces FOR DELETE
USING (owner_id = get_current_user_id());


-- WORKSPACE MEMBERS
DROP POLICY IF EXISTS "Users can view members of their own workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Users can view members of workspaces they belong to" ON workspace_members;
CREATE POLICY "Users can view members of workspaces they belong to"
ON workspace_members FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = get_current_user_id()));

DROP POLICY IF EXISTS "Admins can manage members in their workspaces" ON workspace_members;
CREATE POLICY "Admins can manage members in their workspaces"
ON workspace_members FOR ALL
USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = get_current_user_id()) AND
    (
        SELECT role FROM workspace_members 
        WHERE user_id = get_current_user_id() AND workspace_id = workspace_members.workspace_id
    ) IN ('ADMIN', 'OWNER')
);


-- USER INVITATIONS
DROP POLICY IF EXISTS "Users can manage invitations for workspaces they administer" ON user_invitations;
CREATE POLICY "Users can manage invitations for workspaces they administer"
ON user_invitations FOR ALL
USING (
    workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = get_current_user_id() AND role IN ('ADMIN', 'OWNER')
    )
);


-- PROJECTS
DROP POLICY IF EXISTS "Users can view projects in their own workspaces" ON projects;
CREATE POLICY "Users can view projects in their workspaces"
ON projects FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = get_current_user_id()));

DROP POLICY IF EXISTS "Admins can manage projects in their workspaces" ON projects;
CREATE POLICY "Admins can manage projects in their workspaces"
ON projects FOR ALL
USING (
    workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = get_current_user_id() AND role IN ('ADMIN', 'OWNER')
    )
);

-- --- VIEWS ---

CREATE OR REPLACE VIEW active_workspaces AS
SELECT * FROM workspaces WHERE is_active = TRUE;

CREATE OR REPLACE VIEW workspace_members_with_details AS
SELECT
    wm.id,
    wm.workspace_id,
    w.name as workspace_name,
    wm.user_id,
    -- Assuming a 'users' table or similar exists for user details
    -- This join might need to be adjusted based on the final user table schema
    u.name as user_name,
    u.email as user_email,
    wm.role,
    wm.joined_at,
    wm.is_active
FROM
    workspace_members wm
JOIN
    workspaces w ON wm.workspace_id = w.id
LEFT JOIN
    -- This assumes a unified 'users' or 'team_members' table
    team_members u ON wm.user_id = u.id;

CREATE OR REPLACE VIEW pending_invitations AS
SELECT * FROM user_invitations WHERE status = 'pending'; 