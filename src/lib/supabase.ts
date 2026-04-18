import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Missing Supabase environment variables. Auth and database operations will fail.');
}

// Fallback to localhost if env vars are missing to prevent immediate crash,
// but auth will still fail as expected rather than misrouting to placeholder.co
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'dummy-key-for-development'
);