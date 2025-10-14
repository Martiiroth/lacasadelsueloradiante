import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Usar la funcionalidad nativa de Supabase para reset de contraseña
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://lacasadelsueloradiante.es/auth/reset-password',
    })

    if (error) {
      console.error('Error al enviar reset email:', error)
      // Por seguridad, siempre devolvemos éxito incluso si hay error
      return NextResponse.json(
        { message: 'Si el email existe, recibirás un enlace de recuperación' },
        { status: 200 }
      )
    }

    console.log(`✅ Email de recuperación enviado a: ${email}`)

    return NextResponse.json(
      { message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña' },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Error en send-reset-email:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}