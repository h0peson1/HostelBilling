'use client';

import React from 'react';

export default function RouterSyncPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          Core Network Infrastructure • MikroTik RouterOS & FreeRADIUS
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
          Router Sync
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Synchronize resident hardware MAC bindings, IP pools, and queue bandwidth limits with hostel APs.
        </p>
      </div>

      {/* Gateway Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block">RouterOS Gateway</span>
          <span className="text-2xl font-bold font-headline-md text-emerald-400 mt-1 block">Connected</span>
          <span className="text-[11px] font-mono text-slate-400 mt-1 block">10.142.28.1 (v7.14)</span>
        </div>
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block">Active DHCP Leases</span>
          <span className="text-2xl font-bold font-headline-md text-indigo-400 mt-1 block">128 Leases</span>
          <span className="text-[11px] font-mono text-slate-400 mt-1 block">Pool: 10.142.28.0/22</span>
        </div>
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block">FreeRADIUS Clients</span>
          <span className="text-2xl font-bold font-headline-md text-white mt-1 block">4 APs Online</span>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Omada EAP670 Wi-Fi 6</span>
        </div>
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block">Last Full Sync</span>
          <span className="text-2xl font-bold font-headline-md text-amber-400 mt-1 block">18s ago</span>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 block">Zero Sync Errors</span>
        </div>
      </div>

      {/* Placeholder Workspace Card */}
      <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <span className="material-symbols-outlined text-2xl">sync</span>
        </div>
        <h2 className="text-lg font-bold font-heading text-white">Automated MikroTik RouterOS Bridge</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Synchronizes registered student MAC addresses directly into MikroTik Simple Queues and RADIUS MAC authentication tables.
        </p>
      </div>

    </div>
  );
}
