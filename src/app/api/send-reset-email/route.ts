import { NextRequest, NextResponse } from 'next/server'
import { getPasswordResetService } from '@/lib/passwordResetService'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el email existe en Supabase Auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar usuario por email
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const userExists = authUsers?.users.some(user => user.email === email)

    if (!userExists) {
      // Por seguridad, no revelamos si el email existe o no
      return NextResponse.json(
        { message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña' },
        { status: 200 }
      )
    }

    // Generar token y enviarlo por email
    const emailService = getPasswordResetService()
    const token = await emailService.generateResetToken(email)
    
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${token}`
    
    await emailService.sendPasswordResetEmail({
      email,
      token,
      resetUrl,
      companyName: 'La Casa del Suelo Radiante'
    })

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