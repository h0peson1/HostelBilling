import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { findProfileByIdentifier } from '@/lib/profiles';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || '').trim();
    const password = (body.password || '').trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Administrator identifier and password are required.' },
        { status: 400 }
      );
    }

    const masterPassword = process.env.ADMIN_PASSWORD || 'Admin@Hopeson2026!';

    // 1. Resolve Admin Profile
    let profile = await findProfileByIdentifier(identifier);

    // Fallback: Check if identifier is email or 'admin'
    if (!profile) {
      if (identifier.toLowerCase() === 'admin' || identifier.includes('@')) {
        const { data: pData } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, phone_number, roll_number, room_number, role')
          .eq('role', 'admin')
          .limit(1)
          .maybeSingle();
        if (pData) profile = pData;
      }
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Invalid administrator credentials.' },
        { status: 401 }
      );
    }

    // 2. Strict Role Verification
    if (profile.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Access Denied: You do not have administrator permissions.',
        },
        { status: 403 }
      );
    }

    // 3. Password Verification (Master password or Supabase Auth)
    let passwordMatches = password === masterPassword;

    if (!passwordMatches) {
      // Check Supabase Auth signIn
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@hopeson.net',
        password: password,
      });

      if (!authError && authData.user) {
        passwordMatches = true;
      }
    }

    if (!passwordMatches) {
      return NextResponse.json(
        { success: false, message: 'Invalid administrator password.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Authentication successful. Welcome to Hopeson's NetOps.",
      admin: {
        id: profile.id,
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        roll_number: profile.roll_number,
        room_number: profile.room_number,
        role: profile.role,
      },
      token: `admin_token_${Date.now()}_${profile.id}`,
    });
  } catch (err: unknown) {
    console.error('Admin login error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error during administrator login.' },
      { status: 500 }
    );
  }
}
