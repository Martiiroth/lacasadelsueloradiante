import { supabase } from './supabase'

export class CheckoutTestDataService {
  
  // Crear métodos de envío de prueba
  static async createShippingMethods() {
    try {
      const shippingMethods = [
        {
          name: 'Envío Estándar',
          price_cents: 599, // 5.99€
          estimated_days: 3
        },
        {
          name: 'Envío Express',
          price_cents: 999, // 9.99€
          estimated_days: 1
        },
        {
          name: 'Recogida en Tienda',
          price_cents: 0, // Gratis
          estimated_days: 1
        }
      ]

      const { data, error } = await supabase
        .from('shipping_methods')
        .upsert(shippingMethods, { 
          onConflict: 'name',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        console.error('Error creating shipping methods:', error)
        return false
      }

      console.log('✅ Métodos de envío creados:', data)
      return true
    } catch (error) {
      console.error('Error in createShippingMethods:', error)
      return false
    }
  }

  // Crear métodos de pago de prueba
  static async createPaymentMethods() {
    try {
      const paymentMethods = [
        {
          name: 'Tarjeta de Crédito/Débito',
          provider: 'Stripe',
          active: true
        },
        {
          name: 'PayPal',
          provider: 'PayPal',
          active: true
        },
        {
          name: 'Transferencia Bancaria',
          provider: 'Bank Transfer',
          active: true
        },
        {
          name: 'Pago Contrareembolso',
          provider: 'Cash on Delivery',
          active: true
        }
      ]

      const { data, error } = await supabase
        .from('payment_methods')
        .upsert(paymentMethods, { 
          onConflict: 'name',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        console.error('Error creating payment methods:', error)
        return false
      }

      console.log('✅ Métodos de pago creados:', data)
      return true
    } catch (error) {
      console.error('Error in createPaymentMethods:', error)
      return false
    }
  }

  // Crear cupones de prueba
  static async createCoupons() {
    try {
      const coupons = [
        {
          code: 'WELCOME10',
          description: '10% de descuento en tu primera compra',
          discount_type: 'percentage',
          discount_value: 10,
          applies_to: 'order',
          usage_limit: 100,
          used_count: 0,
          valid_from: new Date().toISOString(),
          valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
        },
        {
          code: 'SAVE5',
          description: '5€ de descuento en tu pedido',
          discount_type: 'fixed',
          discount_value: 500, // 5€ en centavos
          applies_to: 'order',
          usage_limit: 50,
          used_count: 0,
          valid_from: new Date().toISOString(),
          valid_to: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 días
        },
        {
          code: 'FREESHIP',
          description: 'Envío gratuito en tu pedido',
          discount_type: 'percentage',
          discount_value: 100,
          applies_to: 'order',
          usage_limit: 25,
          used_count: 0,
          valid_from: new Date().toISOString(),
          valid_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
        }
      ]

      const { data, error } = await supabase
        .from('coupons')
        .upsert(coupons, { 
          onConflict: 'code',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        console.error('Error creating coupons:', error)
        return false
      }

      console.log('✅ Cupones creados:', data)
      return true
    } catch (error) {
      console.error('Error in createCoupons:', error)
      return false
    }
  }

  // Inicializar contador de facturas
  static async initializeInvoiceCounter() {
    try {
      // Verificar si ya existe un contador
      const { data: existingCounter } = await supabase
        .from('invoice_counters')
        .select('*')
        .limit(1)
        .single()

      if (existingCounter) {
        console.log('✅ Contador de facturas ya existe:', existingCounter)
        return true
      }

      // Crear nuevo contador
      const { data, error } = await supabase
        .from('invoice_counters')
        .insert({
          prefix: 'FAC-',
          suffix: '',
          next_number: 1
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating invoice counter:', error)
        return false
      }

      console.log('✅ Contador de facturas inicializado:', data)
      return true
    } catch (error) {
      console.error('Error in initializeInvoiceCounter:', error)
      return false
    }
  }

  // Configurar todo el sistema de checkout
  static async setupCheckoutSystem() {
    console.log('🚀 Configurando sistema de checkout...')
    
    try {
      const results = await Promise.all([
        this.createShippingMethods(),
        this.createPaymentMethods(),
        this.createCoupons(),
        this.initializeInvoiceCounter()
      ])

      const allSuccessful = results.every(result => result === true)
      
      if (allSuccessful) {
        console.log('✅ Sistema de checkout configurado exitosamente')
        return true
      } else {
        console.error('❌ Algunos componentes del checkout fallaron')
        return false
      }
    } catch (error) {
      console.error('Error setting up checkout system:', error)
      return false
    }
  }

  // Limpiar datos de prueba
  static async clearTestData() {
    try {
      console.log('🧹 Limpiando datos de prueba...')

      const tables = [
        'coupon_redemptions',
        'coupons', 
        'invoices',
        'order_logs',
        'order_items',
        'orders',
        'payment_methods',
        'shipping_methods',
        'invoice_counters'
      ]

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Eliminar todo

        if (error) {
          console.error(`Error clearing ${table}:`, error)
        } else {
          console.log(`✅ Tabla ${table} limpiada`)
        }
      }

      console.log('✅ Datos de prueba eliminados')
      return true
    } catch (error) {
      console.error('Error clearing test data:', error)
      return false
    }
  }
}