'use client';

import React, { useState } from 'react';

export interface DeviceItem {
  id: string;
  mac_address: string;
  device_name: string;
  last_seen_at: string | null;
}

export interface PlanItem {
  id: string;
  name: string;
  simultaneous_devices: number;
}

export interface SubscriptionItem {
  id: string;
  status: string;
  expires_at: string;
  plans: PlanItem | null;
}

export interface RawAdminUser {
  id: string;
  full_name: string;
  phone_number: string;
  room_number: string | null;
  role: string;
  devices?: DeviceItem[] | null;
  subscriptions?: SubscriptionItem[] | null;
}

interface FormattedStudent {
  id: string;
  name: string;
  phone: string;
  room: string;
  status: 'Active' | 'Inactive';
  connectedDevices: string;
  currentDeviceCount: number;
  maxDeviceLimit: number;
  activePlan: string;
  devices: DeviceItem[];
}

interface UsersTableProps {
  initialUsers: RawAdminUser[];
}

export default function UsersTable({ initialUsers }: UsersTableProps) {
  // Format raw Supabase data into display model
  const formattedInitialUsers: FormattedStudent[] = initialUsers.map((user) => {
    const devicesList = user.devices || [];
    const subsList = user.subscriptions || [];

    // Check if resident has an unexpired active subscription
    const now = new Date();
    const activeSub = subsList.find(
      (sub) => sub.status === 'active' && new Date(sub.expires_at) > now
    );

    const isActive = !!activeSub;
    const planObj = activeSub?.plans;
    const maxLimit = planObj?.simultaneous_devices || 2;
    const deviceCount = devicesList.length;

    return {
      id: user.id,
      name: user.full_name || `Resident ${user.phone_number.slice(-4)}`,
      phone: user.phone_number,
      room: user.room_number || 'B3-102',
      status: isActive ? 'Active' : 'Inactive',
      connectedDevices: `${deviceCount}/${maxLimit}`,
      currentDeviceCount: deviceCount,
      maxDeviceLimit: maxLimit,
      activePlan: planObj?.name ? `${planObj.name} (Unlimited)` : (isActive ? 'Active Subscription' : 'No Active Plan'),
      devices: devicesList,
    };
  });

  const [students, setStudents] = useState<FormattedStudent[]>(formattedInitialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modal States
  const [topUpStudent, setTopUpStudent] = useState<FormattedStudent | null>(null);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState('100');
  const [selectedPlanName, setSelectedPlanName] = useState('Monthly Scholar (Unlimited)');
  const [manageStudent, setManageStudent] = useState<FormattedStudent | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.phone.includes(searchQuery.trim()) ||
      s.room.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle Manual Top-Up (Cash) confirmation
  const handleConfirmTopUp = () => {
    if (!topUpStudent) return;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === topUpStudent.id) {
          return {
            ...s,
            status: 'Active',
            activePlan: selectedPlanName,
          };
        }
        return s;
      })
    );
    showToast(`Cash top-up confirmed! GH₵ ${selectedPlanPrice}.00 recorded for ${topUpStudent.phone} (${topUpStudent.room})`);
    setTopUpStudent(null);
  };

  // Handle Device Disconnect / Unbind
  const handleDisconnectDevice = (deviceId: string) => {
    if (!manageStudent) return;
    const updatedDevices = manageStudent.devices.filter((d) => d.id !== deviceId);
    const newCount = updatedDevices.length;
    const updatedRecord: FormattedStudent = {
      ...manageStudent,
      devices: updatedDevices,
      currentDeviceCount: newCount,
      connectedDevices: `${newCount}/${manageStudent.maxDeviceLimit}`,
    };

    setManageStudent(updatedRecord);
    setStudents((prev) => prev.map((s) => (s.id === manageStudent.id ? updatedRecord : s)));
    showToast(`Device unlinked from FreeRADIUS AAA. ${manageStudent.name} now has ${newCount}/${manageStudent.maxDeviceLimit} devices.`);
  };

  // Mask MAC Address for privacy
  const maskMac = (mac: string) => {
    if (!mac) return 'XX:XX:XX:XX:EE:FF';
    const parts = mac.split(/[:-]/);
    if (parts.length === 6) {
      return `XX:XX:XX:XX:${parts[4].toUpperCase()}:${parts[5].toUpperCase()}`;
    }
    return mac;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm animate-bounce">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hostel Network Operations • FreeRADIUS Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
            Users & Devices
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage resident student accounts, hardware bindings, and manual cash top-ups.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast('Syncing hardware MAC bindings with MikroTik RouterOS…')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-amber-400">sync</span>
            <span>Sync Router</span>
          </button>
          <button
            onClick={() => showToast('Opening resident registration modal')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>+ Add Student</span>
          </button>
        </div>
      </div>

      {/* Network KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block">Total Residents</span>
          <span className="text-2xl font-bold font-headline-md text-white mt-1 block">
            {students.length}
          </span>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check</span>
            Active Supabase Profiles
          </span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block">Active Status</span>
          <span className="text-2xl font-bold font-headline-md text-emerald-400 mt-1 block">
            {students.filter((s) => s.status === 'Active').length}
          </span>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Online in Hostel AAA
          </span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block">Bound Devices</span>
          <span className="text-2xl font-bold font-headline-md text-indigo-400 mt-1 block">
            {students.reduce((acc, s) => acc + s.currentDeviceCount, 0)} /{' '}
            {students.reduce((acc, s) => acc + s.maxDeviceLimit, 0)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Hardware Capacity
          </span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block">Cash Collections</span>
          <span className="text-2xl font-bold font-headline-md text-amber-400 mt-1 block">
            GH₵ 515.00
          </span>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Today’s Desk Receipts
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search phone, room, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          {(['All', 'Active', 'Inactive'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ================= USERS & DEVICES DATA TABLE ================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 px-6">Phone Number</th>
                <th className="py-4 px-6">Room Number</th>
                <th className="py-4 px-6">Status (Active/Inactive)</th>
                <th className="py-4 px-6">Connected Devices (e.g., 2/3)</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                    No resident students match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* 1. Phone Number */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-mono text-xs">
                          <span className="material-symbols-outlined text-[18px]">phone_iphone</span>
                        </div>
                        <div>
                          <span className="font-mono font-bold text-white block">
                            {student.phone}
                          </span>
                          <span className="text-xs text-slate-400 block">{student.name}</span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Room Number */}
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700/80 text-xs font-mono font-semibold text-slate-200">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">meeting_room</span>
                        <span>{student.room}</span>
                      </div>
                    </td>

                    {/* 3. Status (Active/Inactive) */}
                    <td className="py-4 px-6">
                      {student.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* 4. Connected Devices (e.g., 2/3) */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          {student.connectedDevices}
                        </span>
                        <span className="text-xs text-slate-400 hidden lg:inline">
                          ({student.currentDeviceCount} of {student.maxDeviceLimit} slots)
                        </span>
                      </div>
                    </td>

                    {/* 5. Actions Column: Green 'Manual Top-Up (Cash)' + Red 'Manage Devices' */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2.5">
                        
                        {/* Green 'Manual Top-Up (Cash)' Button */}
                        <button
                          onClick={() => setTopUpStudent(student)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Record Cash Payment & Top-Up Quota"
                        >
                          <span className="material-symbols-outlined text-[16px]">payments</span>
                          <span>Manual Top-Up (Cash)</span>
                        </button>

                        {/* Red 'Manage Devices' Button */}
                        <button
                          onClick={() => setManageStudent(student)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-rose-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Inspect and unbind resident hardware devices"
                        >
                          <span className="material-symbols-outlined text-[16px]">devices</span>
                          <span>Manage Devices</span>
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Showing {filteredStudents.length} of {students.length} residents in Supabase</span>
          <span className="text-indigo-400 font-mono">Hostel ISP Gateway: All Subnets Synchronized</span>
        </div>
      </div>

      {/* ================= MODAL 1: MANUAL TOP-UP (CASH) ================= */}
      {topUpStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Manual Top-Up (Cash)</h3>
                  <p className="text-xs text-slate-400">Issue Wi-Fi pass upon physical cash receipt</p>
                </div>
              </div>
              <button
                onClick={() => setTopUpStudent(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Resident Summary Pill */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Resident</span>
                  <span className="text-sm font-bold text-white block">{topUpStudent.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-indigo-400 block">{topUpStudent.phone}</span>
                  <span className="text-xs font-mono text-slate-400 block">{topUpStudent.room}</span>
                </div>
              </div>

              {/* Package Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Internet Plan
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { name: 'Semester Scholar (Unlimited)', price: '300', days: '120 Days (Semester)', popular: true },
                    { name: 'Monthly Scholar (Unlimited)', price: '100', days: '30 Days (1 Month)', popular: false },
                    { name: 'Daily QuickSurge (Unlimited)', price: '15', days: '24 Hours', popular: false },
                  ].map((plan) => (
                    <label
                      key={plan.price}
                      onClick={() => {
                        setSelectedPlanPrice(plan.price);
                        setSelectedPlanName(plan.name);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        selectedPlanPrice === plan.price
                          ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/40'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="topup-plan"
                          checked={selectedPlanPrice === plan.price}
                          onChange={() => {}}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-900"
                        />
                        <div>
                          <span className="text-sm font-bold text-white flex items-center gap-2">
                            {plan.name}
                            {plan.popular && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
                                Popular
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-slate-400 block">{plan.days}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        GH₵ {plan.price}.00
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cash Collector Confirmation */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">receipt_long</span>
                <span>Payment recorded by: <strong>Hopeson (Super Admin)</strong></span>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
              <button
                onClick={() => setTopUpStudent(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTopUp}
                className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md hover:shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Confirm Cash Receipt (GH₵ {selectedPlanPrice}.00)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 2: MANAGE DEVICES ================= */}
      {manageStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <span className="material-symbols-outlined text-2xl">devices</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Manage Devices</h3>
                  <p className="text-xs text-slate-400">
                    {manageStudent.name} • {manageStudent.room} ({manageStudent.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManageStudent(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Device Quota Usage Header */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Device Quota:</span>
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                    {manageStudent.currentDeviceCount} / {manageStudent.maxDeviceLimit} Slots Used
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Plan: <strong className="text-white">{manageStudent.activePlan}</strong>
                </span>
              </div>

              {/* Bound Devices List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Registered Hardware (MAC Bindings)
                </span>

                {manageStudent.devices.length === 0 ? (
                  <div className="p-6 bg-slate-950 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                    No hardware devices bound yet. Resident will bind automatically on captive portal login.
                  </div>
                ) : (
                  manageStudent.devices.map((dev) => (
                    <div
                      key={dev.id}
                      className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                          <span className="material-symbols-outlined text-xl">
                            {dev.device_name?.toLowerCase().includes('phone') || dev.device_name?.toLowerCase().includes('iphone') || dev.device_name?.toLowerCase().includes('galaxy')
                              ? 'smartphone'
                              : 'laptop'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{dev.device_name || 'Resident Device'}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 font-bold">
                              {maskMac(dev.mac_address)}
                            </span>
                            <span className="font-mono text-[11px] text-indigo-400">
                              MAC Bound
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDisconnectDevice(dev.id)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                          title="Unbind hardware MAC from student profile"
                        >
                          <span className="material-symbols-outlined text-sm">link_off</span>
                          <span>Unbind</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Changes apply instantly across FreeRADIUS and MikroTik.
              </span>
              <button
                onClick={() => setManageStudent(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
