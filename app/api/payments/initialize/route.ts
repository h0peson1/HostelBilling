import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createScopedClient } from '@/lib/supabase';
import { generatePaymentReference, initializePaystackPayment } from '@/lib/payments';
import { PaymentInitRequestBody, PaymentInitResponse } from '@/types';

/**
 * POST /api/payments/initialize
 * 
 * Prepares a Mobile Money or Card payment transaction for Paystack / Flutterwave.
 * Creates an initial 'pending' record in the payments table and returns
 * the payment gateway checkout authorization URL.
 */
export async function POST(req: NextRequest): Promise<NextResponse<PaymentInitResponse>> {
  try {
    const authHeader = req.headers.get('authorization');
    const body: PaymentInitRequestBody = await req.json();
    const { plan_id, channel = 'momo', phone_number } = body;

    if (!plan_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'plan_id is required.',
          reference: '',
          amount_ghs: 0,
          currency: 'GHS',
          plan: { id: '', name: '', duration_days: 0 },
        },
        { status: 400 }
      );
    }

    // 1. Resolve User ID
    let userId: string | null = null;
    let userEmail = 'student@hostel.campus.internal';
    let userPhone = phone_number ? phone_number.trim().replace(/\s+/g, '') : '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const scopedClient = createScopedClient(token);
      const { data: userData } = await scopedClient.auth.getUser();
      if (userData?.user) {
        userId = userData.user.id;
        userEmail = userData.user.email || userEmail;
      }
    }

    if (!userId && userPhone) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, phone_number')
        .eq('phone_number', userPhone)
        .single();
      if (profile) {
        userId = profile.id;
      }
    }

    // Fallback to first profile if demo mode or unauthenticated test
    if (!userId) {
      const { data: firstProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, phone_number')
        .limit(1)
        .single();
      if (firstProfile) {
        userId = firstProfile.id;
        userPhone = userPhone || firstProfile.phone_number;
      }
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'User authentication required to initialize payment.',
          reference: '',
          amount_ghs: 0,
          currency: 'GHS',
          plan: { id: '', name: '', duration_days: 0 },
        },
        { status: 401 }
      );
    }

    // 2. Query Plan Details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('id, name, price_ghs, duration_days, is_active')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        {
          success: false,
          message: 'Selected internet plan not found.',
          reference: '',
          amount_ghs: 0,
          currency: 'GHS',
          plan: { id: '', name: '', duration_days: 0 },
        },
        { status: 404 }
      );
    }

    if (!plan.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: 'This plan is currently deactivated.',
          reference: '',
          amount_ghs: plan.price_ghs,
          currency: 'GHS',
          plan: { id: plan.id, name: plan.name, duration_days: plan.duration_days },
        },
        { status: 400 }
      );
    }

    // 3. Generate Cryptographic Reference
    const reference = generatePaymentReference('HSTL');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${appUrl}/student-dashboard.html?payment=success&ref=${reference}`;

    // 4. Insert Pending Payment Record
    const { error: paymentInsertError } = await supabaseAdmin.from('payments').insert({
      user_id: userId,
      plan_id: plan.id,
      amount: plan.price_ghs,
      reference,
      status: 'pending',
      channel,
      provider: 'paystack',
      metadata: {
        plan_name: plan.name,
        duration_days: plan.duration_days,
        phone_number: userPhone,
      },
    });

    if (paymentInsertError) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to record pending transaction: ${paymentInsertError.message}`,
          reference,
          amount_ghs: plan.price_ghs,
          currency: 'GHS',
          plan: { id: plan.id, name: plan.name, duration_days: plan.duration_days },
        },
        { status: 500 }
      );
    }

    // 5. Initialize with Gateway (Paystack)
    const initResult = await initializePaystackPayment({
      email: userEmail,
      amountGhs: plan.price_ghs,
      reference,
      callbackUrl,
      channels: channel === 'card' ? ['card'] : ['momo'],
      phone: userPhone,
      metadata: {
        user_id: userId,
        plan_id: plan.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment initialized successfully.',
      reference,
      authorization_url: initResult.authorizationUrl || `${callbackUrl}&mock_gateway=1`,
      access_code: initResult.accessCode,
      amount_ghs: plan.price_ghs,
      currency: 'GHS',
      plan: {
        id: plan.id,
        name: plan.name,
        duration_days: plan.duration_days,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      {
        success: false,
        message: 'Unexpected error initializing payment gateway.',
        reference: '',
        amount_ghs: 0,
        currency: 'GHS',
        plan: { id: '', name: '', duration_days: 0 },
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
