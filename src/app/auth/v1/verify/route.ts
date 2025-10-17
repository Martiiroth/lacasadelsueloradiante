import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const redirectTo = searchParams.get('redirect_to')
  
  console.log('🔍 AUTH/V1/VERIFY - URL completa:', request.url)
  console.log('🔍 AUTH/V1/VERIFY - Parámetros:', { token, type, redirectTo })
  
  // Usar siempre el dominio de producción
  const baseUrl = 'https://lacasadelsueloradiante.es'
  
  // Si es recovery, redirigir directamente a reset password
  if (type === 'recovery' && token) {
    const resetUrl = new URL('/auth/reset-password', baseUrl)
    resetUrl.searchParams.set('token', token)
    resetUrl.searchParams.set('type', 'recovery')
    
    console.log('✅ AUTH/V1/VERIFY - Redirigiendo a:', resetUrl.toString())
    return NextResponse.redirect(resetUrl.toString())
  }
  
  // Para otros casos, redirigir al callback normal
  return NextResponse.redirect(new URL('/auth/callback?' + searchParams.toString(), baseUrl))
}