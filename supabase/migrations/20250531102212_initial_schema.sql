-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email LIKE '%@thegridcompany.it'),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    notification_preferences JSONB DEFAULT '{}',
    email_password_encrypted TEXT,
    last_email_sync TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Accounts table
CREATE TABLE IF NOT EXISTS email_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    email_address VARCHAR(255) NOT NULL,
    encrypted_password TEXT NOT NULL,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'active' CHECK (sync_status IN ('active', 'error', 'paused')),
    error_message TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_member_id, email_address)
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    company VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    industry VARCHAR(100),
    notes TEXT,
    engagement_score DECIMAL(5,2) DEFAULT 0.0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
    last_interaction TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'churned')),
    assigned_to UUID REFERENCES team_members(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'meeting', 'call', 'task', 'note', 'proposal', 'invoice')),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    team_member_id UUID NOT NULL REFERENCES team_members(id),
    subject VARCHAR(500) NOT NULL,
    content TEXT,
    sentiment DECIMAL(3,2) CHECK (sentiment >= -1 AND sentiment <= 1),
    importance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
    
    -- Email specific fields
    email_message_id VARCHAR(255),
    thread_id VARCHAR(255),
    email_from VARCHAR(255),
    email_to TEXT[],
    email_cc TEXT[],
    requires_response BOOLEAN DEFAULT false,
    response_deadline TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- General metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- AI analysis
    ai_summary TEXT,
    ai_suggested_actions TEXT[] DEFAULT '{}',
    ai_analysis_timestamp TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learned Patterns table
CREATE TABLE IF NOT EXISTS learned_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('behavior', 'communication', 'business', 'risk')),
    pattern_description TEXT NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    occurrences INTEGER DEFAULT 1 CHECK (occurrences >= 1),
    first_observed TIMESTAMP WITH TIME ZONE NOT NULL,
    last_observed TIMESTAMP WITH TIME ZONE NOT NULL,
    last_validated TIMESTAMP WITH TIME ZONE,
    
    -- Pattern details
    conditions JSONB DEFAULT '{}',
    predictions JSONB DEFAULT '{}',
    
    -- Effectiveness tracking
    predictions_made INTEGER DEFAULT 0,
    predictions_correct INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Rules table
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('alert', 'action', 'analysis')),
    is_active BOOLEAN DEFAULT true,
    
    -- Trigger configuration
    trigger_conditions JSONB NOT NULL,
    trigger_schedule VARCHAR(100), -- Cron expression
    
    -- Action configuration
    actions JSONB NOT NULL DEFAULT '[]',
    
    -- Execution tracking
    last_triggered TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES team_members(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory table with vector embeddings
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('interaction', 'pattern', 'insight', 'document')),
    content_id UUID NOT NULL,
    content_text TEXT NOT NULL,
    embedding vector(1536), -- OpenAI embedding dimension
    
    -- Memory categorization
    category VARCHAR(100),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    
    -- Importance and decay
    importance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    
    -- Memory metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('response_overdue', 'client_silent', 'proposal_followup', 'invoice_overdue', 'custom')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Alert target
    team_member_id UUID NOT NULL REFERENCES team_members(id),
    client_id UUID REFERENCES clients(id),
    related_id UUID,
    related_type VARCHAR(50),
    
    -- Alert status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved', 'expired')),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Actions
    suggested_actions TEXT[] DEFAULT '{}',
    action_taken TEXT,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Briefings table
CREATE TABLE IF NOT EXISTS daily_briefings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES team_members(id),
    briefing_date DATE NOT NULL,
    
    -- Content sections
    summary TEXT NOT NULL,
    key_metrics JSONB NOT NULL DEFAULT '{}',
    priority_items JSONB NOT NULL DEFAULT '[]',
    follow_ups_needed JSONB NOT NULL DEFAULT '[]',
    insights TEXT[] DEFAULT '{}',
    
    -- Delivery status
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    feedback TEXT,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(team_member_id, briefing_date)
);

-- Client Health table
CREATE TABLE IF NOT EXISTS client_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Health metrics
    engagement_score DECIMAL(5,2) NOT NULL CHECK (engagement_score >= 0 AND engagement_score <= 100),
    response_time_avg DECIMAL(10,2), -- hours
    interaction_frequency DECIMAL(10,2), -- per month
    sentiment_trend DECIMAL(3,2) CHECK (sentiment_trend >= -1 AND sentiment_trend <= 1),
    
    -- Risk indicators
    churn_risk DECIMAL(3,2) DEFAULT 0.0 CHECK (churn_risk >= 0 AND churn_risk <= 1),
    days_since_contact INTEGER DEFAULT 0,
    
    -- Recommendations
    recommended_actions TEXT[] DEFAULT '{}',
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_interactions_team_member ON interactions(team_member_id);
CREATE INDEX idx_interactions_client ON interactions(client_id);
CREATE INDEX idx_interactions_created_at ON interactions(created_at DESC);
CREATE INDEX idx_interactions_email_message_id ON interactions(email_message_id);
CREATE INDEX idx_alerts_team_member ON alerts(team_member_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_client_health_client ON client_health(client_id);
CREATE INDEX idx_daily_briefings_team_member ON daily_briefings(team_member_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON email_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learned_patterns_updated_at BEFORE UPDATE ON learned_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_briefings_updated_at BEFORE UPDATE ON daily_briefings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_health_updated_at BEFORE UPDATE ON client_health
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 