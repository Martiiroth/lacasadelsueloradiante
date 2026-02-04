/**
 * API admin: gestión del carrusel de la homepage
 * GET: lista de product_ids en orden
 * PUT: actualizar productos del carrusel (body: { product_ids: string[] })
 */

import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import { createClient } from '@/utils/supabase/server'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization')
  return h?.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() || null : null
}

async function getAuthUser(req: NextRequest) {
  const supabase = await createClient()
  const token = getBearerToken(req)
  if (token) {
    const res = await supabase.auth.getUser(token)
    if (res.data.user) return res.data.user
  }
  const res = await supabase.auth.getUser()
  return res.data.user ?? null
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: JSON_HEADERS })
    }
    const roleName = await AdminService.getClientRoleByAuthUid(user.id)
    if (roleName !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403, headers: JSON_HEADERS })
    }
    const productIds = await AdminService.getCarouselProductIds()
    return NextResponse.json({ product_ids: productIds }, { headers: JSON_HEADERS })
  } catch (e) {
    console.error('[admin/carousel] GET error:', e)
    return NextResponse.json({ error: 'Error al cargar el carrusel' }, { status: 500, headers: JSON_HEADERS })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: JSON_HEADERS })
    }
    const roleName = await AdminService.getClientRoleByAuthUid(user.id)
    if (roleName !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403, headers: JSON_HEADERS })
    }
    let body: { product_ids?: string[] }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400, headers: JSON_HEADERS })
    }
    const productIds = Array.isArray(body?.product_ids) ? body.product_ids : []
    const ok = await AdminService.setCarouselProductIds(productIds)
    if (!ok) {
      return NextResponse.json({ error: 'Error al guardar el carrusel' }, { status: 500, headers: JSON_HEADERS })
    }
    return NextResponse.json({ success: true, product_ids: productIds }, { headers: JSON_HEADERS })
  } catch (e) {
    console.error('[admin/carousel] PUT error:', e)
    return NextResponse.json({ error: 'Error al actualizar el carrusel' }, { status: 500, headers: JSON_HEADERS })
  }
}
