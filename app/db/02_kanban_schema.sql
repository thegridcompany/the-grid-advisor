-- Kanban Columns Table
CREATE TABLE IF NOT EXISTS kanban_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    color VARCHAR(7), -- hex color code
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Kanban Tasks Table
CREATE TABLE IF NOT EXISTS kanban_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'todo',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kanban_columns_project_id ON kanban_columns(project_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_column_id ON kanban_tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_assignee_id ON kanban_tasks(assignee_id);

-- Use the trigger functions created in 01_schema_creation.sql
-- Drop and recreate triggers to avoid conflicts

DROP TRIGGER IF EXISTS update_kanban_columns_updated_at ON kanban_columns;
CREATE TRIGGER update_kanban_columns_updated_at
BEFORE UPDATE ON kanban_columns
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS update_kanban_tasks_updated_at ON kanban_tasks;
CREATE TRIGGER update_kanban_tasks_updated_at
BEFORE UPDATE ON kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 