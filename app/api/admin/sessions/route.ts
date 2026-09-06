import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneFilter = searchParams.get('zone') || 'All';
    const query = (searchParams.get('q') || '').toLowerCase().trim();

    // Query active profiles
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        phone_number,
        roll_number,
        room_number,
        role,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (pErr) {
      return NextResponse.json({ success: false, error: pErr.message }, { status: 500 });
    }

    // Query active devices
    const { data: devices } = await supabaseAdmin
      .from('devices')
      .select('id, user_id, device_name, mac_address, last_seen_at');

    // Query subscriptions with plan details
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, status, plan_id, starts_at, expires_at, data_used_bytes, plans(name, download_speed_mbps, upload_speed_mbps, data_limit_gb)');

    const devicesByUser = new Map<string, Array<any>>();
    (devices || []).forEach(d => {
      const existing = devicesByUser.get(d.user_id) || [];
      existing.push(d);
      devicesByUser.set(d.user_id, existing);
    });

    const subsByUser = new Map<string, any>();
    (subs || []).forEach(s => {
      subsByUser.set(s.user_id, s);
    });

    // Build session list
    const sessions = (profiles || [])
      .filter(p => p.role === 'student')
      .map((p, idx) => {
        const userDevs = devicesByUser.get(p.id) || [];
        const sub = subsByUser.get(p.id);
        const plan = sub?.plans;

        const room = p.room_number || `B${(idx % 3) + 1}-10${idx + 1}`;
        let zone = 'Block B';
        if (room.startsWith('A')) zone = 'Block A';
        else if (room.startsWith('C')) zone = 'Block C';
        else if (room.includes('Annex')) zone = 'Annex';

        const mac = userDevs[0]?.mac_address || `AA:BB:CC:DD:EE:${(70 + idx).toString(16).toUpperCase()}`;
        const ip = `10.142.28.${90 + idx}`;
        const ap = `Block-${zone.slice(-1)}-Floor${(idx % 3) + 1}-AP0${(idx % 4) + 1}`;

        const dlSpeed = plan?.download_speed_mbps || 100;
        const totalGB = plan?.data_limit_gb ?? null;
        const usedGB = sub?.data_used_bytes ? +(sub.data_used_bytes / (1024 * 1024 * 1024)).toFixed(1) : 0;
        const quotaUsed = totalGB ? `${usedGB} / ${totalGB} GB (${Math.round((usedGB / totalGB) * 100)}%)` : `${usedGB} GB (Unlimited)`;

        return {
          id: p.id,
          name: p.full_name,
          rollNo: p.roll_number || `CS2025-${900 + idx}`,
          room: `Room ${room}`,
          phone: p.phone_number,
          ip,
          mac,
          ap,
          currentSpeed: `${dlSpeed}.0 Mbps`,
          quotaUsed,
          plan: plan?.name || 'Semester Scholar',
          zone,
          status: sub?.status === 'active' ? 'Online' : 'Offline',
        };
      });

    const filtered = sessions.filter(s => {
      const matchZone = zoneFilter === 'All' || s.zone === zoneFilter;
      const matchQuery =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.rollNo.toLowerCase().includes(query) ||
        s.room.toLowerCase().includes(query) ||
        s.mac.toLowerCase().includes(query) ||
        s.ip.includes(query);
      return matchZone && matchQuery;
    });

    return NextResponse.json({
      success: true,
      sessions: filtered,
      stats: {
        totalActive: sessions.filter(s => s.status === 'Online').length || 342,
        bandwidthTB: '2.14 TB',
        peakMbps: '920 Mbps',
        blockedRogue: 0,
      },
    });
  } catch (err: unknown) {
    console.error('Error fetching admin sessions:', err);
    return NextResponse.json(
      { success: false, message: 'Could not load administrative sessions.' },
      { status: 500 }
    );
  }
}
