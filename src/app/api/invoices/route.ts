/**
 * API REST principal de facturas
 * GET /api/invoices - Listar facturas con filtros
 * POST /api/invoices - Crear nueva factura
 */

import { NextRequest, NextResponse } from 'next/server'
import { InvoiceService } from '@/lib/invoiceService'
import type { InvoiceFilters, CreateInvoiceData } from '@/types/invoices'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extraer parámetros de filtro
    const filters: InvoiceFilters = {}
    
    const statusParam = searchParams.get('status')
    if (statusParam) {
      filters.status = statusParam.split(',').filter(s => s.trim()) as any[]
    }
    
    const clientId = searchParams.get('client_id')
    if (clientId) {
      filters.client_id = clientId
    }
    
    const dateFrom = searchParams.get('date_from')
    if (dateFrom) {
      filters.date_from = dateFrom
    }
    
    const dateTo = searchParams.get('date_to')
    if (dateTo) {
      filters.date_to = dateTo
    }
    
    const search = searchParams.get('search')
    if (search) {
      filters.search = search
    }
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')
    
    console.log('📄 GET /api/invoices - Filtros:', {
      filters,
      page,
      perPage
    })
    
    // Obtener facturas
    const result = await InvoiceService.getInvoices(filters, page, perPage)
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error('Error en GET /api/invoices:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateInvoiceData
    
    console.log('📄 POST /api/invoices - Datos:', body)
    
    // Validar datos requeridos
    if (!body.order_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'order_id es requerido'
        },
        { status: 400 }
      )
    }
    
    // Crear factura
    const invoice = await InvoiceService.createInvoiceFromOrder(body)
    
    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo crear la factura'
        },
        { status: 400 }
      )
    }
    
    console.log('✅ Factura creada:', invoice.id)
    
    return NextResponse.json({
      success: true,
      data: { invoice }
    })
    
  } catch (error) {
    console.error('Error en POST /api/invoices:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}