-- Create universities table
CREATE TABLE public.universities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id),
  student_id TEXT,
  full_name TEXT,
  email TEXT,
  semester INTEGER,
  year INTEGER,
  academic_year INTEGER,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create master_units table for all available units
CREATE TABLE public.master_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  unit_code TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  department TEXT,
  semester INTEGER NOT NULL,
  year INTEGER NOT NULL,
  credits INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(university_id, unit_code, semester, year)
);

-- Create master_timetables table for all timetable entries
CREATE TABLE public.master_timetables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  unit_code TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  type TEXT NOT NULL, -- lecture, tutorial, lab, exam
  day TEXT, -- monday, tuesday, etc. (null for exams)
  time_start TIME,
  time_end TIME,
  venue TEXT,
  lecturer TEXT,
  semester INTEGER NOT NULL,
  year INTEGER NOT NULL,
  exam_date DATE, -- for exam entries
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_units table for user enrollments
CREATE TABLE public.student_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  unit_code TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  semester INTEGER NOT NULL,
  year INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, unit_code, semester, year)
);

-- Create class_reps table for class representative assignments
CREATE TABLE public.class_reps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  unit_code TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  semester INTEGER NOT NULL,
  year INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, unit_code, semester, year)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  unit_code TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general', -- general, exam, assignment, announcement
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification_recipients table
CREATE TABLE public.notification_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(notification_id, recipient_id)
);

-- Enable Row Level Security
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for universities (public read)
CREATE POLICY "Universities are viewable by everyone" 
ON public.universities FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage universities" 
ON public.universities FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- RLS Policies for master_units (public read)
CREATE POLICY "Units are viewable by everyone" 
ON public.master_units FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage units" 
ON public.master_units FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- RLS Policies for master_timetables (public read)
CREATE POLICY "Timetables are viewable by everyone" 
ON public.master_timetables FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage timetables" 
ON public.master_timetables FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- RLS Policies for student_units
CREATE POLICY "Users can view their own units" 
ON public.student_units FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own units" 
ON public.student_units FOR ALL 
USING (user_id = auth.uid());

-- RLS Policies for class_reps
CREATE POLICY "Users can view their own class rep assignments" 
ON public.class_reps FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own class rep assignments" 
ON public.class_reps FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Class reps are viewable by students in same university" 
ON public.class_reps FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND university_id = class_reps.university_id
));

-- RLS Policies for notifications
CREATE POLICY "Users can view notifications in their university" 
ON public.notifications FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND university_id = notifications.university_id
));

CREATE POLICY "Class reps can create notifications for their units" 
ON public.notifications FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.class_reps 
  WHERE user_id = auth.uid() 
  AND unit_code = notifications.unit_code 
  AND is_active = true
) OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- RLS Policies for notification_recipients
CREATE POLICY "Users can view their own notification receipts" 
ON public.notification_recipients FOR SELECT 
USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notification receipts" 
ON public.notification_recipients FOR UPDATE 
USING (recipient_id = auth.uid());

CREATE POLICY "System can insert notification receipts" 
ON public.notification_recipients FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_universities_updated_at
  BEFORE UPDATE ON public.universities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_master_units_updated_at
  BEFORE UPDATE ON public.master_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create fuzzy search function for smart course filtering
CREATE OR REPLACE FUNCTION public.search_units_fuzzy(
  search_term TEXT,
  university_id_param UUID,
  semester_param INTEGER,
  year_param INTEGER
)
RETURNS TABLE (
  id UUID,
  unit_code TEXT,
  unit_name TEXT,
  department TEXT,
  semester INTEGER,
  year INTEGER,
  credits INTEGER,
  similarity_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.unit_code,
    u.unit_name,
    u.department,
    u.semester,
    u.year,
    u.credits,
    GREATEST(
      -- Exact code match gets highest score
      CASE WHEN UPPER(u.unit_code) = UPPER(search_term) THEN 1.0
           WHEN UPPER(u.unit_code) LIKE UPPER(search_term) || '%' THEN 0.9
           WHEN UPPER(u.unit_code) LIKE '%' || UPPER(search_term) || '%' THEN 0.7
           ELSE 0.0 END,
      -- Name similarity
      CASE WHEN UPPER(u.unit_name) LIKE '%' || UPPER(search_term) || '%' THEN 0.8
           ELSE 0.0 END,
      -- Department similarity
      CASE WHEN UPPER(u.department) LIKE '%' || UPPER(search_term) || '%' THEN 0.6
           ELSE 0.0 END,
      -- Partial code matches (e.g., CS for computer science)
      CASE WHEN UPPER(u.unit_code) LIKE UPPER(SUBSTRING(search_term, 1, 2)) || '%' THEN 0.5
           ELSE 0.0 END
    ) AS similarity_score
  FROM public.master_units u
  WHERE u.university_id = university_id_param
    AND u.semester = semester_param
    AND u.year = year_param
    AND (
      UPPER(u.unit_code) LIKE '%' || UPPER(search_term) || '%'
      OR UPPER(u.unit_name) LIKE '%' || UPPER(search_term) || '%'
      OR UPPER(u.department) LIKE '%' || UPPER(search_term) || '%'
    )
  ORDER BY similarity_score DESC, u.unit_code ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Insert sample universities
INSERT INTO public.universities (name, code, country, is_active) VALUES
('University of Nairobi', 'UON', 'Kenya', true),
('Kenyatta University', 'KU', 'Kenya', true),
('Makerere University', 'MAK', 'Uganda', true),
('University of Dar es Salaam', 'UDSM', 'Tanzania', true),
('Strathmore University', 'SU', 'Kenya', true);

-- Create first admin user (you'll need to sign up first, then update this)
-- This will be updated after user signs up