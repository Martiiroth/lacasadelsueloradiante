/**
 * InvoiceService - Servicio de facturas
 * 
 * ✅ COMPATIBLE CON ARQUITECTURA SUPABASE SSR
 * Cliente browser a través de lib/supabase.ts (wrapper compatible)
 */

import { supabase } from './supabase'
import type { Invoice, InvoiceStatus } from '../types/client'

export interface CreateInvoiceData {
  client_id: string
  order_id: string
  total_cents: number
  currency?: string
  due_date?: string
}

export interface InvoiceCounter {
  id: string
  prefix: string
  suffix: string
  next_number: number
}

export class InvoiceService {
  /**
   * Genera automáticamente una factura para un pedido
   */
  static async generateInvoiceForOrder(orderId: string): Promise<Invoice | null> {
    try {
      console.log(`📄 Generando factura para pedido: ${orderId}`)

      // 1. Obtener los datos del pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          client_id,
          total_cents,
          created_at,
          client:clients(
            id,
            first_name,
            last_name,
            email,
            company_name,
            nif_cif
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        console.error('Error obteniendo pedido:', orderError)
        return null
      }

      // 2. Verificar si ya existe una factura para este pedido
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id, invoice_number, prefix, suffix')
        .eq('order_id', orderId)
        .single()

      if (existingInvoice) {
        console.log(`⚠️ Ya existe una factura para el pedido ${orderId}:`, existingInvoice)
        return existingInvoice as Invoice
      }

      // 3. Obtener el próximo número de factura
      const invoiceNumber = await this.getNextInvoiceNumber()
      if (!invoiceNumber) {
        console.error('Error obteniendo número de factura')
        return null
      }

      // 4. Calcular fecha de vencimiento (30 días por defecto)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)

      // 5. Crear la factura
      const invoiceData: CreateInvoiceData = {
        client_id: order.client_id,
        order_id: orderId,
        total_cents: order.total_cents,
        currency: 'EUR',
        due_date: dueDate.toISOString()
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          ...invoiceData,
          invoice_number: invoiceNumber.next_number,
          prefix: invoiceNumber.prefix,
          suffix: invoiceNumber.suffix
        })
        .select(`
          id,
          client_id,
          order_id,
          invoice_number,
          prefix,
          suffix,
          total_cents,
          currency,
          created_at,
          due_date
        `)
        .single()

      if (invoiceError || !invoice) {
        console.error('Error creando factura:', invoiceError)
        return null
      }

      // 6. Incrementar el contador de facturas
      await this.incrementInvoiceCounter(invoiceNumber.id)

      console.log(`✅ Factura generada exitosamente:`, {
        id: invoice.id,
        number: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`,
        total: invoice.total_cents / 100,
        client: (order.client as any)?.first_name + ' ' + (order.client as any)?.last_name
      })

      return invoice as Invoice

    } catch (error) {
      console.error('Error en generateInvoiceForOrder:', error)
      return null
    }
  }

  /**
   * Obtiene el próximo número de factura disponible
   */
  static async getNextInvoiceNumber(): Promise<InvoiceCounter | null> {
    try {
      // Intentar obtener el contador existente
      const { data: counter } = await supabase
        .from('invoice_counters')
        .select('*')
        .single()

      if (counter) {
        return counter as InvoiceCounter
      }

      // Si no existe, crear uno por defecto
      const { data: newCounter, error } = await supabase
        .from('invoice_counters')
        .insert({
          prefix: 'FAC-',
          suffix: '',
          next_number: 1
        })
        .select('*')
        .single()

      if (error || !newCounter) {
        console.error('Error creando contador de facturas:', error)
        return null
      }

      return newCounter as InvoiceCounter

    } catch (error) {
      console.error('Error en getNextInvoiceNumber:', error)
      return null
    }
  }

  /**
   * Incrementa el contador de facturas
   */
  static async incrementInvoiceCounter(counterId: string): Promise<boolean> {
    try {
      // Primero obtener el valor actual
      const { data: currentCounter } = await supabase
        .from('invoice_counters')
        .select('next_number')
        .eq('id', counterId)
        .single()

      if (!currentCounter) {
        console.error('No se encontró el contador')
        return false
      }

      // Incrementar el valor
      const { error } = await supabase
        .from('invoice_counters')
        .update({ next_number: currentCounter.next_number + 1 })
        .eq('id', counterId)

      if (error) {
        console.error('Error incrementando contador:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error en incrementInvoiceCounter:', error)
      return false
    }
  }

  /**
   * Obtiene una factura por ID
   */
  static async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          id,
          client_id,
          order_id,
          invoice_number,
          prefix,
          suffix,
          total_cents,
          currency,
          status,
          created_at,
          due_date,
          client:clients(
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
          order:orders(
            id,
            created_at,
            status,
            shipping_address,
            order_items(
              id,
              qty,
              price_cents,
              variant:product_variants(
                id,
                title,
                sku,
                product:products(
                  id,
                  title,
                  slug
                )
              )
            )
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
   * Obtiene las facturas de un cliente
   */
  static async getClientInvoices(
    clientId: string, 
    limit: number = 10
  ): Promise<Invoice[]> {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          prefix,
          suffix,
          total_cents,
          currency,
          status,
          created_at,
          due_date,
          order:orders(
            id,
            created_at,
            status
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error obteniendo facturas del cliente:', error)
        return []
      }

      return (invoices || []) as unknown as Invoice[]
    } catch (error) {
      console.error('Error en getClientInvoices:', error)
      return []
    }
  }
}