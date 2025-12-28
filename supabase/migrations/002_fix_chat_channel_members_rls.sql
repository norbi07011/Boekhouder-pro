-- =====================================================
-- MIGRATION: Fix Chat Channel Members RLS Policies
-- Problem: Users cannot add other members to channels
-- because INSERT policy restricts user_id = auth.uid()
-- 
-- This causes:
-- 1. New channels have only creator as member
-- 2. Other users can't see the channel
-- 3. Other users can't send/read messages
-- =====================================================

-- Step 1: Drop old restrictive policies on chat_channel_members
DROP POLICY IF EXISTS "chat_channel_members_insert_self" ON chat_channel_members;
DROP POLICY IF EXISTS "chat_channel_members_select_org" ON chat_channel_members;
DROP POLICY IF EXISTS "chat_channel_members_delete_self" ON chat_channel_members;

-- Step 2: Create proper RLS policies for chat_channel_members

-- SELECT: Users can see members of channels in their organization
CREATE POLICY "chat_channel_members_select_org" ON chat_channel_members
    FOR SELECT USING (
        channel_id IN (
            SELECT id FROM chat_channels 
            WHERE organization_id = get_user_organization_id()
        )
    );

-- INSERT: Organization members can add OTHER users to channels in their org
-- This allows channel creators to add all organization members
CREATE POLICY "chat_channel_members_insert_org" ON chat_channel_members
    FOR INSERT WITH CHECK (
        -- Channel must belong to user's organization
        channel_id IN (
            SELECT id FROM chat_channels 
            WHERE organization_id = get_user_organization_id()
        )
        AND
        -- User being added must be in the same organization
        user_id IN (
            SELECT id FROM profiles 
            WHERE organization_id = get_user_organization_id()
        )
    );

-- UPDATE: Users can update their own membership records
CREATE POLICY "chat_channel_members_update_own" ON chat_channel_members
    FOR UPDATE USING (user_id = auth.uid());

-- DELETE: Users can remove themselves, or admins/channel creators can remove others
CREATE POLICY "chat_channel_members_delete" ON chat_channel_members
    FOR DELETE USING (
        -- User can remove themselves
        user_id = auth.uid()
        OR
        -- Admin can remove anyone in their org
        is_user_admin()
        OR
        -- Channel creator can remove members
        channel_id IN (
            SELECT id FROM chat_channels 
            WHERE created_by = auth.uid()
        )
    );

-- Step 3: Fix potential orphaned channels - add all org members to existing channels
-- This repairs channels that were created but members couldn't be added

DO $$
DECLARE
    channel_record RECORD;
    org_member RECORD;
BEGIN
    -- For each channel
    FOR channel_record IN 
        SELECT id, organization_id, name FROM chat_channels WHERE type = 'group'
    LOOP
        -- For each member in the channel's organization
        FOR org_member IN 
            SELECT id FROM profiles WHERE organization_id = channel_record.organization_id
        LOOP
            -- Add them if not already a member (ignore conflicts)
            INSERT INTO chat_channel_members (channel_id, user_id)
            VALUES (channel_record.id, org_member.id)
            ON CONFLICT (channel_id, user_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Fixed channel: %', channel_record.name;
    END LOOP;
END $$;

-- Step 4: Ensure realtime is enabled for chat_channel_members
ALTER PUBLICATION supabase_realtime ADD TABLE chat_channel_members;

-- Done!
SELECT 'Migration 002 completed! Chat channel members RLS policies fixed.' as result;
