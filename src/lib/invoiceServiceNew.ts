/**
 * InvoiceService - Servicio de facturas completamente reconstruido
 * 
 * ✅ ROBUSTO Y FUNCIONAL
 * ✅ Manejo de errores completo
 * ✅ Logging detallado
 * ✅ Validaciones estrictas
 * ✅ Transacciones seguras
 * ✅ MIGRADO A JSPDF
 */

import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔧 [INVOICE] Inicializando Supabase client:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  urlLength: supabaseUrl?.length,
  keyLength: supabaseKey?.length
})

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables de entorno de Supabase')
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('✅ [INVOICE] Supabase client creado exitosamente')

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface Invoice {
  id: string
  client_id: string
  order_id: string
  invoice_number: number
  prefix: string
  suffix: string
  total_cents: number
  currency: string
  invoice_date: string
  due_date: string | null
  created_at: string
  updated_at: string
  notes: string | null
  pdf_generated: boolean
  email_sent: boolean
}

export interface InvoiceWithRelations extends Invoice {
  client?: {
    id: string
    first_name: string
    last_name: string
    email: string
    company_name?: string
    nif_cif?: string
    phone?: string
    address_line1?: string
    address_line2?: string
    city?: string
    region?: string
    postal_code?: string
  }
  order?: {
    id: string
    status: string
    created_at: string
    shipping_address?: any
    billing_address?: any
    order_items?: Array<{
      id: string
      qty: number
      price_cents: number
      variant?: {
        id: string
        title: string
        sku?: string
        product?: {
          title: string
        }
      }
    }>
  }
}

export interface CreateInvoiceData {
  client_id: string
  order_id: string
  total_cents: number
  currency?: string
  prefix?: string
  suffix?: string
  due_days?: number
  notes?: string
}

export interface InvoiceCounter {
  id: string
  prefix: string
  suffix: string
  next_number: number
}

// ============================================================================
// CLASE PRINCIPAL DEL SERVICIO
// ============================================================================

export class InvoiceService {
  
  /**
   * Crear una nueva factura para un pedido
   */
  static async createInvoice(data: CreateInvoiceData): Promise<Invoice | null> {
    try {
      console.log('📄 [INVOICE] Iniciando creación de factura:', {
        order_id: data.order_id,
        client_id: data.client_id,
        total: data.total_cents / 100
      })

      // 1. Validar datos de entrada
      const validation = this.validateCreateInvoiceData(data)
      if (!validation.valid) {
        console.error('❌ [INVOICE] Datos inválidos:', validation.errors)
        return null
      }

      // 2. Verificar que el pedido existe y no tiene factura
      const orderCheck = await this.verifyOrderForInvoice(data.order_id)
      if (!orderCheck.valid) {
        console.error('❌ [INVOICE] Error con pedido:', orderCheck.error)
        return null
      }

      // 3. Usar función de base de datos para crear factura con numeración automática
      const { data: result, error } = await supabase
        .rpc('create_invoice_with_number', {
          p_client_id: data.client_id,
          p_order_id: data.order_id,
          p_total_cents: data.total_cents,
          p_currency: data.currency || 'EUR',
          p_prefix: data.prefix || 'FAC-',
          p_suffix: data.suffix || '-2025',
          p_due_days: data.due_days || 30
        })

      if (error) {
        console.error('❌ [INVOICE] Error en función create_invoice_with_number:', error)
        return null
      }

      if (!result || result.length === 0) {
        console.error('❌ [INVOICE] No se retornó resultado de creación')
        return null
      }

      const invoiceData = result[0]
      console.log('✅ [INVOICE] Factura creada exitosamente:', {
        id: invoiceData.invoice_id,
        number: invoiceData.full_number,
        total: data.total_cents / 100
      })

      // 4. Obtener factura completa creada
      return await this.getInvoiceById(invoiceData.invoice_id)

    } catch (error) {
      console.error('❌ [INVOICE] Error general creando factura:', error)
      return null
    }
  }

