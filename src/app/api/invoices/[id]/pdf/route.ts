/**
 * API para generar y descargar PDFs de facturas
 * GET /api/invoices/[id]/pdf - Generar y descargar PDF de factura
 */

import { NextRequest, NextResponse } from 'next/server'
import { InvoiceService } from '@/lib/invoiceService'
import { PDFService } from '@/lib/pdfService'

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, props: Props) {
  try {
    const params = await props.params
    const { id } = params
    const { searchParams } = new URL(request.url)
    const download = searchParams.get('download') === 'true'
    
    console.log('📄 GET /api/invoices/[id]/pdf - ID:', id, 'Download:', download)
    
    // Obtener factura con todos los datos
    const invoice = await InvoiceService.getInvoiceById(id)
    
    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Factura no encontrada'
        },
        { status: 404 }
      )
    }
    
    // Generar PDF
    console.log('📄 Generando PDF para factura:', id)
    const pdfBuffer = await PDFService.generateInvoicePDF(id)
    
    if (!pdfBuffer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al generar el PDF'
        },
        { status: 500 }
      )
    }
    
    // Configurar headers para descarga del PDF
    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.byteLength.toString()
    })
    
    if (download) {
      const filename = `factura-${invoice.invoice_number}.pdf`
      headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    } else {
      headers.set('Content-Disposition', 'inline')
    }
    
    console.log('✅ PDF generado correctamente para factura:', id)
    
    // Convertir Buffer a Uint8Array para NextResponse
    const uint8Array = new Uint8Array(pdfBuffer)
    
    return new NextResponse(uint8Array, {
      status: 200,
      headers
    })
    
  } catch (error) {
    console.error('Error en GET /api/invoices/[id]/pdf:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}