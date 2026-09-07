-- ============================================================================
-- Supabase SQL Migration: Hostel Wi-Fi Billing & FreeRADIUS Integration
-- Target: PostgreSQL / Supabase
-- ============================================================================

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PART 1: FREERADIUS STANDARD SCHEMA (rlm_sql for PostgreSQL)
-- Standard tables used by FreeRADIUS AAA server for router authentication,
-- bandwidth policy replies, and RADIUS accounting metrics.
-- ============================================================================

-- 1. radcheck: Authentication & credential checks
CREATE TABLE IF NOT EXISTS radcheck (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL DEFAULT '',
    attribute VARCHAR(64) NOT NULL DEFAULT '',
    op CHAR(2) NOT NULL DEFAULT ':=',
    value VARCHAR(253) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_radcheck_username ON radcheck(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_radcheck_user_attr ON radcheck(username, attribute);

-- 2. radreply: Authorization reply attributes (Rate-limiting, timeouts, VLANs)
CREATE TABLE IF NOT EXISTS radreply (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL DEFAULT '',
    attribute VARCHAR(64) NOT NULL DEFAULT '',
    op CHAR(2) NOT NULL DEFAULT '=',
    value VARCHAR(253) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_radreply_username ON radreply(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_radreply_user_attr ON radreply(username, attribute);

-- 3. radacct: RADIUS session accounting logs (Live telemetry from access points)
CREATE TABLE IF NOT EXISTS radacct (
    radacctid BIGSERIAL PRIMARY KEY,
    acctsessionid VARCHAR(64) NOT NULL DEFAULT '',
    acctuniqueid VARCHAR(32) NOT NULL DEFAULT '',
    username VARCHAR(64) NOT NULL DEFAULT '',
    realm VARCHAR(64) DEFAULT '',
    nasipaddress INET NOT NULL,
    nasportid VARCHAR(32) DEFAULT NULL,
    nasporttype VARCHAR(32) DEFAULT NULL,
    acctstarttime TIMESTAMPTZ DEFAULT NULL,
    acctupdatetime TIMESTAMPTZ DEFAULT NULL,
    acctstoptime TIMESTAMPTZ DEFAULT NULL,
    acctinterval INT DEFAULT NULL,
    acctsessiontime BIGINT DEFAULT NULL,
    acctauthentic VARCHAR(32) DEFAULT NULL,
    connectinfo_start VARCHAR(50) DEFAULT NULL,
    connectinfo_stop VARCHAR(50) DEFAULT NULL,
    acctinputoctets BIGINT DEFAULT 0,
    acctoutputoctets BIGINT DEFAULT 0,
    calledstationid VARCHAR(50) NOT NULL DEFAULT '',
    callingstationid VARCHAR(50) NOT NULL DEFAULT '',
    acctterminatecause VARCHAR(32) DEFAULT NULL,
    servicetype VARCHAR(32) DEFAULT NULL,
    framedprotocol VARCHAR(32) DEFAULT NULL,
    framedipaddress INET DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_radacct_username ON radacct(username);
CREATE INDEX IF NOT EXISTS idx_radacct_acctstarttime ON radacct(acctstarttime);
CREATE INDEX IF NOT EXISTS idx_radacct_acctstoptime ON radacct(acctstoptime);
CREATE INDEX IF NOT EXISTS idx_radacct_nasip_session ON radacct(nasipaddress, acctsessionid);
CREATE INDEX IF NOT EXISTS idx_radacct_callingstationid ON radacct(callingstationid);

-- ============================================================================
-- PART 2: HOSTEL BILLING CUSTOM TABLES
-- ============================================================================

-- 1. profiles: User identity linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE,
    roll_number TEXT,
    room_number TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_roll ON profiles(roll_number);

-- 2. plans: Internet service tier catalog
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price_ghs NUMERIC(10, 2) NOT NULL CHECK (price_ghs >= 0),
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    download_speed_mbps INTEGER NOT NULL CHECK (download_speed_mbps > 0),
    upload_speed_mbps INTEGER NOT NULL CHECK (upload_speed_mbps > 0),
    data_limit_gb NUMERIC(10, 2) DEFAULT NULL, -- NULL indicates unlimited data
    simultaneous_devices INTEGER NOT NULL DEFAULT 2 CHECK (simultaneous_devices > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. subscriptions: Active and historical student internet subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    data_used_bytes BIGINT NOT NULL DEFAULT 0 CHECK (data_used_bytes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);

-- 4. devices: Registered hardware MAC addresses bound to student profiles
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mac_address VARCHAR(17) NOT NULL UNIQUE,
    device_name TEXT NOT NULL,
    last_seen_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_mac_format CHECK (mac_address ~* '^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$')
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_mac ON devices(mac_address);

-- 5. payments: Financial audit log for Mobile Money & Card transactions
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    reference TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    channel TEXT NOT NULL CHECK (channel IN ('momo', 'card')),
    provider TEXT NOT NULL DEFAULT 'paystack',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================================================
-- PART 3: AUTOMATED FREERADIUS SYNC (FUNCTION & TRIGGERS)
-- Synchronizes active subscription changes, speeds, and MAC devices
-- directly into radcheck and radreply for instant router authorization.
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_sync_subscription_to_freeradius()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile RECORD;
    v_plan RECORD;
    v_device RECORD;
    v_rate_limit TEXT;
    v_session_timeout INTEGER;
    v_normalized_mac TEXT;
BEGIN
    -- Retrieve student profile details
    SELECT id, phone_number, roll_number 
    INTO v_profile 
    FROM profiles 
    WHERE id = NEW.user_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Retrieve internet plan specifications
    SELECT id, name, download_speed_mbps, upload_speed_mbps 
    INTO v_plan 
    FROM plans 
    WHERE id = NEW.plan_id;

    -- ========================================================================
    -- CASE 1: Subscription is ACTIVE
    -- ========================================================================
    IF NEW.status = 'active' AND NEW.expires_at > now() THEN
        -- MikroTik Rate Limit format: "RxRate/TxRate" (e.g. "30M/100M")
        v_rate_limit := format('%sM/%sM', v_plan.upload_speed_mbps, v_plan.download_speed_mbps);
        
        -- Remaining session duration in seconds
        v_session_timeout := GREATEST(0, EXTRACT(EPOCH FROM (NEW.expires_at - now()))::INTEGER);

        -- 1. Sync User Credential (Phone Number / Roll Number authentication)
        -- Sets Cleartext-Password in radcheck
        INSERT INTO radcheck (username, attribute, op, value)
        VALUES (v_profile.phone_number, 'Cleartext-Password', ':=', v_profile.phone_number)
        ON CONFLICT (username, attribute) 
        DO UPDATE SET value = EXCLUDED.value, op = ':=';

        -- 2. Sync Rate Limit to radreply
        INSERT INTO radreply (username, attribute, op, value)
        VALUES (v_profile.phone_number, 'Mikrotik-Rate-Limit', '=', v_rate_limit)
        ON CONFLICT (username, attribute)
        DO UPDATE SET value = EXCLUDED.value, op = '=';

        -- 3. Sync Session Timeout to radreply
        INSERT INTO radreply (username, attribute, op, value)
        VALUES (v_profile.phone_number, 'Session-Timeout', '=', v_session_timeout::TEXT)
        ON CONFLICT (username, attribute)
        DO UPDATE SET value = EXCLUDED.value, op = '=';

        -- 4. Sync Accounting Interim Interval (5 minutes = 300 seconds)
        INSERT INTO radreply (username, attribute, op, value)
        VALUES (v_profile.phone_number, 'Acct-Interim-Interval', '=', '300')
        ON CONFLICT (username, attribute)
        DO UPDATE SET value = '300', op = '=';

        -- 5. Sync Registered Device MAC Addresses (Automatic MAC Authentication)
        FOR v_device IN SELECT mac_address FROM devices WHERE user_id = NEW.user_id LOOP
            v_normalized_mac := UPPER(REPLACE(v_device.mac_address, '-', ':'));

            -- Authorize MAC address directly in radcheck
            INSERT INTO radcheck (username, attribute, op, value)
            VALUES (v_normalized_mac, 'Auth-Type', ':=', 'Accept')
            ON CONFLICT (username, attribute)
            DO UPDATE SET value = 'Accept', op = ':=';

            -- Apply bandwidth speed policy to device MAC
            INSERT INTO radreply (username, attribute, op, value)
            VALUES (v_normalized_mac, 'Mikrotik-Rate-Limit', '=', v_rate_limit)
            ON CONFLICT (username, attribute)
            DO UPDATE SET value = EXCLUDED.value, op = '=';

            INSERT INTO radreply (username, attribute, op, value)
            VALUES (v_normalized_mac, 'Session-Timeout', '=', v_session_timeout::TEXT)
            ON CONFLICT (username, attribute)
            DO UPDATE SET value = EXCLUDED.value, op = '=';

            INSERT INTO radreply (username, attribute, op, value)
            VALUES (v_normalized_mac, 'Acct-Interim-Interval', '=', '300')
            ON CONFLICT (username, attribute)
            DO UPDATE SET value = '300', op = '=';
        END LOOP;

    -- ========================================================================
    -- CASE 2: Subscription EXPIRED or CANCELLED
    -- ========================================================================
    ELSE
        -- Remove student credential from radcheck & radreply or set Reject
        DELETE FROM radcheck WHERE username = v_profile.phone_number;
        DELETE FROM radreply WHERE username = v_profile.phone_number;

        -- Remove all device MAC authorizations for this user
        FOR v_device IN SELECT mac_address FROM devices WHERE user_id = NEW.user_id LOOP
            v_normalized_mac := UPPER(REPLACE(v_device.mac_address, '-', ':'));
            DELETE FROM radcheck WHERE username = v_normalized_mac;
            DELETE FROM radreply WHERE username = v_normalized_mac;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger attached to subscriptions table
DROP TRIGGER IF EXISTS trg_sync_subscription_to_freeradius ON subscriptions;
CREATE TRIGGER trg_sync_subscription_to_freeradius
    AFTER INSERT OR UPDATE OF status, expires_at, plan_id
    ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_subscription_to_freeradius();

-- ============================================================================
-- PART 4: DEVICE REGISTRATION SYNC TRIGGER
-- When a user adds a new device MAC, automatically grant access if they have
-- an active subscription.
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_sync_device_to_freeradius()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sub RECORD;
    v_plan RECORD;
    v_normalized_mac TEXT;
    v_rate_limit TEXT;
    v_session_timeout INTEGER;
BEGIN
    v_normalized_mac := UPPER(REPLACE(NEW.mac_address, '-', ':'));

    IF TG_OP = 'INSERT' THEN
        -- Check if user has an active subscription
        SELECT s.id, s.plan_id, s.expires_at 
        INTO v_sub
        FROM subscriptions s
        WHERE s.user_id = NEW.user_id 
          AND s.status = 'active' 
          AND s.expires_at > now()
        ORDER BY s.expires_at DESC
        LIMIT 1;

        IF FOUND THEN
            SELECT upload_speed_mbps, download_speed_mbps 
            INTO v_plan 
            FROM plans 
            WHERE id = v_sub.plan_id;

            v_rate_limit := format('%sM/%sM', v_plan.upload_speed_mbps, v_plan.download_speed_mbps);
            v_session_timeout := GREATEST(0, EXTRACT(EPOCH FROM (v_sub.expires_at - now()))::INTEGER);

            -- Authorize MAC
            INSERT INTO radcheck (username, attribute, op, value)
            VALUES (v_normalized_mac, 'Auth-Type', ':=', 'Accept')
            ON CONFLICT (username, attribute) DO UPDATE SET value = 'Accept';

            INSERT INTO radreply (username, attribute, op, value)
            VALUES (v_normalized_mac, 'Mikrotik-Rate-Limit', '=', v_rate_limit)
            ON CONFLICT (username, attribute) DO UPDATE SET value = EXCLUDED.value;

            INSERT INTO radreply (username, attribute, op, value)
            VALUES (v_normalized_mac, 'Session-Timeout', '=', v_session_timeout::TEXT)
            ON CONFLICT (username, attribute) DO UPDATE SET value = EXCLUDED.value;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_normalized_mac := UPPER(REPLACE(OLD.mac_address, '-', ':'));
        DELETE FROM radcheck WHERE username = v_normalized_mac;
        DELETE FROM radreply WHERE username = v_normalized_mac;
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_device_to_freeradius ON devices;
CREATE TRIGGER trg_sync_device_to_freeradius
    AFTER INSERT OR DELETE
    ON devices
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_device_to_freeradius();

-- ============================================================================
-- PART 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Security Definer function to check admin role without RLS infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- 1. Profiles RLS
CREATE POLICY "Users can view own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles" 
    ON profiles FOR ALL 
    USING (public.is_admin());

-- 2. Plans RLS (Public read for active tiers)
CREATE POLICY "Anyone can view active plans" 
    ON plans FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Admins can manage plans" 
    ON plans FOR ALL 
    USING (public.is_admin());

-- 3. Subscriptions RLS
CREATE POLICY "Users can view own subscriptions" 
    ON subscriptions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view and manage all subscriptions" 
    ON subscriptions FOR ALL 
    USING (public.is_admin());

-- 4. Devices RLS
CREATE POLICY "Users can view own devices" 
    ON devices FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" 
    ON devices FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices" 
    ON devices FOR DELETE 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all devices" 
    ON devices FOR ALL 
    USING (public.is_admin());

-- 5. Payments RLS
CREATE POLICY "Users can view own payments" 
    ON payments FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" 
    ON payments FOR ALL 
    USING (public.is_admin());

-- ============================================================================
-- PART 6: SEED DEFAULT INTERNET PLANS
-- ============================================================================

INSERT INTO plans (name, description, price_ghs, duration_days, download_speed_mbps, upload_speed_mbps, data_limit_gb, simultaneous_devices)
VALUES 
    (
        'Daily QuickSurge', 
        '24 Hours unlimited burst high-speed access for downloads, study, and video lectures.', 
        15.00, 
        1, 
        50, 
        20, 
        NULL, 
        2
    ),
    (
        'Monthly Scholar', 
        '30 Days (1 Month) unlimited unthrottled campus-wide high-speed connection with zero data limits.', 
        100.00, 
        30, 
        100, 
        30, 
        NULL, 
        2
    ),
    (
        'Semester Scholar', 
        'Full Semester (3–4 Months / 120 Days) unlimited unthrottled priority high-speed access with zero caps.', 
        300.00, 
        120, 
        120, 
        40, 
        NULL, 
        2
    )
ON CONFLICT (name) DO UPDATE SET
    price_ghs = EXCLUDED.price_ghs,
    duration_days = EXCLUDED.duration_days,
    download_speed_mbps = EXCLUDED.download_speed_mbps,
    upload_speed_mbps = EXCLUDED.upload_speed_mbps,
    data_limit_gb = EXCLUDED.data_limit_gb,
    simultaneous_devices = EXCLUDED.simultaneous_devices;

