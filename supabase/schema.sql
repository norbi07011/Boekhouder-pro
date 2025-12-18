-- =====================================================
-- BOEKHOUDER CONNECT - SUPABASE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('Accountant', 'Manager', 'Admin');
CREATE TYPE user_status AS ENUM ('Online', 'Offline', 'Busy');
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');
CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE task_category AS ENUM ('General', 'Tax', 'Payroll', 'Meeting', 'Audit', 'Advisory');
CREATE TYPE channel_type AS ENUM ('group', 'dm');
CREATE TYPE attachment_type AS ENUM ('image', 'file', 'voice', 'gif', 'sticker');
CREATE TYPE document_category AS ENUM ('invoice', 'receipt', 'tax_form', 'contract', 'report', 'other');
CREATE TYPE notification_type AS ENUM ('task_assigned', 'task_due', 'message', 'document', 'system');
CREATE TYPE app_language AS ENUM ('PL', 'TR', 'NL');

-- =====================================================
-- ORGANIZATIONS (Multi-tenancy)
-- =====================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    kvk_number VARCHAR(20),  -- Dutch Chamber of Commerce number
    btw_number VARCHAR(20),  -- VAT number
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROFILES (extends Supabase auth.users)
-- =====================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role user_role DEFAULT 'Accountant',
    phone VARCHAR(50),
    website VARCHAR(255),
    location VARCHAR(255),
    bio TEXT,
    status user_status DEFAULT 'Offline',
    linkedin VARCHAR(255),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CLIENTS (Accounting clients/companies)
-- =====================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    kvk_number VARCHAR(20),
    btw_number VARCHAR(20),
    address TEXT,
    contact_person VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_org ON clients(organization_id);
CREATE INDEX idx_clients_active ON clients(organization_id, is_active);

-- =====================================================
-- TASKS
-- =====================================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    due_date DATE,
    due_time TIME,
    status task_status DEFAULT 'TODO',
    priority task_priority DEFAULT 'Medium',
    category task_category DEFAULT 'General',
    estimated_hours DECIMAL(5,2),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_org ON tasks(organization_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(organization_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_client ON tasks(client_id);

-- =====================================================
-- TASK ATTACHMENTS
-- =====================================================

CREATE TABLE task_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    type attachment_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_attachments_task ON task_attachments(task_id);

-- =====================================================
-- TASK TEMPLATES
-- =====================================================

CREATE TABLE task_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description_pl TEXT,
    description_tr TEXT,
    description_nl TEXT,
    color VARCHAR(100) DEFAULT 'bg-blue-100 text-blue-700 border-blue-200',
    priority task_priority DEFAULT 'Medium',
    category task_category DEFAULT 'General',
    is_system BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_templates_org ON task_templates(organization_id);

-- =====================================================
-- CHAT CHANNELS
-- =====================================================

CREATE TABLE chat_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type channel_type DEFAULT 'group',
    color VARCHAR(50),
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_channels_org ON chat_channels(organization_id);

-- =====================================================
-- CHAT CHANNEL MEMBERS
-- =====================================================

CREATE TABLE chat_channel_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, user_id)
);

CREATE INDEX idx_channel_members_channel ON chat_channel_members(channel_id);
CREATE INDEX idx_channel_members_user ON chat_channel_members(user_id);

-- =====================================================
-- CHAT MESSAGES
-- =====================================================

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    text TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(channel_id, created_at DESC);

-- =====================================================
-- CHAT MESSAGE ATTACHMENTS
-- =====================================================

CREATE TABLE chat_message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    type attachment_type NOT NULL,
    name VARCHAR(255),
    file_path TEXT NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_attachments_message ON chat_message_attachments(message_id);

-- =====================================================
-- DOCUMENTS
-- =====================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    category document_category DEFAULT 'other',
    year INTEGER,
    quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4),
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_documents_category ON documents(organization_id, category);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(user_id, created_at DESC);

-- =====================================================
-- USER SETTINGS
-- =====================================================

CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    language app_language DEFAULT 'NL',
    dark_mode BOOLEAN DEFAULT FALSE,
    compact_mode BOOLEAN DEFAULT FALSE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    default_currency VARCHAR(3) DEFAULT 'EUR',
    fiscal_year_end VARCHAR(5) DEFAULT '12-31',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOG
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);

-- =====================================================
-- DUTCH TAX DEADLINES (Static reference table)
-- =====================================================

CREATE TABLE dutch_tax_deadlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    description_pl TEXT NOT NULL,
    description_tr TEXT NOT NULL,
    description_nl TEXT NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Dutch tax deadlines
INSERT INTO dutch_tax_deadlines (date, description_pl, description_tr, description_nl) VALUES
('2025-01-31', 'Roczna deklaracja IB za poprzedni rok', 'Önceki yıl için yıllık IB beyannamesi', 'Jaarlijkse IB-aangifte vorig jaar'),
('2025-04-01', 'Deklaracja BTW Q1', 'Q1 KDV beyannamesi', 'BTW-aangifte Q1'),
('2025-05-01', 'Termin rozliczenia rocznego podatku dochodowego', 'Yıllık gelir vergisi beyannamesi son tarihi', 'Deadline jaarlijkse inkomstenbelasting'),
('2025-07-01', 'Deklaracja BTW Q2', 'Q2 KDV beyannamesi', 'BTW-aangifte Q2'),
('2025-07-31', 'Loonheffingen - półroczne rozliczenie', 'Loonheffingen - yarı yıllık uzlaşma', 'Loonheffingen - halfjaarlijkse afrekening'),
('2025-10-01', 'Deklaracja BTW Q3', 'Q3 KDV beyannamesi', 'BTW-aangifte Q3'),
('2026-01-01', 'Deklaracja BTW Q4', 'Q4 KDV beyannamesi', 'BTW-aangifte Q4');

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Profiles: Users can read all profiles in their org, update their own
-- Also allow users to read their own profile even without org
CREATE POLICY "Users can view profiles in their organization" ON profiles
    FOR SELECT USING (
        id = auth.uid() 
        OR organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid() AND organization_id IS NOT NULL
        )
    );

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Organizations: Members can read their org, users can create new orgs
CREATE POLICY "Members can view their organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Clients: Organization members can CRUD
CREATE POLICY "Org members can view clients" ON clients
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Org members can insert clients" ON clients
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Org members can update clients" ON clients
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Org members can delete clients" ON clients
    FOR DELETE USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Tasks: Organization members can CRUD
CREATE POLICY "Org members can view tasks" ON tasks
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Org members can insert tasks" ON tasks
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Org members can update tasks" ON tasks
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Org members can delete tasks" ON tasks
    FOR DELETE USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Task Attachments: Based on task access
