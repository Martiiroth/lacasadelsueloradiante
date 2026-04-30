import { createClient } from '@supabase/supabase-js'

// Cliente server-side sin cookies (build time y server components públicos).
// Usa service role key para bypasear RLS en queries de datos públicos.
export function createBuildClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
