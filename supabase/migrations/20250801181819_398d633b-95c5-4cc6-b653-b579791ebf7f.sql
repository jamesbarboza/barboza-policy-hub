-- Fix security issues - update functions with search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create a function to search users by email
-- This function allows admins to search for users by email address
CREATE OR REPLACE FUNCTION public.search_user_by_email(search_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    au.id as user_id,
    au.email,
    p.full_name,
    p.phone,
    p.address,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.user_id
  WHERE au.email ILIKE '%' || search_email || '%'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_user_by_email(TEXT) TO authenticated;

-- Create a users view that combines auth.users with profiles
CREATE OR REPLACE VIEW public.users AS
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.updated_at,
  p.full_name,
  p.phone,
  p.address,
  p.date_of_birth,
  ur.role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
LEFT JOIN public.user_roles ur ON au.id = ur.user_id;

-- Grant select permission on the users view to authenticated users
GRANT SELECT ON public.users TO authenticated;

-- Create RLS policy for the users view (only admins can view)
CREATE POLICY "Admins can view users" ON public.users
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create a policy to allow admins to use this function
CREATE POLICY "Admins can search users by email"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));