import { supabase } from './supabase'
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
            product:products (
              id,
              title,
              slug,
              images:product_images (
                url,
                alt
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

      // Calcular total de la orden
      const total_cents = orderItems.reduce((total, item) => {
        return total + (item.price_cents * item.qty)
      }, 0)

      // Actualizar total de la orden
      const { error: updateError } = await supabase
        .from('orders')
        .update({ total_cents })
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
              product:products (
                id,
                title,
                slug,
                images:product_images (
                  url,
                  alt
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

      return data
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
              product:products (
                id,
                title,
                slug
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

      return data || []
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
}