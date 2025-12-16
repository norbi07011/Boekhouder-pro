-- =====================================================
-- SUPABASE STORAGE POLICIES
-- Run this in Supabase SQL Editor after creating buckets
-- =====================================================

-- First, create buckets in Supabase Dashboard → Storage:
-- 1. avatars (public)
-- 2. documents (private)
-- 3. task-attachments (private)
-- 4. chat-attachments (private)

-- =====================================================
-- AVATARS BUCKET (PUBLIC)
-- =====================================================

-- Allow public read access to avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- DOCUMENTS BUCKET (PRIVATE - ORG BASED)
-- =====================================================

-- Allow org members to read documents
CREATE POLICY "Org members can read documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM profiles WHERE id = auth.uid()
    )
);

-- Allow org members to upload documents
CREATE POLICY "Org members can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM profiles WHERE id = auth.uid()
    )
);

-- Allow org members to delete documents
CREATE POLICY "Org members can delete documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM profiles WHERE id = auth.uid()
    )
);

-- =====================================================
-- TASK ATTACHMENTS BUCKET (PRIVATE - ORG BASED)
-- =====================================================

-- Allow org members to read task attachments
CREATE POLICY "Org members can read task attachments"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM profiles WHERE id = auth.uid()
    )
);

-- Allow org members to upload task attachments
CREATE POLICY "Org members can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'task-attachments'
    AND auth.role() = 'authenticated'
);

-- Allow uploaders to delete their attachments
CREATE POLICY "Users can delete own task attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'task-attachments'
    AND auth.uid()::text = owner
);

-- =====================================================
-- CHAT ATTACHMENTS BUCKET (PRIVATE - ORG BASED)
-- =====================================================

-- Allow org members to read chat attachments
CREATE POLICY "Org members can read chat attachments"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'chat-attachments'
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to upload chat attachments
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'chat-attachments'
    AND auth.role() = 'authenticated'
);

-- Allow users to delete their own chat attachments
CREATE POLICY "Users can delete own chat attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'chat-attachments'
    AND auth.uid()::text = owner
);
