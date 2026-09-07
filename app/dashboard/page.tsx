'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the rich student-dashboard portal view
    window.location.href = '/student-dashboard.html';
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center max-w-sm w-full">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 animate-bounce">
          <span className="material-symbols-outlined text-2xl">wifi</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Connecting to Dashboard</h2>
        <p className="text-xs text-slate-500">Synchronizing Wi-Fi quota and telemetry...</p>
      </div>
    </div>
  );
}
