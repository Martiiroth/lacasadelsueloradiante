import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const redirectTo = searchParams.get('redirect_to') || searchParams.get('redirectTo')

  console.log('🔍 Auth callback params:', { token, type, redirectTo })

  // Si es un token de recuperación, redirigir a la página de reset con el token
  if (type === 'recovery' && token) {
    const resetUrl = new URL('/auth/reset-password', request.nextUrl.origin)
    resetUrl.searchParams.set('token', token)
    resetUrl.searchParams.set('type', 'recovery')
    
    console.log('🔄 Redirigiendo a:', resetUrl.toString())
    
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
  const errorUrl = new URL('/auth/error', request.nextUrl.origin)
  errorUrl.searchParams.set('message', 'Enlace inválido o expirado')
  return NextResponse.redirect(errorUrl.toString())
}