import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔍 DEBUG ROUTE - URL completa:', request.url)
  console.log('🔍 DEBUG ROUTE - Method:', request.method)
  console.log('🔍 DEBUG ROUTE - Headers:', Object.fromEntries(request.headers.entries()))
  
  const { searchParams, pathname } = new URL(request.url)
  const allParams = Object.fromEntries(searchParams.entries())
  
  console.log('🔍 DEBUG ROUTE - Pathname:', pathname)
  console.log('🔍 DEBUG ROUTE - Todos los parámetros:', allParams)
  
  // Redirigir al callback real
  return NextResponse.redirect(new URL('/auth/callback?' + searchParams.toString(), request.nextUrl.origin))
}

export async function POST(request: NextRequest) {
  console.log('🔍 DEBUG ROUTE POST - URL completa:', request.url)
  const body = await request.text()
  console.log('🔍 DEBUG ROUTE POST - Body:', body)
  
  // Redirigir al callback real
  return NextResponse.redirect(new URL('/auth/callback', request.nextUrl.origin))
}