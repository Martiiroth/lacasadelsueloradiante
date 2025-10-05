import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Cliente Supabase con configuración optimizada para Next.js
 * 
 * Configuración crítica para sesión persistente:
 * - autoRefreshToken: true → Renueva automáticamente tokens antes de expirar
 * - persistSession: true → Guarda sesión en localStorage
 * - detectSessionInUrl: true → Detecta tokens en URL (OAuth, magic links)
 * - flowType: 'pkce' → PKCE flow para mayor seguridad
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
  },
  global: {
    headers: {
      'x-application-name': 'lacasadelsueloradiante',
    },
  },
})