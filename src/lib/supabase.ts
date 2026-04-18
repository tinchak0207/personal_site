import { createClient } from '@supabase/supabase-js';

// Vercel handles environment variables securely
// They will be injected at build time
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your environment configuration. The database connection will fail.');
}

// Ensure the URL is valid before creating the client
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const supabase = createClient(
  isValidUrl(supabaseUrl) ? supabaseUrl : 'https://eiwbebgaocdkabeucpxm.supabase.co', // Fallback to your actual URL found in vercel.json if env vars are missing
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpd2JlYmdhb2Nka2FiZXVjcHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMzODcwNDQsImV4cCI6MjAyODk2MzA0NH0.missing_key_fallback' // We need a real anon key here, falling back to dummy won't work for real queries
);