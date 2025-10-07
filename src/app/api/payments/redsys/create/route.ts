/**
 * API Route: Crear transacción de pago con Redsys
 * POST /api/payments/redsys/create
 */

import { NextRequest, NextResponse } from 'next/server'
import { RedsysService } from '@/lib/redsys'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, amount, description, consumerName } = body

    // Validar parámetros requeridos
    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: orderId y amount' },
        { status: 400 }
      )
    }

    // Validar que el amount sea un número positivo
    const amountInCents = parseInt(amount)
    if (isNaN(amountInCents) || amountInCents <= 0) {
      return NextResponse.json(
        { error: 'El importe debe ser un número positivo' },
        { status: 400 }
      )
    }

    // Verificar que la orden existe en la base de datos
    const supabase = await createClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_cents, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el importe coincide con el de la orden
    if (order.total_cents !== amountInCents) {
      return NextResponse.json(
        { error: 'El importe no coincide con el de la orden' },
        { status: 400 }
      )
    }

    // Generar parámetros de pago de Redsys
    const paymentForm = RedsysService.createPaymentForm(
      amountInCents,
      orderId,
      description || 'Pedido en La Casa del Suelo Radiante',
      consumerName
    )

    // Registrar intento de pago en logs
    await supabase.from('order_logs').insert({
      order_id: orderId,
      status: 'pending',
      comment: 'Iniciando pago con Redsys',
      details: {
        amount: amountInCents,
        paymentMethod: 'redsys'
      }
    })

    return NextResponse.json({
      success: true,
      paymentForm
    })

  } catch (error) {
    console.error('Error creando transacción Redsys:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
