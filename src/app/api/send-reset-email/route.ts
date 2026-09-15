import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getPasswordResetService } from '@/lib/passwordResetService'

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://www.lacasadelsueloradiante.es').replace(/\/$/, '')
}

/** Fuerza redirect_to del action_link de Supabase hacia nuestra app (www + callback). */
function withAppRedirect(actionLink: string, redirectTo: string): string {
  try {
    const url = new URL(actionLink)
    url.searchParams.set('redirect_to', redirectTo)
    return url.toString()
  } catch {
    return actionLink
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      console.error('❌ [RESET] Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    const admin = createServiceClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const appUrl = appBaseUrl()
    const redirectTo = `${appUrl}/auth/callback`

    const { data, error: linkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
      options: { redirectTo },
    })

    if (linkError) {
      console.error('❌ [RESET] generateLink:', linkError.message)
      return NextResponse.json(
        { message: 'Si el email existe, recibirás un enlace de recuperación' },
        { status: 200 }
      )
    }

    const hashedToken = data?.properties?.hashed_token
    const actionLink =
      data?.properties?.action_link ||
      (data as { action_link?: string } | null)?.action_link

    // Preferir enlace a NUESTRA app con token_hash (evita redirect_to a la home de Supabase)
    let resetUrl: string
    if (hashedToken) {
      resetUrl = `${appUrl}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`
    } else if (actionLink) {
      resetUrl = withAppRedirect(actionLink, redirectTo)
    } else {
      console.error('❌ [RESET] generateLink sin token ni action_link:', JSON.stringify(data))
      return NextResponse.json(
        { message: 'Si el email existe, recibirás un enlace de recuperación' },
        { status: 200 }
      )
    }

    console.log('🔗 [RESET] Enlace de recuperación:', resetUrl.replace(hashedToken || 'x', '[token]'))

    try {
      const mailer = getPasswordResetService()
      await mailer.sendPasswordResetEmail({
        email: email.trim().toLowerCase(),
        token: hashedToken || 'recovery',
        resetUrl,
        companyName: process.env.EMAIL_FROM_NAME || 'La Casa del Suelo Radiante',
      })
      console.log(`✅ [RESET] Email de recuperación enviado a: ${email}`)
    } catch (mailErr) {
      console.error('❌ [RESET] Error SMTP enviando recovery:', mailErr)
      return NextResponse.json(
        {
          error: 'No se pudo enviar el correo de recuperación',
          details: mailErr instanceof Error ? mailErr.message : String(mailErr),
        },
        { status: 500 }
      )
    }

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
