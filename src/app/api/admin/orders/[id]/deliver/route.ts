import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import { createClient } from '@/utils/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    console.log('🔐 Procesando solicitud de entrega para pedido:', id)
    
    // Verificación de autenticación usando Supabase
    const supabase = await createClient()
    
    // Verificar que el usuario está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Usuario no autenticado:', authError?.message)
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('✅ Usuario autenticado:', user.email)

    // Verificar que el usuario es admin
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('customer_role:customer_roles(*)')
      .eq('auth_uid', user.id)
      .single()

    if (clientError || !client) {
      console.error('❌ Error obteniendo cliente:', clientError?.message)
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const isAdmin = (client?.customer_role as any)?.name === 'admin'
    if (!isAdmin) {
      console.error('❌ Usuario no es admin:', user.email)
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    console.log('✅ Usuario es admin, procediendo con la entrega')

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
      message: 'Pedido marcado como entregado.'
    })
  } catch (error) {
    console.error('Error en POST /api/admin/orders/[id]/deliver:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}