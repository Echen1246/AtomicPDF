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
  subscription_tier: 'free' | 'lifetime';
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing';
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
  tier: 'lifetime';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

// Subscription limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    pdfs_per_month: 3,
    features: ['basic_editing', 'text_annotations', 'highlights']
  },
  lifetime: {
    pdfs_per_month: -1, // unlimited
    features: ['all_features']
  }
} as const; 