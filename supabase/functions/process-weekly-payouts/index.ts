// Follow this setup guide to integrate the Deno runtime:
// https://deno.com/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

interface PayoutRequest {
  familyId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Get request body
    const { familyId } = await req.json() as PayoutRequest;

    // Get completed pools that haven't been paid out
    const { data: pools, error: poolsError } = await supabaseClient
      .from('weekly_pools')
      .select('*')
      .eq('family_id', familyId)
      .eq('status', 'completed');

    if (poolsError) throw poolsError;
    if (!pools || pools.length === 0) {
      return new Response(JSON.stringify({ message: 'No pools to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Process each pool
    for (const pool of pools) {
      // Get payment details for winners
      const winnerIds = pool.winners.map((w: any) => w.user_id);
      const { data: paymentDetails, error: detailsError } = await supabaseClient
        .from('user_payment_details')
        .select('*')
        .in('user_id', winnerIds);

      if (detailsError) throw detailsError;

      // Process payments
      for (const winner of pool.winners) {
        const details = paymentDetails?.find((d: any) => d.user_id === winner.user_id);
        if (!details) {
          console.warn(`No payment details found for user ${winner.user_id}`);
          continue;
        }

        // Initiate payment based on provider
        await processPayment(details.provider, details.account_id, winner.payout_amount);
      }

      // Mark pool as paid out
      const { error: updateError } = await supabaseClient
        .from('weekly_pools')
        .update({ status: 'paid_out' })
        .eq('id', pool.id);

      if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ message: 'Payouts processed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing payouts:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function processPayment(provider: string, accountId: string, amount: number) {
  // TODO: Implement actual payment processing
  // This is a placeholder for the actual payment API integration
  console.log(`Processing ${amount} payment to ${accountId} via ${provider}`);
}
