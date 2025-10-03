-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('superuser', 'admin', 'user');

-- Create institutions table
CREATE TABLE public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  institution_id UUID REFERENCES public.institutions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create dustbins table
CREATE TABLE public.dustbins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dustbin_id TEXT UNIQUE NOT NULL,
  institution_id UUID REFERENCES public.institutions(id) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create readings table
CREATE TABLE public.readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dustbin_id UUID REFERENCES public.dustbins(id) ON DELETE CASCADE NOT NULL,
  fill_percentage NUMERIC(5,2) NOT NULL CHECK (fill_percentage >= 0 AND fill_percentage <= 100),
  sensor1_value NUMERIC(10,2),
  sensor2_value NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dustbins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for institutions
CREATE POLICY "All authenticated users can view institutions"
ON public.institutions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Superusers can manage institutions"
ON public.institutions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superuser'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Superusers can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superuser'));

CREATE POLICY "Superusers can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superuser'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Superusers can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superuser'));

-- RLS Policies for dustbins
CREATE POLICY "All authenticated users can view dustbins"
ON public.dustbins FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Superusers can manage all dustbins"
ON public.dustbins FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superuser'));

CREATE POLICY "Admins can manage their institution dustbins"
ON public.dustbins FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') AND
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- RLS Policies for readings
CREATE POLICY "All authenticated users can view readings"
ON public.readings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public can insert readings (for IoT devices)"
ON public.readings FOR INSERT
TO anon
WITH CHECK (true);

-- Create trigger for auto-updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_institutions_updated_at
BEFORE UPDATE ON public.institutions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dustbins_updated_at
BEFORE UPDATE ON public.dustbins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Insert default institution
INSERT INTO public.institutions (name) VALUES ('Default Institution');

-- Enable realtime for readings
ALTER PUBLICATION supabase_realtime ADD TABLE public.readings;