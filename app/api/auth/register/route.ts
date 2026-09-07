import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { isValidMacAddress, normalizeMacAddress } from '@/lib/freeradius';
import { resolveDeviceName } from '@/lib/device-detection';
import { RegisterRequestBody, RegisterResponse } from '@/types';

/**
 * POST /api/auth/register
 * 
 * Silent Registration & Secondary Device Handling Flow:
 * 1. Accepts phone, room_number, and mac_address from request body.
 * 2. Checks if a user with this phone number already exists in the database.
 * 3. If New User:
 *    - Creates auth user and profile.
 *    - Adds device to devices table.
 *    - Assigns default active subscription.
 *    - Returns session data (200 OK).
 * 4. If Existing User:
 *    a. Checks their currently registered devices in the devices table.
 *    b. If the current MAC is already registered for this user, updates last_seen_at and continues.
 *    c. If adding a new device:
 *       - Checks active plan in subscriptions table for device_limit (defaults to 1 if no active plan).
 *       - If deviceCount >= deviceLimit, returns 403 Forbidden with:
 *         'Device limit reached. Please manage your devices in the dashboard.'
 *       - If under limit, inserts new mac_address into devices table linked to existing user_id.
 *    d. Generates session data and returns successful response (200 OK).
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
    let cleanMac = rawMac ? rawMac.trim() : '00:11:22:33:44:55';
    if (!isValidMacAddress(cleanMac)) {
      cleanMac = '00:11:22:33:44:55';
    }
    const normalizedMac = normalizeMacAddress(cleanMac);

    // Device Name Detection
    const userAgentHeader = req.headers.get('user-agent') || '';
    const query = req.nextUrl.searchParams;
    const providedHost =
      body.hostname ||
      body.host_name ||
      body.device_name ||
      query.get('hostname') ||
      query.get('host_name') ||
      query.get('device_name') ||
      null;
    const detectedDeviceName = resolveDeviceName(providedHost, userAgentHeader);

    // Auth credentials synthesis
    const dummyEmail = `${cleanPhone}@hopeson.local`;
    const backendSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_PASSWORD || 'hopeson_silent_auth_secret_2026';
    const hash = crypto.createHmac('sha256', backendSecret).update(cleanPhone).digest('hex').slice(0, 16);
    const dummyPassword = `Hopeson!${hash}!`;

    // 1. Check if user with this phone number already exists in the database
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone_number, roll_number, room_number, role')
      .eq('phone_number', cleanPhone)
      .maybeSingle();

    let userId: string;
    let fullName: string;
    let deviceRecord: any = null;

    if (!existingProfile) {
      // -------------------------------------------------------------
      // 2. NEW USER FLOW
      // -------------------------------------------------------------
      // Provision auth user via Supabase Admin (auto-confirm enabled)
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
        // Fallback: recover auth user if already registered in auth but missing from profiles
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email === dummyEmail || u.phone === cleanPhone);
        if (existing) {
          userId = existing.id;
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: dummyPassword,
            email_confirm: true,
          });
        } else {
          return NextResponse.json(
            {
              success: false,
              message: `Failed to provision resident user: ${createError.message}`,
              error: createError.message,
            },
            { status: 500 }
          );
        }
      } else if (createError) {
        return NextResponse.json(
          {
            success: false,
            message: `Failed to provision resident user: ${createError.message}`,
            error: createError.message,
          },
          { status: 500 }
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to create resident account.',
          },
          { status: 500 }
        );
      }

      fullName = rawName.trim() || `Resident ${cleanPhone.slice(-4)}`;

      // Create profile record
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
        console.warn('Profile creation warning:', profileError.message);
      }

      // Add device into devices table
      const { data: newDevice, error: deviceError } = await supabaseAdmin
        .from('devices')
        .upsert(
          {
            user_id: userId,
            mac_address: normalizedMac,
            device_name: detectedDeviceName,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'mac_address' }
        )
        .select('id, mac_address, device_name, last_seen_at')
        .maybeSingle();

      if (deviceError) {
        console.warn('Device insertion warning:', deviceError.message);
      }
      deviceRecord = newDevice;

      // Assign default subscription (Semester Scholar)
      const { data: defPlan } = await supabaseAdmin
        .from('plans')
        .select('id, duration_days')
        .eq('is_active', true)
        .order('price_ghs', { ascending: false })
        .limit(1)
        .maybeSingle();

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
    } else {
      // -------------------------------------------------------------
      // 3. EXISTING USER FLOW (Secondary Device Registration)
      // -------------------------------------------------------------
      userId = existingProfile.id;
      fullName = existingProfile.full_name || rawName.trim() || `Resident ${cleanPhone.slice(-4)}`;

      // Update room number if provided
      if (cleanRoom && cleanRoom !== existingProfile.room_number) {
        await supabaseAdmin
          .from('profiles')
          .update({
            room_number: cleanRoom,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }

      // 3a. Check total registered devices currently in devices table for this user
      const { data: currentDevices } = await supabaseAdmin
        .from('devices')
        .select('id, mac_address, device_name')
        .eq('user_id', userId);

      const registeredDevices = currentDevices || [];
      const alreadyRegistered = registeredDevices.find(
        (d) => d.mac_address.toLowerCase() === normalizedMac.toLowerCase()
      );

      if (alreadyRegistered) {
        // Device is already bound to this user -> update last seen and continue
        const { data: updatedDev } = await supabaseAdmin
          .from('devices')
          .update({
            last_seen_at: new Date().toISOString(),
            device_name: detectedDeviceName || alreadyRegistered.device_name,
          })
          .eq('id', alreadyRegistered.id)
          .select('id, mac_address, device_name, last_seen_at')
          .maybeSingle();
        deviceRecord = updatedDev || alreadyRegistered;
      } else {
        // User is attempting to register a new / secondary device
        const deviceCount = registeredDevices.length;

        // 3b. Check their active plan in the subscriptions table to find their device_limit (default 1 if no active plan)
        const { data: activeSub } = await supabaseAdmin
          .from('subscriptions')
          .select(`
            id,
            plan_id,
            status,
            expires_at,
            plans (
              id,
              name,
              simultaneous_devices
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let deviceLimit = 1;

        if (activeSub) {
          const planData: any = Array.isArray(activeSub.plans) ? activeSub.plans[0] : activeSub.plans;
          if (planData?.simultaneous_devices && typeof planData.simultaneous_devices === 'number') {
            deviceLimit = planData.simultaneous_devices;
          } else if (activeSub.plan_id) {
            const { data: fallbackPlan } = await supabaseAdmin
              .from('plans')
              .select('simultaneous_devices')
              .eq('id', activeSub.plan_id)
              .maybeSingle();
            if (fallbackPlan?.simultaneous_devices) {
              deviceLimit = fallbackPlan.simultaneous_devices;
            }
          }
        }

        // 3c. If they have reached their limit, return 403 Forbidden
        if (deviceCount >= deviceLimit) {
          return NextResponse.json(
            {
              success: false,
              message: 'Device limit reached. Please manage your devices in the dashboard.',
            },
            { status: 403 }
          );
        }

        // 3d. If under limit, insert the new mac_address into devices table linked to existing user_id
        const { data: newDevice, error: deviceInsertError } = await supabaseAdmin
          .from('devices')
          .upsert(
            {
              user_id: userId,
              mac_address: normalizedMac,
              device_name: detectedDeviceName,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: 'mac_address' }
          )
          .select('id, mac_address, device_name, last_seen_at')
          .maybeSingle();

        if (deviceInsertError) {
          return NextResponse.json(
            {
              success: false,
              message: `Failed to register device: ${deviceInsertError.message}`,
              error: deviceInsertError.message,
            },
            { status: 500 }
          );
        }
        deviceRecord = newDevice;
      }
    }

    // -------------------------------------------------------------
    // 4. GENERATE SESSION AND RETURN SUCCESS (200 OK)
    // -------------------------------------------------------------
    // Synchronize auth user password & email confirmation
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: dummyPassword,
        email: dummyEmail,
        email_confirm: true,
      });
    } catch {
      try {
        await supabaseAdmin.auth.admin.createUser({
          id: userId,
          email: dummyEmail,
          password: dummyPassword,
          email_confirm: true,
          user_metadata: {
            phone: cleanPhone,
            phone_number: cleanPhone,
            room_number: cleanRoom,
          },
        });
      } catch {
        // ignore if exists
      }
    }

    // Sign in to produce session tokens
    let sessionData: any = null;
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: dummyPassword,
    });

    if (signInData?.session) {
      sessionData = signInData.session;
    }

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
          roll_number: body.roll_number || existingProfile?.roll_number || null,
          room_number: cleanRoom || existingProfile?.room_number || null,
          role: existingProfile?.role || 'student',
        },
        device: deviceRecord || {
          mac_address: normalizedMac,
          device_name: detectedDeviceName,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    console.error('Registration / Secondary Device error:', err);
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
