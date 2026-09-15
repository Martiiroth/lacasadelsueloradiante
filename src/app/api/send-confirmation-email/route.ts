import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import ServerEmailService from '@/lib/emailService.server'

/**
 * Envía el email de confirmación de cuenta usando el SMTP de la app
 * (no el SMTP de GoTrue/Supabase).
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Error de configuración' }, { status: 500 })
    }

    const admin = createServiceClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.lacasadelsueloradiante.es').replace(/\/$/, '')
    const redirectTo = `${appUrl}/auth/callback`

    const { data, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.trim().toLowerCase(),
      options: { redirectTo },
    })

    if (linkError) {
      console.error('❌ [CONFIRM] generateLink:', linkError.message)
      // No revelar si el email existe
      return NextResponse.json(
        { message: 'Si el email existe, recibirás un enlace de confirmación' },
        { status: 200 }
      )
    }

    const actionLink =
      data?.properties?.action_link ||
      (data as { action_link?: string } | null)?.action_link

    if (!actionLink) {
      console.error('❌ [CONFIRM] sin action_link')
      return NextResponse.json(
        { message: 'Si el email existe, recibirás un enlace de confirmación' },
        { status: 200 }
      )
    }

    try {
      await ServerEmailService.sendAccountConfirmationEmail(
        email.trim().toLowerCase(),
        actionLink
      )
      console.log(`✅ [CONFIRM] Email de confirmación enviado a: ${email}`)
    } catch (mailErr) {
      console.error('❌ [CONFIRM] SMTP:', mailErr)
      return NextResponse.json(
        {
          error: 'No se pudo enviar el correo de confirmación',
          details: mailErr instanceof Error ? mailErr.message : String(mailErr),
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Si el email existe, recibirás un enlace de confirmación',
    })
  } catch (error) {
    console.error('❌ send-confirmation-email:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
