-- Blueprint and Proposal Schema
-- This file adds support for project blueprints and proposals
-- Compatible with existing Supabase structure

-- Project Members Table (for authorization)
-- Note: This might already exist from 01_schema_creation.sql, but we'll ensure it exists
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'viewer')),
    joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure unique membership constraint exists
DO $$ 
BEGIN
    ALTER TABLE project_members ADD CONSTRAINT unique_project_user UNIQUE(project_id, user_id);
EXCEPTION 
    WHEN duplicate_table THEN NULL;
END $$;

-- Blueprints Table
CREATE TABLE IF NOT EXISTS blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Proposals Table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    project_id UUID REFERENCES project(id) ON DELETE SET NULL,
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    client_email VARCHAR(255),
    sent_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    total_amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_project_id ON blueprints(project_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_author_id ON blueprints(author_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_blueprint_id ON proposals(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_proposals_author_id ON proposals(author_id);

-- Update triggers (using functions from 01_schema_creation.sql)
-- Drop and recreate triggers to avoid conflicts

DROP TRIGGER IF EXISTS update_project_members_updated_at ON project_members;
CREATE TRIGGER update_project_members_updated_at
BEFORE UPDATE ON project_members
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS update_blueprints_updated_at ON blueprints;
CREATE TRIGGER update_blueprints_updated_at
BEFORE UPDATE ON blueprints
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at
BEFORE UPDATE ON proposals
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 