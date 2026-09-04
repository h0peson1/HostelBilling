export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone_number: string;
          roll_number: string | null;
          room_number: string | null;
          role: 'student' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone_number: string;
          roll_number?: string | null;
          room_number?: string | null;
          role?: 'student' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone_number?: string;
          roll_number?: string | null;
          room_number?: string | null;
          role?: 'student' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_ghs: number;
          duration_days: number;
          download_speed_mbps: number;
          upload_speed_mbps: number;
          data_limit_gb: number | null;
          simultaneous_devices: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_ghs: number;
          duration_days: number;
          download_speed_mbps: number;
          upload_speed_mbps: number;
          data_limit_gb?: number | null;
          simultaneous_devices?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price_ghs?: number;
          duration_days?: number;
          download_speed_mbps?: number;
          upload_speed_mbps?: number;
          data_limit_gb?: number | null;
          simultaneous_devices?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: 'active' | 'expired' | 'cancelled';
          starts_at: string;
          expires_at: string;
          data_used_bytes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          status?: 'active' | 'expired' | 'cancelled';
          starts_at?: string;
          expires_at: string;
          data_used_bytes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          status?: 'active' | 'expired' | 'cancelled';
          starts_at?: string;
          expires_at?: string;
          data_used_bytes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      devices: {
        Row: {
          id: string;
          user_id: string;
          mac_address: string;
          device_name: string;
          last_seen_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mac_address: string;
          device_name: string;
          last_seen_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mac_address?: string;
          device_name?: string;
          last_seen_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          amount: number;
          reference: string;
          status: 'pending' | 'success' | 'failed';
          channel: 'momo' | 'card';
          provider: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          amount: number;
          reference: string;
          status?: 'pending' | 'success' | 'failed';
          channel: 'momo' | 'card';
          provider?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          amount?: number;
          reference?: string;
          status?: 'pending' | 'success' | 'failed';
          channel?: 'momo' | 'card';
          provider?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      radcheck: {
        Row: {
          id: number;
          username: string;
          attribute: string;
          op: string;
          value: string;
        };
        Insert: {
          id?: number;
          username: string;
          attribute: string;
          op?: string;
          value: string;
        };
        Update: {
          id?: number;
          username?: string;
          attribute?: string;
          op?: string;
          value?: string;
        };
        Relationships: [];
      };
      radreply: {
        Row: {
          id: number;
          username: string;
          attribute: string;
          op: string;
          value: string;
        };
        Insert: {
          id?: number;
          username: string;
          attribute: string;
          op?: string;
          value: string;
        };
        Update: {
          id?: number;
          username?: string;
          attribute?: string;
          op?: string;
          value?: string;
        };
        Relationships: [];
      };
      radacct: {
        Row: {
          radacctid: number;
          acctsessionid: string;
          acctuniqueid: string;
          username: string;
          realm: string | null;
          nasipaddress: string;
          nasportid: string | null;
          nasporttype: string | null;
          acctstarttime: string | null;
          acctupdatetime: string | null;
          acctstoptime: string | null;
          acctinterval: number | null;
          acctsessiontime: number | null;
          acctauthentic: string | null;
          connectinfo_start: string | null;
          connectinfo_stop: string | null;
          acctinputoctets: number;
          acctoutputoctets: number;
          calledstationid: string;
          callingstationid: string;
          acctterminatecause: string | null;
          servicetype: string | null;
          framedprotocol: string | null;
          framedipaddress: string | null;
        };
        Insert: {
          radacctid?: number;
          acctsessionid: string;
          acctuniqueid: string;
          username: string;
          realm?: string | null;
          nasipaddress: string;
          nasportid?: string | null;
          nasporttype?: string | null;
          acctstarttime?: string | null;
          acctupdatetime?: string | null;
          acctstoptime?: string | null;
          acctinterval?: number | null;
          acctsessiontime?: number | null;
          acctauthentic?: string | null;
          connectinfo_start?: string | null;
          connectinfo_stop?: string | null;
          acctinputoctets?: number;
          acctoutputoctets?: number;
          calledstationid?: string;
          callingstationid?: string;
          acctterminatecause?: string | null;
          servicetype?: string | null;
          framedprotocol?: string | null;
          framedipaddress?: string | null;
        };
        Update: {
          acctstoptime?: string | null;
          acctsessiontime?: number | null;
          acctinputoctets?: number;
          acctoutputoctets?: number;
          acctterminatecause?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
