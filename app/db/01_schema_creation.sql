-- File: app/db/01_schema_creation.sql
-- Updated for existing Supabase structure

-- Make sure extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create or replace the timestamp update function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Alternative function name for compatibility
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- User Profiles Table (linked to supabase.auth.users)
-- This table stores additional user information not present in auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to Supabase auth user
    username TEXT UNIQUE,
    role TEXT, -- Consider CHECK constraint for valid roles: role IN ('consultant_po', 'developer', ...)
    is_active BOOLEAN DEFAULT TRUE,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop and recreate trigger for profiles to avoid conflicts
DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Project Table
CREATE TABLE IF NOT EXISTS project (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop and recreate trigger for project to avoid conflicts
DROP TRIGGER IF EXISTS set_project_updated_at ON project;
CREATE TRIGGER set_project_updated_at
BEFORE UPDATE ON project
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Epic Table
CREATE TABLE IF NOT EXISTS epic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'open', -- e.g., open, in_progress, completed
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop and recreate trigger for epic to avoid conflicts
DROP TRIGGER IF EXISTS set_epic_updated_at ON epic;
CREATE TRIGGER set_epic_updated_at
BEFORE UPDATE ON epic
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Sprint Table
CREATE TABLE IF NOT EXISTS sprint (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    goal TEXT,
    status TEXT DEFAULT 'planned', -- e.g., planned, active, completed
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop and recreate trigger for sprint to avoid conflicts
DROP TRIGGER IF EXISTS set_sprint_updated_at ON sprint;
CREATE TRIGGER set_sprint_updated_at
BEFORE UPDATE ON sprint
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Ticket Table
CREATE TABLE IF NOT EXISTS ticket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'backlog', -- From TicketStatus Enum
    priority TEXT DEFAULT 'medium', -- From TicketPriority Enum
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    epic_id UUID REFERENCES epic(id) ON DELETE SET NULL,
    sprint_id UUID REFERENCES sprint(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Or auth.users(id)
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Or auth.users(id)
    due_date TIMESTAMPTZ,
    estimated_hours REAL,
    actual_hours REAL,
    tags TEXT[] DEFAULT '{}',
    embeddings vector(1536), -- OpenAI ada-002 embedding dimension
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop and recreate trigger for ticket to avoid conflicts
DROP TRIGGER IF EXISTS set_ticket_updated_at ON ticket;
CREATE TRIGGER set_ticket_updated_at
BEFORE UPDATE ON ticket
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Create GIN index on ticket.description for full-text search
CREATE INDEX IF NOT EXISTS ticket_description_gin_idx ON ticket USING GIN (to_tsvector('english', description));

-- Create HNSW index for vector similarity search on embeddings
CREATE INDEX IF NOT EXISTS ticket_embeddings_hnsw_idx ON ticket USING hnsw (embeddings vector_cosine_ops);

-- Alternative indexes for different distance metrics (uncomment as needed):
-- CREATE INDEX IF NOT EXISTS ticket_embeddings_l2_idx ON ticket USING hnsw (embeddings vector_l2_ops);
-- CREATE INDEX IF NOT EXISTS ticket_embeddings_ip_idx ON ticket USING hnsw (embeddings vector_ip_ops);

-- Comment Table
CREATE TABLE IF NOT EXISTS comment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    ticket_id UUID NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Or auth.users(id)
    parent_comment_id UUID REFERENCES comment(id) ON DELETE CASCADE, -- For threaded comments
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop and recreate trigger for comment to avoid conflicts
DROP TRIGGER IF EXISTS set_comment_updated_at ON comment;
CREATE TRIGGER set_comment_updated_at
BEFORE UPDATE ON comment
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- project_members table (from previous RLS discussion, essential for many policies)
CREATE TABLE IF NOT EXISTS project_members (
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Or auth.users(id)
    -- project_role TEXT, -- Optional: role within the project like 'editor', 'viewer'
    PRIMARY KEY (project_id, user_id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL -- Added for audit
);
-- No updated_at trigger needed here as it's a linking table, rows are typically inserted/deleted.

-- Ensure roles from UserRole enum are valid for profiles.role and other role text fields.
-- This is typically done with a CHECK constraint or a separate 'roles' lookup table.
-- Example CHECK constraint for profiles.role:
-- ALTER TABLE profiles ADD CONSTRAINT check_profiles_role
-- CHECK (role IN ('consultant_po', 'developer', 'tech_lead', 'partner_cfo', 'client'));
-- Apply similar checks for ticket.status, ticket.priority, epic.status, sprint.status if you want to enforce enum values at DB level. 