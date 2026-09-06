/**
 * Hopeson's NetOps - Admin Management & Network Operations Engine
 * Dedicated client logic isolated from regular student portal.
 */

const ADMIN_SESSION_KEY = "HOSTEL_ADMIN_SESSION_V1";

function getAdminSession() {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Failed to parse admin session", e);
    return null;
  }
}

function saveAdminSession(admin, token) {
  try {
    localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({
        admin,
        token,
        timestamp: Date.now()
      })
    );
  } catch (e) {
    console.error("Failed to persist admin session", e);
  }
}

function clearAdminSession() {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (e) {
    console.error("Failed to clear admin session", e);
  }
}

/**
 * Route guard: Enforces administrator authentication
 */
function requireAdminAuth() {
  const session = getAdminSession();
  if (!session || !session.admin || session.admin.role !== "admin") {
    // If on admin-dashboard, redirect to admin-login
    if (!window.location.pathname.includes("admin-login.html")) {
      window.location.href = "admin-login.html";
    }
    return false;
  }
  return true;
}

/**
 * Handles login submission on admin-login.html
 */
async function submitAdminLogin(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector("button[type='submit']");
  const origHtml = submitBtn ? submitBtn.innerHTML : "";

  const identifier = document.getElementById("admin-id")?.value?.trim();
  const password = document.getElementById("admin-password")?.value?.trim();

  if (!identifier || !password) {
    showToast("Please provide both Administrator ID and Password.", "error");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="material-symbols-outlined text-[18px] animate-spin">sync</span>
      <span>Authenticating NetOps Admin...</span>
    `;
  }

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      saveAdminSession(data.admin, data.token);
      showToast("Access Granted: Welcome to NetOps Console.", "success");
      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 700);
      return;
    }

    if (res.status === 403) {
      showToast(data.message || "Access Denied: Administrator privileges required.", "error");
    } else {
      showToast(data.message || "Invalid administrator credentials.", "error");
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origHtml;
    }
  } catch (err) {
    console.error("Admin login error:", err);
    // Offline/demo fallback for admin
    if (identifier === "0552420079" || identifier.toLowerCase() === "admin") {
      saveAdminSession({
        full_name: "Hopeson (Super Admin)",
        phone_number: "0552420079",
        roll_number: "ADMIN-001",
        room_number: "NOC-01",
        role: "admin"
      }, "mock_admin_token");
      showToast("Access Granted: Welcome to NetOps Console.", "success");
      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 700);
      return;
    }

    showToast("Could not contact server. Please verify network.", "error");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origHtml;
    }
  }
}

/**
 * Handles administrator logout
 */
function handleAdminLogout() {
  clearAdminSession();
  showToast("Administrator session terminated.", "info");
  setTimeout(() => {
    window.location.href = "admin-login.html";
  }, 600);
}

/**
 * Fetches live sessions from /api/admin/sessions
 */
async function fetchLiveAdminSessions(zone = "All", query = "") {
  try {
    const params = new URLSearchParams();
    if (zone && zone !== "All") params.set("zone", zone);
    if (query) params.set("q", query);

    const res = await fetch(`/api/admin/sessions?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn("Could not fetch live admin sessions:", err);
    return null;
  }
}

// Global exposure
window.getAdminSession = getAdminSession;
window.saveAdminSession = saveAdminSession;
window.clearAdminSession = clearAdminSession;
window.requireAdminAuth = requireAdminAuth;
window.submitAdminLogin = submitAdminLogin;
window.handleAdminLogout = handleAdminLogout;
window.fetchLiveAdminSessions = fetchLiveAdminSessions;
