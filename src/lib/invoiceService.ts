/**
 * Servicio principal para gestión de facturas
 * Integrado con Supabase y jsPDF
 */

import { supabase } from './supabase'
import type { 
  Invoice, 
  CreateInvoiceData, 
  InvoiceFilters, 
  InvoicePaginatedResponse,
  InvoiceStats,
  InvoiceStatus,
  InvoiceCounter
} from '@/types/invoices'
import { PDFService } from './pdfService'

export class InvoiceService {
  
  /**
   * Crear nueva factura desde un pedido
   */
  static async createInvoiceFromOrder(data: CreateInvoiceData): Promise<Invoice | null> {
    try {
      console.log('📄 Creando factura desde pedido:', data.order_id)

      // Verificar que el pedido existe
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, client_id, total_cents, status')
        .eq('id', data.order_id)
        .single()

      if (orderError || !order) {
        console.error('Pedido no encontrado:', orderError)
        return null
      }

      // Verificar que no existe ya una factura para este pedido
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('order_id', data.order_id)
        .single()

      if (existingInvoice) {
        console.log('Ya existe una factura para este pedido:', existingInvoice.id)
        return await this.getInvoiceById(existingInvoice.id)
      }

      // Obtener o crear contador de facturas
      const counter = await this.getOrCreateInvoiceCounter()
      if (!counter) {
        throw new Error('No se pudo obtener contador de facturas')
      }

      // Calcular fecha de vencimiento (30 días por defecto)
      const dueDate = data.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      // Calcular IVA (21%)
      const TAX_RATE = 21
      const totalWithTax = order.total_cents
      const subtotal = Math.round(totalWithTax / (1 + TAX_RATE / 100))
      const taxAmount = totalWithTax - subtotal

      // Crear factura
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          client_id: data.client_id || order.client_id,
          order_id: data.order_id,
          invoice_number: counter.next_number,
          prefix: counter.prefix,
          suffix: counter.suffix,
          subtotal_cents: subtotal,
          tax_rate: TAX_RATE,
          tax_cents: taxAmount,
          total_cents: totalWithTax,
          currency: 'EUR',
          status: 'pending', // Factura pendiente de pago al crearla
          due_date: dueDate
        })
        .select()
        .single()

      if (invoiceError || !invoice) {
        console.error('Error creando factura:', invoiceError)
        return null
      }

      // Actualizar contador
      await supabase
        .from('invoice_counters')
        .update({ next_number: counter.next_number + 1 })
        .eq('id', counter.id)

