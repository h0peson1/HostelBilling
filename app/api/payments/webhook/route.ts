import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPaystackSignature, verifyFlutterwaveSignature } from '@/lib/payments';

/**
 * POST /api/payments/webhook
 * 
 * Handles real-time transaction notifications from Paystack and Flutterwave.
 * 
 * 1. Cryptographically verifies HMAC SHA-512 signature.
 * 2. On 'charge.success':
 *    - Marks payment row as 'success'.
 *    - Activates or extends the student's internet subscription.
 *    - The Supabase PostgreSQL trigger (fn_sync_subscription_to_freeradius)
 *      automatically provisions radcheck & radreply for router access.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await req.text();
    const paystackSignature = req.headers.get('x-paystack-signature');
    const flutterwaveSignature = req.headers.get('verif-hash');

    // 1. Webhook Signature Verification
    const isProduction = process.env.NODE_ENV === 'production';
    const isValidPaystack = verifyPaystackSignature(rawBody, paystackSignature);
    const isValidFlutterwave = verifyFlutterwaveSignature(flutterwaveSignature);

    if (isProduction && !isValidPaystack && !isValidFlutterwave) {
      console.error('[Webhook] Unauthorized: Invalid gateway signature.');
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
    }

    // 2. Parse Event Body
    let payload: Record<string, any>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const event = payload.event;
    const data = payload.data || payload;

    console.log(`[Webhook] Received payment event: ${event}, Reference: ${data.reference}`);

    // 3. Handle Successful Charge
    // Paystack: 'charge.success', Flutterwave: 'charge.completed'
    if (event === 'charge.success' || event === 'charge.completed' || data.status === 'successful') {
      const reference = data.reference || data.tx_ref;

      if (!reference) {
        return NextResponse.json({ error: 'Missing transaction reference' }, { status: 400 });
      }

      // Find the corresponding payment record
      const { data: paymentRecord, error: paymentFetchError } = await supabaseAdmin
        .from('payments')
        .select('id, user_id, plan_id, amount, status, metadata')
        .eq('reference', reference)
        .single();

      if (paymentFetchError || !paymentRecord) {
        console.warn(`[Webhook] Payment record not found for reference ${reference}.`);
        return NextResponse.json({ received: true, warning: 'Payment record not found' }, { status: 200 });
      }

      // Avoid processing already completed transactions
      if (paymentRecord.status === 'success') {
        return NextResponse.json({ received: true, message: 'Already processed' }, { status: 200 });
      }

      // Fetch plan duration to calculate new expiry date
      const { data: plan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('id, name, duration_days')
        .eq('id', paymentRecord.plan_id)
        .single();

      const durationDays = plan?.duration_days || 30;

      // 4. Update Payment Status to 'success'
      const { error: paymentUpdateError } = await supabaseAdmin
        .from('payments')
        .update({
          status: 'success',
          metadata: {
            ...(typeof paymentRecord.metadata === 'object' ? paymentRecord.metadata : {}),
            gateway_paid_at: data.paid_at || new Date().toISOString(),
            channel: data.channel || 'momo',
            gateway_id: data.id,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentRecord.id);

      if (paymentUpdateError) {
        console.error(`[Webhook] Failed to update payment status: ${paymentUpdateError.message}`);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      // 5. Calculate Subscription Validity Window
      const now = new Date();
      // Check if user has an existing active subscription that hasn't expired yet
      const { data: currentSub } = await supabaseAdmin
        .from('subscriptions')
        .select('id, expires_at')
        .eq('user_id', paymentRecord.user_id)
        .eq('status', 'active')
        .gt('expires_at', now.toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .single();

      let baseDate = now;
      if (currentSub && new Date(currentSub.expires_at) > now) {
        // Extend existing subscription duration
        baseDate = new Date(currentSub.expires_at);
      }

      const expiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // 6. Upsert / Create Subscription Record
      // NOTE: Inserting or updating status to 'active' automatically fires
      // the PostgreSQL trigger: trg_sync_subscription_to_freeradius
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: paymentRecord.user_id,
          plan_id: paymentRecord.plan_id,
          status: 'active',
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          data_used_bytes: 0,
        });

      if (subError) {
        console.error(`[Webhook] Failed to activate subscription: ${subError.message}`);
        return NextResponse.json({ error: 'Subscription activation failed' }, { status: 500 });
      }

      console.log(`[Webhook] Successfully activated subscription for user ${paymentRecord.user_id} until ${expiresAt.toISOString()}. FreeRADIUS trigger dispatched.`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Webhook Error]:`, errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
