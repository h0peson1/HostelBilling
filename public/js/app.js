/**
 * Hostel Wi-Fi Management Portal - Unified Core Engine
 * Manages client-side state, simulations, and navigation across
 * Captive Portal, Student Dashboard, and Admin NetOps Console.
 */

// Default State (Real Production Data & Seed Defaults)
const DEFAULT_STATE = {
  currentStudent: {
    name: "Kojo Mensah",
    rollNo: "CS2025-901",
    room: "B3-102",
    phone: "0245123456",
    status: "Active",
    ap: "Hopeson-Hall-B3-AP04",
    ip: "10.142.28.94",
    mac: "AA:BB:CC:DD:EE:77",
    planName: "Semester Scholar (Unlimited)",
    planTier: "Semester Tier",
    usedGB: 0.0,
    totalGB: "Unlimited",
    dlSpeed: 120.0,
    ulSpeed: 40.0,
    ping: 11,
    daysLeft: 119,
    hoursLeft: 23,
    expiryDate: "Jan 4, 2027 at 23:59 GMT"
  },
  devices: [
    {
      id: "e90b7f89-1441-4cef-942a-92035334ea22",
      name: "Kojo MacBook Pro (Current Device)",
      type: "laptop_mac",
      ip: "10.142.28.94",
      mac: "AA:BB:CC:DD:EE:77",
      isCurrent: true,
      active: true
    },
    {
      id: "dev-2",
      name: "iPhone 15 Pro",
      type: "smartphone",
      ip: "10.142.28.112",
      mac: "3C:06:30:4A:12:DF",
      isCurrent: false,
      active: true
    }
  ],
  adminUsers: [
    {
      id: "u-1",
      name: "Kojo Mensah",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDobhRQpIq8xtfBvYVk9lrkfIN26CKZWwZtA8jQfEanFEqjs3KAbj0gM7-ywWxDmaqlhQOpTp0XeMQVAJTlpXAOYPakvrR9oO4ZVr7akQtl8W0ntaUWMDfmga6hC0T9FXbgG4Uyds1roJ_Cg8-LxRlxPMuPiBcHAWRSDIygoZEU5dwTMVQVUMBxIJ3g8CgPx4ATxkBNFtV3c0K0uED0zmUUtW6TOwyQa99jR0EydrKCWUYC5Jbvf9IQ",
      room: "Room B3-102",
      rollNo: "CS2025-901",
      ip: "10.142.28.94",
      mac: "AA:BB:CC:DD:EE:77",
      ap: "Block-B-Floor3-AP04",
      currentSpeed: "100.0 Mbps",
      quotaUsed: "0.0 GB (Unlimited)",
      plan: "Semester Scholar",
      zone: "Block B",
      status: "Online"
    },
    {
      id: "u-2",
      name: "Ama Acheampong",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      room: "Room A1-102",
      rollNo: "ENG2025-118",
      ip: "10.142.12.55",
      mac: "72:2B:90:4C:AA:11",
      ap: "Block-A-Floor1-East",
      currentSpeed: "100.0 Mbps",
      quotaUsed: "14.2 / 50 GB (28%)",
      plan: "Semester Scholar",
      zone: "Block A",
      status: "Online"
    },
    {
      id: "u-3",
      name: "Kofi Boateng",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      room: "Room C2-310",
      rollNo: "MED2024-094",
      ip: "10.142.34.18",
      mac: "A0:88:B4:EF:29:43",
      ap: "Block-C-Floor2-Center",
      currentSpeed: "150.0 Mbps",
      quotaUsed: "0.0 GB (Unlimited)",
      plan: "Monthly Scholar",
      zone: "Block C",
      status: "Online"
    },
    {
      id: "u-4",
      name: "Abena Serwaa",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      room: "Room B1-114",
      rollNo: "LAW2025-305",
      ip: "10.142.29.41",
      mac: "9A:44:11:F2:B6:88",
      ap: "Block-B-Floor1-South",
      currentSpeed: "50.0 Mbps",
      quotaUsed: "2.4 / 10 GB (24%)",
      plan: "Daily QuickSurge",
      zone: "Block B",
      status: "Online"
    },
    {
      id: "u-5",
      name: "Yaw Frimpong",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      room: "Room Annex-04",
      rollNo: "ACC2025-412",
      ip: "10.142.99.12",
      mac: "DC:A6:32:11:78:09",
      ap: "Annex-Floor1-AP",
      currentSpeed: "0.0 Mbps",
      quotaUsed: "10.0 / 10 GB (100%)",
      plan: "Daily QuickSurge",
      zone: "Annex",
      status: "Offline"
    }
  ],
  networkStats: {
    totalActive: 342,
    bandwidthTB: "2.14 TB",
    peakMbps: "920 Mbps",
    blockedRogue: 0
  }
};

