'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('HOSTEL_WIFI_SESSION_V1');
      localStorage.removeItem('HOSTEL_WIFI_ADMIN_SESSION');
    }
    router.push('/');
  };

  const navLinks = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: 'dashboard',
      active: pathname === '/admin',
    },
    {
      name: 'Users & Devices',
      href: '/admin',
      icon: 'manage_accounts',
      active: pathname === '/admin',
      badge: 'Active',
    },
    {
      name: 'Revenue',
      href: '/admin/revenue',
      icon: 'payments',
      active: pathname === '/admin/revenue',
    },
    {
      name: 'Router Sync',
      href: '/admin/router-sync',
      icon: 'sync',
      active: pathname === '/admin/router-sync',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================= PERSISTENT LEFT SIDEBAR ================= */}
        <aside className="w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between shrink-0 z-20 backdrop-blur-md">
          <div className="p-4 space-y-6">
            
            {/* ISP Brand Header */}
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <span className="material-symbols-outlined text-[24px]">wifi_tethering</span>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full ring-2 ring-emerald-500/20 animate-pulse"></span>
              </div>
              <div className="min-w-0">
                <span className="text-base font-bold font-headline-md tracking-tight block text-white truncate">
                  Hopeson’s NetOps
                </span>
                <span className="text-[11px] font-medium text-indigo-400 block tracking-wider uppercase truncate">
                  Hostel ISP Gateway
                </span>
              </div>
            </div>

            {/* Network Operational Status Badge */}
            <div className="px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700/60 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-slate-300 font-sans text-[11px]">FreeRADIUS AAA</span>
              </div>
              <span className="text-emerald-400 font-bold text-[11px]">Online</span>
            </div>

            {/* Primary Navigation Links */}
            <nav aria-label="ISP Admin Navigation" className="space-y-1.5 pt-1">
              {navLinks.map((item, index) => {
                const isItemActive =
                  item.name === 'Users & Devices'
                    ? pathname === '/admin'
                    : pathname === item.href && item.name !== 'Dashboard';

                return (
                  <Link
                    key={`${item.name}-${index}`}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                      isItemActive
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] transition-colors ${
                        isItemActive
                          ? 'text-indigo-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && isItemActive && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

          </div>

          {/* Sidebar Footer: Admin Profile & Sign Out Button */}
          <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-900/60">
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-500/40">
                HA
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">Hopeson (Super Admin)</p>
                <p className="text-[11px] text-slate-400 truncate">NetOps Administrator</p>
              </div>
            </div>
            
            {/* Sign Out Action Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>

        </aside>

        {/* ================= MAIN CONTENT WORKSPACE ================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950">
          
          {/* Top Admin Navigation Header */}
          <header className="sticky top-0 z-10 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 sm:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
                Zone: Hall B Floor 3
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                AP04 Uplink: 1.0 Gbps (0.8ms Ping)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-xs text-slate-400 block">Hostel Core Gateway</span>
                <span className="text-xs font-mono font-semibold text-indigo-300 block">IP: 10.142.28.1</span>
              </div>
              <Link
                href="/dashboard"
                className="text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                Student View
              </Link>
            </div>
          </header>

          {/* Main Children Canvas */}
          <main className="flex-1 p-6 sm:p-8">
            {children}
          </main>

          {/* Admin Footer */}
          <footer className="border-t border-slate-800/60 py-4 px-8 text-center text-xs text-slate-500 bg-slate-950">
            Hopeson’s NetOps Wi-Fi Management Console • RADIUS AAA & MikroTik RouterOS Sync • 2026
          </footer>

        </div>

      </div>
    </div>
  );
}
