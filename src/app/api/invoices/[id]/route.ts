/**
 * API REST para operaciones específicas de factura
 * GET /api/invoices/[id] - Obtener factura específica
 * PUT /api/invoices/[id] - Actualizar estado de factura
 * DELETE /api/invoices/[id] - Eliminar factura
 */

import { NextRequest, NextResponse } from 'next/server'
import { InvoiceService } from '@/lib/invoiceService'
import type { InvoiceStatus } from '@/types/invoices'

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, props: Props) {
  try {
    const params = await props.params
    const { id } = params
    
    console.log('📄 GET /api/invoices/[id] - ID:', id)
    
    // Obtener factura específica
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
    
    return NextResponse.json({
      success: true,
      data: { invoice }
    })
    
  } catch (error) {
    console.error('Error en GET /api/invoices/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, props: Props) {
  try {
    const params = await props.params
    const { id } = params
    const body = await request.json()
    
    console.log('📄 PUT /api/invoices/[id] - ID:', id, 'Body:', body)
    
    // Validar datos
    const { status, ...otherUpdates } = body
    
    if (status && !['draft', 'sent', 'paid', 'cancelled'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Estado de factura inválido'
        },
        { status: 400 }
      )
    }
    
    // Actualizar factura
    const invoice = await InvoiceService.updateInvoiceStatus(id, status as InvoiceStatus)
    
    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Factura no encontrada o no se pudo actualizar'
        },
        { status: 404 }
      )
    }
    
    console.log('✅ Factura actualizada:', id)
    
    return NextResponse.json({
      success: true,
      data: { invoice }
    })
    
  } catch (error) {
    console.error('Error en PUT /api/invoices/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, props: Props) {
  try {
    const params = await props.params
    const { id } = params
    
    console.log('📄 DELETE /api/invoices/[id] - ID:', id)
    
    // Verificar que la factura existe
    const existingInvoice = await InvoiceService.getInvoiceById(id)
    
    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Factura no encontrada'
        },
        { status: 404 }
      )
    }
    
    // Solo permitir eliminar facturas en estado draft
    if (existingInvoice.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Solo se pueden eliminar facturas en borrador'
        },
        { status: 400 }
      )
    }
    
    // Eliminar factura
    const success = await InvoiceService.deleteInvoice(id)
    
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo eliminar la factura'
        },
        { status: 500 }
      )
    }
    
    console.log('✅ Factura eliminada:', id)
    
    return NextResponse.json({
      success: true,
      message: 'Factura eliminada correctamente'
    })
    
  } catch (error) {
    console.error('Error en DELETE /api/invoices/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}