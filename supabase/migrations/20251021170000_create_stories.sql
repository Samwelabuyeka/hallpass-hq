
-- Create stories table
CREATE TABLE public.stories (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_url text NOT NULL,
    story_type text NOT NULL DEFAULT 'image', -- 'image' or 'video'
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + '1 day'::interval)
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Function to check if a user is in the same university
CREATE OR REPLACE FUNCTION public.is_in_same_university(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
    current_user_university_id uuid;
    target_user_university_id uuid;
BEGIN
    -- Get the university_id of the current user
    SELECT university_id INTO current_user_university_id FROM public.profiles WHERE user_id = auth.uid();

    -- Get the university_id of the user who created the story
    SELECT university_id INTO target_user_university_id FROM public.profiles WHERE user_id = p_user_id;

    -- Return true if they are in the same university
    RETURN current_user_university_id = target_user_university_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for stories
-- Users can create stories
CREATE POLICY "Users can create their own stories" ON public.stories
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can see stories from people in the same university that have not expired
CREATE POLICY "Users can view stories from their university" ON public.stories
    FOR SELECT USING (
        public.is_in_same_university(user_id) AND expires_at > now()
    );

-- Users can delete their own stories
CREATE POLICY "Users can delete their own stories" ON public.stories
    FOR DELETE USING (user_id = auth.uid());

-- Add storage bucket for story media
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Story media is publicly accessible" ON storage.objects
    FOR SELECT USING ( bucket_id = 'stories' );

CREATE POLICY "Users can upload to stories bucket" ON storage.objects
    FOR INSERT WITH CHECK ( bucket_id = 'stories' AND owner = auth.uid() );
