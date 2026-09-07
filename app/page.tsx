'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CaptivePortalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read the mac and ip values from the URL query string
  // If mac is not present in URL (e.g. during local development), fall back to '00:11:22:33:44:55'
  const macQuery =
    searchParams.get('mac') ||
    searchParams.get('mac_address') ||
    searchParams.get('client_mac');
  const macAddress = macQuery && macQuery.trim() ? macQuery.trim() : '00:11:22:33:44:55';

  const ipQuery =
    searchParams.get('ip') ||
    searchParams.get('client_ip');
  const ipAddress = ipQuery && ipQuery.trim() ? ipQuery.trim() : '10.142.28.94';

  const [phone, setPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!phone.trim() || !roomNumber.trim()) {
      setErrorMsg('Please provide both your phone number and room number.');
      return;
    }

    setLoading(true);

    try {
      // 1. Send silent registration POST request with phone, room_number, and mac_address
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone.trim(),
          room_number: roomNumber.trim(),
          mac_address: macAddress,
          ip: ipAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed. Please try again.');
      }

      setSuccessMsg('Silent authentication approved! Redirecting to dashboard...');

      // Store local session and user profile for dashboard synchronization
      if (typeof window !== 'undefined') {
        const sessionPayload = {
          identifier: phone.trim(),
          phone: data.user?.phone_number || phone.trim(),
          room: data.user?.room_number || roomNumber.trim(),
          userId: data.user?.id || null,
          token: data.session?.access_token || null,
          mac: data.device?.mac_address || macAddress,
          ip: ipAddress,
        };
        localStorage.setItem('HOSTEL_WIFI_SESSION_V1', JSON.stringify(sessionPayload));

        // Update default state so student dashboard displays their live credentials
        try {
          const rawState = localStorage.getItem('HOSTEL_WIFI_STATE_V2');
          const state = rawState ? JSON.parse(rawState) : {};
          if (!state.currentStudent) state.currentStudent = {};
          if (data.user?.full_name) state.currentStudent.name = data.user.full_name;
          state.currentStudent.phone = phone.trim();
          state.currentStudent.room = roomNumber.trim();
          state.currentStudent.mac = data.device?.mac_address || macAddress;
          state.currentStudent.ip = ipAddress;
          localStorage.setItem('HOSTEL_WIFI_STATE_V2', JSON.stringify(state));
        } catch {
          // ignore local state parse errors
        }
      }

      // 2. On 200 OK response, use router.push('/dashboard')
      setTimeout(() => {
        router.push('/dashboard');
      }, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to network.';
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden transition-all duration-200">

        {/* Card Header */}
        <div className="p-6 sm:p-8 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hostel Wi-Fi Captive Portal • WPA3 Enterprise
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline-lg text-slate-900 tracking-tight">
            Welcome to Hopeson’s Net
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Enter your student phone number and room number for silent instant network onboarding.
          </p>
        </div>

        {/* Prominent Network Hardware Telemetry Display (Above Input Fields) */}
        <div className="px-6 sm:px-8 py-3 bg-slate-50 border-y border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">devices</span>
            </div>
            <span className="text-slate-500 font-sans font-semibold">MAC:</span>
            <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              {macAddress}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">router</span>
            </div>
            <span className="text-slate-500 font-sans font-semibold">IP:</span>
            <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              {ipAddress}
            </span>
          </div>
        </div>

        {/* Single Static Form Container */}
        <div className="p-6 sm:p-8 pt-6">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5">
              <span className="material-symbols-outlined text-rose-600 text-xl">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Student Phone Number Input */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-slate-700 mb-1.5" htmlFor="phone">
                Student Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-xl">call</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="e.g. 0245123456 or 0552420079"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none"
                />
              </div>
            </div>

            {/* Hostel Room Number Input */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-slate-700 mb-1.5" htmlFor="room_number">
                Hostel Room Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-xl">meeting_room</span>
                </div>
                <input
                  id="room_number"
                  type="text"
                  required
                  placeholder="e.g. B3-102 or Room 204"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none"
                />
              </div>
            </div>

            {/* Auto-bind Hardware Device Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-600"
                />
                <span>Auto-bind this hardware device (Silent Registration)</span>
              </label>
            </div>

            {/* Main Connect to Internet Button */}
            <button
              id="submit-btn"
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-4"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Connecting to Network…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">bolt</span>
                  <span>Connect to Internet</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>FreeRADIUS Gigabit Uplink: Online</span>
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Unthrottled Unlimited
          </span>
        </div>

      </div>
    </div>
  );
}

export default function CaptivePortalPage() {
  return (
    <>
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-2xl">wifi</span>
            </div>
            <div>
              <span className="text-lg font-bold text-indigo-900 tracking-tight block leading-tight">
                Hopeson’s Net
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300/80 text-slate-800 hover:text-indigo-600 font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-indigo-600">admin_panel_settings</span>
              <span>Admin</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container with Suspense boundary for useSearchParams */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12 wave-bg">
        <Suspense fallback={
          <div className="p-8 text-center text-slate-500 font-medium">
            Loading Captive Portal Gateway...
          </div>
        }>
          <CaptivePortalForm />
        </Suspense>
      </main>

      {/* Page Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>© 2026 Hopeson’s Net Management Portal. All rights reserved.</div>
          <div className="flex items-center justify-center gap-4">
            <a href="/admin" className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline">Admin Dashboard</a>
            <span>•</span>
            <a href="/admin-login.html" className="text-slate-500 hover:text-slate-700 hover:underline">NetOps Login</a>
          </div>
        </div>
      </footer>
    </>
  );
}
