
import { createClient } from '@supabase/supabase-js';

// Use the real Supabase credentials provided by the user
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://zpuhyuvifzcrquihmxax.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdWh5dXZpZnpjcnF1aWhteGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1OTI4ODksImV4cCI6MjA1ODE2ODg4OX0.X1EDX94UayTTAhiDjzLemhSpPfG-mF862o0giqoecXQ";

console.log('Supabase initialization with URL:', supabaseUrl.substring(0, 15) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export a function to verify if we have real credentials or using defaults
export const hasValidSupabaseCredentials = (): boolean => {
  return (
    import.meta.env.VITE_SUPABASE_URL !== undefined && 
    import.meta.env.VITE_SUPABASE_ANON_KEY !== undefined
  );
};
