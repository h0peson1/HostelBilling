# Hostel Wi-Fi Management Portal

A modern, high-performance web application imported directly from **Google Stitch** (`projects/9400132624252122147`).

This application fulfills a dual-purpose environment:
1. **Student Captive Portal**: Effortless, zero-friction Wi-Fi onboarding and plan management for university and hostel residents.
2. **IT Admin NetOps Console**: High-density management console for hostel network administrators to monitor live telemetry, bandwidth allocation, active student sessions, and provision accounts.

---

## 🚀 Quick Start

### Option 1: Run with Node.js
```bash
npm start
# or
node server.js
```
Then visit:
- **Captive Portal (Login)**: [http://localhost:3000](http://localhost:3000)
- **Student Dashboard & Checkout**: [http://localhost:3000/student-dashboard.html](http://localhost:3000/student-dashboard.html)
- **IT Admin NetOps Console**: [http://localhost:3000/admin-dashboard.html](http://localhost:3000/admin-dashboard.html)

### Option 2: Open Directly in Browser
You can also directly double-click or open `index.html` in any modern web browser without needing a server.

---

## 🎨 Screens & Architecture

### 1. Captive Portal (`index.html`)
- **Dual Authentication Modes**:
  - **Student ID / Room Login**: Authenticates via Student Roll Number / Room ID and Network Password.
  - **Prepaid Voucher**: PIN code redemption with instant MAC binding.
- **Hardware AP Indicator**: Shows current AP connection (`B-Block 3F AP-04`, 98% signal).
- **Responsive Viewport**: Optimized for both mobile devices (390px) and desktop browsers.

### 2. Student Dashboard (`student-dashboard.html`)
- **Live Session Telemetry**: Assigned IP (`10.142.28.94`), MAC identifier (`E4:5F:01:BC:88:21`), and ping (12ms).
- **Dynamic Speedometer**: Interactive speed test simulating live download/upload throughput.
- **Bandwidth Quota Meter**: Visual progress bar tracking consumed vs. remaining data.
- **Registered Devices List**: Displays active hardware slots with the ability to disconnect or register new devices.
- **Checkout Modal**: Interactive plan renewal supporting Mobile Money (MTN MoMo, Telecel Cash) and Bank Cards.

### 3. IT Admin NetOps Console (`admin-dashboard.html`)
- **Real-Time KPIs**: Total active users (342), aggregate bandwidth (1.84 TB), peak throughput (840 Mbps), and network health.
- **Active Sessions Data Table**: Search and filter by student name, roll number, room, MAC, IP, or hostel zone.
- **Hardware Controls**: Instant session disconnection and speed throttling.
- **User Provisioning**: Add new residents with custom quotas and instant credentials dispatch.

### 4. Floating Demo Role Switcher
Every screen includes a discreet floating bottom bar allowing 1-click navigation between:
- 🎓 **Captive Portal**
- 📱 **Student Dashboard**
- 🛠️ **Admin NetOps**
- 🔄 **Reset Demo Data** (Restores default state)

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
