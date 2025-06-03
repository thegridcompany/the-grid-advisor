# Database Migration and Supabase Integration

This directory contains database migration scripts and documentation for The Grid Advisor project management system.

## Migration Files

### 1. `01_schema_creation.sql`

Creates the core database schema including:

- `profiles` - User profile information (extends Supabase auth.users)
- `project` - Project management data
- `epic` - Epic/feature groupings within projects
- `ticket` - Individual work items/tasks
- `sprint` - Sprint/iteration management
- `comment` - Comments on tickets
- `project_members` - Project team membership

**Foreign Key Relationships:**

- `profiles.id` → `auth.users.id` (Supabase auth)
- `epic.project_id` → `project.id`
- `ticket.project_id` → `project.id`
- `ticket.epic_id` → `epic.id` (optional)
- `ticket.sprint_id` → `sprint.id` (optional)
- `ticket.assignee_id` → `profiles.id` (optional)
- `comment.ticket_id` → `ticket.id`
- `comment.user_id` → `profiles.id`
- `project_members.project_id` → `project.id`
- `project_members.user_id` → `profiles.id`

### 2. `02_rls_policies.sql` (DEPRECATED - File was deleted)

Previously contained Row-Level Security policies. RLS policies have been integrated into the main schema creation file.

## Migration Process

### Initial Setup (First Time)

1. **Enable Extensions in Supabase:**

   ```sql
   -- Enable in Supabase dashboard or SQL editor
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgvector";
   ```

2. **Run Schema Creation:**

   ```bash
   # In Supabase SQL Editor, paste and execute:
   cat app/db/01_schema_creation.sql
   ```

3. **Verify Setup:**

   ```sql
   -- Check tables exist
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('profiles', 'project', 'epic', 'ticket', 'sprint', 'comment', 'project_members');

   -- Check RLS is enabled
   SELECT schemaname, tablename, rowsecurity
   FROM pg_tables
   WHERE tablename IN ('profiles', 'project', 'epic', 'ticket', 'sprint', 'comment', 'project_members')
   AND schemaname = 'public';
   ```

### Future Schema Changes

For any future schema modifications:

1. Create a new numbered SQL file (e.g., `03_add_new_feature.sql`)
2. Include both UP and DOWN migration scripts
3. Test migrations in a development environment first
4. Document changes in this README

## Supabase Integration

### Environment Variables

Required environment variables for Supabase connection:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### Real-time Features

The application supports real-time updates for:

- Project changes
- Ticket status updates
- New comments
- Epic modifications
- Sprint updates

**WebSocket Endpoint:** `/api/realtime/ws/{client_id}`

**Configuration Endpoint:** `/api/realtime/config`

### Row-Level Security (RLS)

RLS policies are implemented based on user roles:

- `consultant_po` - Full access to projects they own
- `developer` - Access to assigned tickets and project data
- `tech_lead` - Broad access within assigned projects
- `partner_cfo` - Financial and reporting access
- `client` - Read-only access to their projects

### Backup and Recovery

**Automatic Backups:**

- Supabase provides automatic daily backups
- Point-in-time recovery available
- Backups retained for 7 days (Pro plan) or 30 days (Team plan)

**Manual Backup:**

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or using pg_dump (if you have direct database access)
pg_dump "postgresql://user:pass@host:port/dbname" > backup.sql
```

**Recovery:**

```bash
# Using Supabase CLI
supabase db reset
supabase db push

# Or using psql
psql "postgresql://user:pass@host:port/dbname" < backup.sql
```

## API Integration

### FastAPI Database Layer

- **Database Manager:** `app/core/database.py`
- **Models:** `app/db/models.py`
- **API Routes:**
  - Projects: `app/api/projects.py`
  - Tickets: `app/api/tickets.py`
  - Real-time: `app/api/realtime.py`

### Available Endpoints

**Projects:**

- `GET /api/projects/` - List all projects
- `POST /api/projects/` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `GET /api/projects/{id}/epics` - Get project epics
- `POST /api/projects/{id}/epics` - Create epic
- `GET /api/projects/{id}/sprints` - Get project sprints
- `POST /api/projects/{id}/sprints` - Create sprint

**Tickets:**

- `GET /api/tickets/{id}` - Get ticket details
- `PUT /api/tickets/{id}` - Update ticket
- `DELETE /api/tickets/{id}` - Delete ticket
- `PATCH /api/tickets/{id}/status` - Update ticket status
- `PATCH /api/tickets/{id}/assign` - Assign ticket
- `GET /api/tickets/{id}/comments` - Get ticket comments
- `POST /api/tickets/{id}/comments` - Add comment

**Real-time:**

- `WebSocket /api/realtime/ws/{client_id}` - Real-time updates
- `GET /api/realtime/config` - Get WebSocket configuration

## Performance Considerations

### Indexes

The schema includes optimized indexes for:

- Foreign key relationships
- Common query patterns
- Text search on ticket descriptions
- Vector similarity search (when using pgvector)

### Query Optimization

- Use proper LIMIT/OFFSET for pagination
- Filter by project_id early in queries
- Leverage RLS for automatic security filtering
- Use SELECT only required columns

### Vector Search (Future Enhancement)

When implementing semantic search:

```sql
-- Add vector column to tickets
ALTER TABLE ticket ADD COLUMN description_embedding vector(1536);

-- Create index for fast similarity search
CREATE INDEX ON ticket USING ivfflat (description_embedding vector_cosine_ops);
```

## Troubleshooting

### Common Issues

1. **Foreign Key Violations:**

   - Ensure referenced records exist before creating relationships
   - Check RLS policies aren't blocking legitimate access

2. **RLS Policy Conflicts:**

   - Use `auth.uid()` for user-based policies
   - Test policies with different user contexts
   - Consider policy precedence (restrictive vs permissive)

3. **Real-time Not Working:**
   - Check Supabase real-time is enabled for tables
   - Verify WebSocket connection and authentication
   - Ensure RLS policies allow the user to see the data

### Debug Queries

```sql
-- Check current user and role
SELECT auth.uid(), auth.role();

-- Test RLS policy for a table
SELECT * FROM project WHERE id = 'some-uuid';

-- Check policy definitions
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'project';
```
