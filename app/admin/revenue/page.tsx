'use client';

import React from 'react';

export default function RevenuePage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Financial Management • MoMo & Cash Gateway
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline-lg text-white tracking-tight">
          Revenue Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Track hostel Wi-Fi subscriptions, Paystack Mobile Money transactions, and cash desk top-ups.
        </p>
      </div>

      {/* Revenue KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block">Total Revenue (MTD)</span>
          <span className="text-2xl font-bold font-headline-md text-emerald-400 mt-1 block">GH₵ 12,450.00</span>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">+18.4% vs last month</span>
        </div>
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block">Mobile Money (Paystack)</span>
          <span className="text-2xl font-bold font-headline-md text-indigo-400 mt-1 block">GH₵ 8,950.00</span>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">MTN, Telecel & AT MoMo</span>
        </div>
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block">Desk Cash Collections</span>
          <span className="text-2xl font-bold font-headline-md text-amber-400 mt-1 block">GH₵ 3,500.00</span>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Manual admin receipts</span>
        </div>
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block">Active Paid Passes</span>
          <span className="text-2xl font-bold font-headline-md text-white mt-1 block">94 Residents</span>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Semester & Monthly Scholars</span>
        </div>
      </div>

      {/* Placeholder Workspace Card */}
      <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
          <span className="material-symbols-outlined text-2xl">payments</span>
        </div>
        <h2 className="text-lg font-bold text-white">Revenue & Billing Audit Feed</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Detailed financial ledger syncing with Supabase <code className="text-indigo-400">payments</code> table and Paystack webhook event stream.
        </p>
      </div>

    </div>
  );
}
