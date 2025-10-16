import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { recovery_token, new_password } = await request.json()

    if (!recovery_token || !new_password) {
      return NextResponse.json(
        { error: 'Token de recuperación y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Crear cliente de Supabase con service role key para operaciones administrativas
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Necesita service role key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Usar la API REST directamente para actualizar con recovery token
    const supabaseAuthUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const response = await fetch(`${supabaseAuthUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recovery_token}`, // Usar el token de recuperación como bearer token
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      },
      body: JSON.stringify({
        password: new_password
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Error al actualizar contraseña:', result)
      return NextResponse.json(
        { error: result.msg || result.error_description || 'Error al actualizar la contraseña' },
        { status: response.status }
      )
    }

    return NextResponse.json(
      { message: 'Contraseña actualizada correctamente' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error en reset-password-recovery:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}