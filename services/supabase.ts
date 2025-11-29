import { createClient } from '@supabase/supabase-js';

// Helper to safely access env vars
const getEnv = (key: string, defaultValue: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || defaultValue;
    }
  } catch (e) {
    // Ignore errors
  }
  return defaultValue;
};

// Estas variables deben configurarse en tu archivo .env o en el panel de Vercel/Netlify
const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://tu-proyecto.supabase.co');
const supabaseAnonKey = getEnv('VITE_SUPABASE_KEY', 'tu-anon-key');

export const isSupabaseConfigured = () => {
    return supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://tu-proyecto.supabase.co';
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos de Base de Datos para TypeScript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          reputation: number
          tier: 'FREE' | 'PREMIUM'
          interests: string[]
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          reputation?: number
          tier?: 'FREE' | 'PREMIUM'
          interests?: string[]
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          reputation?: number
          tier?: 'FREE' | 'PREMIUM'
          interests?: string[]
          updated_at?: string | null
        }
      }
      cases: {
        Row: {
          id: string
          title: string
          text: string
          summary: string
          area: string
          corporation: string
          date: string
          analysis: Json
          user_id: string
          source_type: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          text: string
          summary: string
          area: string
          corporation: string
          date: string
          analysis?: Json
          user_id: string
          source_type?: string
          created_at?: string
        }
      }
      // Agregar definiciones para 'folders', 'documents', 'events' similarmente...
    }
  }
}
