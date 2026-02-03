/**
 * Endpoint de diagnóstico: devuelve el resultado de authenticateAdmin.
 * Útil para depurar 403. Eliminar o proteger en producción.
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/adminAuth'

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request)
  const base: Record<string, unknown> = { type: authResult.type }
  if (authResult.type === 'success') {
    base.userEmail = authResult.user.email
    base.roleName = authResult.roleName
    base.authSource = authResult.authSource
  } else if (authResult.type === 'forbidden') {
    base.message = authResult.message
    base.roleDebug = authResult.roleDebug
  } else {
    base.message = authResult.message
    base.reason = authResult.reason
  }
  return NextResponse.json(base)
}
