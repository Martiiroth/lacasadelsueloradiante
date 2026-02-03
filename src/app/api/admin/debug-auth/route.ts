/**
 * Endpoint de diagnóstico: devuelve el resultado de authenticateAdmin con roleDebug.
 * Útil para depurar 403 sin depender de DEBUG_ADMIN_AUTH.
 * Eliminar o proteger en producción.
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
    base.roleDebug = authResult.roleDebug
    base.serviceRoleOk = authResult.serviceRoleOk
  } else if (authResult.type === 'forbidden') {
    base.message = authResult.message
    base.authSource = authResult.authSource
    base.hasToken = authResult.hasToken
    base.roleDebug = authResult.roleDebug
    base.serviceRoleOk = authResult.serviceRoleOk
  } else {
    base.message = authResult.message
    base.authSourceTried = authResult.authSourceTried
    base.hasToken = authResult.hasToken
    base.reason = authResult.reason
  }
  return NextResponse.json(base)
}
