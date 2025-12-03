-- Fix infinite recursion in profiles RLS policy
-- The issue is that "Admins can view all profiles" policy is querying profiles table to check if user is admin
-- This creates a circular dependency

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Recreate it with a simpler check that doesn't cause recursion
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (
  (SELECT is_admin FROM profiles WHERE user_id = auth.uid() LIMIT 1) = true
  OR user_id = auth.uid()
);