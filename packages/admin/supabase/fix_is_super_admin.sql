CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS boolean AS $func$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin');
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;
