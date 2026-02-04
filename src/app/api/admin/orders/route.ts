import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario es admin
    const { data: { user } } = await supabase.auth.getUser(authToken)
    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Obtener filtros desde query params
    const statusFilter = searchParams.get('status')
    const dateFromFilter = searchParams.get('date_from')
    const dateToFilter = searchParams.get('date_to')
    
    const filters: any = {}
    if (statusFilter) {
      filters.order_status = statusFilter.split(',')
    }
    if (dateFromFilter) {
      filters.order_date_from = dateFromFilter
    }
    if (dateToFilter) {
      filters.order_date_to = dateToFilter
    }

    const orders = await AdminService.getAllOrders(filters, limit, offset)
    
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error en GET /api/admin/orders:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}