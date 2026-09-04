-- ============================================================================
-- Quick Fix: Resolve Infinite Recursion in Profiles RLS Policies (Error 42P17)
-- Run this in your Supabase Dashboard > SQL Editor:
-- ============================================================================

-- 1. Create a Security Definer function that checks admin role safely
-- (Bypasses RLS within function execution to prevent recursive evaluation)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- 2. Drop existing recursive policies
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage plans" ON plans;
DROP POLICY IF EXISTS "Admins can view and manage all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all devices" ON devices;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

-- 3. Re-create admin policies using the safe is_admin() function
CREATE POLICY "Admins have full access to profiles" 
    ON profiles FOR ALL 
    USING (public.is_admin());

CREATE POLICY "Admins can manage plans" 
    ON plans FOR ALL 
    USING (public.is_admin());

CREATE POLICY "Admins can view and manage all subscriptions" 
    ON subscriptions FOR ALL 
    USING (public.is_admin());

CREATE POLICY "Admins can view all devices" 
    ON devices FOR ALL 
    USING (public.is_admin());

CREATE POLICY "Admins can view all payments" 
    ON payments FOR ALL 
    USING (public.is_admin());
