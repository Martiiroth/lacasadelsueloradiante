import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth-token')

    if (!authCookie) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Decodificar el token (en un caso real usarías JWT)
    let userId: string
    try {
      const authData = JSON.parse(authCookie.value)
      userId = authData.user?.id
      if (!userId) {
        throw new Error('Invalid auth token')
      }
    } catch {
      return NextResponse.json(
        { error: 'Token de autenticación inválido' },
        { status: 401 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')?.split(',').filter(Boolean) || []
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    console.log('📄 API: Obteniendo facturas del cliente:', userId)

    // Primero obtener el cliente asociado al usuario
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (clientError || !client) {
      console.error('❌ Cliente no encontrado:', clientError)
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Construir consulta de facturas
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients (
          first_name,
          last_name
        )
      `)
      .eq('client_id', client.id)

    // Aplicar filtros
    if (status.length > 0) {
      query = query.in('status', status)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59')
    }

    // Aplicar paginación y ordenamiento
    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: invoices, error: invoicesError, count } = await query

    if (invoicesError) {
      console.error('❌ Error fetching client invoices:', invoicesError)
      return NextResponse.json(
        { error: 'Error al obtener facturas' },
        { status: 500 }
      )
    }

    console.log('✅ Facturas encontradas:', invoices?.length || 0)

    return NextResponse.json({
      invoices: invoices || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Error in client invoices API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