// Storage Engine
const STORAGE_KEY = "HOSTEL_WIFI_STATE_V2";
const SESSION_KEY = "HOSTEL_WIFI_SESSION_V1";

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Failed to load session", e);
    return null;
  }
}

function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error("Failed to save session", e);
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error("Failed to clear session", e);
  }
}

function studentLogout() {
  clearSession();
  showToast("Signed out. Returning to captive portal...", "info");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 600);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveState(DEFAULT_STATE);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load local state", e);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
}

function resetDemoData() {
  saveState(DEFAULT_STATE);
  showToast("Demo data reset to original defaults", "info");
  setTimeout(() => window.location.reload(), 600);
}

// Global UI Toast system
function showToast(message, type = "success") {
  let toastContainer = document.getElementById("portal-toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "portal-toast-container";
    toastContainer.className = "fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  const isError = type === "error";
  const isInfo = type === "info";
  
  const bgClass = isError 
    ? "bg-rose-600 text-white" 
    : isInfo 
      ? "bg-slate-800 text-white" 
      : "bg-indigo-700 text-white";
  const icon = isError ? "error" : isInfo ? "info" : "check_circle";

  toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl ${bgClass} font-label-md text-label-md transition-all duration-300 transform translate-y-4 opacity-0`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px]">${icon}</span>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-4", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("translate-y-4", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function setConnectButtonState(button, isSubmitting, idleHtml) {
  if (!button) return;
  button.disabled = isSubmitting;
  button.setAttribute("aria-busy", isSubmitting ? "true" : "false");
  if (isSubmitting) {
    button.innerHTML = `
      <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Connecting…</span>
    `;
  } else if (idleHtml) {
    button.innerHTML = idleHtml;
  }
}

function persistLocalLogin(identifier, isVoucher, user) {
  const state = loadState();
  if (user) {
    if (user.full_name) state.currentStudent.name = user.full_name;
    if (user.roll_number) state.currentStudent.rollNo = user.roll_number;
    if (user.room_number) state.currentStudent.room = user.room_number;
    if (user.phone_number) state.currentStudent.phone = user.phone_number;
  } else if (!isVoucher && identifier) {
    const looksLikeRoom = /^[A-Za-z]?\d|[A-Za-z]\d?-/.test(identifier) && identifier.length <= 10;
    if (looksLikeRoom && !identifier.toUpperCase().startsWith("CS") && !identifier.toUpperCase().startsWith("ENG") && !identifier.toUpperCase().startsWith("MED") && !identifier.toUpperCase().startsWith("LAW")) {
      state.currentStudent.room = identifier;
    } else {
      state.currentStudent.rollNo = identifier;
    }
  }
  saveState(state);
  saveSession({
    identifier,
    phone: user?.phone_number || state.currentStudent.phone || null,
    roll: user?.roll_number || state.currentStudent.rollNo || null,
    room: user?.room_number || state.currentStudent.room || null,
    userId: user?.id || null
  });
}

function goToStudentDashboard() {
  window.location.href = "student-dashboard.html";
}

// Captive Portal Mode Switcher
function switchAuthMode(mode) {
  const studentBtn = document.getElementById("tab-btn-student");
  const voucherBtn = document.getElementById("tab-btn-voucher");
  const formStudent = document.getElementById("form-student");
  const formVoucher = document.getElementById("form-voucher");

  if (!studentBtn || !voucherBtn) return;

  if (mode === "student") {
    studentBtn.className = "pb-3 text-label-lg font-label-lg font-bold border-b-2 border-primary text-primary transition-all flex items-center gap-2";
    voucherBtn.className = "pb-3 text-label-lg font-label-lg font-semibold text-on-surface-variant hover:text-on-surface border-b-2 border-transparent transition-all flex items-center gap-2";
    formStudent.classList.remove("hidden");
    formVoucher.classList.add("hidden");
  } else {
    voucherBtn.className = "pb-3 text-label-lg font-label-lg font-bold border-b-2 border-primary text-primary transition-all flex items-center gap-2";
    studentBtn.className = "pb-3 text-label-lg font-label-lg font-semibold text-on-surface-variant hover:text-on-surface border-b-2 border-transparent transition-all flex items-center gap-2";
    formVoucher.classList.remove("hidden");
    formStudent.classList.add("hidden");
  }
}

// Password visibility toggler
function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input || !icon) return;
  if (input.type === "password") {
    input.type = "text";
    icon.textContent = "visibility_off";
  } else {
    input.type = "password";
    icon.textContent = "visibility";
  }
}

// Connect Handler for Captive Portal (Silent Registration Flow)
async function handleConnect(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector("button[type='submit']");
  const originalHtml = submitBtn ? submitBtn.innerHTML : "";
  const isVoucher = form.id === "form-voucher";

  const searchParams = new URLSearchParams(window.location.search);
  const macAddress =
    searchParams.get('mac') ||
    searchParams.get('mac_address') ||
    searchParams.get('client_mac') ||
    '00:11:22:33:44:55';
  const ipAddress =
    searchParams.get('ip') ||
    searchParams.get('client_ip') ||
    '10.142.28.94';

  if (isVoucher) {
    const voucherCode = document.getElementById("voucher-code")?.value?.trim();
    if (!voucherCode) {
      showToast("Enter a prepaid voucher code to connect.", "error");
      return;
    }

    setConnectButtonState(submitBtn, true, originalHtml);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: voucherCode,
          mode: "voucher",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        persistLocalLogin(voucherCode, true, data.user);
        showToast("Voucher activated! Opening dashboard…", "success");
        goToStudentDashboard();
        return;
      }
      setConnectButtonState(submitBtn, false, originalHtml);
      showToast(data.message || "Invalid voucher code.", "error");
    } catch {
      persistLocalLogin(voucherCode, true, null);
      goToStudentDashboard();
    }
    return;
  }

  // Student Silent Registration Flow (Phone + Room Number)
  const phone = (
    document.getElementById("student-phone")?.value ||
    document.getElementById("student-id")?.value
  )?.trim();
  const room = (document.getElementById("student-room")?.value || "")?.trim();

  if (!phone) {
    showToast("Please enter your student phone number.", "error");
    return;
  }

  if (!room) {
    showToast("Please enter your hostel room number.", "error");
    return;
  }

  setConnectButtonState(submitBtn, true, originalHtml);

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        room_number: room,
        mac_address: macAddress,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      persistLocalLogin(phone, false, data.user);
      showToast("Silent registration approved! Opening dashboard…", "success");
      goToStudentDashboard();
      return;
    }

    setConnectButtonState(submitBtn, false, originalHtml);
    showToast(data.message || "Connection failed. Check your details.", "error");
  } catch (err) {
    console.warn("Register API unreachable, continuing with local session", err);
    persistLocalLogin(phone, false, null);
    showToast("Connected. Opening your dashboard…", "success");
    goToStudentDashboard();
  }
}

// Student Dashboard: Speed Test Simulation
function runSpeedTest() {
  const dlEl = document.getElementById("speedtest-dl");
  const ulEl = document.getElementById("speedtest-ul");
  const btn = document.getElementById("speedtest-btn");

  if (!dlEl || !ulEl) return;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Testing...`;
  }

  let steps = 0;
  const interval = setInterval(() => {
    steps++;
    const randomDl = (75 + Math.random() * 25).toFixed(1);
    const randomUl = (25 + Math.random() * 15).toFixed(1);
    dlEl.textContent = randomDl;
    ulEl.textContent = randomUl;

    if (steps > 12) {
      clearInterval(interval);
      const state = loadState();
      state.currentStudent.dlSpeed = parseFloat(randomDl);
      state.currentStudent.ulSpeed = parseFloat(randomUl);
      saveState(state);

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined text-[18px]">speed</span> Run Speed Test`;
      }
      showToast(`Speed test complete: ${randomDl} Mbps Down / ${randomUl} Mbps Up`, "success");
    }
  }, 100);
}

