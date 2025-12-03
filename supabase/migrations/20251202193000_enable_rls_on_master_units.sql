
-- Enable RLS for master_units
ALTER TABLE public.master_units ENABLE ROW LEVEL SECURITY;

-- Policies for master_units
DROP POLICY IF EXISTS "Users can view units from their university" ON public.master_units;
CREATE POLICY "Users can view units from their university" ON public.master_units
    FOR SELECT
    USING (university_id = (SELECT university_id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage units" ON public.master_units;
CREATE POLICY "Admins can manage units" ON public.master_units
    FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
