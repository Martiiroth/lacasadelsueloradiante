import { NextResponse } from 'next/server'
import { verifySmtpConnection } from '@/lib/emailService.server'
import { createClient } from '@/utils/supabase/server'

/** GET: verifica la conexión SMTP (solo admin). Útil para diagnosticar credenciales. */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'No autorizado', message: 'Inicia sesión como administrador' },
        { status: 401 }
      )
    }
    const { data: client } = await supabase
      .from('clients')
      .select('*, customer_role:customer_roles(*)')
      .eq('auth_uid', user.id)
      .single()
    const isAdmin = (client?.customer_role as { name?: string } | null)?.name === 'admin'
    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, error: 'Sin permisos', message: 'Se requiere rol de administrador' },
        { status: 403 }
      )
    }
    const result = await verifySmtpConnection()
    if (result.ok) {
      return NextResponse.json({ ok: true, message: result.message })
    }
    return NextResponse.json(
      { ok: false, message: result.message },
      { status: 502 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { ok: false, message },
      { status: 500 }
    )
  }
}
