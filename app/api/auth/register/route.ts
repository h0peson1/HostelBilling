import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { isValidMacAddress, normalizeMacAddress } from '@/lib/freeradius';
import { RegisterRequestBody, RegisterResponse } from '@/types';

/**
 * POST /api/auth/register
 * 
 * Silent Registration Flow for Hostel Wi-Fi Portal:
 * 1. Accepts phone, room_number, and mac_address from request body.
 * 2. Generates dummy email (${cleanPhone}@hopeson.local) and secure deterministic password.
 * 3. Uses Supabase Admin Client (Service Role) with auto-confirm enabled.
 * 4. Generates session data for the authenticated resident.
 * 5. Inserts/upserts hardware MAC address into custom devices table linked to user ID.
 * 6. Returns 200 OK with session data.
 */
export async function POST(req: NextRequest): Promise<NextResponse<RegisterResponse>> {
  try {
    const body: RegisterRequestBody = await req.json();
    const rawPhone = body.phone || body.phone_number || '';
    const rawRoom = body.room_number || body.room || '';
    const rawMac = body.mac_address || body.mac || '';
    const rawName = body.full_name || body.name || '';

    // Validate required fields
    if (!rawPhone || !rawRoom) {
      return NextResponse.json(
        {
          success: false,
          message: 'Phone number and room number are required.',
        },
        { status: 400 }
      );
    }

    const cleanPhone = rawPhone.trim().replace(/\s+/g, '');
    const cleanRoom = rawRoom.trim();

    // Resolve and validate MAC address with testing fallback
    let cleanMac = rawMac ? rawMac.trim() : 'AA:BB:CC:DD:EE:77';
    if (!isValidMacAddress(cleanMac)) {
      cleanMac = 'AA:BB:CC:DD:EE:77';
    }
    const normalizedMac = normalizeMacAddress(cleanMac);

    // 1. Generate dummy email and secure dummy password
    const dummyEmail = `${cleanPhone}@hopeson.local`;
    const backendSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_PASSWORD || 'hopeson_silent_auth_secret_2026';
    const hash = crypto.createHmac('sha256', backendSecret).update(cleanPhone).digest('hex').slice(0, 16);
    const dummyPassword = `Hopeson!${hash}!`;

    let userId: string | null = null;

    // 2. Provision or retrieve user via Supabase Admin (auto-confirm enabled)
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: dummyEmail,
      password: dummyPassword,
      email_confirm: true,
      user_metadata: {
        phone: cleanPhone,
        phone_number: cleanPhone,
        room_number: cleanRoom,
      },
    });

    if (createData?.user) {
      userId = createData.user.id;
    } else if (createError && (createError.message.includes('already registered') || createError.status === 422 || createError.status === 400)) {
      // Returning resident: fetch existing user record
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const existing = listData?.users?.find(u => u.email === dummyEmail || u.phone === cleanPhone);
      if (existing) {
        userId = existing.id;
        // Keep credentials synchronized and auto-confirmed
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: dummyPassword,
          email_confirm: true,
        });
      }
    } else if (createError) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to provision user: ${createError.message}`,
          error: createError.message,
        },
        { status: 500 }
      );
    }

    if (!userId) {
      // Fallback lookup in profiles
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone_number', cleanPhone)
        .maybeSingle();
      if (existingProfile) {
        userId = existingProfile.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to resolve resident account ID.',
        },
        { status: 500 }
      );
    }

    // 3. Generate active session
    let sessionData: any = null;
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: dummyPassword,
    });

    if (signInData?.session) {
      sessionData = signInData.session;
    }

    // 4. Upsert Profile record in profiles table
    const fullName = rawName.trim() || `Resident ${cleanPhone.slice(-4)}`;
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: fullName,
          phone_number: cleanPhone,
          room_number: cleanRoom,
          role: 'student',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.warn('Profile upsert warning:', profileError.message);
    }

    // 5. Insert / Link MAC address in custom devices table
    const { data: deviceRecord, error: deviceError } = await supabaseAdmin
      .from('devices')
      .upsert(
        {
          user_id: userId,
          mac_address: normalizedMac,
          device_name: body.device_name?.trim() || 'Personal Device',
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'mac_address' }
      )
      .select('id, mac_address, device_name, last_seen_at')
      .maybeSingle();

    if (deviceError) {
      console.warn('Device upsert warning:', deviceError.message);
    }

    // 6. Ensure resident has active subscription
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status, expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!existingSub) {
      const { data: defPlan } = await supabaseAdmin
        .from('plans')
        .select('id, duration_days')
        .eq('is_active', true)
        .order('price_ghs', { ascending: false })
        .limit(1)
        .single();

      if (defPlan) {
        const startsAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (defPlan.duration_days || 120));

        await supabaseAdmin.from('subscriptions').insert({
          user_id: userId,
          plan_id: defPlan.id,
          status: 'active',
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          data_used_bytes: 0,
        });
      }
    }

    // 7. Return success with session data (HTTP 200 OK)
    return NextResponse.json(
      {
        success: true,
        message: 'Silent registration completed successfully.',
        session: sessionData,
        user: {
          id: userId,
          email: dummyEmail,
          full_name: fullName,
          phone_number: cleanPhone,
          roll_number: body.roll_number || null,
          room_number: cleanRoom,
          role: 'student',
        },
        device: deviceRecord || {
          mac_address: normalizedMac,
          device_name: 'Personal Device',
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    console.error('Silent registration error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred during silent registration.',
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
