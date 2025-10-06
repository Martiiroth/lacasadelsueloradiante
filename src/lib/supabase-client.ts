/**
 * Helper para obtener el cliente Supabase apropiado según el contexto
 * 
 * DEPRECADO: Este archivo existe solo para compatibilidad hacia atrás.
 * Usa directamente:
 * - import { createClient } from '@/utils/supabase/client' para Client Components
 * - import { createClient } from '@/utils/supabase/server' para Server Components
 */

import { createClient as createBrowserClient } from '@/utils/supabase/client'

/**
 * Cliente para uso en el navegador (Client Components)
 * Este es el cliente por defecto para mantener compatibilidad
 */
export function getSupabaseClient() {
  return createBrowserClient()
}

/**
 * Re-export del cliente browser para compatibilidad con código antiguo
 */
export const supabase = getSupabaseClient()
