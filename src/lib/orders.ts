/**
 * OrderService - Servicio de pedidos
 * 
 * ✅ COMPATIBLE CON ARQUITECTURA SUPABASE SSR
 * Cliente browser a través de lib/supabase.ts (wrapper compatible)
 */

import { supabase } from './supabase'
import EmailService from './emailService'
import type { 
  Order, 
  OrderItem, 
  ShippingMethod, 
  PaymentMethod, 
  CreateOrderData,
  OrderConfirmation,
  Invoice,
  InvoiceCounter,
  Coupon,
  CheckoutSummary,
  CouponRedemption
} from '../types/checkout'
import type { CartItem } from '../types/cart'

export class OrderService {
  // Obtener métodos de envío disponibles
  static async getShippingMethods(): Promise<ShippingMethod[]> {
    try {
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('price_cents')

      if (error) {
        console.error('Error fetching shipping methods:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getShippingMethods:', error)
      return []
    }
  }

  // Obtener métodos de pago disponibles
  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) {
        console.error('Error fetching payment methods:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getPaymentMethods:', error)
      return []
    }
  }

  // Validar cupón de descuento
  static async validateCoupon(code: string): Promise<Coupon | null> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .lte('valid_from', new Date().toISOString())
        .gte('valid_to', new Date().toISOString())
        .single()

      if (error || !data) {
        console.error('Coupon not found or invalid:', error)
        return null
      }

      // Verificar límite de uso
      if (data.usage_limit && data.used_count >= data.usage_limit) {
        console.error('Coupon usage limit exceeded')
        return null
      }

      return data
    } catch (error) {
      console.error('Error validating coupon:', error)
      return null
    }
  }

  // Calcular resumen de checkout
  static async calculateCheckoutSummary(
    cartItems: CartItem[],
    shippingMethodId: string,
    couponCode?: string
  ): Promise<CheckoutSummary | null> {
    try {
      // Calcular subtotal
      const subtotal_cents = cartItems.reduce((total, item) => {
        return total + (item.price_at_addition_cents * item.qty)
      }, 0)

      // Obtener método de envío
      const { data: shippingMethod, error: shippingError } = await supabase
        .from('shipping_methods')
        .select('*')
        .eq('id', shippingMethodId)
        .single()

      if (shippingError || !shippingMethod) {
        console.error('Error fetching shipping method:', shippingError)
        return null
      }

      let discount_cents = 0
      let applied_coupon: Coupon | undefined

      // Aplicar cupón si existe
      if (couponCode) {
        const validatedCoupon = await this.validateCoupon(couponCode)
        if (validatedCoupon) {
          applied_coupon = validatedCoupon
          if (applied_coupon.discount_type === 'percentage') {
            discount_cents = Math.round((subtotal_cents * applied_coupon.discount_value) / 100)
          } else if (applied_coupon.discount_type === 'fixed') {
            discount_cents = applied_coupon.discount_value
          }
        }
      }

      // Calcular impuestos (por ahora 0, se puede implementar según necesidades)
      const tax_cents = 0

      // Calcular total
      const total_cents = subtotal_cents + shippingMethod.price_cents + tax_cents - discount_cents

      // Convertir CartItems a OrderItems para el resumen
      const orderItems: OrderItem[] = cartItems.map(item => ({
        id: '', // Se generará al crear la orden
        order_id: '', // Se generará al crear la orden
        variant_id: item.variant_id,
        qty: item.qty,
        price_cents: item.price_at_addition_cents,
        variant: item.variant
      }))

      return {
        subtotal_cents,
        shipping_cents: shippingMethod.price_cents,
        discount_cents,
        tax_cents,
        total_cents: Math.max(0, total_cents), // Asegurar que no sea negativo
        currency: 'EUR',
        items: orderItems,
        shipping_method: shippingMethod,
        applied_coupon
      }
    } catch (error) {
      console.error('Error calculating checkout summary:', error)
      return null
    }
  }

  // Crear orden
  static async createOrder(orderData: CreateOrderData): Promise<OrderConfirmation | null> {
    try {
      // Iniciar transacción
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: orderData.client_id || null,
          status: 'pending',
          total_cents: 0, // Se calculará después
          shipping_address: orderData.shipping_address,
          billing_address: orderData.billing_address,
        })
        .select()
        .single()

      if (orderError || !order) {
        console.error('Error creating order:', orderError)
        return null
      }

      // Validar stock antes de crear los items
      console.log('Validando stock antes de crear pedido...')
      const stockValidation = await this.validateOrderStock(orderData.items)
      
      if (!stockValidation.valid) {
        console.error('❌ Order creation BLOCKED - Insufficient stock:', stockValidation.issues)
        
        // Construir mensaje de error detallado
        const errorMessages = stockValidation.issues.map(issue => 
          `Variant ${issue.variant_id}: ${issue.issue}`
        ).join('\n')
        
        throw new Error(`No se puede crear el pedido. Stock insuficiente:\n${errorMessages}`)
      }

      // Crear items de la orden
      const orderItemsData = orderData.items.map(item => ({
        order_id: order.id,
        variant_id: item.variant_id,
        qty: item.qty,
        price_cents: item.price_cents
      }))

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData)
        .select(`
          *,
          variant:product_variants (
            id,
            title,
            sku,
            variant_images (
              id,
              url,
              alt,
              position
            ),
            product:products (
              id,
              title,
              slug,
              images:product_images (
                url,
                alt,
                position
              )
            )
          )
        `)

      if (itemsError || !orderItems) {
        console.error('Error creating order items:', itemsError)
        // Limpiar orden creada
        await supabase.from('orders').delete().eq('id', order.id)
        return null
      }

      // Descontar stock después de crear los items exitosamente
      console.log('Descontando stock para pedido del cliente...')
      const stockUpdatePromises = orderData.items.map(async (item) => {
        // Check stock availability first
        const stockCheck = await this.checkVariantStock(item.variant_id, item.qty)
        
        if (!stockCheck.available) {
          const errorMsg = `Stock insuficiente para variante ${item.variant_id}. Disponible: ${stockCheck.current_stock}, Solicitado: ${item.qty}`
          console.error(`❌ ${errorMsg}`)
          throw new Error(errorMsg)
        }

        // Update stock (subtract the quantity)
        const stockUpdate = await this.updateVariantStock(item.variant_id, -item.qty)
        
        return {
          ...stockUpdate,
          variant_id: item.variant_id,
          qty_ordered: item.qty,
          stock_check: stockCheck
        }
      })

      // Wait for all stock updates to complete
      const stockUpdateResults = await Promise.all(stockUpdatePromises)
      
      // Log stock update results
      stockUpdateResults.forEach(result => {
        if (result.success) {
          console.log(`Stock updated for variant ${result.variant_id}: ${result.old_stock} -> ${result.new_stock} (-${result.qty_ordered})`)
          if (!result.stock_check.available) {
            console.warn(`Warning: Order created with insufficient stock for variant ${result.variant_id}`)
          }
        } else {
          console.error(`Failed to update stock for variant ${result.variant_id}:`, result.error)
        }
      })

      // Check if any stock updates failed
      const failedUpdates = stockUpdateResults.filter(result => !result.success)
      if (failedUpdates.length > 0) {
        console.warn(`${failedUpdates.length} stock updates failed, but order was created successfully`)
      }

      // Obtener método de envío para incluir su costo
      const { data: shippingMethod, error: shippingError } = await supabase
        .from('shipping_methods')
        .select('*')
        .eq('id', orderData.shipping_method_id)
        .single()

      if (shippingError || !shippingMethod) {
        console.error('Error fetching shipping method for total calculation:', shippingError)
        throw new Error('Invalid shipping method')
      }

      // Calcular total de la orden incluyendo envío
      const subtotal_cents = orderItems.reduce((total, item) => {
        return total + (item.price_cents * item.qty)
      }, 0)
      
      const total_cents = subtotal_cents + shippingMethod.price_cents

      console.log('💰 Calculando total de la orden:', {
        subtotal_cents,
        shipping_cents: shippingMethod.price_cents,
        total_cents,
        shipping_method: shippingMethod.name
      })

      // Actualizar total de la orden
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          total_cents,
          shipping_method_id: orderData.shipping_method_id 
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('Error updating order total:', updateError)
      }

      // Crear factura
      const invoice = await this.createInvoice(order.id, orderData.client_id || null, total_cents)
      if (!invoice) {
        console.error('Error creating invoice')
        // Podríamos decidir si continuar o cancelar la orden
      }

      // Aplicar cupón si existe
      if (orderData.coupon_code) {
        await this.applyCoupon(orderData.coupon_code, orderData.client_id || null, order.id)
      }

      // Registrar log de la orden
      await this.logOrderAction(order.id, 'created', {
        total_cents,
        items_count: orderItems.length,
        shipping_method: orderData.shipping_method_id,
        payment_method: orderData.payment_method_id,
        guest_email: orderData.guest_email
      }, orderData.client_id || null)

      // Enviar notificación por email de nuevo pedido
      try {
        console.log('Enviando notificación de nuevo pedido desde cliente por email...')
        
        // Obtener información del cliente
        let clientName = 'Cliente'
        let clientEmail = orderData.guest_email || ''
        
        if (orderData.client_id) {
          const { data: client } = await supabase
            .from('clients')
            .select('first_name, last_name, email')
            .eq('id', orderData.client_id)
            .single()
          
          if (client) {
            clientName = `${client.first_name} ${client.last_name}`.trim()
            clientEmail = client.email
          }
        }
        
        const emailData = {
          orderId: order.id,
          orderNumber: order.id, // Usar ID como número de pedido
          status: 'pending', // Nuevo pedido siempre es pending
          clientName,
          clientEmail,
          items: orderItems.map(item => ({
            title: item.variant?.product?.title || 'Producto',
            quantity: item.qty,
            price: (item.price_cents || 0) / 100
          })),
          total: total_cents / 100,
          createdAt: order.created_at,
          shippingAddress: orderData.shipping_address ? 
            (typeof orderData.shipping_address === 'string' 
              ? orderData.shipping_address 
              : JSON.stringify(orderData.shipping_address, null, 2)
            ) : undefined
        }

        // Enviar notificación de nuevo pedido
        const emailSent = await EmailService.sendNewOrderNotification(emailData)
        
        if (emailSent) {
          console.log(`✅ Notificación de nuevo pedido del cliente enviada para #${order.id}`)
        } else {
          console.log(`⚠️ No se pudo enviar la notificación de nuevo pedido del cliente #${order.id}`)
        }
      } catch (emailError) {
        console.error('Error enviando notificación de nuevo pedido del cliente por email:', emailError)
        // No fallar la operación si el email falla
      }

      const confirmation: OrderConfirmation = {
        order: { ...order, total_cents },
        order_items: orderItems,
        invoice: invoice!,
        confirmation_number: `ORD-${order.id.split('-')[0].toUpperCase()}`
      }

      return confirmation
    } catch (error) {
      console.error('Error creating order:', error)
      return null
    }
  }

  // Crear factura
  private static async createInvoice(
    orderId: string, 
    clientId: string | null, 
    totalCents: number
  ): Promise<Invoice | null> {
    try {
      // Obtener contador de facturas
      let { data: counter, error: counterError } = await supabase
        .from('invoice_counters')
        .select('*')
        .limit(1)
        .single()

      if (counterError || !counter) {
        // Crear contador si no existe
        const { data: newCounter, error: createCounterError } = await supabase
          .from('invoice_counters')
          .insert({
            prefix: 'FAC-',
            suffix: '',
            next_number: 1
          })
          .select()
          .single()

        if (createCounterError || !newCounter) {
          console.error('Error creating invoice counter:', createCounterError)
          return null
        }
        counter = newCounter
      }

      // Crear factura
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          client_id: clientId,
          order_id: orderId,
          invoice_number: counter.next_number,
          prefix: counter.prefix,
          suffix: counter.suffix,
          total_cents: totalCents,
          currency: 'EUR',
          status: 'pending',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
        })
        .select()
        .single()

      if (invoiceError || !invoice) {
        console.error('Error creating invoice:', invoiceError)
        return null
      }

      // Actualizar contador
      await supabase
        .from('invoice_counters')
        .update({ next_number: counter.next_number + 1 })
        .eq('id', counter.id)

      return invoice
    } catch (error) {
      console.error('Error in createInvoice:', error)
      return null
    }
  }

  // Aplicar cupón
  private static async applyCoupon(
    couponCode: string,
    clientId: string | null,
    orderId: string
  ): Promise<boolean> {
    try {
      const coupon = await this.validateCoupon(couponCode)
      if (!coupon) return false

      // Registrar redención
      const { error: redemptionError } = await supabase
        .from('coupon_redemptions')
        .insert({
          coupon_id: coupon.id,
          client_id: clientId,
          order_id: orderId
        })

      if (redemptionError) {
        console.error('Error recording coupon redemption:', redemptionError)
        return false
      }

      // Incrementar contador de uso
      await supabase
        .from('coupons')
        .update({ used_count: coupon.used_count + 1 })
        .eq('id', coupon.id)

      return true
    } catch (error) {
      console.error('Error applying coupon:', error)
      return false
    }
  }

  // Registrar acción en log de orden
  private static async logOrderAction(
    orderId: string,
    action: string,
    details: any,
    performedBy: string | null
  ): Promise<void> {
    try {
      await supabase
        .from('order_logs')
        .insert({
          order_id: orderId,
          action,
          details,
          performed_by: performedBy
        })
    } catch (error) {
      console.error('Error logging order action:', error)
    }
  }

  // Obtener orden por ID
  static async getOrder(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            variant:product_variants (
              id,
              title,
              sku,
              variant_images (
                id,
                url,
                alt,
                position
              ),
              product:products (
                id,
                title,
                slug,
                images:product_images (
                  url,
                  alt,
                  position
                )
              )
            )
          )
        `)
        .eq('id', orderId)
        .single()

      if (error || !data) {
        console.error('Error fetching order:', error)
        return null
      }

      // Transformar items con imágenes correctas
      const transformedData = {
        ...data,
        order_items: this.transformOrderItemsWithImages(data.order_items || [])
      }

      return transformedData
    } catch (error) {
      console.error('Error in getOrder:', error)
      return null
    }
  }

  // Obtener órdenes de un cliente
  static async getClientOrders(clientId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            variant:product_variants (
              id,
              title,
              sku,
              variant_images (
                id,
                url,
                alt,
                position
              ),
              product:products (
                id,
                title,
                slug,
                images:product_images (
                  url,
                  alt,
                  position
                )
              )
            )
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching client orders:', error)
        return []
      }

      // Transformar items con imágenes correctas para cada orden
      const transformedData = (data || []).map(order => ({
        ...order,
        order_items: this.transformOrderItemsWithImages(order.order_items || [])
      }))

      return transformedData
    } catch (error) {
      console.error('Error in getClientOrders:', error)
      return []
    }
  }

  // Actualizar estado de orden
  static async updateOrderStatus(
    orderId: string,
    status: string,
    performedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) {
        console.error('Error updating order status:', error)
        return false
      }

      // Registrar cambio en log
      await this.logOrderAction(orderId, 'status_changed', {
        new_status: status,
        timestamp: new Date().toISOString()
      }, performedBy)

      return true
    } catch (error) {
      console.error('Error in updateOrderStatus:', error)
      return false
    }
  }

  // Stock management methods
  static async checkVariantStock(variantId: string, requestedQty: number) {
    try {
      const { data: variant, error } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('id', variantId)
        .single()

      if (error) {
        console.error('Error checking variant stock:', error)
        return {
          available: false,
          current_stock: 0,
          error: error.message
        }
      }

      const available = variant.stock >= requestedQty
      
      return {
        available,
        current_stock: variant.stock,
        requested: requestedQty,
        remaining: Math.max(0, variant.stock - requestedQty)
      }
    } catch (error) {
      console.error('Error in checkVariantStock:', error)
      return {
        available: false,
        current_stock: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async updateVariantStock(variantId: string, quantityChange: number) {
    try {
      // Get current stock first
      const { data: currentVariant, error: fetchError } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('id', variantId)
        .single()

      if (fetchError) {
        return {
          success: false,
          error: `Failed to fetch current stock: ${fetchError.message}`,
          variant_id: variantId
        }
      }

      const oldStock = currentVariant.stock
      const newStock = Math.max(0, oldStock + quantityChange) // Prevent negative stock

      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ stock: newStock })
        .eq('id', variantId)

      if (updateError) {
        return {
          success: false,
          error: `Failed to update stock: ${updateError.message}`,
          variant_id: variantId
        }
      }

      console.log(`Stock updated for variant ${variantId}: ${oldStock} -> ${newStock} (${quantityChange >= 0 ? '+' : ''}${quantityChange})`)

      return {
        success: true,
        old_stock: oldStock,
        new_stock: newStock,
        change: quantityChange,
        variant_id: variantId
      }
    } catch (error) {
      console.error('Error updating variant stock:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        variant_id: variantId
      }
    }
  }

  static async validateOrderStock(orderItems: Array<{variant_id: string, qty: number}>) {
    interface StockIssue {
      variant_id: string
      requested: number
      available: number
      issue: string
    }

    const issues: StockIssue[] = []
    
    for (const item of orderItems) {
      const stockCheck = await this.checkVariantStock(item.variant_id, item.qty)
      
      if (!stockCheck.available) {
        issues.push({
          variant_id: item.variant_id,
          requested: item.qty,
          available: stockCheck.current_stock,
          issue: `Insufficient stock. Requested: ${item.qty}, Available: ${stockCheck.current_stock}`
        })
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    }
  }

  // Helper para transformar order items con imágenes correctas
  static transformOrderItemsWithImages(orderItems: any[]): any[] {
    return orderItems.map((item: any) => {
      if (item.variant && item.variant.variant_images && item.variant.product) {
        const variantImage = item.variant.variant_images
          .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))[0]
        const productImage = item.variant.product.images
          ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))[0]
        
        return {
          ...item,
          variant: {
            ...item.variant,
            product: {
              ...item.variant.product,
              // Priorizar imagen de variación, si no existe usar imagen del producto
              image: variantImage || productImage
            }
          }
        }
      }
      return item
    })
  }
}