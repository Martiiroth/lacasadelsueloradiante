/**
 * DEPRECADO: Este archivo existe solo para compatibilidad hacia atrás.
 * 
 * NUEVA ARQUITECTURA (Supabase SSR):
 * - Para Client Components: import { createClient } from '@/utils/supabase/client'
 * - Para Server Components: import { createClient } from '@/utils/supabase/server'
 * 
 * Este export mantiene compatibilidad con código antiguo que aún no ha sido migrado.
 * El cliente se crea dinámicamente para funcionar en cualquier contexto.
 */

import { createClient as createBrowserClient } from '@/utils/supabase/client'

/**
 * Cliente legacy para compatibilidad
 * Solo funciona en el navegador (Client Components)
 * 
 * @deprecated Usa createClient() de @/utils/supabase/client o @/utils/supabase/server
 */
export const supabase = createBrowserClient()