/**
 * API para generar proforma desde un pedido
 * GET /api/proforma/[orderId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { PDFService } from '@/lib/pdfService'

interface Props {
  params: Promise<{ orderId: string }>
}

export async function GET(
  request: NextRequest,
  props: Props
) {
  try {
    const params = await props.params
    const { orderId } = params

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID es requerido' },
        { status: 400 }
      )
    }

    // Generar PDF de proforma (numeración PR-00001, PR-00002...)
    const { buffer: pdfBuffer, proformaNumber } = await PDFService.generateProformaFromOrder(orderId)

    // Determinar si es descarga o inline
    const { searchParams } = new URL(request.url)
    const download = searchParams.get('download') === 'true'

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download
          ? `attachment; filename="${proformaNumber}.pdf"`
          : `inline; filename="${proformaNumber}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generando proforma:', error)
    return NextResponse.json(
      { 
        error: 'Error al generar proforma',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
