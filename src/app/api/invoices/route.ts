import { NextRequest, NextResponse } from 'next/server'
import { InvoiceService } from '../../../lib/invoiceService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')
    const invoiceId = searchParams.get('invoice_id')
    const limit = searchParams.get('limit')

    if (invoiceId) {
      // Obtener una factura específica
      const invoice = await InvoiceService.getInvoiceById(invoiceId)
      
      if (!invoice) {
        return NextResponse.json(
          { error: 'Factura no encontrada' },
          { status: 404 }
        )
      }

      return NextResponse.json({ invoice })
    }

    if (clientId) {
      // Obtener facturas de un cliente específico
      const invoices = await InvoiceService.getClientInvoices(
        clientId,
        limit ? parseInt(limit) : 10
      )

      return NextResponse.json({ invoices })
    }

    return NextResponse.json(
      { error: 'Parámetros requeridos: client_id o invoice_id' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error en API de facturas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, orderId } = await request.json()

    if (action === 'generate' && orderId) {
      // Generar factura para un pedido específico
      const invoice = await InvoiceService.generateInvoiceForOrder(orderId)
      
      if (!invoice) {
        return NextResponse.json(
          { error: 'Error generando la factura' },
          { status: 400 }
        )
      }

      return NextResponse.json({ 
        message: 'Factura generada exitosamente',
        invoice 
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida. Solo se soporta "generate" con orderId.' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error en API de facturas POST:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}