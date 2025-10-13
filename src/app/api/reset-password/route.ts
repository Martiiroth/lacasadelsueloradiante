import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token, new_password } = await request.json()

    if (!access_token || !refresh_token || !new_password) {
      return NextResponse.json(
        { error: 'Token de acceso, token de refresh y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Establecer la sesión con los tokens de recuperación
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (sessionError) {
      console.error('Error estableciendo sesión:', sessionError)
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    // Actualizar la contraseña usando la funcionalidad nativa de Supabase
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password
    })

    if (updateError) {
      console.error('Error actualizando contraseña:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar la contraseña' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Contraseña actualizada correctamente' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error en reset-password:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}