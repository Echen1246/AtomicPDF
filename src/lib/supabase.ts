import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'basic' | 'standard' | 'professional';
  subscription_status: 'active' | 'canceled' | 'past_due';
  stripe_customer_id?: string;
  pdf_count_used: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  tier: 'basic' | 'standard' | 'professional';
  status: 'active' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

// Subscription limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    pdfs_per_month: 1,
    features: ['basic_editing', 'text_annotations', 'highlights']
  },
  basic: {
    pdfs_per_month: 25,
    features: ['basic_editing', 'text_annotations', 'highlights', 'drawing', 'page_operations']
  },
  standard: {
    pdfs_per_month: 100,
    features: ['basic_editing', 'text_annotations', 'highlights', 'drawing', 'page_operations', 'bulk_operations', 'export_formats']
  },
  professional: {
    pdfs_per_month: -1, // unlimited
    features: ['all_features', 'priority_support', 'advanced_exports', 'api_access']
  }
} as const; 