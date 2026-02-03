import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import { createClient } from '@/utils/supabase/server'

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization')
  return h?.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() || null : null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const token = getBearerToken(request)

    // Usuario: Bearer primero, luego cookies
    let user: { id: string; email?: string } | null = null
    if (token) {
      const res = await supabase.auth.getUser(token)
      if (res.data.user) user = res.data.user
    }
    if (!user) {
      const res = await supabase.auth.getUser()
      if (res.data.user) user = res.data.user
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado. Inicia sesión.' },
        { status: 401 }
      )
    }

    // Rol: service role (bypassa RLS) - clients.role_id → customer_roles.name
    const roleName = await AdminService.getClientRoleByAuthUid(user.id)
    if (roleName !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: roleName
            ? `No tienes permisos. Tu rol es "${roleName}".`
            : 'No tienes rol admin. Verifica SUPABASE_SERVICE_ROLE_KEY en el servidor.',
        },
        { status: 403 }
      )
    }

    // Leer el body con manejo de errores
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ Error parseando body del request:', parseError)
      return NextResponse.json({ 
        success: false, 
        message: 'Error al procesar los datos del formulario' 
      }, { status: 400 })
    }

    // Validar datos requeridos
    if (!body.email || !body.first_name || !body.last_name) {
      return NextResponse.json({ 
        success: false, 
        message: 'Faltan datos requeridos: email, nombre y apellidos' 
      }, { status: 400 })
    }
    
    // Llamar al AdminService para crear el cliente
    const result = await AdminService.createClient(body)
    
    if (result) {
      return NextResponse.json({ 
        success: true, 
        message: 'Cliente creado exitosamente' 
      }, { status: 201 })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Error al crear el cliente' 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ API Route error creating client:', error)
    return NextResponse.json({ 
      success: false, 
      message: error?.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}