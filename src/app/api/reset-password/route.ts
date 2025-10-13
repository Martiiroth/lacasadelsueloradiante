import { NextRequest, NextResponse } from 'next/server'
import { getPasswordResetService } from '@/lib/passwordResetService'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const emailService = getPasswordResetService()
    
    // Validar token
    const tokenValidation = await emailService.validateToken(token)
    
    if (!tokenValidation.valid || !tokenValidation.email) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    // Actualizar contraseña en Supabase Auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar el usuario por email para obtener su ID
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const user = authUsers?.users.find(u => u.email === tokenValidation.email)

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar contraseña
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('❌ Error actualizando contraseña:', updateError)
      return NextResponse.json(
        { error: 'Error actualizando la contraseña' },
        { status: 500 }
      )
    }

    // Marcar token como usado
    await emailService.markTokenAsUsed(token)

    console.log(`✅ Contraseña actualizada para: ${tokenValidation.email}`)

    return NextResponse.json(
      { message: 'Contraseña actualizada correctamente' },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Error en reset-password:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}