ALTER TABLE projects ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
UPDATE projects SET workspace_id = (SELECT id FROM workspaces WHERE slug = 'thegrid' LIMIT 1);
ALTER TABLE projects ALTER COLUMN workspace_id SET NOT NULL; 