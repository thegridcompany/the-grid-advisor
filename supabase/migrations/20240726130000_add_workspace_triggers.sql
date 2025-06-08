CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Apply updated_at trigger to new workspace tables
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_members_updated_at BEFORE UPDATE ON workspace_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_invitations_updated_at BEFORE UPDATE ON user_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to prevent deleting a workspace with active members
CREATE OR REPLACE FUNCTION prevent_workspace_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = OLD.id AND is_active = TRUE) > 0 THEN
        RAISE EXCEPTION 'Cannot delete workspace with active members. Deactivate the workspace instead.';
    END IF;
    RETURN OLD;
END;
$$ language 'plpgsql';

CREATE TRIGGER prevent_workspace_deletion_trigger
BEFORE DELETE ON workspaces
FOR EACH ROW EXECUTE FUNCTION prevent_workspace_deletion();

-- Function to cascade workspace deactivation
CREATE OR REPLACE FUNCTION cascade_workspace_deactivation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        UPDATE workspace_members SET is_active = FALSE WHERE workspace_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER cascade_workspace_deactivation_trigger
AFTER UPDATE ON workspaces
FOR EACH ROW EXECUTE FUNCTION cascade_workspace_deactivation();

-- Function to generate a url-safe slug from a name
CREATE OR REPLACE FUNCTION slugify("value" TEXT)
RETURNS TEXT AS $$
  SELECT regexp_replace(
    trim(
      lower(
        regexp_replace(
          unaccent("value"),
          '[^a-zA-Z0-9\s-]', '', 'g'
        )
      )
    ), '\s+', '-', 'g'
  );
$$ LANGUAGE SQL IMMUTABLE;

-- Function to set slug on workspace creation
CREATE OR REPLACE FUNCTION set_workspace_slug()
RETURNS TRIGGER AS $$
BEGIN
    NEW.slug := slugify(NEW.name);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_workspace_slug_trigger
BEFORE INSERT ON workspaces
FOR EACH ROW EXECUTE FUNCTION set_workspace_slug(); 