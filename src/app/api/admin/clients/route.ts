import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import { createClient } from '@/utils/supabase/server'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization')
  return h?.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() || null : null
}

async function getAuthUser(req: NextRequest) {
  const supabase = await createClient()
  const token = getBearerToken(req)
  if (token) {
    const res = await supabase.auth.getUser(token)
    if (res.data.user) return res.data.user
  }
  const res = await supabase.auth.getUser()
  return res.data.user ?? null
}

/** GET: diagnóstico de auth (Bearer o cookies) - devuelve roleName y serviceRoleOk */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ ok: false, error: 'no_user' }, { status: 401, headers: JSON_HEADERS })
    }
    const roleName = await AdminService.getClientRoleByAuthUid(user.id)
    const serviceRoleOk = AdminService.isServiceRoleAvailable()
    return NextResponse.json(
      { ok: true, userId: user.id, roleName, serviceRoleOk, isAdmin: roleName === 'admin' },
      { headers: JSON_HEADERS }
    )
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500, headers: JSON_HEADERS }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('[admin/clients] POST received')
  try {
    const user = await getAuthUser(request)
    if (!user) {
      console.log('[admin/clients] 401: no user')
      return NextResponse.json(
        { success: false, message: 'No autorizado. Inicia sesión.' },
        { status: 401, headers: JSON_HEADERS }
      )
    }

    // Rol: service role (bypassa RLS) - clients.role_id → customer_roles.name
    const roleName = await AdminService.getClientRoleByAuthUid(user.id)
    const serviceRoleOk = AdminService.isServiceRoleAvailable()
    console.log('[admin/clients] auth check:', { userId: user.id, roleName, serviceRoleOk })

    if (roleName !== 'admin') {
      const payload = {
        success: false,
        message: !serviceRoleOk
          ? 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.'
          : roleName
            ? `No tienes permisos. Tu rol es "${roleName}".`
            : 'No tienes rol admin. Verifica tu usuario en Supabase.',
        debug: { serviceRoleOk, roleName },
      }
      return NextResponse.json(payload, { status: 403, headers: JSON_HEADERS })
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
      }, { status: 400, headers: JSON_HEADERS })
    }

    // Validar datos requeridos
    if (!body.email || !body.first_name || !body.last_name) {
      return NextResponse.json({ 
        success: false, 
        message: 'Faltan datos requeridos: email, nombre y apellidos' 
      }, { status: 400, headers: JSON_HEADERS })
    }
    
    // Llamar al AdminService para crear el cliente
    const result = await AdminService.createClient(body)
    
    if (result) {
      return NextResponse.json({ 
        success: true, 
        message: 'Cliente creado exitosamente' 
      }, { status: 201, headers: JSON_HEADERS })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Error al crear el cliente' 
      }, { status: 500, headers: JSON_HEADERS })
    }
  } catch (error: any) {
    console.error('❌ API Route error creating client:', error)
    return NextResponse.json({ 
      success: false, 
      message: error?.message || 'Error interno del servidor' 
    }, { status: 500, headers: JSON_HEADERS })
  }
}