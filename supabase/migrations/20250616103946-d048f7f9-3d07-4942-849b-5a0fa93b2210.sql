
-- Fix the find_user_by_email function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION public.find_user_by_email(search_email text)
RETURNS TABLE(id uuid, email text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    auth.users.id, 
    auth.users.email, 
    auth.users.created_at
  FROM auth.users
  WHERE auth.users.email = search_email;
END;
$function$
