import { createClient } from '@supabase/supabase-js'

// Cliente sin cookies para uso en generateStaticParams (build time, sin request scope)
export function createBuildClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
