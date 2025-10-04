-- Fix security warning: Set search_path for get_dustbin_status function
CREATE OR REPLACE FUNCTION get_dustbin_status(bin_id UUID)
RETURNS NUMERIC 
LANGUAGE SQL 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fill_percentage
  FROM readings
  WHERE dustbin_id = bin_id
  ORDER BY created_at DESC
  LIMIT 1;
$$;