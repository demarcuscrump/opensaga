import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[OpenSaga] Supabase credentials not found. Running in offline/mock mode. ' +
    'Copy .env.example → .env.local and add your Supabase project credentials.'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
