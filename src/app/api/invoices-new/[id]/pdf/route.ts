/**
 * API Route: Generar PDF de factura (migrado a jsPDF)
 * GET /api/invoices-new/[id]/pdf
 */

import { NextRequest, NextResponse } from 'next/server'
import { PDFServiceJsPDF } from '@/lib/pdfServiceJsPDF'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    
    console.log('📄 [API-PDF] Solicitud de PDF para factura:', invoiceId)
    
    // Validar ID de factura
    if (!invoiceId) {
      console.error('❌ [API-PDF] ID de factura faltante')
      return NextResponse.json(
        { success: false, error: 'ID de factura requerido' },
        { status: 400 }
      )
    }

    // Generar PDF usando jsPDF
    console.log('🎨 [API-PDF] Generando PDF con jsPDF...')
    const pdfBuffer = await PDFServiceJsPDF.generateInvoicePDF(invoiceId)
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('❌ [API-PDF] PDF generado está vacío')
      return NextResponse.json(
        { success: false, error: 'Error generando PDF - archivo vacío' },
        { status: 500 }
      )
    }
    
    console.log('✅ [API-PDF] PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes')
    
    // Retornar PDF como respuesta
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factura-${invoiceId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('❌ [API-PDF] Error generando PDF:', error)
    
    // Retornar error detallado
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error generando PDF',
        details: error instanceof Error ? error.message : 'Error desconocido',
        invoiceId: (await params).id
      },
      { status: 500 }
    )
  }
}