/**
 * API para obtener estadísticas de facturas
 * GET /api/invoices/stats - Estadísticas generales de facturas
 */

import { NextRequest, NextResponse } from 'next/server'
import { InvoiceService } from '@/lib/invoiceService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parámetros de filtro temporal
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const clientId = searchParams.get('client_id')
    
    console.log('📊 GET /api/invoices/stats - Filtros:', {
      dateFrom,
      dateTo,
      clientId
    })
    
    // Obtener estadísticas
    const stats = await InvoiceService.getInvoiceStats(clientId || undefined)
    
    return NextResponse.json({
      success: true,
      data: { stats }
    })
    
  } catch (error) {
    console.error('Error en GET /api/invoices/stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}