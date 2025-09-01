import { createClient } from '@supabase/supabase-js';

// Support both VITE_ prefixed e variabili semplici (.env.supabase)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  // (DEV fallback) usa SERVICE_ROLE solo in locale per evitare crash login
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Crea client solo se variabili disponibili
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
