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
    // Usar createClient() que funciona con usuarios autenticados y anónimos
    const supabase = await createClient()
    
    // Obtener usuario actual (puede ser null para usuarios invitados)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_cents, status, client_id')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('❌ Error fetching order:', orderError)
      return NextResponse.json(
        { error: 'Error al verificar la orden: ' + orderError.message },
        { status: 500 }
      )
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Lógica de autorización mejorada:
    // - Si la orden no tiene client_id (pedido invitado), SIEMPRE permitir acceso
    // - Si no hay usuario autenticado, permitir acceso (checkout como invitado reciente)
    // - Si hay usuario autenticado y la orden tiene client_id, verificar que sea el dueño o admin
    
    let isAuthorized = false
    
    // Caso 1: Orden sin cliente asociado (pedido invitado) - SIEMPRE permitir
    if (!order.client_id) {
      console.log('✅ Acceso permitido - Orden sin cliente (invitado)')
      isAuthorized = true
    }
    // Caso 2: No hay usuario autenticado - Permitir acceso (puede ser checkout como invitado reciente)
    else if (!user) {
      console.log('✅ Acceso permitido - Usuario no autenticado (checkout invitado)')
      isAuthorized = true
    }
    // Caso 3: Usuario autenticado con orden que tiene cliente - Verificar permisos
    else {
      try {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id, auth_user_id, customer_role:customer_roles(name)')
          .eq('id', order.client_id)
          .single()
        
        if (clientError) {
          console.error('⚠️ Error obteniendo cliente, permitiendo acceso:', clientError.message)
          // Si hay error obteniendo el cliente, permitir acceso para no bloquear pagos
          isAuthorized = true
        } else if (client) {
          const isOwner = client.auth_user_id === user.id
          const isAdmin = (client.customer_role as any)?.name === 'admin'
          
          if (isOwner || isAdmin) {
            console.log('✅ Acceso permitido - Usuario autorizado:', { isOwner, isAdmin })
            isAuthorized = true
          } else {
            console.error('❌ Acceso denegado - Usuario no autorizado:', {
              userId: user.id,
              orderClientId: order.client_id,
              clientAuthUserId: client.auth_user_id
            })
            isAuthorized = false
          }
        } else {
          // Cliente no encontrado - permitir acceso (puede ser un problema de datos)
          console.warn('⚠️ Cliente no encontrado, permitiendo acceso')
          isAuthorized = true
        }
      } catch (authError) {
        console.error('⚠️ Error verificando autorización, permitiendo acceso:', authError)
        // En caso de error, permitir acceso para no bloquear pagos legítimos
        isAuthorized = true
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'No autorizado para acceder a esta orden' },
        { status: 403 }
      )
    }

    console.log('💰 Verificando totales para Redsys:', {
      orderId: order.id,
      orderTotalCents: order.total_cents,
      requestedAmountCents: amountInCents,
      match: order.total_cents === amountInCents
    })

    // Verificar que el importe coincide con el de la orden
    if (order.total_cents !== amountInCents) {
      console.error('❌ Mismatch de importe:', {
        expected: order.total_cents,
        received: amountInCents,
        difference: order.total_cents - amountInCents
      })
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

    // Registrar intento de pago en logs (no bloquear si falla)
    try {
      await supabase.from('order_logs').insert({
        order_id: orderId,
        status: 'pending',
        comment: 'Iniciando pago con Redsys',
        details: {
          amount: amountInCents,
          paymentMethod: 'redsys'
        }
      })
    } catch (logError) {
      console.warn('⚠️ Error registrando log de pago (no crítico):', logError)
      // No bloquear el pago si falla el registro de logs
    }

    return NextResponse.json({
      success: true,
      paymentForm
    })

  } catch (error) {
    console.error('❌ Error creando transacción Redsys:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}
