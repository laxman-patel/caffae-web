
import { createClient } from '@supabase/supabase-js';

// Define default test values to prevent immediate errors during development
// These will not connect to a real Supabase instance
const DEFAULT_SUPABASE_URL = 'https://xyzcompany.supabase.co';
const DEFAULT_SUPABASE_KEY = 'public-anon-key';

// Get values from environment or use defaults
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

console.log('Supabase initialization with URL:', supabaseUrl.substring(0, 15) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export a function to verify if we have real credentials or using defaults
export const hasValidSupabaseCredentials = (): boolean => {
  return (
    import.meta.env.VITE_SUPABASE_URL !== undefined && 
    import.meta.env.VITE_SUPABASE_ANON_KEY !== undefined
  );
};