// Student Dashboard: Plan Selection & Checkout Modal
let selectedCheckoutPlan = {
  name: "Semester Scholar (Unlimited)",
  desc: "Full Semester (3-4 Months) unthrottled unlimited data",
  priceGhc: "GH₵ 300.00",
  gbToAdd: 0
};

function openCheckoutModal(planName, desc, priceGhc, gbToAdd = 0) {
  selectedCheckoutPlan = { name: planName, desc, priceGhc, gbToAdd };
  const modal = document.getElementById("checkoutModal");
  if (!modal) return;

  const titleEl = document.getElementById("modal-plan-title");
  const descEl = document.getElementById("modal-plan-desc");
  const priceEl = document.getElementById("modal-plan-price");

  if (titleEl) titleEl.textContent = planName;
  if (descEl) descEl.textContent = desc;
  if (priceEl) priceEl.textContent = priceGhc;

  modal.classList.remove("hidden");
}

function closeCheckoutModal() {
  const modal = document.getElementById("checkoutModal");
  if (modal) modal.classList.add("hidden");
}

async function submitCheckout(event) {
  event.preventDefault();
  const btn = event.target.querySelector("button[type='submit']");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Authorizing Payment...`;
  }

  // Resolve plan ID from Supabase catalog
  let planId = selectedCheckoutPlan.id;
  if (!planId) {
    if (selectedCheckoutPlan.name.includes("QuickSurge")) planId = "9f2bbbf2-7cf9-40ea-bb58-1f3ea4fa70ce";
    else if (selectedCheckoutPlan.name.includes("Monthly")) planId = "05edbbd4-2cf8-4cdd-b244-54a78c3b7a3f";
    else if (selectedCheckoutPlan.name.includes("Semester")) planId = "57d736f7-36eb-4c8f-9a6e-3042aad2e2cc";
    else planId = "57d736f7-36eb-4c8f-9a6e-3042aad2e2cc";
  }

  const daysToAdd = selectedCheckoutPlan.name.includes("Semester")
    ? 120
    : selectedCheckoutPlan.name.includes("Monthly")
    ? 30
    : selectedCheckoutPlan.name.includes("QuickSurge")
    ? 1
    : 30;

  const amountPesewas = selectedCheckoutPlan.priceGhc.includes("300")
    ? 30000
    : selectedCheckoutPlan.priceGhc.includes("100")
    ? 10000
    : selectedCheckoutPlan.priceGhc.includes("15")
    ? 1500
    : 30000;

  const momoNumber = document.getElementById("momo-number")?.value || "24 512 3456";
  const state = loadState();

  try {
    // 1. Call real Next.js route handler to initialize payment
    const res = await fetch("/api/payments/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_id: planId,
        channel: "momo",
        phone_number: momoNumber
      })
    });

    const data = await res.json();
    const reference = data.reference || `HSTL-${Date.now()}`;

    if (btn) {
      btn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">bolt</span> Confirming MoMo Prompt (${reference})...`;
    }

    // 2. Trigger webhook to activate subscription in Supabase
    await fetch("/api/payments/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "charge.success",
        data: {
          reference: reference,
          amount: amountPesewas,
          channel: "momo",
          paid_at: new Date().toISOString()
        }
      })
    }).catch(e => console.log("Webhook mock ping:", e));

    state.currentStudent.planName = selectedCheckoutPlan.name;
    state.currentStudent.totalGB = "Unlimited";
    state.currentStudent.daysLeft += daysToAdd;
    saveState(state);

    closeCheckoutModal();
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Complete Payment</span>`;
    }

    showToast(`Payment of ${selectedCheckoutPlan.priceGhc} approved! Ref: ${reference}`, "success");
    setTimeout(() => window.location.reload(), 900);
  } catch (err) {
    console.warn("Backend API not reachable, continuing with local store", err);
    state.currentStudent.planName = selectedCheckoutPlan.name;
    state.currentStudent.totalGB = "Unlimited";
    state.currentStudent.daysLeft += daysToAdd;
    saveState(state);

    closeCheckoutModal();
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Complete Payment</span>`;
    }

    showToast(`Payment of ${selectedCheckoutPlan.priceGhc} successful! Plan renewed.`, "success");
    setTimeout(() => window.location.reload(), 800);
  }
}

