/**
 * API Route: Procesa resultado de pago Redsys desde la página de resultado
 * POST /api/payments/redsys/process-result
 */

import { NextRequest, NextResponse } from 'next/server'
import { RedsysService, RedsysResponse } from '@/lib/redsys'
import { createClient } from '@/utils/supabase/server'
import EmailService from '@/lib/emailService.server'

export async function POST(request: NextRequest) {
  console.log('🔄 ===== PROCESANDO RESULTADO DE REDSYS DESDE FRONTEND =====')
  
  try {
    const body = await request.json()
    const { Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature, orderId } = body
    
    console.log('📦 Datos recibidos del frontend:', {
      hasSignatureVersion: !!Ds_SignatureVersion,
      hasParameters: !!Ds_MerchantParameters,
      hasSignature: !!Ds_Signature,
      orderId: orderId
    })

    // Validar que tenemos todos los parámetros
    if (!Ds_MerchantParameters || !Ds_Signature || !orderId) {
      console.error('Faltan parámetros requeridos')
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    const redsysResponse: RedsysResponse = {
      Ds_SignatureVersion,
      Ds_MerchantParameters,
      Ds_Signature
    }

    // Debug: Mostrar información de configuración
    console.log('🔧 Variables de configuración Redsys:', {
      merchantCode: process.env.REDSYS_MERCHANT_CODE,
      terminal: process.env.REDSYS_TERMINAL,
      hasSecretKey: !!process.env.REDSYS_SECRET_KEY,
      secretKeyLength: process.env.REDSYS_SECRET_KEY?.length || 0,
      currency: process.env.REDSYS_CURRENCY,
      environment: process.env.REDSYS_ENVIRONMENT
    })

    // Debug: Mostrar parámetros recibidos
    console.log('🔍 Parámetros Redsys recibidos:', {
      signatureVersion: Ds_SignatureVersion,
      parametersLength: Ds_MerchantParameters?.length || 0,
      signatureLength: Ds_Signature?.length || 0,
      parameters: Ds_MerchantParameters?.substring(0, 100) + '...',
      signature: Ds_Signature?.substring(0, 20) + '...'
    })

    // Procesar respuesta de Redsys
    const result = RedsysService.processResponse(redsysResponse)

    console.log('📊 Resultado del procesamiento:', {
      isValid: result.isValid,
      isSuccess: result.isSuccess,
      message: result.message,
      hasData: !!result.data
    })

    if (!result.isValid) {
      console.error('❌ Firma de Redsys inválida')
      
      // Debug adicional para la firma
      try {
        const decodedParams = JSON.parse(Buffer.from(Ds_MerchantParameters, 'base64').toString('utf-8'))
        console.log('🧪 Debug parámetros decodificados:', {
          order: decodedParams.Ds_Order,
          amount: decodedParams.Ds_Amount,
          response: decodedParams.Ds_Response,
          merchantCode: decodedParams.Ds_MerchantCode,
          terminal: decodedParams.Ds_Terminal
        })
      } catch (decodeError) {
        console.error('Error decodificando parámetros para debug:', decodeError)
      }
      
      return NextResponse.json(
        { 
          error: 'Firma de Redsys inválida', 
          success: false,
          debug: {
            hasSecretKey: !!process.env.REDSYS_SECRET_KEY,
            parametersReceived: !!Ds_MerchantParameters,
            signatureReceived: !!Ds_Signature
          }
        },
        { status: 400 }
      )
    }

    // Extraer información de la transacción
    const transactionData = result.data
    if (!transactionData) {
      console.error('No se pudo decodificar datos de transacción')
      return NextResponse.json(
        { error: 'No se pudo decodificar datos de transacción', success: false },
        { status: 400 }
      )
    }

    console.log('📝 Datos de transacción Redsys:', {
      order: transactionData.Ds_Order,
      response: transactionData.Ds_Response,
      amount: transactionData.Ds_Amount,
      authCode: transactionData.Ds_AuthorisationCode
    })

    const supabase = await createClient()

    // Verificar que la orden existe
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status, payment_status')
      .eq('id', orderId)
      .single()

    if (!existingOrder) {
      console.error('Orden no encontrada:', orderId)
      return NextResponse.json(
        { error: 'Orden no encontrada', success: false },
        { status: 404 }
      )
    }

    console.log('📋 Estado actual de la orden:', existingOrder)

    // Actualizar estado de la orden según el resultado del pago
    if (result.isSuccess) {
      // Pago exitoso - cambiar a processing (en proceso de preparación)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'processing',
          payment_status: 'paid'
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('Error actualizando orden:', updateError)
        return NextResponse.json(
          { error: 'Error actualizando orden', success: false },
          { status: 500 }
        )
      }

      // Registrar en logs
      await supabase.from('order_logs').insert({
        order_id: orderId,
        status: 'processing',
        comment: 'Pago confirmado vía Redsys desde página resultado',
        details: {
          redsysOrder: transactionData.Ds_Order,
          authCode: transactionData.Ds_AuthorisationCode,
          amount: transactionData.Ds_Amount,
          responseCode: transactionData.Ds_Response,
          processedFrom: 'frontend-result-page'
        }
      })

      console.log('✅ Orden actualizada a processing:', orderId)
      
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

          return NextResponse.json({
            success: true,
            message: 'Pago procesado correctamente',
            orderStatus: 'processing',
            emailSent: true
          })
        }
      } catch (emailError) {
        console.error('Error enviando correo de confirmación:', emailError)
        return NextResponse.json({
          success: true,
          message: 'Pago procesado correctamente, error enviando correo',
          orderStatus: 'processing',
          emailSent: false,
          emailError: emailError instanceof Error ? emailError.message : 'Error desconocido'
        })
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
        comment: `Pago rechazado por Redsys desde página resultado: ${result.message}`,
        details: {
          redsysOrder: transactionData.Ds_Order,
          responseCode: transactionData.Ds_Response,
          amount: transactionData.Ds_Amount,
          processedFrom: 'frontend-result-page'
        }
      })

      console.log('❌ Pago rechazado para orden:', orderId, result.message)
      
      return NextResponse.json({
        success: false,
        message: `Pago rechazado: ${result.message}`,
        orderStatus: 'cancelled'
      })
    }

    // Fallback return
    return NextResponse.json({
      success: true,
      message: 'Procesamiento completado'
    })

  } catch (error) {
    console.error('Error procesando resultado de pago:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        success: false,
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}