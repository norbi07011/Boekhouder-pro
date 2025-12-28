-- Migration: Add Push Notifications Support
-- Run this in Supabase SQL Editor

-- =====================================================
-- PUSH SUBSCRIPTIONS TABLE
-- Stores Web Push subscriptions for each user
-- =====================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,  -- Public key for encryption
    auth TEXT NOT NULL,     -- Auth secret
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- =====================================================
-- RLS POLICIES FOR PUSH SUBSCRIPTIONS
-- =====================================================

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own subscriptions
CREATE POLICY "push_subscriptions_select_own" ON push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_insert_own" ON push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_update_own" ON push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete_own" ON push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTION: Send Push Notification via Edge Function
-- This function will be called by triggers
-- =====================================================

CREATE OR REPLACE FUNCTION notify_push_on_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Call Edge Function to send push notification
    -- The Edge Function will handle the actual Web Push
    PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'user_id', NEW.user_id,
            'title', NEW.title,
            'body', COALESCE(NEW.body, ''),
            'type', NEW.type,
            'link', COALESCE(NEW.link, '/'),
            'notification_id', NEW.id
        )
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the insert if push fails
        RAISE WARNING 'Push notification failed: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Auto-send push on new notification
-- =====================================================

DROP TRIGGER IF EXISTS trigger_push_notification ON notifications;

CREATE TRIGGER trigger_push_notification
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION notify_push_on_notification();

-- =====================================================
-- Grant access to service role for Edge Functions
-- =====================================================

GRANT SELECT ON push_subscriptions TO service_role;
GRANT ALL ON push_subscriptions TO authenticated;
