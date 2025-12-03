
-- This migration creates a trigger to invoke the edge function
-- that creates a dedicated chat channel every time a new course is created.

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_course_for_chat_channel()
RETURNS TRIGGER AS $$
BEGIN
    -- Invoke the Deno Edge Function
    PERFORM net.http_post(
        url := 'https://jgmwhxptbifbcpzcnvfe.supabase.co/functions/v1/create-course-channel',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"}',
        body := json_build_object('record', NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on the courses table
DROP TRIGGER IF EXISTS on_course_created_create_channel ON public.courses;
CREATE TRIGGER on_course_created_create_channel
    AFTER INSERT ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_course_for_chat_channel();


-- Also, we need a way to add users to course channels when they enroll.
-- We can create a trigger on `profiles` for this.
CREATE OR REPLACE FUNCTION public.handle_profile_update_for_chat()
RETURNS TRIGGER AS $$
DECLARE
    course_chat_id uuid;
BEGIN
    -- If the user's course_id has changed
    IF (TG_OP = 'UPDATE' AND NEW.course_id IS DISTINCT FROM OLD.course_id) OR 
       (TG_OP = 'INSERT' AND NEW.course_id IS NOT NULL) THEN
        
        -- Find the chat_id for the new course
        SELECT id INTO course_chat_id
        FROM public.chats
        WHERE course_id = NEW.course_id AND type = 'course_channel' LIMIT 1;

        -- If a channel exists, add the user to it
        IF course_chat_id IS NOT NULL THEN
            INSERT INTO public.chat_participants (chat_id, user_id)
            VALUES (course_chat_id, NEW.user_id)
            ON CONFLICT (chat_id, user_id) DO NOTHING;
        END IF;

        -- If they left a course, we might want to remove them from the old one.
        -- For now, we will leave them in the channel to retain history.
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the profiles table
DROP TRIGGER IF EXISTS on_profile_change_add_to_chat ON public.profiles;
CREATE TRIGGER on_profile_change_add_to_chat
    AFTER INSERT OR UPDATE OF course_id ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update_for_chat();