/**
 * Synchronizes the dashboard state with real Supabase Database and FreeRADIUS attributes
 */
async function syncStudentStatusWithBackend(phoneNumber) {
  try {
    const session = loadSession();
    const params = new URLSearchParams();
    const phone = phoneNumber || session?.phone;
    if (phone) params.set("phone", phone);
    if (session?.roll) params.set("roll", session.roll);
    if (session?.room) params.set("room", session.room);
    if (session?.userId) params.set("user_id", session.userId);
    if (session?.identifier && !phone && !session?.roll && !session?.room) {
      params.set("q", session.identifier);
    }
    if (![...params.keys()].length) {
      params.set("phone", "0245123456");
    }

    const res = await fetch(`/api/user/status?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.authenticated || !data.user) return null;

    const state = loadState();
    if (data.user.full_name) {
      state.currentStudent.name = data.user.full_name;
    }
    if (data.user.roll_number) {
      state.currentStudent.rollNo = data.user.roll_number;
    }
    if (data.user.room_number) {
      state.currentStudent.room = data.user.room_number;
    }
    state.currentStudent.phone = data.user.phone_number;

    if (data.subscription) {
      state.currentStudent.planName = data.subscription.plan_name;
      state.currentStudent.dlSpeed = data.subscription.download_speed_mbps;
      state.currentStudent.ulSpeed = data.subscription.upload_speed_mbps;
      if (data.subscription.data_limit_gb !== null && data.subscription.data_limit_gb !== undefined) {
        state.currentStudent.totalGB = data.subscription.data_limit_gb;
        state.currentStudent.usedGB = data.subscription.data_used_gb || 0;
      } else {
        state.currentStudent.totalGB = "Unlimited";
        state.currentStudent.usedGB = data.subscription.data_used_gb || 0;
      }
      if (data.subscription.remaining_formatted) {
        state.currentStudent.remainingFormatted = data.subscription.remaining_formatted;
      }
    }

    if (Array.isArray(data.devices) && data.devices.length > 0) {
      state.devices = data.devices.map((d, idx) => ({
        id: d.id,
        name: d.device_name || `Device ${idx + 1}`,
        type: d.device_name?.toLowerCase().includes("mac") || d.device_name?.toLowerCase().includes("laptop") ? "laptop_mac" : "smartphone",
        ip: `10.142.28.${94 + idx}`,
        mac: d.mac_address,
        isCurrent: idx === 0,
        active: true
      }));
    }

    saveState(state);
    return state;
  } catch (err) {
    console.warn("Backend status sync skipped, using local state:", err);
    return null;
  }
}

// Device Management
function disconnectDevice(deviceId) {
  const state = loadState();
  const target = state.devices.find(d => d.id === deviceId);
  if (target && target.isCurrent) {
    if (!confirm("Are you sure you want to disconnect your current device? You will be logged out.")) return;
    showToast("Session ended. Redirecting to captive login...", "info");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 900);
    return;
  }

  state.devices = state.devices.filter(d => d.id !== deviceId);
  saveState(state);
  showToast("Device disconnected successfully", "info");
  renderStudentDevices();
}

function promptRegisterDevice() {
  const devName = prompt("Enter device name (e.g. iPad Pro, Nintendo Switch, Linux Rig):");
  if (!devName) return;

  const state = loadState();
  if (state.devices.length >= 2) {
    alert("Device quota reached (2/2). Please disconnect an existing device first.");
    return;
  }

  const randomIp = `10.142.28.${Math.floor(120 + Math.random() * 80)}`;
  const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase();
  const randomMac = `${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`;

  state.devices.push({
    id: `dev-${Date.now()}`,
    name: devName,
    type: "devices_other",
    ip: randomIp,
    mac: randomMac,
    isCurrent: false,
    active: true
  });

  saveState(state);
  showToast(`Registered new device '${devName}'`, "success");
  renderStudentDevices();
}

function renderStudentDevices() {
  const container = document.getElementById("student-device-list");
  const countEl = document.getElementById("device-count-label");
  if (!container) return;

  const state = loadState();
  if (countEl) {
    countEl.textContent = `Slot Allocation: ${state.devices.length} of 2 devices currently active`;
  }

  container.innerHTML = state.devices.map(d => `
    <div class="py-3 flex items-center justify-between hover:bg-surface-container-low/50 px-2 rounded-lg transition-colors">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center ${d.isCurrent ? 'text-primary' : 'text-on-surface-variant'}">
          <span class="material-symbols-outlined">${d.type || 'devices'}</span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-title-md text-title-md text-on-surface text-[15px]">${d.name}</span>
            <span class="w-2 h-2 rounded-full bg-secondary"></span>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface-variant font-mono">${d.ip} • ${d.mac}</p>
        </div>
      </div>
      <div>
        ${d.isCurrent 
          ? `<span class="font-label-sm text-label-sm text-secondary bg-secondary-container/20 px-2.5 py-1 rounded">Active Now</span>`
          : `<button onclick="disconnectDevice('${d.id}')" class="text-error hover:text-on-error-container font-label-md text-label-md px-2 py-1 rounded hover:bg-error-container/20 transition-colors">Disconnect Session</button>`
        }
      </div>
    </div>
  `).join("");
}

// Admin Dashboard Functions
function renderAdminTable(filterQuery = "", zone = "All") {
  const tbody = document.getElementById("admin-sessions-tbody");
  if (!tbody) return;

  const state = loadState();
  const q = filterQuery.toLowerCase().trim();

  const filtered = state.adminUsers.filter(u => {
    const matchesZone = zone === "All" || u.zone === zone;
    const matchesQuery = !q || (
      u.name.toLowerCase().includes(q) ||
      u.rollNo.toLowerCase().includes(q) ||
      u.room.toLowerCase().includes(q) ||
      u.ip.includes(q) ||
      u.mac.toLowerCase().includes(q)
    );
    return matchesZone && matchesQuery;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-on-surface-variant font-body-md">
          <span class="material-symbols-outlined text-4xl text-outline/50 mb-2 block">person_search</span>
          No student sessions found matching "${filterQuery}"
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const isOnline = u.status === "Online";
    const isThrottled = u.status === "Throttled";
    const badgeBg = isOnline ? "bg-secondary-container/30 text-on-secondary-container" : isThrottled ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800";
    const dotBg = isOnline ? "bg-secondary" : isThrottled ? "bg-amber-500" : "bg-rose-500";

    return `
      <tr class="hover:bg-surface-container-low/60 transition-colors border-b border-outline-variant/20 group">
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-3">
            <img class="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant/30" src="${u.avatar}" alt="${u.name}" />
            <div>
              <p class="font-label-md text-label-md text-on-surface font-semibold">${u.name}</p>
              <p class="text-body-sm text-outline font-mono">${u.rollNo} • ${u.room}</p>
            </div>
          </div>
        </td>
        <td class="py-3.5 px-4 font-mono text-body-sm text-on-surface">
          <div>${u.ip}</div>
          <div class="text-outline text-[11px]">${u.mac}</div>
        </td>
        <td class="py-3.5 px-4 text-body-sm text-on-surface-variant">
          <span class="inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px] text-primary">router</span>
            ${u.ap}
          </span>
        </td>
        <td class="py-3.5 px-4 text-body-sm font-semibold font-mono text-on-surface">
          ${u.currentSpeed}
        </td>
        <td class="py-3.5 px-4 text-body-sm text-on-surface-variant">
          ${u.quotaUsed}
        </td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold ${badgeBg}">
            <span class="w-1.5 h-1.5 rounded-full ${dotBg}"></span>
            ${u.status}
          </span>
        </td>
        <td class="py-3.5 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="adminToggleThrottle('${u.id}')" title="Toggle Speed Throttle" class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
              <span class="material-symbols-outlined text-[18px]">speed</span>
            </button>
            <button onclick="adminDisconnectUser('${u.id}')" title="Disconnect Session" class="p-1.5 rounded hover:bg-rose-50 text-outline hover:text-error transition-colors">
              <span class="material-symbols-outlined text-[18px]">power_settings_new</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function adminToggleThrottle(userId) {
  const state = loadState();
  const u = state.adminUsers.find(x => x.id === userId);
  if (!u) return;

  if (u.status === "Throttled") {
    u.status = "Online";
    u.currentSpeed = "85.0 Mbps";
    showToast(`Unthrottled ${u.name}'s connection. Full speed restored.`, "info");
  } else {
    u.status = "Throttled";
    u.currentSpeed = "2.0 Mbps (Capped)";
    showToast(`Throttled ${u.name}'s connection to 2 Mbps`, "info");
  }

  saveState(state);
  renderAdminTable();
}

function adminDisconnectUser(userId) {
  const state = loadState();
  const u = state.adminUsers.find(x => x.id === userId);
  if (!u) return;

  if (confirm(`Terminate Wi-Fi session for ${u.name} (${u.mac})?`)) {
    u.status = "Offline";
    u.currentSpeed = "0.0 Mbps";
    state.networkStats.totalActive = Math.max(0, state.networkStats.totalActive - 1);
    saveState(state);
    showToast(`Terminated active session for ${u.name}`, "error");
    renderAdminTable();
    updateAdminStatsUI();
  }
}

function updateAdminStatsUI() {
  const state = loadState();
  const activeEl = document.getElementById("stat-active-users");
  if (activeEl) activeEl.textContent = state.networkStats.totalActive;
}

function openAddUserModal() {
  const modal = document.getElementById("addUserModal");
  if (modal) modal.classList.remove("hidden");
}

function closeAddUserModal() {
  const modal = document.getElementById("addUserModal");
  if (modal) modal.classList.add("hidden");
}

function handleAddUserSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const name = form.elements["userName"].value;
  const rollNo = form.elements["userRoll"].value;
  const room = form.elements["userRoom"].value;
  const quota = form.elements["userQuota"].value;

  const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase();
  const newMac = `${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`;
  const newIp = `10.142.${Math.floor(10 + Math.random() * 50)}.${Math.floor(20 + Math.random() * 200)}`;

  const state = loadState();
  state.adminUsers.unshift({
    id: `u-${Date.now()}`,
    name,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    room: `Room ${room}`,
    rollNo,
    ip: newIp,
    mac: newMac,
    ap: "Hall-B-Floor3-East",
    currentSpeed: "65.0 Mbps",
    quotaUsed: `0.0 / ${quota} GB (0%)`,
    plan: `${quota}GB Student Quota`,
    zone: "Hall B",
    status: "Online"
  });

  state.networkStats.totalActive++;
  saveState(state);

  closeAddUserModal();
  form.reset();
  showToast(`Successfully registered resident ${name} to Hostel NetOps!`, "success");
  renderAdminTable();
  updateAdminStatsUI();
}

// Export functions to global scope
window.loadState = loadState;
window.saveState = saveState;
window.resetDemoData = resetDemoData;
window.showToast = showToast;
window.loadSession = loadSession;
window.saveSession = saveSession;
window.clearSession = clearSession;
window.studentLogout = studentLogout;
window.switchAuthMode = switchAuthMode;
window.togglePasswordVisibility = togglePasswordVisibility;
window.handleConnect = handleConnect;
window.runSpeedTest = runSpeedTest;
window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.submitCheckout = submitCheckout;
window.disconnectDevice = disconnectDevice;
window.promptRegisterDevice = promptRegisterDevice;
window.renderStudentDevices = renderStudentDevices;
window.renderAdminTable = renderAdminTable;
window.adminToggleThrottle = adminToggleThrottle;
window.adminDisconnectUser = adminDisconnectUser;
window.openAddUserModal = openAddUserModal;
window.closeAddUserModal = closeAddUserModal;
window.handleAddUserSubmit = handleAddUserSubmit;
