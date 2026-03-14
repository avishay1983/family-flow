
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_display_name text;
BEGIN
  user_display_name := COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, user_display_name);

  -- Create 3 default workspaces for new users
  INSERT INTO public.workspaces (name, icon, color, members) VALUES
    ('משפחה', '🏠', '#6366f1', ARRAY[user_display_name]),
    ('עבודה', '💼', '#f59e0b', ARRAY[user_display_name]),
    ('אישי', '👤', '#10b981', ARRAY[user_display_name]);

  RETURN NEW;
END;
$$;
