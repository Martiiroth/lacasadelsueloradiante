/**
 * API Endpoint: Obtener información de un código
 * GET /api/activation-codes/[code]
 * 
 * Consulta el estado de un código específico
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{
    code: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { code } = await params

    if (!code) {
      return NextResponse.json(
        { error: 'Código requerido' },
        { status: 400 }
      )
    }

    // Buscar código
    const { data: activationCode, error } = await supabase
      .from('activation_codes')
      .select(`
        *,
        order:orders (
          id,
          order_number,
          total_cents,
          status,
          created_at
        )
      `)
      .eq('code', code.toUpperCase().replace(/\s/g, ''))
      .single()

    if (error || !activationCode) {
      return NextResponse.json(
        { error: 'Código no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si está expirado
    const now = new Date()
    const expiresAt = new Date(activationCode.expires_at)
    const isExpired = expiresAt < now

    // Calcular días restantes
    const daysRemaining = isExpired
      ? 0
      : Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return NextResponse.json({
      code: activationCode,
      is_valid: activationCode.status === 'active' && !isExpired,
      is_expired: isExpired || activationCode.status === 'expired',
      is_revoked: activationCode.status === 'revoked',
      days_remaining: daysRemaining,
      expires_at: activationCode.expires_at
    })
  } catch (error) {
    console.error('Error en get activation code API:', error)
    return NextResponse.json(
      { error: 'Error al obtener código' },
      { status: 500 }
    )
  }
}

// Permitir CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  )
}
