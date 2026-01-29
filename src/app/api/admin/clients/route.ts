import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import { createClient } from '@/utils/supabase/server'

const jsonOptions = { headers: { 'Content-Type': 'application/json' } }

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Procesando solicitud de creación de cliente')
    
    // Verificación de autenticación usando Supabase
    const supabase = await createClient()
    
    // Verificar que el usuario está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Usuario no autenticado:', authError?.message)
      return NextResponse.json(
        { success: false, message: 'No autorizado. Inicia sesión para continuar.' },
        { status: 401, ...jsonOptions }
      )
    }

    console.log('✅ Usuario autenticado:', user.email)

    // Verificar que el usuario es admin (clients.role_id -> customer_roles donde name='admin')
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, role_id, customer_role:customer_roles(id, name)')
      .eq('auth_uid', user.id)
      .single()

    if (clientError || !client) {
      console.error('❌ Error obteniendo cliente:', clientError?.message, clientError?.code)
      return NextResponse.json(
        {
          success: false,
          message: 'No se pudo verificar tu rol. Debes tener un registro en la tabla "clients" con tu auth_uid y role_id apuntando al rol "admin" (customer_roles). Comprueba en Supabase que tu usuario tiene rol admin.',
        },
        { status: 403, ...jsonOptions }
      )
    }

    const roleName = (client?.customer_role as { name?: string } | null)?.name
    const isAdmin = roleName === 'admin'
    if (!isAdmin) {
      console.error('❌ Usuario no es admin:', user.email, 'rol actual:', roleName)
      return NextResponse.json(
        {
          success: false,
          message: `No tienes permisos para crear clientes. Tu rol actual es "${roleName || 'sin asignar'}". En Supabase, actualiza clients.role_id a 4 (admin) para tu usuario.`,
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