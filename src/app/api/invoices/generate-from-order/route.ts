/**
 * API para generar factura automáticamente desde un pedido
 * POST /api/invoices/generate-from-order - Genera factura desde pedido específico
 */

import { NextRequest, NextResponse } from 'next/server'
import { InvoiceService } from '@/lib/invoiceService'
import type { CreateInvoiceData } from '@/types/invoices'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, client_id, auto_send = true } = body
    
    console.log('📄 POST /api/invoices/generate-from-order - Datos:', {
      order_id,
      client_id,
      auto_send
    })
    
    // Validar datos requeridos
    if (!order_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'order_id es requerido'
        },
        { status: 400 }
      )
    }
    
    // Crear factura desde pedido
    const createData: CreateInvoiceData = {
      order_id,
      client_id: client_id || undefined,
      auto_send
    }
    
    const invoice = await InvoiceService.createInvoiceFromOrder(createData)
    
    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo generar la factura automáticamente'
        },
        { status: 400 }
      )
    }
    
    console.log('✅ Factura generada automáticamente:', {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      order_id
    })
    
    // Si está configurado para envío automático, generar el PDF también
    let pdf_url = null
    if (auto_send) {
      try {
        // Generar PDF y obtener la URL para el email
        pdf_url = `/api/invoices/${invoice.id}/pdf`
        console.log('📄 PDF disponible en:', pdf_url)
      } catch (pdfError) {
        console.warn('Error generando PDF automático:', pdfError)
        // No fallar si hay error en PDF, la factura ya está creada
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        invoice,
        pdf_url,
        message: auto_send 
          ? 'Factura generada y lista para enviar por email'
          : 'Factura generada correctamente'
      }
    })
    
  } catch (error) {
    console.error('Error en POST /api/invoices/generate-from-order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al generar factura automática'
      },
      { status: 500 }
    )
  }
}