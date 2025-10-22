/**
 * API Endpoint: Validar código de activación
 * POST /api/activation-codes/validate
 * 
 * Valida un código desde la app móvil y retorna su estado
 */

import { NextRequest, NextResponse } from 'next/server'
import { ActivationCodesService } from '@/lib/activationCodesService'
import type { ValidateCodeRequest } from '@/types/activation-codes'

export async function POST(request: NextRequest) {
  try {
    const body: ValidateCodeRequest = await request.json()

    // Validar datos requeridos
    if (!body.code) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Código requerido'
        },
        { status: 400 }
      )
    }

    // Validar código
    const result = await ActivationCodesService.validateCode(body)

    const statusCode = result.valid ? 200 : 400

    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    console.error('Error en validate activation code API:', error)
    return NextResponse.json(
      {
        valid: false,
        message: 'Error al validar código'
      },
      { status: 500 }
    )
  }
}

// Permitir CORS para la app móvil
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  )
}
