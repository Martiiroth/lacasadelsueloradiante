import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Log para debugging
console.log('🔍 Supabase Environment Check:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Available' : '❌ Missing')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Available' : '❌ Missing')

if (!supabaseUrl) {
  console.error('❌ Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  console.error('❌ Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

console.log('✅ Supabase client initialized successfully')
export const supabase = createClient(supabaseUrl, supabaseAnonKey)