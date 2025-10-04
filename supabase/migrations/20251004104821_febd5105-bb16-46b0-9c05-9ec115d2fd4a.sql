-- Add fields to dustbins table for API key and creator tracking
ALTER TABLE public.dustbins 
ADD COLUMN api_key UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN dustbin_code TEXT;

-- Update existing dustbins to use dustbin_id as dustbin_code
UPDATE public.dustbins SET dustbin_code = dustbin_id WHERE dustbin_code IS NULL;

-- Make dustbin_code required and unique
ALTER TABLE public.dustbins 
ALTER COLUMN dustbin_code SET NOT NULL,
ADD CONSTRAINT dustbins_dustbin_code_unique UNIQUE (dustbin_code);

-- Create function to get latest dustbin status from readings
CREATE OR REPLACE FUNCTION get_dustbin_status(bin_id UUID)
RETURNS NUMERIC AS $$
  SELECT fill_percentage
  FROM readings
  WHERE dustbin_id = bin_id
  ORDER BY created_at DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Insert default institution if not exists
INSERT INTO public.institutions (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Institution')
ON CONFLICT (id) DO NOTHING;

-- Note: Default users must be created via signup
-- After signup, run these to assign roles:
-- For superuser (email: super@gmail.com):
-- INSERT INTO user_roles (user_id, role) VALUES ('<user_id>', 'superuser');
-- For admin (email: admin@gmail.com):  
-- INSERT INTO user_roles (user_id, role) VALUES ('<user_id>', 'admin');
-- For user (email: user@gmail.com):
-- INSERT INTO user_roles (user_id, role) VALUES ('<user_id>', 'user');