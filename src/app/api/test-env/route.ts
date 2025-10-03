import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 API Route - Checking environment variables:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Available' : '❌ Missing')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Available' : '❌ Missing')

    return NextResponse.json({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Available' : 'Missing',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Available' : 'Missing',
      timestamp: new Date().toISOString(),
      status: 'success'
    })
  } catch (error) {
    console.error('Error in test-env API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        status: 'error'
      },
      { status: 500 }
    )
  }
}