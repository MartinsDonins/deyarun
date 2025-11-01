import { createClient } from '@supabase/supabase-js';

// Supabase configuration for DeyaRun
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Public client for frontend operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client for backend operations (with service role key)
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Default export for backward compatibility
export default supabase;

