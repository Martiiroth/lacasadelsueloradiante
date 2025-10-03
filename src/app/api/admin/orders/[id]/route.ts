import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    console.log('🔍 Obteniendo detalles del pedido:', id)
    
    // Verificación de autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado - Token requerido' },
        { status: 401 }
      )
    }

    const order = await AdminService.getOrderById(id)
    
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error en GET /api/admin/orders/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    console.log('🔐 Procesando solicitud de actualización para pedido:', id)
    
    // Verificación de autenticación
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value
    if (!authToken) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Estado requerido' },
        { status: 400 }
      )
    }

    // Validar que el estado es válido
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      )
    }

    const success = await AdminService.updateOrderStatus(id, { status })
    
    if (!success) {
      return NextResponse.json(
        { error: 'Error actualizando el pedido' },
        { status: 500 }
      )
    }

    // Obtener el pedido actualizado
    const updatedOrder = await AdminService.getOrderById(id)

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: status === 'delivered' ? 
        'Pedido marcado como entregado. Factura generada automáticamente.' : 
        'Estado del pedido actualizado correctamente.'
    })
  } catch (error) {
    console.error('Error en PUT /api/admin/orders/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}