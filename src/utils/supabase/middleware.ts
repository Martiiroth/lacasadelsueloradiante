import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Cliente Supabase para Middleware
 * 
 * Actualiza la sesión del usuario y refresca tokens expirados
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // CRITICAL: Esto refresca la sesión si está expirada
  // Siempre usar getUser() en lugar de getSession() en el servidor
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Logging para debug (remover en producción)
  if (user) {
    console.log('✅ Middleware: User session valid', user.email)
  } else {
    console.log('ℹ️ Middleware: No user session')
  }

  return supabaseResponse
}
