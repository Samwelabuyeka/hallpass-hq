DROP TABLE IF EXISTS public.course_unit_set_units CASCADE;
DROP TABLE IF EXISTS public.course_unit_sets CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;

-- Create courses table to store course names
CREATE TABLE public.courses (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT courses_university_id_name_key UNIQUE (university_id, name)
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_admin = true)))));

-- Create course_unit_sets table
-- This table stores a specific set of units for a course, combination, year, and semester.
CREATE TABLE public.course_unit_sets (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    combination text, -- e.g., 'Math/Physics' for Education students
    year integer NOT NULL,
    semester integer NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- The user who first defined this set
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT course_unit_sets_course_id_combination_year_semester_key UNIQUE (course_id, combination, year, semester)
);
ALTER TABLE public.course_unit_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view unit sets" ON public.course_unit_sets FOR SELECT USING (true);
CREATE POLICY "Admins or creator can manage unit sets" ON public.course_unit_sets FOR ALL USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE (((profiles.user_id = auth.uid()) AND (profiles.is_admin = true)) OR (created_by = auth.uid())))));

-- Create course_unit_set_units table
-- This links a unit set to the master units table.
CREATE TABLE public.course_unit_set_units (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_set_id uuid NOT NULL REFERENCES public.course_unit_sets(id) ON DELETE CASCADE,
    unit_code text NOT NULL, -- Changed from master_units reference to allow flexibility
    unit_name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (unit_set_id, unit_code)
);
ALTER TABLE public.course_unit_set_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view units in a set" ON public.course_unit_set_units FOR SELECT USING (true);
CREATE POLICY "Admins or creator can manage units in a set" ON public.course_unit_set_units FOR ALL USING ((EXISTS ( SELECT 1
   FROM public.course_unit_sets cs
   JOIN public.profiles p ON cs.created_by = p.user_id
  WHERE ((cs.id = course_unit_set_units.unit_set_id) AND ((p.is_admin = true) OR (cs.created_by = auth.uid()))))));