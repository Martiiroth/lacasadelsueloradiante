import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para Client Components
 * 
 * Este cliente debe usarse SOLO en:
 * - Client Components ('use client')
 * - Código que se ejecuta en el navegador
 * - Hooks de React
 * 
 * NO usar en:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 * - Middleware
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
