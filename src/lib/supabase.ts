
import { createClient } from '@supabase/supabase-js';

// Use the real Supabase credentials provided by the user
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ;

console.log('Supabase initialization with URL:', supabaseUrl.substring(0, 15) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export a function to verify if we have real credentials or using defaults
export const hasValidSupabaseCredentials = (): boolean => {
  return (
    import.meta.env.VITE_SUPABASE_URL !== undefined && 
    import.meta.env.VITE_SUPABASE_ANON_KEY !== undefined
  );
};
