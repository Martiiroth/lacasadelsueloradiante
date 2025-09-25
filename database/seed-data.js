// Script para insertar métodos de envío y pago temporales
// Ejecuta con: node database/seed-data.js

import { supabase } from '../src/lib/supabase.js'

async function seedShippingAndPaymentMethods() {
  console.log('🌱 Insertando datos temporales...')
  
  try {
    // Datos de métodos de envío
    const shippingMethods = [
      {
        name: 'Envío Estándar',
        price_cents: 500,  // 5.00 EUR
        estimated_days: 3
      },
      {
        name: 'Envío Express',
        price_cents: 1200,  // 12.00 EUR
        estimated_days: 1
      },
      {
        name: 'Envío Gratis (+50€)',
        price_cents: 0,  // Gratis
        estimated_days: 5
      },
      {
        name: 'Recogida en Tienda',
        price_cents: 0,  // Gratis
        estimated_days: 0
      }
    ]

    // Datos de métodos de pago
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
        provider: null,
        active: true
      },
      {
        name: 'Contrareembolso',
        provider: null,
        active: true
      },
      {
        name: 'Bizum',
        provider: 'Bizum',
        active: true
      }
    ]

    // Datos de roles de cliente
    const customerRoles = [
      {
        name: 'cliente_particular',
        description: 'Cliente particular sin descuentos especiales'
      },
      {
        name: 'cliente_profesional', 
        description: 'Cliente profesional con descuentos por volumen'
      },
      {
        name: 'distribuidor',
        description: 'Distribuidor autorizado con precios especiales'
      },
      {
        name: 'vip',
        description: 'Cliente VIP con máximos descuentos'
      }
    ]

    // Insertar métodos de envío
    console.log('📦 Insertando métodos de envío...')
    const { data: shippingData, error: shippingError } = await supabase
      .from('shipping_methods')
      .insert(shippingMethods)
      .select()

    if (shippingError) {
      console.error('❌ Error insertando métodos de envío:', shippingError)
    } else {
      console.log(`✅ ${shippingData.length} métodos de envío insertados`)
      shippingData.forEach(method => {
        console.log(`   - ${method.name}: ${(method.price_cents / 100).toFixed(2)}€ (${method.estimated_days} días)`)
      })
    }

    // Insertar métodos de pago
    console.log('\n💳 Insertando métodos de pago...')
    const { data: paymentData, error: paymentError } = await supabase
      .from('payment_methods')
      .insert(paymentMethods)
      .select()

    if (paymentError) {
      console.error('❌ Error insertando métodos de pago:', paymentError)
    } else {
      console.log(`✅ ${paymentData.length} métodos de pago insertados`)
      paymentData.forEach(method => {
        const provider = method.provider ? ` (${method.provider})` : ''
        console.log(`   - ${method.name}${provider}`)
      })
    }

    // Insertar roles de cliente
    console.log('\n👥 Insertando roles de cliente...')
    const { data: rolesData, error: rolesError } = await supabase
      .from('customer_roles')
      .insert(customerRoles)
      .select()

    if (rolesError) {
      console.error('❌ Error insertando roles de cliente:', rolesError)
    } else {
      console.log(`✅ ${rolesData.length} roles de cliente insertados`)
      rolesData.forEach(role => {
        console.log(`   - ${role.name}: ${role.description}`)
      })
    }

    console.log('\n🎉 Datos temporales insertados correctamente!')
    console.log('Ahora puedes probar el checkout en tu aplicación.')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el script
seedShippingAndPaymentMethods()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })