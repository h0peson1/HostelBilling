import { NextRequest, NextResponse } from 'next/server';
import { findProfileByIdentifier } from '@/lib/profiles';
import { LoginRequestBody, LoginResponse } from '@/types';

/**
 * POST /api/auth/login
 *
 * Captive-portal sign-in: look up a resident by roll number, room ID, or
 * phone, then return the profile used to open the student dashboard.
 */
export async function POST(req: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    const body: LoginRequestBody = await req.json();
    const identifier = (body.identifier || '').trim();
    const password = (body.password || '').trim();
    const mode = body.mode === 'voucher' ? 'voucher' : 'student';

    if (!identifier) {
      return NextResponse.json(
        {
          success: false,
          message:
            mode === 'voucher'
              ? 'Enter a prepaid voucher code to connect.'
              : 'Enter your roll number or room ID to connect.',
        },
        { status: 400 }
      );
    }

    if (mode === 'student' && !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Enter your network password to connect.',
        },
        { status: 400 }
      );
    }

    const profile = await findProfileByIdentifier(identifier);

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message:
            mode === 'voucher'
              ? 'That voucher code is not recognised on Hostel Net.'
              : 'No resident matches that roll number or room ID.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Authenticated. Opening your student dashboard.',
      user: {
        id: profile.id,
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        roll_number: profile.roll_number,
        room_number: profile.room_number,
        role: profile.role,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      {
        success: false,
        message: 'Could not reach Hostel Net authentication.',
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
