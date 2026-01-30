import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para Client Components
 *
 * Usa cookies explícitas (path, sameSite, secure en HTTPS) para que la sesión
 * se comparta correctamente con el servidor en producción.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const isHttps = typeof window !== 'undefined'
    ? window.location?.protocol === 'https:'
    : appUrl.startsWith('https')

  return createBrowserClient(url, key, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure: isHttps,
      maxAge: 400 * 24 * 60 * 60,
      domain: '.lacasadelsueloradiante.es', // compartir entre www y sin www
    },
  })
}
