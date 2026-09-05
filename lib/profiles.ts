import { supabaseAdmin } from '@/lib/supabase';
import { Profile } from '@/types';

const PROFILE_COLUMNS =
  'id, full_name, phone_number, roll_number, room_number, role' as const;

/**
 * Resolves a hostel resident by roll number, room ID, or phone number.
 * Used by captive-portal login and /api/user/status fallbacks.
 */
export async function findProfileByIdentifier(
  identifier: string
): Promise<Pick<
  Profile,
  'id' | 'full_name' | 'phone_number' | 'roll_number' | 'room_number' | 'role'
> | null> {
  const raw = identifier.trim();
  if (!raw) return null;

  const cleanPhone = raw.replace(/\s+/g, '');
  const lookups: Array<{ column: 'roll_number' | 'room_number' | 'phone_number'; value: string }> = [
    { column: 'roll_number', value: raw },
    { column: 'room_number', value: raw },
    { column: 'phone_number', value: cleanPhone },
  ];

  for (const lookup of lookups) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq(lookup.column, lookup.value)
      .maybeSingle();

    if (data) return data;
  }

  return null;
}
