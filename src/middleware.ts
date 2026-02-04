import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// Versión de la aplicación - cambiar cuando hay updates que requieran limpiar cookies
const APP_VERSION = '2024.10.12.1'
const VERSION_COOKIE_NAME = 'app_version'

// Lista de cookies que pueden causar problemas tras updates
const PROBLEMATIC_COOKIES = [
  'next-auth.session-token',
  'next-auth.csrf-token', 
  'next-auth.callback-url',
  '__Secure-next-auth.session-token',
  '__Host-next-auth.csrf-token',
  'authjs.session-token',
  'authjs.csrf-token'
]

export async function middleware(request: NextRequest) {
  console.log('🔍 Middleware executing for:', request.nextUrl.pathname)
  
  try {
    // Primero, verificar versión y limpiar cookies si es necesario
    const storedVersion = request.cookies.get(VERSION_COOKIE_NAME)?.value
    
    // Si no hay versión o es diferente, limpiar cookies problemáticas
    if (!storedVersion || storedVersion !== APP_VERSION) {
      console.log('🧹 Cleaning cookies due to version mismatch:', {
        stored: storedVersion,
        current: APP_VERSION
      })
      
      const response = NextResponse.next()
      
      // Limpiar cookies problemáticas
      PROBLEMATIC_COOKIES.forEach(cookieName => {
        if (request.cookies.has(cookieName)) {
          console.log('🗑️ Removing cookie:', cookieName)
          response.cookies.delete(cookieName)
        }
      })
      
      // Actualizar versión
      response.cookies.set(VERSION_COOKIE_NAME, APP_VERSION, {
        maxAge: 60 * 60 * 24 * 365, // 1 año
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      console.log('✅ Cookies cleaned, proceeding with Supabase middleware')
    }
    
    // Luego, ejecutar el middleware de Supabase
    return await updateSession(request)
    
  } catch (error) {
    console.error('❌ Middleware error:', error)
    
    // En caso de error, continuar con Supabase middleware
    return await updateSession(request)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
