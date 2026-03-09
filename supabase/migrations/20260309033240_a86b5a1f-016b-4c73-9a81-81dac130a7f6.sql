
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Apps table
CREATE TABLE public.apps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Meu App',
  description TEXT,
  logo_url TEXT,
  background_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#FF4B8B',
  welcome_text TEXT NOT NULL DEFAULT 'Seja Bem-Vindo!',
  login_type TEXT NOT NULL DEFAULT 'complete',
  visual_style TEXT NOT NULL DEFAULT 'original',
  show_progress BOOLEAN NOT NULL DEFAULT true,
  support_email TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own apps" ON public.apps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own apps" ON public.apps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own apps" ON public.apps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own apps" ON public.apps FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_apps_updated_at
  BEFORE UPDATE ON public.apps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for app assets
INSERT INTO storage.buckets (id, name, public) VALUES ('app-assets', 'app-assets', true);

CREATE POLICY "Anyone can view app assets" ON storage.objects FOR SELECT USING (bucket_id = 'app-assets');
CREATE POLICY "Authenticated users can upload app assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'app-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own app assets" ON storage.objects FOR UPDATE USING (bucket_id = 'app-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own app assets" ON storage.objects FOR DELETE USING (bucket_id = 'app-assets' AND auth.role() = 'authenticated');
