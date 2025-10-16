import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const redirectTo = searchParams.get('redirect_to') || searchParams.get('redirectTo')
  
  // Log completo de todos los parámetros para debugging
  const allParams = Object.fromEntries(searchParams.entries())
  console.log('🔍 Auth callback URL completa:', request.url)
  console.log('🔍 Todos los parámetros:', allParams)
  console.log('🔍 Parámetros extraídos:', { token, type, redirectTo })

  // Si es un token de recuperación, redirigir a la página de reset con el token
  if (type === 'recovery' && token) {
    const resetUrl = new URL('/auth/reset-password', request.nextUrl.origin)
    resetUrl.searchParams.set('token', token)
    resetUrl.searchParams.set('type', 'recovery')
    
    console.log('✅ Token de recovery encontrado, redirigiendo a:', resetUrl.toString())
    
    return NextResponse.redirect(resetUrl.toString())
  }

  // Verificar si tenemos parámetros pero no del tipo esperado
  if (token && !type) {
    console.log('⚠️ Token encontrado pero sin type, asumiendo recovery')
    const resetUrl = new URL('/auth/reset-password', request.nextUrl.origin)
    resetUrl.searchParams.set('token', token)
    resetUrl.searchParams.set('type', 'recovery')
    
    return NextResponse.redirect(resetUrl.toString())
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
      const errorUrl = new URL('/auth/error', request.nextUrl.origin)
      errorUrl.searchParams.set('message', 'Error al confirmar el email')
      return NextResponse.redirect(errorUrl.toString())
    }

    // Redirigir al dashboard después de confirmar
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl.origin))
  }

  // Para otros tipos de tokens o si falta información
  console.log('❌ Parámetros inválidos o faltantes')
  console.log('❌ URL recibida:', request.url)
  console.log('❌ Todos los params:', allParams)
  
  const errorUrl = new URL('/auth/error', request.nextUrl.origin)
  const errorMessage = process.env.NODE_ENV === 'development' 
    ? `Enlace inválido. Params: ${JSON.stringify(allParams)}` 
    : 'Enlace inválido o expirado'
  errorUrl.searchParams.set('message', errorMessage)
  return NextResponse.redirect(errorUrl.toString())
}