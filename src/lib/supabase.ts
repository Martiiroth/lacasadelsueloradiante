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

// Create Supabase client with session refresh configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Refresh session when window regains focus
    storageKey: 'supabase-auth',
  },
  global: {
    headers: {
      'x-application-name': 'lacasadelsueloradiante',
    },
  },
})

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    console.log('🔴 User signed out')
  } else if (event === 'SIGNED_IN') {
    console.log('🟢 User signed in:', session?.user?.email)
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 Token refreshed')
  } else if (event === 'USER_UPDATED') {
    console.log('👤 User updated')
  }
})

// Auto-refresh session when window regains focus
if (typeof window !== 'undefined') {
  window.addEventListener('focus', async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('❌ Error getting session on focus:', error)
    } else if (session) {
      console.log('✅ Session recovered on window focus')
    }
  })

  // Also check on visibility change
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('❌ Error getting session on visibility change:', error)
      } else if (session) {
        console.log('✅ Session checked on visibility change')
      }
    }
  })
}

console.log('✅ Supabase client initialized successfully with auto-refresh')