
CREATE TABLE public.class_rep_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  email TEXT NOT NULL,
  year_of_study TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  reason_for_applying TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- e.g., pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.class_rep_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications" ON public.class_rep_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" ON public.class_rep_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER on_class_rep_applications_update
  BEFORE UPDATE ON public.class_rep_applications
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
