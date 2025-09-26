import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔧 API Route - Creating client:', body.email)
    
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
      message: error.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}