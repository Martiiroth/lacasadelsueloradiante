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
  cookies: { ok: boolean; error?: string | null }
}

type AuthSource = 'bearer' | 'cookies' | 'none'

type AdminAuthSuccess = {
  type: 'success'
  user: User
  authSource: AuthSource
  roleName: string
  hasToken: boolean
  roleDebug: RoleCheckDebug
  serviceRoleOk: boolean
}

type AdminAuthUnauthorized = {
  type: 'unauthorized'
  message: string
  reason: 'invalid-token' | 'expired' | 'no-session'
  authSourceTried: AuthSource
  hasToken: boolean
  clearCookies: boolean
  bearerError?: string | null
  cookieError?: string | null
}

type AdminAuthForbidden = {
  type: 'forbidden'
  message: string
  authSource: AuthSource
  hasToken: boolean
  roleDebug: RoleCheckDebug
  serviceRoleOk: boolean
  clearCookies: boolean
}

export type AdminAuthOutcome = AdminAuthSuccess | AdminAuthUnauthorized | AdminAuthForbidden

const AUTH_COOKIE_PREFIX = 'sb-'

function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null
  return authHeader.slice(7).trim() || null
}

function shouldClearCookiesFromError(error?: AuthError | null): boolean {
  if (!error) return false
  const message = error.message?.toLowerCase() ?? ''
  return (
    message.includes('refresh token') ||
    message.includes('session not found') ||
    message.includes('invalid') ||
    message.includes('expired')
  )
}

function isTokenExpired(error?: AuthError | null): boolean {
  if (!error) return false
  const message = error.message?.toLowerCase() ?? ''
  return message.includes('expired') || message.includes('invalid token') || error.status === 401
}

function roleDebugTemplate(): RoleCheckDebug {
  return {
    serviceRole: { ok: false },
    token: { ok: false },
    cookies: { ok: false },
  }
}

async function getRoleByToken(
  authUid: string,
  accessToken: string
): Promise<{ roleName: string | null; error?: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return { roleName: null, error: 'missing_supabase_env' }
  }
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
  } catch (err: any) {
    return { roleName: null, error: err?.message ?? 'token_role_exception' }
  }
}

export function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  const authCookies = request
    .cookies
    .getAll()
    .filter(({ name }) => name.startsWith(AUTH_COOKIE_PREFIX))
    .map(({ name }) => name)

  if (!authCookies.length) return

  const options = {
    path: '/',
    sameSite: 'lax' as const,
    secure: isProd,
    maxAge: 0,
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  }

  authCookies.forEach(cookieName => {
    response.cookies.set(cookieName, '', options)
  })
}

export async function authenticateAdmin(request: NextRequest): Promise<AdminAuthOutcome> {
  const supabase = await createClient()
  const token = extractBearerToken(request)

  let user: User | null = null
  let authSource: AuthSource = 'none'
  let bearerError: AuthError | null = null
  let cookiesError: AuthError | null = null
  let clearCookies = false

  if (token) {
    const bearerResult = await supabase.auth.getUser(token)
    if (bearerResult.data.user) {
      user = bearerResult.data.user
      authSource = 'bearer'
    } else if (bearerResult.error) {
      bearerError = bearerResult.error
      if (shouldClearCookiesFromError(bearerResult.error)) {
        clearCookies = true
      }
    }
  }

  if (!user) {
    const cookieResult = await supabase.auth.getUser()
    if (cookieResult.data.user) {
      user = cookieResult.data.user
      authSource = 'cookies'
    } else if (cookieResult.error) {
      cookiesError = cookieResult.error
      if (shouldClearCookiesFromError(cookieResult.error)) {
        clearCookies = true
      }
    }
  }

  if (!user) {
    const reason: AdminAuthUnauthorized['reason'] =
      bearerError && isTokenExpired(bearerError)
        ? 'expired'
        : bearerError || cookiesError
        ? 'invalid-token'
        : 'no-session'

    const message =
      reason === 'expired'
        ? 'Tu sesión ha expirado. Inicia sesión para continuar.'
        : 'No autorizado. Inicia sesión para continuar.'

    return {
      type: 'unauthorized',
      message,
      reason,
      authSourceTried: authSource,
      hasToken: Boolean(token),
      clearCookies,
      bearerError: bearerError?.message ?? null,
      cookieError: cookiesError?.message ?? null,
    }
  }

  const roleDebug = roleDebugTemplate()

  const serviceRoleResult = await AdminService.resolveClientRoleByAuthUid(user.id)
  let roleName = serviceRoleResult.roleName
  roleDebug.serviceRole.ok = Boolean(roleName)
  roleDebug.serviceRole.error = serviceRoleResult.error ?? null

  if (!roleName && token) {
    const tokenRole = await getRoleByToken(user.id, token)
    roleName = tokenRole.roleName
    roleDebug.token.ok = Boolean(roleName)
    roleDebug.token.error = tokenRole.error ?? null
  }

  if (!roleName) {
    const { data: clientRow, error: clientError } = await supabase
      .from('clients')
      .select('role_id')
      .eq('auth_uid', user.id)
      .single()
    if (!clientError && clientRow?.role_id) {
      const { data: roleRow, error: roleErr } = await supabase
        .from('customer_roles')
        .select('name')
        .eq('id', clientRow.role_id)
        .single()
      if (roleRow?.name) {
        roleName = roleRow.name
        roleDebug.cookies.ok = true
      } else {
        roleDebug.cookies.error = roleErr?.message ?? 'roles_query_failed'
      }
    } else {
      roleDebug.cookies.error = clientError?.message ?? 'clients_query_failed'
    }
  }

  const serviceRoleOk = AdminService.isServiceRoleAvailable()

  if (!roleName) {
    const message = !serviceRoleOk
      ? 'No se pudo verificar tu rol porque falta SUPABASE_SERVICE_ROLE_KEY en el servidor.'
      : 'No tienes permisos para acceder. Tu usuario no tiene rol admin en Supabase.'

    return {
      type: 'forbidden',
      message,
      authSource,
      hasToken: Boolean(token),
      roleDebug,
      serviceRoleOk,
      clearCookies,
    }
  }

  if (roleName !== 'admin') {
    return {
      type: 'forbidden',
      message: `No tienes permisos para esta acción. Tu rol actual es "${roleName}".`,
      authSource,
      hasToken: Boolean(token),
      roleDebug,
      serviceRoleOk,
      clearCookies,
    }
  }

  return {
    type: 'success',
    user,
    authSource,
    roleName,
    hasToken: Boolean(token),
    roleDebug,
    serviceRoleOk,
  }
}
