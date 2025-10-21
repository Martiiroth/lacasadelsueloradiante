/**
 * API Route: Gestión completa de facturas (reconstruida)
 * POST /api/invoices-new
 * GET /api/invoices-new
 */

import { NextRequest, NextResponse } from 'next/server'
import { InvoiceService } from '@/lib/invoiceServiceNew'

// ============================================================================
// POST - Crear nueva factura
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    console.log('📄 [API] Solicitud POST /api/invoices-new')

    const body = await request.json()
    const { action, ...data } = body

    console.log('📋 [API] Acción solicitada:', action, 'Datos:', data)

    switch (action) {
      case 'create':
        return await handleCreateInvoice(data)
      
      case 'generate_for_order':
        return await handleGenerateForOrder(data)
      
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Acción no válida. Usar: create, generate_for_order' 
          },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ [API] Error en POST /api/invoices-new:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Desconocido'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Obtener facturas
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    console.log('📄 [API] Solicitud GET /api/invoices-new')

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const invoiceId = searchParams.get('id')
    const clientId = searchParams.get('client_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log('📋 [API] Parámetros:', { action, invoiceId, clientId, page, limit })

    switch (action) {
      case 'get_by_id':
        if (!invoiceId) {
          return NextResponse.json(
            { success: false, error: 'ID de factura requerido' },
            { status: 400 }
          )
        }
        return await handleGetInvoiceById(invoiceId)
      
      case 'get_client_invoices':
        if (!clientId) {
          return NextResponse.json(
            { success: false, error: 'ID de cliente requerido' },
            { status: 400 }
          )
        }
        return await handleGetClientInvoices(clientId, limit)
      
      case 'get_all':
        return await handleGetAllInvoices(page, limit)
      
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Acción no válida. Usar: get_by_id, get_client_invoices, get_all' 
          },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ [API] Error en GET /api/invoices-new:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Desconocido'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// HANDLERS PARA ACCIONES ESPECÍFICAS
// ============================================================================

/**
 * Crear nueva factura
 */
async function handleCreateInvoice(data: any) {
  try {
    console.log('📄 [API] Creando nueva factura:', data)

    // Validar datos requeridos
    const { client_id, order_id, total_cents } = data
    if (!client_id || !order_id || !total_cents) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faltan campos requeridos: client_id, order_id, total_cents' 
        },
        { status: 400 }
      )
    }

    // Crear factura
    const invoice = await InvoiceService.createInvoice(data)

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Error creando factura' },
        { status: 400 }
      )
    }

    console.log('✅ [API] Factura creada exitosamente:', invoice.id)

    return NextResponse.json({
      success: true,
      message: 'Factura creada exitosamente',
      data: {
        invoice,
        full_number: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
      }
    })

  } catch (error) {
    console.error('❌ [API] Error creando factura:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error creando factura',
        details: error instanceof Error ? error.message : 'Desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * Generar factura para pedido entregado
 */
async function handleGenerateForOrder(data: any) {
  try {
    console.log('📄 [API] Generando factura para pedido:', data)

    const { order_id } = data
    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'order_id es requerido' },
        { status: 400 }
      )
    }

    // Generar factura automáticamente
    const invoice = await InvoiceService.generateInvoiceForDeliveredOrder(order_id)

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Error generando factura automática' },
        { status: 400 }
      )
    }

    console.log('✅ [API] Factura automática generada:', invoice.id)

    return NextResponse.json({
      success: true,
      message: 'Factura generada automáticamente',
      data: {
        invoice,
        full_number: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
      }
    })

  } catch (error) {
    console.error('❌ [API] Error generando factura automática:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error generando factura automática',
        details: error instanceof Error ? error.message : 'Desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * Obtener factura por ID
 */
async function handleGetInvoiceById(invoiceId: string) {
  try {
    console.log('📄 [API] Obteniendo factura por ID:', invoiceId)

    const invoice = await InvoiceService.getInvoiceById(invoiceId)

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    console.log('✅ [API] Factura obtenida exitosamente')

    return NextResponse.json({
      success: true,
      data: {
        invoice,
        full_number: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
      }
    })

  } catch (error) {
    console.error('❌ [API] Error obteniendo factura:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error obteniendo factura',
        details: error instanceof Error ? error.message : 'Desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * Obtener facturas de un cliente
 */
async function handleGetClientInvoices(clientId: string, limit: number) {
  try {
    console.log('📄 [API] Obteniendo facturas del cliente:', clientId)

    const invoices = await InvoiceService.getClientInvoices(clientId, limit)

    console.log('✅ [API] Facturas del cliente obtenidas:', invoices.length)

    return NextResponse.json({
      success: true,
      data: {
        invoices: invoices.map(invoice => ({
          ...invoice,
          full_number: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
        })),
        count: invoices.length
      }
    })

  } catch (error) {
    console.error('❌ [API] Error obteniendo facturas del cliente:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error obteniendo facturas del cliente',
        details: error instanceof Error ? error.message : 'Desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * Obtener todas las facturas (admin)
 */
async function handleGetAllInvoices(page: number, limit: number) {
  try {
    console.log('📄 [API] Obteniendo todas las facturas, página:', page)

    const result = await InvoiceService.getAllInvoices(page, limit)

    console.log('✅ [API] Facturas obtenidas:', result.invoices.length, 'de', result.total)

    return NextResponse.json({
      success: true,
      data: {
        invoices: result.invoices.map(invoice => ({
          ...invoice,
          full_number: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
        })),
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.page < result.totalPages,
          hasPrev: result.page > 1
        }
      }
    })

  } catch (error) {
    console.error('❌ [API] Error obteniendo todas las facturas:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error obteniendo facturas',
        details: error instanceof Error ? error.message : 'Desconocido'
      },
      { status: 500 }
    )
  }
}