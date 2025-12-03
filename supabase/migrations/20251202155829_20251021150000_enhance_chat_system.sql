
-- Create a new type for different kinds of chats
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_type') THEN
        CREATE TYPE public.chat_type AS ENUM ('direct', 'group', 'course_channel');
    END IF;
END$$;

-- Add new columns to the chats table to support enhanced functionality
ALTER TABLE public.chats
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS type public.chat_type NOT NULL DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add an index for faster lookups on course-related chats
CREATE INDEX IF NOT EXISTS idx_chats_on_course_id ON public.chats(course_id);

-- Update RLS policies for the chats table
-- Users should only be able to see chats they are a part of.
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
CREATE POLICY "Users can access chats they are a part of" ON public.chats
    FOR SELECT USING (
        id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid())
    );

-- Users can create new chats
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
CREATE POLICY "Users can create chats" ON public.chats
    FOR INSERT WITH CHECK (created_by = auth.uid());


-- Update RLS policies for chat_participants
-- A user can add another user to a chat if they are already in it (for group chats)
-- Or if they are creating a new chat.
DROP POLICY IF EXISTS "Users can insert chat participants" ON public.chat_participants;
CREATE POLICY "Users can manage participants in their chats" ON public.chat_participants
    FOR ALL USING (
        chat_id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid())
    );
