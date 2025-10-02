import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'

interface OrderUpdateParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: OrderUpdateParams
) {
  try {
    // Simplificar autenticación temporalmente para debugging
    console.log('🔍 Obteniendo detalles del pedido:', params.id)
    
    // TODO: Implementar verificación de autenticación

    const order = await AdminService.getOrderById(params.id)
    
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
  { params }: OrderUpdateParams
) {
  try {
    // Simplificar autenticación temporalmente para debugging
    console.log('🔐 Procesando solicitud de actualización para pedido:', params.id)
    
    // TODO: Implementar verificación de autenticación más robusta
    // const cookieStore = await cookies()
    // const authToken = cookieStore.get('sb-access-token')?.value
    // if (!authToken) {
    //   return NextResponse.json(
    //     { error: 'No autorizado' },
    //     { status: 401 }
    //   )
    // }

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

    const success = await AdminService.updateOrderStatus(params.id, { status })
    
    if (!success) {
      return NextResponse.json(
        { error: 'Error actualizando el pedido' },
        { status: 500 }
      )
    }

    // Obtener el pedido actualizado
    const updatedOrder = await AdminService.getOrderById(params.id)

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