import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import { authenticateAdmin, clearSupabaseAuthCookies } from '@/lib/auth/adminAuth'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (authResult.type !== 'success') {
      const payload: Record<string, unknown> = { error: authResult.message }
      if (authResult.type === 'forbidden') {
        payload.debug = {
          hasToken: authResult.hasToken,
          authSource: authResult.authSource,
          serviceRoleOk: authResult.serviceRoleOk,
          roleDebug: authResult.roleDebug,
        }
      }
      const response = NextResponse.json(
        payload,
        { status: authResult.type === 'unauthorized' ? 401 : 403, headers: JSON_HEADERS }
      )
      if ('clearCookies' in authResult && authResult.clearCookies) {
        clearSupabaseAuthCookies(request, response)
      }
      return response
    }

    const body = await request.json()
    const { client_id, status, subtotal_cents, shipping_cost_cents, total_cents, shipping_address, items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren items en el pedido' },
        { status: 400, headers: JSON_HEADERS }
      )
    }

    const newOrderId = await AdminService.createOrder({
      client_id: client_id || '',
      status: status || 'pending',
      subtotal_cents: subtotal_cents ?? 0,
      shipping_cost_cents: shipping_cost_cents ?? 0,
      total_cents: total_cents ?? 0,
      shipping_address: shipping_address ?? {},
      items,
    })

    if (!newOrderId) {
      return NextResponse.json(
        { error: 'Error al crear el pedido' },
        { status: 500, headers: JSON_HEADERS }
      )
    }

    return NextResponse.json({ success: true, orderId: newOrderId }, { headers: JSON_HEADERS })
  } catch (error) {
    console.error('Error en POST /api/admin/orders:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500, headers: JSON_HEADERS }
    )
  }
}

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