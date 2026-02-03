import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import {
  authenticateAdmin,
  clearSupabaseAuthCookies,
} from '@/lib/auth/adminAuth'

const JSON_HEADERS = { 'Content-Type': 'application/json', 'X-API-Route': 'admin-clients' }

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Procesando solicitud de creación de cliente')
    const authResult = await authenticateAdmin(request)
    const debugEnabled = process.env.DEBUG_ADMIN_AUTH === '1'

    if (authResult.type === 'unauthorized') {
      console.warn('⚠️ Admin auth unauthorized', {
        reason: authResult.reason,
        hasToken: authResult.hasToken,
        authSource: authResult.authSourceTried,
        bearerError: authResult.bearerError,
        cookieError: authResult.cookieError,
      })
      const payload: Record<string, unknown> = {
        success: false,
        message: authResult.message,
      }
      if (debugEnabled) {
        payload.debug = {
          reason: authResult.reason,
          hasToken: authResult.hasToken,
          authSource: authResult.authSourceTried,
          bearerError: authResult.bearerError,
          cookieError: authResult.cookieError,
        }
      }
      const response = NextResponse.json(payload, {
        status: 401,
        headers: JSON_HEADERS,
      })
      if (authResult.clearCookies) {
        clearSupabaseAuthCookies(request, response)
      }
      return response
    }

    if (authResult.type === 'forbidden') {
      console.error('❌ Admin auth forbidden', {
        hasToken: authResult.hasToken,
        authSource: authResult.authSource,
        roleDebug: authResult.roleDebug,
        serviceRoleOk: authResult.serviceRoleOk,
      })
      const payload: Record<string, unknown> = {
        success: false,
        message: authResult.message,
        debug: {
          hasToken: authResult.hasToken,
          authSource: authResult.authSource,
          serviceRoleOk: authResult.serviceRoleOk,
          roleDebug: authResult.roleDebug,
        },
      }
      const response = NextResponse.json(payload, {
        status: 403,
        headers: JSON_HEADERS,
      })
      if (authResult.clearCookies) {
        clearSupabaseAuthCookies(request, response)
      }
      return response
    }

    const { user } = authResult
    console.log('✅ Usuario autenticado:', user.email)
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
      }, { status: 400, headers: JSON_HEADERS })
    }
    
    console.log('🔧 API Route - Creating client:', body.email)
    
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