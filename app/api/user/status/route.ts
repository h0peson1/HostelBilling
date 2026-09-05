import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createScopedClient } from '@/lib/supabase';
import { findProfileByIdentifier } from '@/lib/profiles';
import { formatRemainingTime, formatDataUsage } from '@/lib/freeradius';
import { UserStatusResponse } from '@/types';

/**
 * GET /api/user/status
 * 
 * Returns the resident student's active Wi-Fi subscription details,
 * speed caps, data usage, remaining validity, and registered devices.
 * 
 * Supports:
 * 1. Bearer JWT authentication (standard for Next.js app)
 * 2. Fallback query parameters (?user_id=... or ?phone=...) for captive portal onboarding
 */
export async function GET(req: NextRequest): Promise<NextResponse<UserStatusResponse>> {
  try {
    const authHeader = req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get('user_id');
    const queryPhone = searchParams.get('phone');
    const queryRoll = searchParams.get('roll');
    const queryRoom = searchParams.get('room');
    const queryQ = searchParams.get('q');

    let userId: string | null = null;

    // 1. Resolve User Identity
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const scopedClient = createScopedClient(token);
      const { data: userData, error: userError } = await scopedClient.auth.getUser();

      if (!userError && userData?.user) {
        userId = userData.user.id;
      }
    }

    // Captive Portal fallback with phone or user_id
    if (!userId && queryUserId) {
      userId = queryUserId;
    } else if (!userId && queryPhone) {
      const cleanPhone = queryPhone.trim().replace(/\s+/g, '');
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone_number', cleanPhone)
        .maybeSingle();

      if (profile) {
        userId = profile.id;
      }
    }

    if (!userId && (queryQ || queryRoll || queryRoom)) {
      const profile = await findProfileByIdentifier(
        queryQ || queryRoll || queryRoom || ''
      );
      if (profile) {
        userId = profile.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        {
          authenticated: false,
          devices: [],
          subscription: null,
          active_session: null,
        },
        { status: 401 }
      );
    }

    // 2. Fetch User Profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone_number, roll_number, room_number, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          authenticated: false,
          devices: [],
          subscription: null,
          active_session: null,
        },
        { status: 404 }
      );
    }

    // 3. Fetch Active Subscription & Plan
    const { data: activeSub } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        status,
        starts_at,
        expires_at,
        data_used_bytes,
        plan_id
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    let subscriptionData = null;

    if (activeSub) {
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('name, download_speed_mbps, upload_speed_mbps, data_limit_gb')
        .eq('id', activeSub.plan_id)
        .single();

      const now = new Date().getTime();
      const expires = new Date(activeSub.expires_at).getTime();
      const remainingSeconds = Math.max(0, Math.floor((expires - now) / 1000));
      const isExpired = remainingSeconds <= 0;

      const { gb: usedGb } = formatDataUsage(activeSub.data_used_bytes);
      let quotaPercentage = 0;
      if (plan?.data_limit_gb && plan.data_limit_gb > 0) {
        quotaPercentage = Math.min(100, Math.round((usedGb / plan.data_limit_gb) * 100));
      }

      subscriptionData = {
        id: activeSub.id,
        status: isExpired ? ('expired' as const) : activeSub.status,
        plan_name: plan?.name || 'Custom Plan',
        download_speed_mbps: plan?.download_speed_mbps || 50,
        upload_speed_mbps: plan?.upload_speed_mbps || 20,
        data_limit_gb: plan?.data_limit_gb ?? null,
        data_used_bytes: activeSub.data_used_bytes,
        data_used_gb: usedGb,
        quota_percentage: quotaPercentage,
        starts_at: activeSub.starts_at,
        expires_at: activeSub.expires_at,
        is_expired: isExpired,
        remaining_seconds: remainingSeconds,
        remaining_formatted: formatRemainingTime(remainingSeconds),
      };
    }

    // 4. Fetch Registered Devices
    const { data: devices = [] } = await supabaseAdmin
      .from('devices')
      .select('id, device_name, mac_address, last_seen_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    // 5. Query Active Session Telemetry from radacct
    let activeSession = null;
    const { data: latestAcct } = await supabaseAdmin
      .from('radacct')
      .select(`
        framedipaddress,
        acctinputoctets,
        acctoutputoctets,
        acctsessiontime
      `)
      .eq('username', profile.phone_number)
      .is('acctstoptime', null)
      .order('acctstarttime', { ascending: false })
      .limit(1)
      .single();

    if (latestAcct) {
      const up = Number(latestAcct.acctinputoctets || 0);
      const down = Number(latestAcct.acctoutputoctets || 0);
      activeSession = {
        ip_address: latestAcct.framedipaddress,
        upload_octets: up,
        download_octets: down,
        total_octets: up + down,
        session_time_seconds: Number(latestAcct.acctsessiontime || 0),
      };
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: profile.id,
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        roll_number: profile.roll_number,
        room_number: profile.room_number,
        role: profile.role,
      },
      subscription: subscriptionData,
      devices: devices || [],
      active_session: activeSession,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json(
      {
        authenticated: false,
        devices: [],
        subscription: null,
        active_session: null,
        error: errorMsg,
      } as unknown as UserStatusResponse,
      { status: 500 }
    );
  }
}
