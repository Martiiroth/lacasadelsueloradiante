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

    // Debug adicional para la firma
    let decodedParams: any = null
    try {
      decodedParams = JSON.parse(Buffer.from(Ds_MerchantParameters, 'base64').toString('utf-8'))
      console.log('🧪 Parámetros decodificados:', {
        order: decodedParams.Ds_Order,
        amount: decodedParams.Ds_Amount,
        response: decodedParams.Ds_Response,
        merchantCode: decodedParams.Ds_MerchantCode,
        terminal: decodedParams.Ds_Terminal,
        authCode: decodedParams.Ds_AuthorisationCode,
        responseDescription: decodedParams.Ds_Response_Description
      })
    } catch (decodeError) {
      console.error('Error decodificando parámetros para debug:', decodeError)
      return NextResponse.json(
        { error: 'Error decodificando parámetros de Redsys', success: false },
        { status: 400 }
      )
    }

    // En entorno de test, permitir procesar sin validación estricta de firma
    // pero verificar que la respuesta de pago sea exitosa
    const isTestEnvironment = process.env.REDSYS_ENVIRONMENT === 'test'
    const paymentResponse = decodedParams.Ds_Response
    const responseCode = parseInt(paymentResponse)
    const isPaymentSuccessful = responseCode >= 0 && responseCode <= 99

    console.log('💳 Análisis de respuesta de pago:', {
      environment: process.env.REDSYS_ENVIRONMENT,
      responseCode: paymentResponse,
      isSuccessful: isPaymentSuccessful,
      bypassSignatureValidation: isTestEnvironment
    })

    if (!result.isValid && !isTestEnvironment) {
      console.error('❌ Firma de Redsys inválida y no estamos en entorno de test')
      return NextResponse.json(
        { 
          error: 'Firma de Redsys inválida', 
          success: false,
          debug: {
            hasSecretKey: !!process.env.REDSYS_SECRET_KEY,
            parametersReceived: !!Ds_MerchantParameters,
            signatureReceived: !!Ds_Signature,
            environment: process.env.REDSYS_ENVIRONMENT
          }
        },
        { status: 400 }
      )
    }

    // En test, usar los datos decodificados directamente si la firma no es válida
    const transactionData = result.data || decodedParams
    
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

    // Verificar que la orden existe y obtener client_id
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status, payment_status, client_id')
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

    // Determinar si el pago fue exitoso
    const isSuccess = result.isSuccess || (isTestEnvironment && isPaymentSuccessful)
    
    console.log('🎯 Determinación final de éxito:', {
      redsysServiceSuccess: result.isSuccess,
      testEnvironmentSuccess: isTestEnvironment && isPaymentSuccessful,
      finalSuccess: isSuccess
    })

    // Actualizar estado de la orden según el resultado del pago
    if (isSuccess) {
      console.log('🔄 Actualizando orden con:', {
        orderId,
        status: 'processing',
        payment_status: 'paid'
      })
      
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
      
      // Vaciar carrito del cliente después del pago exitoso
      if (existingOrder.client_id) {
        try {
          console.log('🛒 Vaciando carrito del cliente:', existingOrder.client_id)
          
          // Buscar el carrito del cliente
          const { data: clientCart } = await supabase
            .from('carts')
            .select('id')
            .eq('client_id', existingOrder.client_id)
            .single()
          
          if (clientCart) {
            // Vaciar items del carrito
            const { error: clearError } = await supabase
              .from('cart_items')
              .delete()
              .eq('cart_id', clientCart.id)
            
            if (clearError) {
              console.error('Error vaciando carrito:', clearError)
            } else {
              // Actualizar timestamp del carrito
              await supabase
                .from('carts')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', clientCart.id)
              
              console.log('✅ Carrito vaciado exitosamente para cliente:', existingOrder.client_id)
            }
          }
        } catch (error) {
          console.error('Error vaciando carrito del cliente:', error)
          // No bloquear el proceso principal por error en vaciar carrito
        }
      }
      
      // Esperar un momento para asegurar que la actualización se propague
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Enviar correo de confirmación de pedido
      try {
        // Verificar que la orden efectivamente se actualizó
        const { data: orderData } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              qty,
              price_cents,
              product_title,
              variant_title,
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

        console.log('📧 Estado de la orden para envío de correo:', {
          orderId: orderData?.id,
          status: orderData?.status,
          paymentStatus: orderData?.payment_status
        })

        if (orderData) {
          // Verificar que el estado es correcto antes de enviar
          if (orderData.status !== 'processing') {
            console.warn('⚠️ Advertencia: El estado de la orden no es processing:', orderData.status)
          }
          // Preparar datos para el email - usar el ID de la orden como número de pedido
          const emailData = {
            orderId: orderData.id,
            orderNumber: orderData.id,
            status: orderData.status, // Este debería ser 'processing' ahora
            clientName: orderData.clients 
              ? `${orderData.clients.first_name} ${orderData.clients.last_name}`
              : orderData.guest_email || 'Cliente',
            clientEmail: orderData.clients?.email || orderData.guest_email || '',
            items: orderData.order_items?.map((item: any) => ({
              // Si es producto personalizado, usar nombres guardados; si no, usar de la relación
              title: item.product_title 
                ? `${item.product_title}${item.variant_title ? ` - ${item.variant_title}` : ''}`
                : item.product_variants?.products?.title || 'Producto',
              quantity: item.qty,
              price: item.price_cents / 100
            })) || [],
            subtotal: orderData.subtotal_cents / 100,
            shipping: orderData.shipping_cost_cents / 100,
            tax: orderData.tax_cents / 100,
            total: orderData.total_cents / 100,
            createdAt: orderData.created_at,
            shippingAddress: orderData.shipping_address ? 
              (typeof orderData.shipping_address === 'string' 
                ? orderData.shipping_address 
                : JSON.stringify(orderData.shipping_address, null, 2)
              ) : undefined,
            clientInfo: orderData.clients ? {
              first_name: orderData.clients.first_name,
              last_name: orderData.clients.last_name,
              email: orderData.clients.email,
              phone: orderData.clients.phone,
              company_name: orderData.clients.company_name,
              nif_cif: orderData.clients.nif_cif,
              company_position: orderData.clients.company_position,
              activity: orderData.clients.activity,
              address_line1: orderData.clients.address_line1,
              address_line2: orderData.clients.address_line2,
              city: orderData.clients.city,
              region: orderData.clients.region,
              postal_code: orderData.clients.postal_code
            } : (orderData.guest_email && orderData.shipping_address ? (() => {
              // Para clientes invitados, extraer información de shipping_address
              const shippingAddr = typeof orderData.shipping_address === 'string' 
                ? JSON.parse(orderData.shipping_address) 
                : orderData.shipping_address
              
              return {
                first_name: shippingAddr?.first_name || shippingAddr?.billing?.first_name || '',
                last_name: shippingAddr?.last_name || shippingAddr?.billing?.last_name || '',
                email: orderData.guest_email,
                phone: shippingAddr?.phone || shippingAddr?.billing?.phone || '',
                company_name: shippingAddr?.company_name || shippingAddr?.billing?.company_name || '',
                nif_cif: shippingAddr?.nif_cif || shippingAddr?.billing?.nif_cif || '',
                company_position: shippingAddr?.company_position || shippingAddr?.billing?.company_position || '',
                activity: shippingAddr?.activity || shippingAddr?.billing?.activity || '',
                address_line1: shippingAddr?.address_line1 || shippingAddr?.billing?.address_line1 || '',
                address_line2: shippingAddr?.address_line2 || shippingAddr?.billing?.address_line2 || '',
                city: shippingAddr?.city || shippingAddr?.billing?.city || '',
                region: shippingAddr?.region || shippingAddr?.billing?.region || '',
                postal_code: shippingAddr?.postal_code || shippingAddr?.billing?.postal_code || ''
              }
            })() : null)
          }

          console.log('📬 Datos del email a enviar:', {
            orderId: emailData.orderId,
            status: emailData.status,
            clientEmail: emailData.clientEmail,
            orderNumber: emailData.orderNumber,
            confirmationNumberFromDB: orderData.confirmation_number,
            hasShippingAddress: !!orderData.shipping_address,
            shippingAddressType: typeof orderData.shipping_address
          })

          await EmailService.sendNewOrderNotification(emailData)
          console.log('📧 Correo de confirmación enviado para orden:', orderId, 'con estado:', emailData.status)

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

      const failureMessage = result.message || `Código de respuesta: ${transactionData.Ds_Response}`
      console.log('❌ Pago rechazado para orden:', orderId, failureMessage)
      
      return NextResponse.json({
        success: false,
        message: `Pago rechazado: ${failureMessage}`,
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