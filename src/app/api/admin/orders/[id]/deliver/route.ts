import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import { InvoiceService } from '@/lib/invoiceService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    console.log('🔐 Procesando solicitud de entrega para pedido:', id)
    
    // Verificación de autenticación para producción
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header provided')
      return NextResponse.json(
        { error: 'No autorizado - Token requerido' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    if (!token || token.length < 10) {
      console.error('❌ Invalid token provided')
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    console.log(`📦 Marcando pedido ${id} como entregado...`)

    // Actualizar estado del pedido a "delivered"
    const success = await AdminService.updateOrderStatus(id, { status: 'delivered' })
    
    if (!success) {
      return NextResponse.json(
        { error: 'Error actualizando el estado del pedido' },
        { status: 500 }
      )
    }

    // La generación de factura se ejecuta automáticamente en updateOrderStatus
    // Obtener el pedido actualizado con la factura generada
    const updatedOrder = await AdminService.getOrderById(id)

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: 'Pedido marcado como entregado y factura generada automáticamente.',
      invoice: updatedOrder?.invoice ? {
        id: updatedOrder.invoice.id,
        number: `${updatedOrder.invoice.prefix}${updatedOrder.invoice.invoice_number}${updatedOrder.invoice.suffix}`,
        generated: true
      } : null
    })
  } catch (error) {
    console.error('Error en POST /api/admin/orders/[id]/deliver:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}