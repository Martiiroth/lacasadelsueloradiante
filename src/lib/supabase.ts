import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Cliente Supabase con configuración optimizada para Next.js
 * 
 * IMPORTANTE: Usando configuración estándar sin PKCE para evitar
 * problemas de corrupción de sesión al cambiar de ventana.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
    // Configuración adicional para estabilidad
    debug: false,
  },
  global: {
    headers: {
      'x-application-name': 'lacasadelsueloradiante',
    },
  },
})