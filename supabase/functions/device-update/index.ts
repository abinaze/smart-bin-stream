import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify HMAC signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  
  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

// Rate limiting store (in-memory for demo - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_MINUTE = 10;

function checkRateLimit(dustbinCode: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(dustbinCode);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(dustbinCode, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  record.count++;
  return true;
}

// Nonce store for replay protection (last 1000 nonces)
const nonceStore = new Set<string>();
const MAX_NONCES = 1000;

function checkNonce(nonce: string): boolean {
  if (nonceStore.has(nonce)) return false;
  
  nonceStore.add(nonce);
  if (nonceStore.size > MAX_NONCES) {
    const firstNonce = nonceStore.values().next().value;
    if (firstNonce) {
      nonceStore.delete(firstNonce);
    }
  }
  
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      dustbin_code, 
      sensor1_value, 
      sensor2_value, 
      timestamp, 
      nonce, 
      signature,
      firmware_version 
    } = await req.json();

    // Validate required fields
    if (!dustbin_code || !timestamp || !nonce || !signature || 
        sensor1_value === undefined || sensor2_value === undefined) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: dustbin_code, timestamp, nonce, signature, sensor1_value, sensor2_value' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    if (!checkRateLimit(dustbin_code)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate timestamp (reject if > 5 minutes old)
    const timestampDate = new Date(timestamp);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - timestampDate.getTime()) / 1000; // seconds
    
    if (timeDiff > 300) { // 5 minutes
      return new Response(
        JSON.stringify({ error: 'Timestamp too old or invalid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check nonce for replay protection
    if (!checkNonce(nonce)) {
      return new Response(
        JSON.stringify({ error: 'Nonce already used - possible replay attack' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get device secret for authentication
    const { data: dustbin, error: dustbinError } = await supabase
      .from('dustbins')
      .select('id, device_secret, api_key')
      .eq('dustbin_code', dustbin_code)
      .single();

    if (dustbinError || !dustbin) {
      console.error('Device not found:', dustbinError);
      return new Response(
        JSON.stringify({ error: 'Device not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify HMAC signature
    const payloadString = JSON.stringify({
      dustbin_code,
      sensor1_value,
      sensor2_value,
      timestamp,
      nonce
    });
    
    const signatureValid = verifySignature(
      payloadString, 
      signature, 
      dustbin.device_secret || dustbin.api_key
    );

    if (!signatureValid) {
      console.error('Invalid signature for dustbin:', dustbin_code);
      
      // Log failed authentication attempt
      await supabase.from('device_logs').insert({
        dustbin_id: dustbin.id,
        payload: { dustbin_code, sensor1_value, sensor2_value, timestamp },
        reported_at: timestampDate,
        signature_valid: false,
        nonce
      });

      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate fill percentage (average of two sensors)
    const avgSensorValue = (parseFloat(sensor1_value) + parseFloat(sensor2_value)) / 2;
    const fill_percentage = Math.min(100, Math.max(0, avgSensorValue));

    // Sanity check: detect suspicious jumps (>50% change in <1 minute)
    const { data: lastReading } = await supabase
      .from('readings')
      .select('fill_percentage, created_at')
      .eq('dustbin_id', dustbin.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let flagForReview = false;
    if (lastReading) {
      const timeSinceLastReading = (now.getTime() - new Date(lastReading.created_at).getTime()) / 1000; // seconds
      const fillDiff = Math.abs(fill_percentage - lastReading.fill_percentage);
      
      if (timeSinceLastReading < 60 && fillDiff > 50) {
        console.warn('Suspicious fill change detected:', { 
          dustbin_code, 
          fillDiff, 
          timeSinceLastReading 
        });
        flagForReview = true;
      }
    }

    // Insert reading
    const { error: insertError } = await supabase.from('readings').insert({
      dustbin_id: dustbin.id,
      fill_percentage,
      sensor1_value: parseFloat(sensor1_value),
      sensor2_value: parseFloat(sensor2_value),
    });

    if (insertError) throw insertError;

    // Log successful device update
    await supabase.from('device_logs').insert({
      dustbin_id: dustbin.id,
      payload: { dustbin_code, sensor1_value, sensor2_value, timestamp, firmware_version },
      reported_at: timestampDate,
      signature_valid: true,
      nonce
    });

    // Update last_seen and firmware_version
    await supabase
      .from('dustbins')
      .update({ 
        last_seen: now.toISOString(),
        firmware_version: firmware_version || null
      })
      .eq('id', dustbin.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        fill_percentage,
        flagged_for_review: flagForReview 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});