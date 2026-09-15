import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Extraer diferentes tipos de tokens y parámetros
  const token = searchParams.get('token') || searchParams.get('token_hash')
  const accessToken = searchParams.get('access_token')
  const refreshToken = searchParams.get('refresh_token')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')
  const redirectTo = searchParams.get('redirect_to') || searchParams.get('redirectTo')
  const code = searchParams.get('code')

  // Referer can help decide if this request came from Supabase hosted pages
  const referer = request.headers.get('referer') || ''

  // Decide si forzar dominio de producción. Forzamos cuando:
  // - estamos en producción (NODE_ENV=production)
  // - el referer proviene de supabase hosted domain
  // - el redirect_to apunta a lacasadelsueloradiante.es
  const shouldForceProduction =
    process.env.NODE_ENV === 'production' ||
    referer.includes('supabase.lacasadelsueloradianteapp.com') ||
    (redirectTo && redirectTo.includes('lacasadelsueloradiante.es'))

  const baseUrl = shouldForceProduction
    ? (process.env.NEXT_PUBLIC_APP_URL || 'https://www.lacasadelsueloradiante.es')
    : request.nextUrl.origin
  
  // Log completo de todos los parámetros para debugging
  const allParams = Object.fromEntries(searchParams.entries())
  console.log('🔍 Auth callback URL completa:', request.url)
  console.log('🔍 Todos los parámetros:', allParams)
  console.log('🔍 Parámetros extraídos:', { 
    token, 
    accessToken, 
    refreshToken, 
    type, 
    error, 
    errorCode,
    errorDescription,
    redirectTo 
  })

  // Si recibimos un 'code', intercambiarlo por una sesión válida con Supabase
  if (code) {
    console.log('ℹ️ Callback received code param, exchanging for session', { code })
    
    try {
      const supabase = await createClient()
      
      // Intercambiar el código por una sesión
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Error intercambiando código:', error)
        const errorUrl = new URL('/auth/error', baseUrl)
        errorUrl.searchParams.set('message', 'Error al procesar el enlace de recuperación')
        return NextResponse.redirect(errorUrl.toString())
      }
      
      console.log('✅ Código intercambiado correctamente, sesión establecida')

      // Recovery → reset password; magiclink / signup / email → dashboard
      if (type === 'recovery') {
        const resetUrl = new URL('/auth/reset-password', baseUrl)
        resetUrl.searchParams.set('type', 'recovery')
        resetUrl.searchParams.set('session', 'active')
        return NextResponse.redirect(resetUrl.toString())
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || baseUrl
      return NextResponse.redirect(new URL('/dashboard', appUrl).toString())
      
    } catch (err) {
      console.error('❌ Error en intercambio de código:', err)
      const errorUrl = new URL('/auth/error', baseUrl)
      errorUrl.searchParams.set('message', 'Error interno al procesar el enlace')
      return NextResponse.redirect(errorUrl.toString())
    }
  }

  // Manejar errores primero
  if (error) {
    console.log('❌ Error en callback:', { error, errorCode, errorDescription })
    const errorUrl = new URL('/auth/error', baseUrl)
    let errorMessage = 'Error en el enlace de recuperación'

    if (errorCode === 'otp_expired') {
      errorMessage = 'El enlace de recuperación ha expirado. Solicita uno nuevo.'
    } else if (errorDescription) {
      errorMessage = errorDescription
    } else if (error) {
      errorMessage = error
    }

    errorUrl.searchParams.set('message', errorMessage)
    return NextResponse.redirect(errorUrl.toString())
  }

  // Si es un token de recuperación, redirigir a la página de reset con el token
  if (type === 'recovery') {
    let tokenToUse = token || accessToken
    
    if (tokenToUse) {
      const resetUrl = new URL('/auth/reset-password', baseUrl)
      resetUrl.searchParams.set('token', tokenToUse)
      resetUrl.searchParams.set('type', 'recovery')
      
      // Si también hay refresh token, añadirlo
      if (refreshToken) {
        resetUrl.searchParams.set('refresh_token', refreshToken)
      }
      
      console.log('✅ Token de recovery encontrado, redirigiendo a:', resetUrl.toString())
      
      return NextResponse.redirect(resetUrl.toString())
    }
  }

  // Verificar si tenemos tokens pero sin type específico (asumir recovery)
  if ((token || accessToken) && !type) {
    console.log('⚠️ Token encontrado pero sin type, asumiendo recovery')
    const tokenToUse = token || accessToken
    if (tokenToUse) {
      const resetUrl = new URL('/auth/reset-password', baseUrl)
      resetUrl.searchParams.set('token', tokenToUse)
      resetUrl.searchParams.set('type', 'recovery')
      
      if (refreshToken) {
        resetUrl.searchParams.set('refresh_token', refreshToken)
      }
      
      return NextResponse.redirect(resetUrl.toString())
    }
  }

  // Si es confirmación de email, usar Supabase para confirmar
  if (type === 'signup' && token) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup'
    })

    if (error) {
      console.error('Error confirmando email:', error)
      const errorUrl = new URL('/auth/error', baseUrl)
      errorUrl.searchParams.set('message', 'Error al confirmar el email')
      return NextResponse.redirect(errorUrl.toString())
    }

    // Redirigir al dashboard después de confirmar
    return NextResponse.redirect(new URL('/dashboard', baseUrl))
  }

  // Para otros tipos de tokens o si falta información
  console.log('❌ Parámetros inválidos o faltantes')
  console.log('❌ URL recibida:', request.url)
  console.log('❌ Todos los params:', allParams)
  console.log('❌ User Agent:', request.headers.get('user-agent'))
  console.log('❌ Referer:', request.headers.get('referer'))
  
  const errorUrl = new URL('/auth/error', baseUrl)
  const errorMessage = process.env.NODE_ENV === 'development' 
    ? `Enlace inválido. URL: ${request.url} - Params: ${JSON.stringify(allParams)}` 
    : 'Enlace inválido o expirado'
  errorUrl.searchParams.set('message', errorMessage)
  return NextResponse.redirect(errorUrl.toString())
}