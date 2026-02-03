import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import {
  authenticateAdmin,
  clearSupabaseAuthCookies,
} from '@/lib/auth/adminAuth'

const JSON_HEADERS = { 'Content-Type': 'application/json', 'X-API-Route': 'admin-clients' }

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)

    if (authResult.type === 'unauthorized') {
      const response = NextResponse.json(
        { success: false, message: authResult.message },
        { status: 401, headers: JSON_HEADERS }
      )
      if (authResult.clearCookies) clearSupabaseAuthCookies(request, response)
      return response
    }

    if (authResult.type === 'forbidden') {
      const response = NextResponse.json(
        { success: false, message: authResult.message, debug: authResult.roleDebug },
        { status: 403, headers: JSON_HEADERS }
      )
      if (authResult.clearCookies) clearSupabaseAuthCookies(request, response)
      return response
    }

    const { user } = authResult

    // Leer el body
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