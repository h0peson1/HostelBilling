import React from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import UsersTable, { RawAdminUser } from './UsersTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Server Component: Fetches resident users, bound devices, and active subscriptions
 * from Supabase with graceful error logging and empty states.
 */
export default async function AdminPage() {
  try {
    const { data: rawUsers, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        phone_number,
        room_number,
        role,
        devices (
          id,
          mac_address,
          device_name,
          last_seen_at
        ),
        subscriptions (
          id,
          status,
          expires_at,
          plans (
            id,
            name,
            simultaneous_devices
          )
        )
      `)
      .order('created_at', { ascending: false });

    // 3. Debug Logging & Error State: If error exists or data is null
    if (error || rawUsers === null) {
      console.error('Supabase query error in app/admin/page.tsx:', error ?? 'Query returned null data');
      return (
        <div className="p-6 max-w-4xl mx-auto my-8 bg-rose-950/40 border border-rose-800/80 rounded-2xl text-rose-200">
          <div className="flex items-center gap-3 mb-3 text-rose-400">
            <span className="material-symbols-outlined text-2xl">error</span>
            <h2 className="text-lg font-bold">Failed to load users from database</h2>
          </div>
          <p className="text-sm text-rose-300 mb-2">
            An error occurred while executing the Supabase query:
          </p>
          <pre className="p-3 bg-black/50 rounded-lg text-xs font-mono text-rose-200 overflow-x-auto border border-rose-900">
            {JSON.stringify(error || { message: 'Database returned null data' }, null, 2)}
          </pre>
        </div>
      );
    }

    // 4. Empty State: If the fetch succeeds but returns an empty array
    if (rawUsers.length === 0) {
      return (
        <div className="p-12 max-w-xl mx-auto my-12 bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
            <span className="material-symbols-outlined text-2xl">group_off</span>
          </div>
          <h2 className="text-lg font-bold text-white mb-1">No users found in the database yet</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When resident students connect to the captive portal, their accounts and hardware bindings will appear here automatically.
          </p>
        </div>
      );
    }

    // 2. Render Client Component with fetched Supabase data
    return <UsersTable initialUsers={rawUsers as unknown as RawAdminUser[]} />;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Unexpected exception in app/admin/page.tsx:', err);
    return (
      <div className="p-6 max-w-4xl mx-auto my-8 bg-rose-950/40 border border-rose-800/80 rounded-2xl text-rose-200">
        <div className="flex items-center gap-3 mb-3 text-rose-400">
          <span className="material-symbols-outlined text-2xl">warning</span>
          <h2 className="text-lg font-bold">Unexpected Server Error</h2>
        </div>
        <p className="text-sm text-rose-300 mb-2">
          An exception was thrown while fetching data:
        </p>
        <pre className="p-3 bg-black/50 rounded-lg text-xs font-mono text-rose-200 overflow-x-auto border border-rose-900">
          {errorMsg}
        </pre>
      </div>
    );
  }
}
