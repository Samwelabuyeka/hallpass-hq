-- Enable RLS on timetable_audit table
ALTER TABLE public.timetable_audit ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.timetable_audit
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);