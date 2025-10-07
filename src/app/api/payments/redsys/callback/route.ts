/**
 * API Route: Callback de Redsys para notificaciones de pago
 * POST /api/payments/redsys/callback
 */

import { NextRequest, NextResponse } from 'next/server'
import { RedsysService, RedsysResponse } from '@/lib/redsys'
import { createClient } from '@/utils/supabase/server'
import EmailService from '@/lib/emailService.server'

export async function POST(request: NextRequest) {
  console.log('🔔 ===== CALLBACK DE REDSYS RECIBIDO =====')
  
  try {
    // Obtener parámetros de Redsys del body
    const formData = await request.formData()
    
    console.log('📦 Datos del formulario:', {
      hasSignatureVersion: !!formData.get('Ds_SignatureVersion'),
      hasParameters: !!formData.get('Ds_MerchantParameters'),
      hasSignature: !!formData.get('Ds_Signature')
    })
    
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
    
    // El número de orden de Redsys contiene nuestro orderId
    // Buscar en los logs el registro que creamos al iniciar el pago
    const { data: logs, error: logsError } = await supabase
      .from('order_logs')
      .select('order_id, created_at')
      .eq('comment', 'Iniciando pago con Redsys')
      .order('created_at', { ascending: false })
      .limit(20) // Aumentar para buscar en más registros

    console.log('🔍 Buscando orden en logs:', { 
      found: logs?.length || 0,
      redsysOrder: transactionData.Ds_Order 
    })

    let orderId: string | null = null
    
    // Buscar la orden más reciente que inició pago
    if (logs && logs.length > 0) {
      // Tomar la más reciente (la primera en la lista ordenada desc)
      orderId = logs[0].order_id
      console.log('✓ Orden encontrada en logs:', orderId)
    }
    
    // Si no encontramos en logs, buscar órdenes pendientes recientes
    if (!orderId) {
      console.log('⚠️ No encontrado en logs, buscando orden pendiente...')
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('status', 'pending')
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (pendingOrders && pendingOrders.length > 0) {
        orderId = pendingOrders[0].id
        console.log('✓ Orden pendiente encontrada:', orderId)
      }
    }

    if (!orderId) {
      console.error('No se encontró la orden relacionada')
      return new NextResponse('', { status: 404 })
    }

    // Actualizar estado de la orden según el resultado del pago
    if (result.isSuccess) {
      // Pago exitoso - cambiar a processing (en proceso de preparación)
      await supabase
        .from('orders')
        .update({ 
          status: 'processing',
          payment_status: 'paid'
        })
        .eq('id', orderId)

      // Registrar en logs
      await supabase.from('order_logs').insert({
        order_id: orderId,
        status: 'processing',
        comment: 'Pago confirmado vía Redsys - Pedido en preparación',
        details: {
          redsysOrder: transactionData.Ds_Order,
          authCode: transactionData.Ds_AuthorisationCode,
          amount: transactionData.Ds_Amount,
          responseCode: transactionData.Ds_Response,
          cardType: transactionData.Ds_Card_Type,
          cardCountry: transactionData.Ds_Card_Country
        }
      })

      console.log('✅ Pago confirmado para orden:', orderId, '- Estado: processing')
      
      // Enviar correo de confirmación de pedido
      try {
        const { data: orderData } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              qty,
              price_cents,
              product_variants (
                title,
                products (
                  title
                )
              )
            ),
            clients (
              first_name,
              last_name,
              email
            )
          `)
          .eq('id', orderId)
          .single()

        if (orderData) {
          // Preparar datos para el email
          const emailData = {
            orderId: orderData.id,
            orderNumber: orderData.confirmation_number,
            status: orderData.status,
            clientName: orderData.clients 
              ? `${orderData.clients.first_name} ${orderData.clients.last_name}`
              : orderData.guest_email || 'Cliente',
            clientEmail: orderData.clients?.email || orderData.guest_email || '',
            items: orderData.order_items?.map((item: any) => ({
              title: item.product_variants?.products?.title || 'Producto',
              quantity: item.qty,
              price: item.price_cents / 100
            })) || [],
            subtotal: orderData.subtotal_cents / 100,
            shipping: orderData.shipping_cents / 100,
            tax: orderData.tax_cents / 100,
            total: orderData.total_cents / 100,
            createdAt: orderData.created_at
          }

          await EmailService.sendNewOrderNotification(emailData)
          console.log('📧 Correo de confirmación enviado para orden:', orderId)
        }
      } catch (emailError) {
        console.error('Error enviando correo de confirmación:', emailError)
        // No fallar la transacción si el correo falla
      }
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
