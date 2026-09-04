# =============================================================================
# MikroTik RouterOS Configuration Script for Hostel Wi-Fi Billing
# Compatible with RouterOS v6 and v7
# =============================================================================

# 1. Configure RADIUS Client
/radius
add address=192.168.88.2 service=hotspot,wireless secret="HostelRadiusSecret2025" \
    authentication-port=1812 accounting-port=1813 timeout=3000ms comment="FreeRADIUS Supabase Backend"

# 2. Enable RADIUS Incoming (CoA / Disconnect Request on Port 3799)
/radius incoming
set accept=yes port=3799

# 3. Configure Hotspot Server Profile to use RADIUS & Accounting
/ip hotspot profile
set [ find default=yes ] use-radius=yes radius-accounting=yes \
    radius-interim-update=5m login-by=http-chap,http-pap,mac-cookie \
    radius-mac-format=XX:XX:XX:XX:XX:XX

# 4. Walled Garden: Allow access to Captive Portal, Supabase API & Paystack
/ip hotspot walled-garden
add dst-host=*.supabase.co comment="Allow Supabase API without auth"
add dst-host=*.paystack.co comment="Allow Paystack checkout without auth"
add dst-host=*.flutterwave.com comment="Allow Flutterwave checkout without auth"
add dst-host=api.paystack.co comment="Paystack API"
add dst-host=fonts.googleapis.com comment="Google Fonts"
add dst-host=fonts.gstatic.com comment="Google Fonts CDN"
add dst-host=cdn.tailwindcss.com comment="Tailwind CDN"

# 5. Hotspot User Profile with Transparent Rate-Limiting
/ip hotspot user profile
set [ find default=yes ] rate-limit="" transparent-proxy=no open-status-page=always
