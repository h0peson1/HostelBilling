import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isValidMacAddress, normalizeMacAddress } from '@/lib/freeradius';
import { RegisterRequestBody, RegisterResponse } from '@/types';

/**
 * POST /api/auth/register
 * 
 * Registers a new hostel resident student:
 * 1. Creates Supabase auth account (or auto-generates credentials)
 * 2. Creates student profile linked to auth.users
 * 3. Registers student's initial hardware device MAC address
 */
export async function POST(req: NextRequest): Promise<NextResponse<RegisterResponse>> {
  try {
    const body: RegisterRequestBody = await req.json();
    const {
      email,
      password,
      full_name,
      phone_number,
      roll_number,
      room_number,
      mac_address,
      device_name = 'Personal Device',
    } = body;

    // 1. Validation
    if (!full_name || !phone_number || !mac_address) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: full_name, phone_number, and mac_address are mandatory.',
        },
        { status: 400 }
      );
    }

    if (!isValidMacAddress(mac_address)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid MAC address format: "${mac_address}". Expected format: AA:BB:CC:DD:EE:FF`,
        },
        { status: 400 }
      );
    }

    const normalizedMac = normalizeMacAddress(mac_address);
    const normalizedPhone = phone_number.trim().replace(/\s+/g, '');
    const userEmail = email ? email.trim().toLowerCase() : `${normalizedPhone}@hostel.campus.internal`;
    const userPassword = password || `Pass_${normalizedPhone}_${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Check if phone number is already registered in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone_number')
      .eq('phone_number', normalizedPhone)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        {
          success: false,
          message: `Phone number ${normalizedPhone} is already registered to resident ${existingProfile.full_name}. Please log in instead.`,
        },
        { status: 409 }
      );
    }

    // 3. Check if MAC address is already registered to another device
    const { data: existingDevice } = await supabaseAdmin
      .from('devices')
      .select('id, mac_address')
      .eq('mac_address', normalizedMac)
      .single();

    if (existingDevice) {
      return NextResponse.json(
        {
          success: false,
          message: `Hardware MAC address ${normalizedMac} is already registered on the hostel network.`,
        },
        { status: 409 }
      );
    }

    // 4. Provision Supabase Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone_number: normalizedPhone,
      },
    });

    if (authError || !authUser.user) {
      return NextResponse.json(
        {
          success: false,
          message: authError?.message || 'Failed to provision auth user in Supabase.',
          error: authError?.message,
        },
        { status: 500 }
      );
    }

    const userId = authUser.user.id;

    // 5. Insert Profile Record
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      full_name: full_name.trim(),
      phone_number: normalizedPhone,
      roll_number: roll_number ? roll_number.trim() : null,
      room_number: room_number ? room_number.trim() : null,
      role: 'student',
    });

    if (profileError) {
      // Rollback auth user if profile insertion failed
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        {
          success: false,
          message: `Profile creation failed: ${profileError.message}`,
          error: profileError.message,
        },
        { status: 500 }
      );
    }

    // 6. Register Hardware Device
    const { data: newDevice, error: deviceError } = await supabaseAdmin
      .from('devices')
      .insert({
        user_id: userId,
        mac_address: normalizedMac,
        device_name: device_name.trim(),
      })
      .select('id, mac_address, device_name')
      .single();

    if (deviceError) {
      return NextResponse.json(
        {
          success: false,
          message: `User created, but device registration failed: ${deviceError.message}`,
          error: deviceError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Student account and initial device successfully provisioned on Hostel NetOps.',
        user: {
          id: userId,
          email: userEmail,
          full_name,
          phone_number: normalizedPhone,
          roll_number: roll_number || null,
          room_number: room_number || null,
          role: 'student',
        },
        device: newDevice,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred during user registration.',
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
