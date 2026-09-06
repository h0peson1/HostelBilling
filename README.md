# Hostel Wi-Fi Management Portal

A modern, high-performance web application imported directly from **Google Stitch** (`projects/9400132624252122147`).

This application fulfills a dual-purpose environment:
1. **Student Captive Portal**: Effortless, zero-friction Wi-Fi onboarding and plan management for university and hostel residents.
2. **IT Admin NetOps Console**: High-density management console for hostel network administrators to monitor live telemetry, bandwidth allocation, active student sessions, and provision accounts.

---

## 🚀 Quick Start

### Option 1: Run with Next.js (Full Database & API Integration)
```bash
npm run dev
```
Then visit:
- **Student Captive Portal**: [http://localhost:3000](http://localhost:3000)
- **Student Self-Service Dashboard**: [http://localhost:3000/student-dashboard.html](http://localhost:3000/student-dashboard.html)
- **Dedicated Admin Login**: [http://localhost:3000/admin-login.html](http://localhost:3000/admin-login.html)
- **IT Admin NetOps Console (Guarded)**: [http://localhost:3000/admin-dashboard.html](http://localhost:3000/admin-dashboard.html)

#### Default Demo Credentials:
- **Resident Student**: Phone: `0245123456` | Roll: `CS2025-901` | Room: `B3-102` (Kojo Mensah)
- **Super Administrator**: Phone: `0552420079` | Roll: `ADMIN-001` | Email: `admin@hopeson.net` (Hopeson Super Admin)

### Option 2: Zero-Dependency Server
```bash
npm start
# or
node server.js
```

---

## 🎨 Architecture & Separation of Concerns

### 1. Student Captive Portal & Self-Service (`index.html` & `student-dashboard.html`)
- **Strictly Isolated**: No administrative actions or NetOps navigation links are exposed to students.
- **Instant Radius Session Verification**: Authenticates via Student Roll Number, Phone Number, or Voucher PIN.
- **Live Session Telemetry**: Assigned IP (`10.142.28.94`), MAC identifier (`AA:BB:CC:DD:EE:77`), and ping (11ms).
- **Dynamic Speedometer**: Interactive speed test simulating live download/upload throughput.
- **Bandwidth Quota Meter**: Visual progress bar tracking consumed vs. remaining data.
- **Device Management**: View registered hardware slots, register new MACs, or terminate active sessions.
- **Checkout Modal**: Mobile Money (MTN MoMo, Telecel Cash) and Card gateway top-up.

### 2. Dedicated IT Admin NetOps Portal (`admin-login.html` & `admin-dashboard.html`)
- **Dedicated Admin Authentication Gate (`admin-login.html`)**: Separate NOC-themed authentication screen submitting to `/api/admin/login`. Students attempting login receive strict `403 Forbidden` rejection.
- **Route Guarding (`js/admin.js`)**: `requireAdminAuth()` continuously verifies `HOSTEL_ADMIN_SESSION_V1`. Any unauthenticated attempt or student credential immediately redirects to `admin-login.html`.
- **Live Supabase Sessions (`/api/admin/sessions`)**: Elevated backend service-role API dynamically pulls active student subscriptions, assigned MACs, and IP allocations directly from the Supabase database.
- **Real-Time Network Telemetry**: Aggregate bandwidth consumption, peak throughput, active access points, and RADIUS connection logs.
- **Hardware Controls**: Instant session disconnection, rogue MAC isolation, and bandwidth throttling.

---

## 📂 Project Structure

```
Hostel Management System/
├── index.html                   # Student Captive Portal (Main Entry)
├── student-dashboard.html       # Student Dashboard & Plan Management
├── admin-dashboard.html         # IT Admin NetOps Console
├── server.js                    # Zero-dependency local Node.js server
├── package.json                 # Project scripts and metadata
├── DESIGN.md                    # Stitch Design System tokens & guidelines
├── stitch_project.json          # Google Stitch project metadata & screen IDs
├── js/
│   └── app.js                   # Unified client-side engine & state store
└── stitch_export/               # Raw exported files from Google Stitch
    ├── view1_login_desktop.html
    ├── view1_login_mobile.html
    ├── view2_student_dashboard.html
    ├── view3_admin_dashboard.html
    └── screenshots/
        ├── view1_login.png
        ├── view2_student_dashboard.png
        └── view3_admin_dashboard.png
```

---

## 🎨 Design Tokens

- **Primary**: Electric Indigo (`#4338CA` / `#2A14B4`)
- **Secondary**: Radiant Mint / Emerald (`#10B981` / `#006C49`)
- **Tertiary**: Electric Cyan (`#06B6D4` / `#005A6A`)
- **Canvas**: Slate Cool White (`#FAF8FF`)
- **Typography**: Space Grotesk (Headlines & Metrics) + Plus Jakarta Sans (Body & Forms)
