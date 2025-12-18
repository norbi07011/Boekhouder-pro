-- =====================================================
-- MIGRATION: Fix Authentication & Organization Issues
-- Run this on existing Supabase database to fix:
-- 1. Users without organizations
-- 2. Missing organization_invites table
-- 3. Updated handle_new_user trigger
-- =====================================================

-- Step 1: Create invite_status enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status') THEN
        CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'cancelled', 'expired');
    END IF;
END $$;

-- Step 2: Create organization_invites table if not exists
CREATE TABLE IF NOT EXISTS organization_invites (
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

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_invites_email ON organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_token ON organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_org ON organization_invites(organization_id);

-- Enable RLS
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Org members can view invites" ON organization_invites;
DROP POLICY IF EXISTS "Org admins can create invites" ON organization_invites;
DROP POLICY IF EXISTS "Org admins can update invites" ON organization_invites;

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

-- Step 3: Fix existing users without organization
-- Create organizations for users who don't have one
DO $$
DECLARE
    orphan_profile RECORD;
    new_org_id UUID;
BEGIN
    FOR orphan_profile IN 
        SELECT id, name, email FROM profiles WHERE organization_id IS NULL
    LOOP
        -- Create a new organization for each orphan user
        INSERT INTO organizations (name, slug)
        VALUES (
            orphan_profile.name || '''s Organization',
            LOWER(REPLACE(COALESCE(orphan_profile.name, 'user'), ' ', '-')) || '-' || SUBSTR(orphan_profile.id::text, 1, 8)
        )
        RETURNING id INTO new_org_id;
        
        -- Update the profile with the new organization
        UPDATE profiles 
        SET organization_id = new_org_id, role = 'Admin'
        WHERE id = orphan_profile.id;
        
        RAISE NOTICE 'Created organization % for user %', new_org_id, orphan_profile.email;
    END LOOP;
END $$;

-- Step 4: Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
CREATE POLICY "Users can view profiles in their organization" ON profiles
    FOR SELECT USING (
        id = auth.uid() 
        OR organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid() AND organization_id IS NOT NULL
        )
    );

-- Step 5: Add organization policies
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;
CREATE POLICY "Admins can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Step 6: Update handle_new_user function
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

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 7: Create accept_organization_invite RPC function
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

-- Done!
SELECT 'Migration completed successfully! All orphan users now have organizations.' as result;
