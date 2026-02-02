import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

// PUBLIC_INTERFACE
/**
 * Supabase client instance for authentication and database operations.
 * Configured with environment variables from .env file.
 */
export const supabase = createClient(supabaseUrl, supabaseKey);
