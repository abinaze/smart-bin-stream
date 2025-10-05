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

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if any users exist with roles
    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('id')
      .limit(1);

    if (rolesError) throw rolesError;

    // If no roles exist, this is the first user - make them superuser
    const role = existingRoles && existingRoles.length === 0 ? 'superuser' : 'user';

    // Assign role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });

    if (insertError) throw insertError;

    // Log the role assignment
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'role_assigned',
      resource_type: 'user_role',
      resource_id: userId,
      details: { role },
    });

    return new Response(
      JSON.stringify({ success: true, role }),
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
