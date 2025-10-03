import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { dustbin_id, sensor1_value, sensor2_value } = await req.json();

    if (!dustbin_id || sensor1_value === undefined || sensor2_value === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate fill percentage (average of two sensors)
    const avgSensorValue = (parseFloat(sensor1_value) + parseFloat(sensor2_value)) / 2;
    const fill_percentage = Math.min(100, Math.max(0, avgSensorValue));

    // Find dustbin by dustbin_id
    const { data: dustbin, error: dustbinError } = await supabase
      .from('dustbins')
      .select('id')
      .eq('dustbin_id', dustbin_id)
      .single();

    if (dustbinError || !dustbin) {
      return new Response(
        JSON.stringify({ error: 'Dustbin not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert reading
    const { error: insertError } = await supabase.from('readings').insert({
      dustbin_id: dustbin.id,
      fill_percentage,
      sensor1_value: parseFloat(sensor1_value),
      sensor2_value: parseFloat(sensor2_value),
    });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, fill_percentage }),
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