import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import { createClient } from '@/utils/supabase/server'

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
        { success: false, message: 'No autorizado' },
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
        { success: false, message: 'No autorizado' },
        { status: 403 }
      )
    }

    const isAdmin = (client?.customer_role as any)?.name === 'admin'
    if (!isAdmin) {
      console.error('❌ Usuario no es admin:', user.email)
      return NextResponse.json(
        { success: false, message: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
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
      }, { status: 400 })
    }
    
    console.log('🔧 API Route - Creating client:', body.email)
    
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