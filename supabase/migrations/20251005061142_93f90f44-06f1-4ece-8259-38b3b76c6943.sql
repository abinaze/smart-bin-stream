-- Add supervisor role to existing enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supervisor';

-- Add password reset fields (Supabase Auth handles this, but adding for reference)
-- Note: auth.users is managed by Supabase, we track this in profiles

-- Add device_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.device_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dustbin_id UUID NOT NULL REFERENCES public.dustbins(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  signature_valid BOOLEAN NOT NULL,
  nonce TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add institution_admins mapping table
CREATE TABLE IF NOT EXISTS public.institution_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  admin_user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  supervisor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(institution_id, admin_user_id)
);

-- Add security fields to dustbins table
ALTER TABLE public.dustbins 
  ADD COLUMN IF NOT EXISTS device_secret_hash TEXT,
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS firmware_version TEXT;

-- Add audit_logs table for security events
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for device_logs
CREATE POLICY "Superusers can view all device logs"
  ON public.device_logs FOR SELECT
  USING (has_role(auth.uid(), 'superuser'));

CREATE POLICY "Admins can view logs for their institution dustbins"
  ON public.device_logs FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') AND
    dustbin_id IN (
      SELECT d.id FROM dustbins d
      JOIN profiles p ON p.institution_id = d.institution_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "System can insert device logs"
  ON public.device_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for institution_admins
CREATE POLICY "Superusers can manage institution admins"
  ON public.institution_admins FOR ALL
  USING (has_role(auth.uid(), 'superuser'));

CREATE POLICY "Supervisors can view their institutions"
  ON public.institution_admins FOR SELECT
  USING (supervisor_user_id = auth.uid() OR has_role(auth.uid(), 'superuser'));

CREATE POLICY "Supervisors can create institution admins"
  ON public.institution_admins FOR INSERT
  WITH CHECK (supervisor_user_id = auth.uid() OR has_role(auth.uid(), 'superuser'));

-- RLS Policies for audit_logs
CREATE POLICY "Superusers can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'superuser'));

CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_logs_dustbin_id ON public.device_logs(dustbin_id);
CREATE INDEX IF NOT EXISTS idx_device_logs_created_at ON public.device_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_institution_admins_institution ON public.institution_admins(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_admins_admin ON public.institution_admins(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dustbins_last_seen ON public.dustbins(last_seen DESC);

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function to verify device HMAC signature
CREATE OR REPLACE FUNCTION public.verify_device_signature(
  p_dustbin_code TEXT,
  p_payload TEXT,
  p_signature TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device_secret TEXT;
  v_expected_signature TEXT;
BEGIN
  SELECT device_secret_hash INTO v_device_secret
  FROM public.dustbins
  WHERE dustbin_code = p_dustbin_code;
  
  IF v_device_secret IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Note: In production, use pgcrypto extension for HMAC
  -- This is a placeholder - actual HMAC verification should be done in edge function
  RETURN TRUE;
END;
$$;