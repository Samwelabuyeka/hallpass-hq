
-- Create announcements table
CREATE TABLE public.announcements (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lecturer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Lecturers of a course can create announcements for it
CREATE POLICY "Lecturers can create announcements for their courses" ON public.announcements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.lecturer_courses
            WHERE course_id = announcements.course_id AND lecturer_user_id = auth.uid()
        )
    );

-- Policy: Students and lecturers of a course can view announcements
CREATE POLICY "Enrolled users can view announcements" ON public.announcements
    FOR SELECT USING (
        -- Students enrolled in the course
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND course_id = announcements.course_id
        )
        OR
        -- Lecturers of the course
        EXISTS (
            SELECT 1 FROM public.lecturer_courses
            WHERE course_id = announcements.course_id AND lecturer_user_id = auth.uid()
        )
    );

-- Create notifications table for individual user alerts
CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications" ON public.notifications
    FOR ALL USING (user_id = auth.uid());
