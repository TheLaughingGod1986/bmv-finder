-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    role JSONB NOT NULL DEFAULT '{"id": "free", "name": "Free User", "description": "Basic user with limited features", "permissions": []}',
    tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'mid', 'elite', 'admin')),
    preferences JSONB NOT NULL DEFAULT '{
        "theme": "system",
        "notifications": {
            "email": true,
            "push": true,
            "sms": false,
            "marketing": false
        },
        "privacy": {
            "profileVisibility": "private",
            "dataSharing": false,
            "analytics": true
        },
        "display": {
            "currency": "GBP",
            "dateFormat": "DD/MM/YYYY",
            "timezone": "Europe/London"
        }
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('authentication', 'authorization', 'data_access', 'data_modification', 'system', 'security')),
    outcome VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'failure', 'error')),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_outcome ON audit_logs(outcome);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint if auth.users table exists
-- This would be added if using Supabase auth
-- ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_auth_user 
--     FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for audit logs
ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_user_profiles 
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Insert default admin user (for development)
INSERT INTO user_profiles (
    id,
    email,
    name,
    role,
    tier,
    preferences
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@bmvfinder.com',
    'System Administrator',
    '{
        "id": "admin",
        "name": "Administrator",
        "description": "Full system access and management capabilities",
        "permissions": [
            {"id": "user:read", "name": "Read Users", "resource": "users", "action": "read", "description": "View user information"},
            {"id": "user:write", "name": "Manage Users", "resource": "users", "action": "write", "description": "Create, update, delete users"},
            {"id": "system:admin", "name": "System Administration", "resource": "system", "action": "admin", "description": "Full system administration"},
            {"id": "data:export", "name": "Export Data", "resource": "data", "action": "export", "description": "Export system data"},
            {"id": "analytics:admin", "name": "Analytics Admin", "resource": "analytics", "action": "admin", "description": "Access to all analytics"}
        ]
    }',
    'admin',
    '{
        "theme": "system",
        "notifications": {
            "email": true,
            "push": true,
            "sms": false,
            "marketing": false
        },
        "privacy": {
            "profileVisibility": "private",
            "dataSharing": false,
            "analytics": true
        },
        "display": {
            "currency": "GBP",
            "dateFormat": "DD/MM/YYYY",
            "timezone": "Europe/London"
        }
    }'
) ON CONFLICT (id) DO NOTHING;
