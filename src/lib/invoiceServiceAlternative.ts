/**
 * InvoiceService alternativo usando cliente anónimo de Supabase
 * Para evitar problemas con SERVICE_ROLE_KEY en producción
 */

import { createClient } from '@supabase/supabase-js'

// Configuración usando solo claves públicas (más seguro en producción)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔧 [INVOICE-ALT] Inicializando cliente anónimo de Supabase:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length,
  anonKeyLength: supabaseAnonKey?.length
})

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno públicas de Supabase')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('✅ [INVOICE-ALT] Cliente anónimo de Supabase creado')

export class AlternativeInvoiceService {
  /**
   * Generar factura usando cliente anónimo
   * Este método crea la factura a través de una función de base de datos
   * que tiene permisos elevados para evitar problemas de RLS
   */
  static async generateInvoiceForDeliveredOrder(orderId: string): Promise<any | null> {
    try {
      console.log('🚀 [INVOICE-ALT] Generando factura con cliente anónimo para pedido:', orderId)

      // Usar una función de base de datos que maneje la creación de facturas
      // Esta función debe tener permisos SECURITY DEFINER
      const { data, error } = await supabase
        .rpc('generate_invoice_for_order', {
          p_order_id: orderId
        })

      if (error) {
        console.error('❌ [INVOICE-ALT] Error llamando función RPC:', error)
        return null
      }

      if (!data) {
        console.error('❌ [INVOICE-ALT] La función RPC no devolvió datos')
        return null
      }

      console.log('✅ [INVOICE-ALT] Factura generada exitosamente:', data)
      return data

    } catch (error) {
      console.error('❌ [INVOICE-ALT] Error generando factura:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        orderId
      })
      return null
    }
  }

  /**
   * Obtener factura por ID usando cliente anónimo
   */
  static async getInvoiceById(invoiceId: string): Promise<any | null> {
    try {
      console.log('📄 [INVOICE-ALT] Obteniendo factura por ID:', invoiceId)

      // Usar función RPC para obtener factura con permisos elevados
      const { data, error } = await supabase
        .rpc('get_invoice_by_id', {
          p_invoice_id: invoiceId
        })

      if (error) {
        console.error('❌ [INVOICE-ALT] Error obteniendo factura:', error)
        return null
      }

      console.log('✅ [INVOICE-ALT] Factura obtenida exitosamente')
      return data

    } catch (error) {
      console.error('❌ [INVOICE-ALT] Error obteniendo factura:', error)
      return null
    }
  }

  /**
   * Obtener todas las facturas usando función RPC
   */
  static async getAllInvoices(page: number = 1, limit: number = 20): Promise<any> {
    try {
      console.log('📄 [INVOICE-ALT] Obteniendo todas las facturas, página:', page)

      const { data, error } = await supabase
        .rpc('get_all_invoices', {
          p_page: page,
          p_limit: limit
        })

      if (error) {
        console.error('❌ [INVOICE-ALT] Error obteniendo facturas:', error)
        return {
          invoices: [],
          total: 0,
          page: 1,
          totalPages: 0
        }
      }

      console.log('✅ [INVOICE-ALT] Facturas obtenidas exitosamente')
      return data || {
        invoices: [],
        total: 0,
        page: 1,
        totalPages: 0
      }

    } catch (error) {
      console.error('❌ [INVOICE-ALT] Error obteniendo facturas:', error)
      return {
        invoices: [],
        total: 0,
        page: 1,
        totalPages: 0
      }
    }
  }
}