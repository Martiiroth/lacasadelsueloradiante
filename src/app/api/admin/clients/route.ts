import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import { createClient } from '@/utils/supabase/server'

const jsonOptions = { headers: { 'Content-Type': 'application/json' } }

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Procesando solicitud de creación de cliente')
    
    const supabase = await createClient()
    
    // 1) Usuario desde cookies (sesión SSR)
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // 2) Fallback: si no hay sesión en cookies, usar token del header (sesión en navegador)
    if ((authError || !user)) {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
      if (token) {
        const result = await supabase.auth.getUser(token)
        user = result.data.user
        authError = result.error
      }
    }
    
    if (authError || !user) {
      console.error('❌ Usuario no autenticado:', authError?.message)
      return NextResponse.json(
        { success: false, message: 'No autorizado. Inicia sesión para continuar.' },
        { status: 401, ...jsonOptions }
      )
    }

    console.log('✅ Usuario autenticado:', user.email)

    // 1) Verificar rol con service role (bypass RLS); 2) fallback con sesión (role_id + customer_roles)
    let roleName = await AdminService.getClientRoleByAuthUid(user.id)
    if (!roleName) {
      const { data: clientRow, error: clientError } = await supabase
        .from('clients')
        .select('role_id')
        .eq('auth_uid', user.id)
        .single()
      if (!clientError && clientRow?.role_id) {
        const { data: roleRow } = await supabase
          .from('customer_roles')
          .select('name')
          .eq('id', clientRow.role_id)
          .single()
        roleName = roleRow?.name ?? null
      }
    }
    if (!roleName) {
      const serviceRoleOk = AdminService.isServiceRoleAvailable()
      console.error('❌ No se pudo obtener rol para:', user.email, 'serviceRoleOk:', serviceRoleOk)
      const hint = !serviceRoleOk
        ? 'En el VPS/servidor falta o falla SUPABASE_SERVICE_ROLE_KEY (mismo proyecto que NEXT_PUBLIC_SUPABASE_URL).'
        : 'En Supabase: tabla "clients" debe tener una fila con tu auth_uid y role_id = 4 (admin). Revisa también RLS en clients.'
      return NextResponse.json(
        {
          success: false,
          message: `No se pudo verificar tu rol. ${hint}`,
        },
        { status: 403, ...jsonOptions }
      )
    }
    if (roleName !== 'admin') {
      console.error('❌ Usuario no es admin:', user.email, 'rol actual:', roleName)
      return NextResponse.json(
        {
          success: false,
          message: `No tienes permisos para crear clientes. Tu rol es "${roleName}". En Supabase, pon clients.role_id = 4 (admin) para tu usuario.`,
        },
        { status: 403, ...jsonOptions }
      )
    }

    console.log('✅ Usuario es admin, procediendo con la creación del cliente')

    // Leer el body con manejo de errores
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ Error parseando body del request:', parseError)
      return NextResponse.json({ 
        success: false, 
        message: 'Error al procesar los datos del formulario' 
      }, { status: 400, ...jsonOptions })
    }
    
    console.log('🔧 API Route - Creating client:', body.email)
    
    // Validar datos requeridos
    if (!body.email || !body.first_name || !body.last_name) {
      return NextResponse.json({ 
        success: false, 
        message: 'Faltan datos requeridos: email, nombre y apellidos' 
      }, { status: 400, ...jsonOptions })
    }
    
    // Llamar al AdminService para crear el cliente
    const result = await AdminService.createClient(body)
    
    if (result) {
      return NextResponse.json({ 
        success: true, 
        message: 'Cliente creado exitosamente' 
      }, { status: 201, ...jsonOptions })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Error al crear el cliente' 
      }, { status: 500, ...jsonOptions })
    }
  } catch (error: any) {
    console.error('❌ API Route error creating client:', error)
    return NextResponse.json({ 
      success: false, 
      message: error?.message || 'Error interno del servidor' 
    }, { status: 500, ...jsonOptions })
  }
}