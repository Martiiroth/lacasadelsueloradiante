/**
 * API Route: Callback de Redsys para notificaciones de pago
 * POST /api/payments/redsys/callback
 */

import { NextRequest, NextResponse } from 'next/server'
import { RedsysService, RedsysResponse } from '@/lib/redsys'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Obtener parámetros de Redsys del body
    const formData = await request.formData()
    
    const redsysResponse: RedsysResponse = {
      Ds_SignatureVersion: formData.get('Ds_SignatureVersion') as string,
      Ds_MerchantParameters: formData.get('Ds_MerchantParameters') as string,
      Ds_Signature: formData.get('Ds_Signature') as string
    }

    // Validar que tenemos todos los parámetros
    if (!redsysResponse.Ds_MerchantParameters || !redsysResponse.Ds_Signature) {
      console.error('Faltan parámetros de Redsys')
      return new NextResponse('', { status: 400 })
    }

    // Procesar respuesta de Redsys
    const result = RedsysService.processResponse(redsysResponse)

    if (!result.isValid) {
      console.error('Firma de Redsys inválida')
      return new NextResponse('', { status: 400 })
    }

    // Extraer información de la transacción
    const transactionData = result.data
    if (!transactionData) {
      console.error('No se pudo decodificar datos de transacción')
      return new NextResponse('', { status: 400 })
    }

    console.log('📝 Callback de Redsys recibido:', {
      order: transactionData.Ds_Order,
      response: transactionData.Ds_Response,
      amount: transactionData.Ds_Amount,
      authCode: transactionData.Ds_AuthorisationCode
    })

    // Buscar la orden relacionada
    const supabase = await createClient()
    
    // Buscar por el número de orden de Redsys en los logs
    const { data: logs } = await supabase
      .from('order_logs')
      .select('order_id')
      .eq('comment', 'Iniciando pago con Redsys')
      .order('created_at', { ascending: false })
      .limit(10)

    let orderId: string | null = null
    
    // Si no encontramos en logs, intentar buscar órdenes pendientes recientes
    if (!logs || logs.length === 0) {
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (pendingOrders && pendingOrders.length > 0) {
        orderId = pendingOrders[0].id
      }
    } else {
      orderId = logs[0].order_id
    }

    if (!orderId) {
      console.error('No se encontró la orden relacionada')
      return new NextResponse('', { status: 404 })
    }

    // Actualizar estado de la orden según el resultado del pago
    if (result.isSuccess) {
      // Pago exitoso
      await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          payment_status: 'paid'
        })
        .eq('id', orderId)

      // Registrar en logs
      await supabase.from('order_logs').insert({
        order_id: orderId,
        status: 'confirmed',
        comment: 'Pago confirmado vía Redsys',
        details: {
          redsysOrder: transactionData.Ds_Order,
          authCode: transactionData.Ds_AuthorisationCode,
          amount: transactionData.Ds_Amount,
          responseCode: transactionData.Ds_Response,
          cardType: transactionData.Ds_Card_Type,
          cardCountry: transactionData.Ds_Card_Country
        }
      })

      console.log('✅ Pago confirmado para orden:', orderId)
    } else {
      // Pago rechazado
      await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          payment_status: 'failed'
        })
        .eq('id', orderId)

      // Registrar en logs
      await supabase.from('order_logs').insert({
        order_id: orderId,
        status: 'cancelled',
        comment: `Pago rechazado por Redsys: ${result.message}`,
        details: {
          redsysOrder: transactionData.Ds_Order,
          responseCode: transactionData.Ds_Response,
          amount: transactionData.Ds_Amount
        }
      })

      console.log('❌ Pago rechazado para orden:', orderId, result.message)
    }

    // Redsys espera un 200 OK vacío como respuesta
    return new NextResponse('', { status: 200 })

  } catch (error) {
    console.error('Error procesando callback de Redsys:', error)
    return new NextResponse('', { status: 500 })
  }
}

// Redsys también puede enviar notificaciones por GET
export async function GET(request: NextRequest) {
  return POST(request)
}
