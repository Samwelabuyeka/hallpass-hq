-- Fix infinite recursion in profiles RLS policy
-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a simpler policy without recursion
-- Admins should use service role key for admin operations
-- Regular users can only see their own profile
CREATE POLICY "Users can view their own profile only"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());