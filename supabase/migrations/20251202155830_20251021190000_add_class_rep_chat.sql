
-- Add is_class_rep to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_class_rep boolean DEFAULT false;

-- We should ensure that only one class rep can exist per course.
-- This is a bit tricky with just a boolean. A better approach might be to have a
-- `class_rep_for_course_id` on the profile, but for simplicity, we'll stick to the boolean
-- and assume the application logic will handle the appointment of a single rep.

-- Create a function for a lecturer to initiate a chat with a class rep.
CREATE OR REPLACE FUNCTION public.create_or_get_chat_with_class_rep(p_course_id uuid)
RETURNS uuid AS $$
DECLARE
    rep_user_id uuid;
    chat_id uuid;
    lecturer_user_id uuid;
BEGIN
    -- Get the current user (must be a lecturer)
    SELECT auth.uid() INTO lecturer_user_id;

    -- Find the class rep for the given course
    SELECT user_id INTO rep_user_id
    FROM public.profiles
    WHERE course_id = p_course_id AND is_class_rep = true
    LIMIT 1;

    -- If no class rep is found, raise an error
    IF rep_user_id IS NULL THEN
        RAISE EXCEPTION 'No class representative found for this course.';
    END IF;

    -- Check if a direct chat between the lecturer and the rep already exists
    SELECT c.id INTO chat_id
    FROM public.chats c
    JOIN public.chat_participants cp1 ON c.id = cp1.chat_id
    JOIN public.chat_participants cp2 ON c.id = cp2.chat_id
    WHERE c.type = 'direct'
      AND cp1.user_id = lecturer_user_id
      AND cp2.user_id = rep_user_id;

    -- If chat exists, return its ID
    IF chat_id IS NOT NULL THEN
        RETURN chat_id;
    END IF;

    -- If no chat exists, create a new one
    INSERT INTO public.chats (type, name)
    VALUES ('direct', 'Direct Message')
    RETURNING id INTO chat_id;

    -- Add both lecturer and class rep as participants
    INSERT INTO public.chat_participants (chat_id, user_id)
    VALUES (chat_id, lecturer_user_id), (chat_id, rep_user_id);

    RETURN chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
