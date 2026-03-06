
-- Create a security definer function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create a function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Drop existing problematic policies on user_roles table
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create new policies using the security definer functions
CREATE POLICY "Users can view own roles" 
ON public.user_roles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Update any other table policies that might be causing recursion
-- Example for courses table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    -- Drop existing policies that might cause recursion
    DROP POLICY IF EXISTS "Users can view own courses" ON public.courses;
    DROP POLICY IF EXISTS "Admins can view all courses" ON public.courses;
    
    -- Create new policies using security definer functions
    CREATE POLICY "Users can view own courses" 
    ON public.courses FOR SELECT 
    USING (user_id = auth.uid());
    
    CREATE POLICY "Users can insert own courses" 
    ON public.courses FOR INSERT 
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
