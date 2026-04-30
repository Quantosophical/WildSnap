import { createClient } from '@supabase/supabase-js';

// Get keys from local storage or environment
export const getSupabaseConfig = () => {
  const url = localStorage.getItem('SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem('SUPABASE_ANON_KEY') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
};

// Initialize with current config
let { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();
export let supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Allow re-initialization after setup
export const reinitSupabase = () => {
  const { url, key } = getSupabaseConfig();
  if (url && key) {
    supabase = createClient(url, key);
    return true;
  }
  return false;
};
