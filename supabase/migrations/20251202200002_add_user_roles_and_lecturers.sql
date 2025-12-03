DROP TABLE IF EXISTS public.lecturer_courses CASCADE;

-- First, create a user_role type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('student', 'lecturer', 'admin');
    END IF;
END$$;

-- Add a 'role' column to the profiles table to differentiate users
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'student';

-- Create a table to link lecturers to the courses they teach
CREATE TABLE public.lecturer_courses (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lecturer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(lecturer_user_id, course_id)
);

ALTER TABLE public.lecturer_courses ENABLE ROW LEVEL SECURITY;

-- Define policies for who can see and manage lecturer-course links
CREATE POLICY "Lecturers can see their own course links" ON public.lecturer_courses
    FOR SELECT USING (auth.uid() = lecturer_user_id);

CREATE POLICY "Admins can manage all lecturer course links" ON public.lecturer_courses
    FOR ALL USING ((EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )));

-- Update the class representative application policy to ensure only students can apply
DROP POLICY IF EXISTS "Users can insert their own applications" ON public.class_rep_applications;
DROP POLICY IF EXISTS "Students can insert their own applications" ON public.class_rep_applications;

CREATE POLICY "Students can insert their own applications" ON public.class_rep_applications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'student'
  );
