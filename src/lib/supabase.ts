import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase env vars. Copy .env.example to .env.local and fill in your keys.');
}

/**
 * Public client for client-side interactions
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Admin/Server client using Service Role for server routes (bypasses RLS).
 * Never import this into client components.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
