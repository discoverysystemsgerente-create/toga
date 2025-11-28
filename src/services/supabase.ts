import { createClient } from '@supabase/supabase-js';
const getEnv = (key: string, def: string) => {
  try { // @ts-ignore
    return import.meta.env[key] || def;
  } catch (e) { return def; }
};
const supabaseUrl = getEnv('VITE_SUPABASE_URL', '');
const supabaseAnonKey = getEnv('VITE_SUPABASE_KEY', '');

export const isSupabaseConfigured = () => {
    return supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://tu-proyecto.supabase.co';
};

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');