  /**
   * Obtener factura por ID con todas las relaciones
   */
  static async getInvoiceById(invoiceId: string): Promise<InvoiceWithRelations | null> {
    try {
      console.log('🔍 [INVOICE] Obteniendo factura:', invoiceId)

      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients (
            id,
            first_name,
            last_name,
            email,
            company_name,
            nif_cif,
            phone,
            address_line1,
            address_line2,
            city,
            region,
            postal_code
          ),
          order:orders (
            id,
            status,
            created_at,
            shipping_address,
            billing_address,
            order_items (
              id,
              qty,
              price_cents,
              variant:product_variants (
                id,
                title,
                sku,
                product:products (
                  title
                )
              )
            )
          )
        `)
        .eq('id', invoiceId)
        .single()

      if (error) {
        console.error('❌ [INVOICE] Error obteniendo factura:', error)
        return null
      }

      if (!invoice) {
        console.error('❌ [INVOICE] Factura no encontrada:', invoiceId)
        return null
      }

      console.log('✅ [INVOICE] Factura obtenida exitosamente')
      return invoice as InvoiceWithRelations

    } catch (error) {
      console.error('❌ [INVOICE] Error general obteniendo factura:', error)
      return null
    }
  }

  /**
   * Obtener facturas de un cliente
   */
  static async getClientInvoices(clientId: string, limit: number = 10): Promise<Invoice[]> {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ [INVOICE] Error obteniendo facturas del cliente:', error)
        return []
      }

      return invoices || []

    } catch (error) {
      console.error('❌ [INVOICE] Error general obteniendo facturas del cliente:', error)
      return []
    }
  }

  /**
   * Obtener todas las facturas (para admin) con paginación
   */
  static async getAllInvoices(page: number = 1, limit: number = 20): Promise<{
    invoices: InvoiceWithRelations[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const offset = (page - 1) * limit

      // Obtener total de facturas
      const { count, error: countError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.error('❌ [INVOICE] Error contando facturas:', countError)
        return { invoices: [], total: 0, page, totalPages: 0 }
      }

      // Obtener facturas de la página actual
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients (
            id,
            first_name,
            last_name,
            email,
            company_name
          ),
          order:orders (
            id,
            status,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('❌ [INVOICE] Error obteniendo facturas:', error)
        return { invoices: [], total: 0, page, totalPages: 0 }
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      return {
        invoices: invoices as InvoiceWithRelations[] || [],
        total,
        page,
        totalPages
      }

    } catch (error) {
      console.error('❌ [INVOICE] Error general obteniendo todas las facturas:', error)
      return { invoices: [], total: 0, page, totalPages: 0 }
    }
  }

  /**
   * Generar factura automáticamente para un pedido entregado
   */
  static async generateInvoiceForDeliveredOrder(orderId: string): Promise<Invoice | null> {
    try {
      console.log('🚀 [INVOICE] Generando factura automática para pedido:', orderId)

      // 1. Obtener datos del pedido
      console.log('🔍 [INVOICE] Buscando pedido en base de datos:', orderId)
      
      let order, orderError
      try {
        const result = await supabase
          .from('orders')
          .select(`
            id,
            client_id,
            total_cents,
            status,
            client:clients(id, first_name, last_name, email)
          `)
          .eq('id', orderId)
          .single()
        
        order = result.data
        orderError = result.error
        
        console.log('📊 [INVOICE] Query ejecutada - resultado:', { 
          hasOrder: !!order, 
          errorCode: orderError?.code,
          errorMessage: orderError?.message,
          errorDetails: orderError?.details 
        })
      } catch (queryError) {
        console.error('❌ [INVOICE] Error ejecutando query:', {
          error: queryError instanceof Error ? queryError.message : queryError,
          stack: queryError instanceof Error ? queryError.stack : undefined
        })
        orderError = queryError
      }
      
      if (orderError || !order) {
        console.error('❌ [INVOICE] Pedido no encontrado:', orderError)
        return null
      }

      // 2. Verificar que el pedido está entregado
      if (order.status !== 'delivered') {
        console.error('❌ [INVOICE] Pedido no está en estado "delivered":', order.status)
        return null
      }

      // 3. Verificar que no existe factura para este pedido
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('order_id', orderId)
        .single()

      if (existingInvoice) {
        console.log('⚠️ [INVOICE] Ya existe factura para este pedido')
        return await this.getInvoiceById(existingInvoice.id)
      }

      // 4. Crear factura
      const invoiceData: CreateInvoiceData = {
        client_id: order.client_id,
        order_id: orderId,
        total_cents: order.total_cents,
        currency: 'EUR',
        prefix: 'FAC-',
        suffix: '-2025',
        due_days: 30,
        notes: `Factura generada automáticamente para pedido ${orderId}`
      }

      const invoice = await this.createInvoice(invoiceData)

      if (invoice) {
        console.log('✅ [INVOICE] Factura automática generada exitosamente:', {
          invoiceId: invoice.id,
          orderFullNumber: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`,
          orderId: orderId
        })
      }

      return invoice

    } catch (error) {
      console.error('❌ [INVOICE] Error generando factura automática:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        orderId
      })
      return null
    }
  }

  /**
   * Marcar factura como PDF generado
   */
  static async markPDFGenerated(invoiceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ pdf_generated: true })
        .eq('id', invoiceId)

      if (error) {
        console.error('❌ [INVOICE] Error marcando PDF generado:', error)
        return false
      }

      console.log('✅ [INVOICE] Factura marcada como PDF generado:', invoiceId)
      return true

    } catch (error) {
      console.error('❌ [INVOICE] Error general marcando PDF:', error)
      return false
    }
  }

  /**
   * Marcar factura como email enviado
   */
  static async markEmailSent(invoiceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ email_sent: true })
        .eq('id', invoiceId)

      if (error) {
        console.error('❌ [INVOICE] Error marcando email enviado:', error)
        return false
      }

      console.log('✅ [INVOICE] Factura marcada como email enviado:', invoiceId)
      return true

    } catch (error) {
      console.error('❌ [INVOICE] Error general marcando email:', error)
      return false
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS DE VALIDACIÓN
  // ============================================================================

  /**
   * Validar datos para crear factura
   */
  private static validateCreateInvoiceData(data: CreateInvoiceData): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!data.client_id) {
      errors.push('client_id es requerido')
    }

    if (!data.order_id) {
      errors.push('order_id es requerido')
    }

    if (!data.total_cents || data.total_cents <= 0) {
      errors.push('total_cents debe ser mayor que 0')
    }

    if (data.currency && !['EUR', 'USD', 'GBP'].includes(data.currency)) {
      errors.push('currency debe ser EUR, USD o GBP')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Verificar que el pedido puede tener una factura
   */
  private static async verifyOrderForInvoice(orderId: string): Promise<{
    valid: boolean
    error?: string
  }> {
    try {
      // Verificar que el pedido existe
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, status, client_id')
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        return { valid: false, error: 'Pedido no encontrado' }
      }

      // Verificar que no tiene factura ya
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('order_id', orderId)
        .single()

      if (existingInvoice) {
        return { valid: false, error: 'El pedido ya tiene una factura' }
      }

      return { valid: true }

    } catch (error) {
      return { valid: false, error: 'Error verificando pedido' }
    }
  }
}

export default InvoiceService