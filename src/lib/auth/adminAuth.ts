/**
 * Auth admin: usuario vía Bearer/cookies, rol vía clients.role_id → customer_roles (database).
 * Fallback: si service role falla, consulta con token del usuario (RLS permite leer propia fila).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient, type AuthError, type User } from '@supabase/supabase-js'
import { AdminService } from '@/lib/adminService'
import { createClient } from '@/utils/supabase/server'

const isProd = process.env.NODE_ENV === 'production'
const COOKIE_DOMAIN =
  process.env.SUPABASE_COOKIE_DOMAIN || (isProd ? '.lacasadelsueloradiante.es' : undefined)

export type RoleCheckDebug = {
  serviceRole: { ok: boolean; error?: string | null }
  token: { ok: boolean; error?: string | null }
}

type AuthSource = 'bearer' | 'cookies' | 'none'

export type AdminAuthSuccess = {
  type: 'success'
  user: User
  authSource: AuthSource
  roleName: string
}

export type AdminAuthUnauthorized = {
  type: 'unauthorized'
  message: string
  reason: 'invalid-token' | 'expired' | 'no-session'
  clearCookies: boolean
}

export type AdminAuthForbidden = {
  type: 'forbidden'
  message: string
  roleDebug: RoleCheckDebug
  clearCookies: boolean
}

export type AdminAuthOutcome = AdminAuthSuccess | AdminAuthUnauthorized | AdminAuthForbidden

const AUTH_COOKIE_PREFIX = 'sb-'

function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.toLowerCase().startsWith('bearer ')) return null
  return authHeader.slice(7).trim() || null
}

function shouldClearCookies(error?: AuthError | null): boolean {
  if (!error) return false
  const m = (error.message ?? '').toLowerCase()
  return m.includes('refresh token') || m.includes('invalid') || m.includes('expired')
}

/** Obtiene rol desde clients + customer_roles usando el JWT del usuario (RLS permite leer propia fila). */
async function getRoleFromTablesByToken(
  authUid: string,
  accessToken: string
): Promise<{ roleName: string | null; error?: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return { roleName: null, error: 'missing_env' }
  try {
    const client = createSupabaseClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })
    const { data: clientRow, error: clientErr } = await client
      .from('clients')
      .select('role_id')
      .eq('auth_uid', authUid)
      .single()
    if (clientErr || !clientRow?.role_id) {
      return { roleName: null, error: clientErr?.message ?? 'clients_query_failed' }
    }
    const { data: roleRow, error: roleErr } = await client
      .from('customer_roles')
      .select('name')
      .eq('id', clientRow.role_id)
      .single()
    if (roleErr || !roleRow?.name) {
      return { roleName: null, error: roleErr?.message ?? 'roles_query_failed' }
    }
    return { roleName: roleRow.name }
  } catch (err: unknown) {
    return { roleName: null, error: err instanceof Error ? err.message : 'token_query_error' }
  }
}

export function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies
    .getAll()
    .filter(({ name }) => name.startsWith(AUTH_COOKIE_PREFIX))
    .forEach(({ name }) => {
      response.cookies.set(name, '', {
        path: '/',
        sameSite: 'lax',
        secure: isProd,
        maxAge: 0,
        ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
      })
    })
}

/**
 * Autentica admin: obtiene usuario (Bearer → cookies) y verifica rol (service role únicamente).
 */
export async function authenticateAdmin(request: NextRequest): Promise<AdminAuthOutcome> {
  const supabase = await createClient()
  const token = extractBearerToken(request)

  let user: User | null = null
  let authSource: AuthSource = 'none'
  let bearerError: AuthError | null = null
  let cookiesError: AuthError | null = null
  let clearCookies = false

  // 1. Usuario: Bearer primero, cookies si no hay Bearer
  if (token) {
    const res = await supabase.auth.getUser(token)
    if (res.data.user) {
      user = res.data.user
      authSource = 'bearer'
    } else {
      bearerError = res.error ?? null
      if (res.error && shouldClearCookies(res.error)) clearCookies = true
    }
  }

  if (!user) {
    const res = await supabase.auth.getUser()
    if (res.data.user) {
      user = res.data.user
      authSource = 'cookies'
    } else {
      cookiesError = res.error ?? null
      if (res.error && shouldClearCookies(res.error)) clearCookies = true
    }
  }

  if (!user) {
    const isExpired =
      bearerError?.message?.toLowerCase().includes('expired') ||
      cookiesError?.message?.toLowerCase().includes('expired')
    const hasTried = Boolean(token) || Boolean(cookiesError || bearerError)
    const reason: AdminAuthUnauthorized['reason'] = isExpired
      ? 'expired'
      : hasTried
        ? 'invalid-token'
        : 'no-session'
    return {
      type: 'unauthorized',
      message: reason === 'expired' ? 'Tu sesión ha expirado. Inicia sesión.' : 'No autorizado. Inicia sesión.',
      reason,
      clearCookies,
    }
  }

  // 2. Rol: clients.role_id → customer_roles.name (tablas DB)
  // Primero service role; si falla y hay Bearer, fallback con token (RLS permite leer propia fila)
  let roleName: string | null = null
  let serviceRoleError: string | null = null
  let tokenError: string | null = null

  const sr = await AdminService.resolveClientRoleByAuthUid(user.id)
  roleName = sr.roleName
  serviceRoleError = sr.error ?? null

  if (!roleName && token) {
    const tr = await getRoleFromTablesByToken(user.id, token)
    roleName = tr.roleName
    tokenError = tr.error ?? null
  }

  const roleDebug: RoleCheckDebug = {
    serviceRole: { ok: Boolean(sr.roleName), error: serviceRoleError },
    token: { ok: Boolean(roleName && !sr.roleName), error: tokenError },
  }

  if (!roleName) {
    const serviceRoleOk = AdminService.isServiceRoleAvailable()
    return {
      type: 'forbidden',
      message: !serviceRoleOk
        ? 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.'
        : 'No tienes rol admin en Supabase.',
      roleDebug,
      clearCookies,
    }
  }

  if (roleName !== 'admin') {
    return {
      type: 'forbidden',
      message: `Tu rol es "${roleName}". Solo admin puede acceder.`,
      roleDebug,
      clearCookies,
    }
  }

  return {
    type: 'success',
    user,
    authSource,
    roleName,
  }
}
