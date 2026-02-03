import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_DOMAIN = '.lacasadelsueloradiante.es'
const isProd = process.env.NODE_ENV === 'production'

/**
 * Cliente Supabase para Middleware
 * 
 * Actualiza la sesión del usuario y refresca tokens expirados.
 * Usa las mismas opciones de cookie que el cliente browser (dominio, secure) para evitar pérdida de sesión.
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
          const baseOptions = {
            path: '/',
            sameSite: 'lax' as const,
            secure: isProd,
            domain: COOKIE_DOMAIN,
          }
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, { ...baseOptions, ...options })
          })
        },
      },
      cookieOptions: {
        path: '/',
        sameSite: 'lax',
        secure: isProd,
        domain: COOKIE_DOMAIN,
      },
    }
  )

  try {
    const { error } = await supabase.auth.getUser()

    // Si el refresh token es inválido, borrar cookies y redirigir a login
    if (error?.message?.includes('Refresh Token') || error?.message?.includes('refresh_token_not_found')) {
      return clearAuthAndRedirect(request)
    }
  } catch (err: any) {
    if (err?.code === 'refresh_token_not_found' || err?.message?.includes('Refresh Token')) {
      return clearAuthAndRedirect(request)
    }
  }

  return supabaseResponse
}

function clearAuthAndRedirect(request: NextRequest) {
  const isApiRequest = request.nextUrl.pathname.startsWith('/api')
  const response = isApiRequest
    ? NextResponse.next()
    : NextResponse.redirect(new URL('/auth/login?session_expired=1', request.url))

  const authCookies = request.cookies.getAll().filter((c) => c.name.startsWith('sb-'))
  authCookies.forEach((c) => {
    response.cookies.set(c.name, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: isProd,
      domain: isProd ? COOKIE_DOMAIN : undefined,
    })
  })
  return response
}
