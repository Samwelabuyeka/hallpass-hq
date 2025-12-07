-- This migration adds the avatar_url column to the profiles table
-- and sets up the necessary storage bucket and policies for avatar uploads.

-- 1. Add avatar_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN avatar_url TEXT;

-- 2. Create 'avatars' storage bucket if it doesn't exist.
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', false
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);


-- 3. RLS Policies for 'avatars' bucket

--    Policy: Allow authenticated users to view all avatars.
CREATE POLICY "Allow authenticated view access to avatars"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'avatars' );

--    Policy: Allow users to upload their own avatar.
CREATE POLICY "Allow users to insert their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );


--    Policy: Allow users to update their own avatar.
CREATE POLICY "Allow users to update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

--    Policy: Allow users to delete their own avatar.
CREATE POLICY "Allow users to delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