CREATE POLICY "Users can view task attachments" ON task_attachments
    FOR SELECT USING (
        task_id IN (
            SELECT id FROM tasks WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert task attachments" ON task_attachments
    FOR INSERT WITH CHECK (
        task_id IN (
            SELECT id FROM tasks WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete task attachments" ON task_attachments
    FOR DELETE USING (uploaded_by = auth.uid());

-- Documents: Organization members can CRUD
CREATE POLICY "Org members can view documents" ON documents
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Org members can insert documents" ON documents
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Org members can update documents" ON documents
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Org members can delete documents" ON documents
    FOR DELETE USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Chat Channels: Org members can access
CREATE POLICY "Org members can view channels" ON chat_channels
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Org members can create channels" ON chat_channels
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Chat Messages: Channel members can access
CREATE POLICY "Channel members can view messages" ON chat_messages
    FOR SELECT USING (
        channel_id IN (
            SELECT id FROM chat_channels WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert messages" ON chat_messages
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own messages" ON chat_messages
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own messages" ON chat_messages
    FOR DELETE USING (user_id = auth.uid());

-- Notifications: Users can only access their own
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- User Settings: Users can only access their own
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ORGANIZATION INVITES (for team invitations)
-- =====================================================

CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'cancelled', 'expired');

CREATE TABLE organization_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    invited_by UUID NOT NULL REFERENCES profiles(id),
    role user_role DEFAULT 'Accountant',
    token UUID DEFAULT uuid_generate_v4(),
    status invite_status DEFAULT 'pending',
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(organization_id, email)
);

CREATE INDEX idx_invites_email ON organization_invites(email);
CREATE INDEX idx_invites_token ON organization_invites(token);
CREATE INDEX idx_invites_org ON organization_invites(organization_id);

-- RLS for invites
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view invites" ON organization_invites
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Org admins can create invites" ON organization_invites
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Org admins can update invites" ON organization_invites
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- =====================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    pending_invite organization_invites%ROWTYPE;
    user_name TEXT;
BEGIN
    -- Get user name from metadata or email
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    
    -- Check if there's a pending invite for this email
    SELECT * INTO pending_invite 
    FROM organization_invites 
    WHERE email = LOWER(NEW.email) 
      AND status = 'pending' 
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF pending_invite.id IS NOT NULL THEN
        -- User was invited - join existing organization
        INSERT INTO public.profiles (id, email, name, avatar_url, role, organization_id)
        VALUES (
            NEW.id,
            NEW.email,
            user_name,
            NEW.raw_user_meta_data->>'avatar_url',
            pending_invite.role,
            pending_invite.organization_id
        );
        
        -- Mark invite as accepted
        UPDATE organization_invites 
        SET status = 'accepted', accepted_at = NOW() 
        WHERE id = pending_invite.id;
    ELSE
        -- New user without invite - create personal organization
        INSERT INTO organizations (name, slug)
        VALUES (
            user_name || '''s Organization',
            LOWER(REPLACE(user_name, ' ', '-')) || '-' || SUBSTR(NEW.id::text, 1, 8)
        )
        RETURNING id INTO new_org_id;
        
        -- Create profile with new organization
        INSERT INTO public.profiles (id, email, name, avatar_url, role, organization_id)
        VALUES (
            NEW.id,
            NEW.email,
            user_name,
            NEW.raw_user_meta_data->>'avatar_url',
            'Admin',  -- First user is admin of their own org
            new_org_id
        );
    END IF;
    
    -- Create default settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ACCEPT INVITE FUNCTION (RPC)
-- =====================================================

CREATE OR REPLACE FUNCTION accept_organization_invite(invite_token UUID)
RETURNS JSONB AS $$
DECLARE
    invite_record organization_invites%ROWTYPE;
    current_profile profiles%ROWTYPE;
BEGIN
    -- Get the invite
    SELECT * INTO invite_record 
    FROM organization_invites 
    WHERE token = invite_token 
      AND status = 'pending' 
      AND expires_at > NOW();
    
    IF invite_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
    END IF;
    
    -- Get current user's profile
    SELECT * INTO current_profile FROM profiles WHERE id = auth.uid();
    
    IF current_profile.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
    END IF;
    
    -- Check if emails match
    IF LOWER(current_profile.email) != LOWER(invite_record.email) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invite is for a different email address');
    END IF;
    
    -- Update user's organization
    UPDATE profiles 
    SET organization_id = invite_record.organization_id, 
        role = invite_record.role,
        updated_at = NOW()
    WHERE id = auth.uid();
    
    -- Mark invite as accepted
    UPDATE organization_invites 
    SET status = 'accepted', accepted_at = NOW() 
    WHERE id = invite_record.id;
    
    RETURN jsonb_build_object(
        'success', true, 
        'organization_id', invite_record.organization_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- =====================================================
-- STORAGE BUCKETS (run separately in Supabase Dashboard)
-- =====================================================

-- Create these buckets in Supabase Dashboard → Storage:
-- 1. avatars (public)
-- 2. documents (private)
-- 3. task-attachments (private)
-- 4. chat-attachments (private)

-- Example storage policies (apply in Dashboard):
/*
-- Avatars bucket (public read, authenticated write)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Documents bucket (org-based access)
CREATE POLICY "Org members can access documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND
        auth.uid() IN (
            SELECT id FROM profiles WHERE organization_id::text = (storage.foldername(name))[1]
        )
    );
*/
