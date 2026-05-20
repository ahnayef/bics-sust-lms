-- ============================================================
-- SUST LMS — RLS Fix & Security Hardening (V2)
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- 1. Enable RLS on ALL tables (this removes the "unrestricted" warning)
ALTER TABLE public.thanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

-- 2. Clean up existing policies to avoid conflicts
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. Optimized Role Helper (Security Definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- 4. Policies for Thanas & Ranks (Public read, Mod/Admin write)
CREATE POLICY "Ranks viewable by everyone" ON public.ranks FOR SELECT USING (true);
CREATE POLICY "Thanas viewable by everyone" ON public.thanas FOR SELECT USING (true);

CREATE POLICY "Admins manage ranks" ON public.ranks FOR ALL 
USING (public.get_my_role() = 'admin');

CREATE POLICY "Mods and admins manage thanas" ON public.thanas FOR ALL 
USING (public.get_my_role() IN ('admin', 'moderator'));

-- 5. Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins and mods can update any profile" 
ON public.profiles FOR UPDATE 
USING (public.get_my_role() IN ('admin', 'moderator'));

CREATE POLICY "Admins and mods can manage all profiles" 
ON public.profiles FOR ALL 
USING (public.get_my_role() IN ('admin', 'moderator'));

-- 6. Policies for Books & Copies
CREATE POLICY "Books viewable by authenticated" ON public.books FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Copies viewable by authenticated" ON public.copies FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Mods and admins manage books" ON public.books FOR ALL 
USING (public.get_my_role() IN ('admin', 'moderator'));

CREATE POLICY "Mods and admins manage copies" ON public.copies FOR ALL 
USING (public.get_my_role() IN ('admin', 'moderator'));

-- 7. Policies for Transactions
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT 
USING (auth.uid() = user_id OR public.get_my_role() IN ('admin', 'moderator'));

CREATE POLICY "Users create own borrow requests" ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id AND type = 'borrow');

CREATE POLICY "Mods and admins manage all transactions" ON public.transactions FOR ALL 
USING (public.get_my_role() IN ('admin', 'moderator'));

-- 8. Policies for PDF Submissions
CREATE POLICY "Users view own submissions" ON public.pdf_submissions FOR SELECT 
USING (auth.uid() = user_id OR public.get_my_role() IN ('admin', 'moderator'));

CREATE POLICY "Users create own submissions" ON public.pdf_submissions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mods and admins manage all submissions" ON public.pdf_submissions FOR ALL 
USING (public.get_my_role() IN ('admin', 'moderator'));

-- 9. Policies for Action Logs
CREATE POLICY "Admins and mods view logs" ON public.action_logs FOR SELECT 
USING (public.get_my_role() IN ('admin', 'moderator'));

-- 10. Policies for Settings
CREATE POLICY "Everyone reads settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.settings FOR ALL 
USING (public.get_my_role() = 'admin');
