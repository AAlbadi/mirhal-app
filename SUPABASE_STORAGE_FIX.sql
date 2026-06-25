-- ==========================================
-- SUPABASE STORAGE FIX FOR MIRHAL
-- Run this in the Supabase SQL Editor
-- ==========================================

-- 1. Create the 'images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts (clean slate)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Owner Updates" ON storage.objects;
DROP POLICY IF EXISTS "Owner Deletes" ON storage.objects;

-- 3. ALLOW PUBLIC READ (Anyone can see images)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT
USING ( bucket_id = 'images' );

-- 4. ALLOW AUTHENTICATED UPLOADS (Any logged-in user can upload)
CREATE POLICY "Authenticated Uploads" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
);

-- 5. ALLOW OWNER UPDATE (User can modify their own files)
CREATE POLICY "Owner Updates" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'images' AND
  auth.uid() = owner
);

-- 6. ALLOW OWNER DELETE (User can delete their own files)
CREATE POLICY "Owner Deletes" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'images' AND
  auth.uid() = owner
);

-- Note: 'reviews', 'trails', and 'spots' are just FOLDERS inside the 'images' bucket.
-- This one script fixes permissions for ALL of them.
