import { NextRequest, NextResponse } from 'next/server'
import ServerEmailService from '@/lib/emailService.server'

export async function GET() {
  try {
    // Verificar configuración de email
    const isConfigurationValid = await ServerEmailService.verifyEmailConfiguration()
    
    if (!isConfigurationValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error en la configuración de email' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Configuración de email verificada correctamente' 
    })
  } catch (error) {
    console.error('Error testing email configuration:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error verificando configuración de email',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { test_email } = body

    if (!test_email) {
      return NextResponse.json(
        { success: false, message: 'Email de prueba requerido' },
        { status: 400 }
      )
    }

    // Datos de prueba para el email
    const testOrderData = {
      orderId: 'test-order-123',
      orderNumber: 'TEST-001',
      status: 'pending',
      clientName: 'Usuario de Prueba',
      clientEmail: test_email,
      items: [
        {
          title: 'Producto de Prueba 1',
          quantity: 2,
          price: 49.99
        },
        {
          title: 'Producto de Prueba 2',
          quantity: 1,
          price: 29.99
        }
      ],
      total: 129.97,
      createdAt: new Date().toISOString(),
      shippingAddress: 'Calle de Prueba 123\n28001 Madrid\nEspaña'
    }

    // Enviar email de prueba
    const emailSent = await ServerEmailService.sendOrderStatusNotification(testOrderData)
    
    if (emailSent) {
      return NextResponse.json({ 
        success: true, 
        message: `Email de prueba enviado exitosamente a ${test_email}` 
      })
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No se pudo enviar el email de prueba' 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error enviando email de prueba',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}