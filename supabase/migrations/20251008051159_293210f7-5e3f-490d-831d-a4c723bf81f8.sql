-- Fix critical security issue: Restrict dustbin access to prevent cross-institution credential exposure
-- Drop the overly permissive policy that allows all authenticated users to view all dustbins
DROP POLICY IF EXISTS "All authenticated users can view dustbins" ON public.dustbins;

-- Add restricted SELECT policy: Users can only view dustbins from their own institution
CREATE POLICY "Users can view their institution's dustbins"
ON public.dustbins
FOR SELECT
TO authenticated
USING (
  institution_id IN (
    SELECT institution_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Note: Admins and Superusers already have appropriate access through their existing ALL policies:
-- - "Admins can manage their institution dustbins" (ALL command for their institution)
-- - "Superusers can manage all dustbins" (ALL command for everything)