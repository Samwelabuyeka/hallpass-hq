-- Migration: Add Comments, Likes, and Sharing to Stories
-- This migration adds the necessary tables and policies to support
-- commenting, liking, and sharing of stories.

-- 1. Create story_comments table
CREATE TABLE public.story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create story_likes table
CREATE TABLE public.story_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(story_id, user_id) -- A user can only like a story once
);

-- 3. Add like and comment counts to stories table
ALTER TABLE public.stories
ADD COLUMN like_count INT DEFAULT 0 NOT NULL,
ADD COLUMN comment_count INT DEFAULT 0 NOT NULL;

-- 4. RLS Policies for story_comments

--    Policy: Allow authenticated users to view all comments.
CREATE POLICY "Allow authenticated users to view comments"
ON public.story_comments FOR SELECT
TO authenticated
USING ( true );

--    Policy: Allow users to insert their own comments.
CREATE POLICY "Allow users to insert their own comments"
ON public.story_comments FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = user_id );

--    Policy: Allow users to update their own comments.
CREATE POLICY "Allow users to update their own comments"
ON public.story_comments FOR UPDATE
TO authenticated
USING ( auth.uid() = user_id );

--    Policy: Allow users to delete their own comments.
CREATE POLICY "Allow users to delete their own comments"
ON public.story_comments FOR DELETE
TO authenticated
USING ( auth.uid() = user_id );

-- 5. RLS Policies for story_likes

--    Policy: Allow authenticated users to view all likes.
CREATE POLICY "Allow authenticated users to view likes"
ON public.story_likes FOR SELECT
TO authenticated
USING ( true );

--    Policy: Allow users to insert their own likes.
CREATE POLICY "Allow users to insert their own likes"
ON public.story_likes FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = user_id );

--    Policy: Allow users to delete their own likes (unlike).
CREATE POLICY "Allow users to delete their own likes"
ON public.story_likes FOR DELETE
TO authenticated
USING ( auth.uid() = user_id );
