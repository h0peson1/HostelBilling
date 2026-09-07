import { Database } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Plan = Database['public']['Tables']['plans']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Device = Database['public']['Tables']['devices']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];

export interface LoginRequestBody {
  identifier: string;
  password?: string;
  mode?: 'student' | 'voucher';
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    full_name: string;
    phone_number: string;
    roll_number: string | null;
    room_number: string | null;
    role: string;
  };
  error?: string;
}

export interface RegisterRequestBody {
  phone?: string;
  phone_number?: string;
  room_number?: string;
  room?: string;
  mac_address?: string;
  mac?: string;
  email?: string;
  password?: string;
  full_name?: string;
  name?: string;
  roll_number?: string;
  device_name?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  session?: any;
  user?: {
    id: string;
    email: string;
    full_name: string;
    phone_number: string;
    roll_number: string | null;
    room_number: string | null;
    role: string;
  };
  device?: {
    id?: string;
    mac_address: string;
    device_name: string;
    last_seen_at?: string | null;
  };
  error?: string;
}

export interface UserStatusResponse {
  authenticated: boolean;
  user?: {
    id: string;
    full_name: string;
    phone_number: string;
    roll_number: string | null;
    room_number: string | null;
    role: string;
  };
  subscription?: {
    id: string;
    status: 'active' | 'expired' | 'cancelled' | 'none';
    plan_name: string;
    download_speed_mbps: number;
    upload_speed_mbps: number;
    data_limit_gb: number | null;
    data_used_bytes: number;
    data_used_gb: number;
    quota_percentage: number;
    starts_at: string;
    expires_at: string;
    is_expired: boolean;
    remaining_seconds: number;
    remaining_formatted: string;
  } | null;
  devices: {
    id: string;
    device_name: string;
    mac_address: string;
    last_seen_at: string | null;
  }[];
  active_session?: {
    ip_address: string | null;
    upload_octets: number;
    download_octets: number;
    total_octets: number;
    session_time_seconds: number;
  } | null;
}

export interface PaymentInitRequestBody {
  plan_id: string;
  channel: 'momo' | 'card';
  phone_number?: string;
  provider?: 'paystack' | 'flutterwave';
}

export interface PaymentInitResponse {
  success: boolean;
  message: string;
  reference: string;
  authorization_url?: string;
  access_code?: string;
  amount_ghs: number;
  currency: string;
  plan: {
    id: string;
    name: string;
    duration_days: number;
  };
  error?: string;
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number; // in pesewas (e.g. 8000 = GH₵ 80.00)
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: {
      user_id?: string;
      plan_id?: string;
      phone_number?: string;
      custom_fields?: Record<string, unknown>[];
    };
    customer: {
      id: number;
      email: string;
      customer_code: string;
      phone: string | null;
    };
  };
}