      console.log('✅ Factura creada exitosamente:', invoice.id)
      return invoice as Invoice

    } catch (error) {
      console.error('Error en createInvoiceFromOrder:', error)
      return null
    }
  }

  /**
   * Obtener factura por ID con relaciones completas
   */
  static async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients (
            id,
            first_name,
            last_name,
            email,
            nif_cif,
            company_name,
            phone,
            address_line1,
            address_line2,
            city,
            postal_code,
            region
          ),
          order:orders (
            id,
            status,
            created_at,
            confirmation_number,
            shipping_address,
            billing_address
          )
        `)
        .eq('id', invoiceId)
        .single()

      if (error || !invoice) {
        console.error('Error obteniendo factura:', error)
        return null
      }

      return invoice as Invoice

    } catch (error) {
      console.error('Error en getInvoiceById:', error)
      return null
    }
  }

  /**
   * Obtener facturas con filtros y paginación
   */
  static async getInvoices(
    filters: InvoiceFilters = {},
    page: number = 1,
    perPage: number = 20
  ): Promise<InvoicePaginatedResponse> {
    try {
      let query = supabase
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
            confirmation_number
          )
        `, { count: 'exact' })

      // Aplicar filtros
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id)
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      if (filters.search) {
        // Buscar por número de factura
        const searchNumber = filters.search.replace(/[^\d]/g, '') // Solo números
        if (searchNumber) {
          query = query.eq('invoice_number', parseInt(searchNumber))
        }
      }

      // Paginación
      const offset = (page - 1) * perPage
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + perPage - 1)

      const { data: invoices, error, count } = await query

      if (error) {
        console.error('Error obteniendo facturas:', error)
        throw error
      }

      const totalPages = count ? Math.ceil(count / perPage) : 0

      return {
        invoices: (invoices || []) as Invoice[],
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: totalPages
      }

    } catch (error) {
      console.error('Error en getInvoices:', error)
      throw error
    }
  }

  /**
   * Obtener facturas de un cliente específico
   */
  static async getClientInvoices(
    clientId: string,
    filters: Partial<InvoiceFilters> = {},
    limit: number = 10
  ): Promise<Invoice[]> {
    try {
      const clientFilters: InvoiceFilters = {
        ...filters,
        client_id: clientId
      }

      const result = await this.getInvoices(clientFilters, 1, limit)
      return result.invoices

    } catch (error) {
      console.error('Error en getClientInvoices:', error)
      return []
    }
  }

  /**
   * Actualizar estado de factura
   */
  static async updateInvoiceStatus(
    invoiceId: string, 
    status: InvoiceStatus
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', invoiceId)

      if (error) {
        console.error('Error actualizando estado de factura:', error)
        return false
      }

      console.log('✅ Estado de factura actualizado:', { invoiceId, status })
      return true

    } catch (error) {
      console.error('Error en updateInvoiceStatus:', error)
      return false
    }
  }

  /**
   * Eliminar factura (soft delete)
   */
  static async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('id', invoiceId)

      if (error) {
        console.error('Error eliminando factura:', error)
        return false
      }

      console.log('✅ Factura cancelada:', invoiceId)
      return true

    } catch (error) {
      console.error('Error en deleteInvoice:', error)
      return false
    }
  }

  /**
   * Obtener estadísticas de facturas
   */
  static async getInvoiceStats(clientId?: string): Promise<InvoiceStats> {
    try {
      let query = supabase
        .from('invoices')
        .select('status, total_cents')

      if (clientId) {
        query = query.eq('client_id', clientId)
      }

      const { data: invoices, error } = await query

      if (error || !invoices) {
        console.error('Error obteniendo estadísticas:', error)
        return this.getEmptyStats()
      }

      const stats = invoices.reduce((acc, invoice) => {
        acc.total_invoices++
        acc.total_amount_cents += invoice.total_cents

        switch (invoice.status) {
          case 'paid':
            acc.paid_count++
            acc.paid_amount_cents += invoice.total_cents
            break
          case 'overdue':
            acc.overdue_count++
            acc.overdue_amount_cents += invoice.total_cents
            break
          default:
            acc.pending_count++
            acc.pending_amount_cents += invoice.total_cents
        }

        return acc
      }, this.getEmptyStats())

      return stats

    } catch (error) {
      console.error('Error en getInvoiceStats:', error)
      return this.getEmptyStats()
    }
  }

  /**
   * Generar PDF de factura
   */
  static async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    return PDFService.generateInvoicePDF(invoiceId)
  }

  /**
   * Marcar factura como pagada
   */
  static async markAsPaid(invoiceId: string): Promise<boolean> {
    return this.updateInvoiceStatus(invoiceId, 'paid')
  }

  /**
   * Reenviar factura (actualizar estado a sent)
   */
  static async resendInvoice(invoiceId: string): Promise<boolean> {
    return this.updateInvoiceStatus(invoiceId, 'sent')
  }

  // --- Métodos privados ---

  /**
   * Obtener o crear contador de facturas
   */
  private static async getOrCreateInvoiceCounter(): Promise<InvoiceCounter | null> {
    try {
      // Intentar obtener contador existente
      let { data: counter, error } = await supabase
        .from('invoice_counters')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error obteniendo contador:', error)
        return null
      }

      // Si no existe, crear uno nuevo
      if (!counter) {
        const { data: newCounter, error: createError } = await supabase
          .from('invoice_counters')
          .insert({
            prefix: 'FAC-',
            suffix: '',
            next_number: 1
          })
          .select()
          .single()

        if (createError || !newCounter) {
          console.error('Error creando contador:', createError)
          return null
        }

        counter = newCounter
      }

      return counter as InvoiceCounter

    } catch (error) {
      console.error('Error en getOrCreateInvoiceCounter:', error)
      return null
    }
  }

  /**
   * Estadísticas vacías por defecto
   */
  private static getEmptyStats(): InvoiceStats {
    return {
      total_invoices: 0,
      total_amount_cents: 0,
      paid_count: 0,
      paid_amount_cents: 0,
      overdue_count: 0,
      overdue_amount_cents: 0,
      pending_count: 0,
      pending_amount_cents: 0
    }
  }

  /**
   * Formatear precio para mostrar
   */
  static formatPrice(cents: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency
    }).format(cents / 100)
  }

  /**
   * Formatear fecha para mostrar
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  /**
   * Obtener color de estado para UI
   */
  static getStatusColor(status: InvoiceStatus): string {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-500'
    }
    return colors[status] || colors.draft
  }

  /**
   * Obtener etiqueta de estado en español
   */
  static getStatusLabel(status: InvoiceStatus): string {
    const labels = {
      'draft': 'Borrador',
      'sent': 'Enviada',
      'paid': 'Pagada',
      'overdue': 'Vencida',
      'cancelled': 'Cancelada'
    }
    return labels[status] || status
  }
}