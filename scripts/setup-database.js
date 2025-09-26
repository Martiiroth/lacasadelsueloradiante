const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://supabase.lacasadelsueloradianteapp.com'
const supabaseKey = 'eyJ0eXAiOiAiSldUIiwiYWxnIjogIkhTMjU2In0.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzU4NzAwNTMzLAogICJleHAiOiAxOTE2MzgwNTMzCn0.uhOFMEExih6oXgd9tDGK87L-xQMK6J-6w5oPDs2tnbc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('🚀 Configurando base de datos...')
  
  try {
    // 1. Verificar y crear roles de cliente
    console.log('📋 Verificando roles de cliente...')
    
    const roles = [
      { id: 1, name: 'guest', description: 'Cliente básico/visitante' },
      { id: 2, name: 'sat', description: 'Servicio de Atención Técnica' },
      { id: 3, name: 'instalador', description: 'Instalador certificado' },
      { id: 4, name: 'admin', description: 'Administrador del sistema' }
    ]

    for (const role of roles) {
      const { data: existingRole, error: checkError } = await supabase
        .from('customer_roles')
        .select('id')
        .eq('name', role.name)
        .single()

      if (checkError && checkError.code === 'PGRST116') {
        // Role doesn't exist, create it
        const { error: insertError } = await supabase
          .from('customer_roles')
          .insert(role)

        if (insertError) {
          console.error(`❌ Error creando rol ${role.name}:`, insertError)
        } else {
          console.log(`✅ Rol creado: ${role.name}`)
        }
      } else if (existingRole) {
        console.log(`✅ Rol ya existe: ${role.name}`)
      } else {
        console.error(`❌ Error verificando rol ${role.name}:`, checkError)
      }
    }

    // 2. Verificar productos existentes
    console.log('\n📦 Verificando productos...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title')
      .limit(5)

    if (productsError) {
      console.error('❌ Error verificando productos:', productsError)
    } else {
      console.log(`📊 Productos existentes: ${products?.length || 0}`)
      if (products && products.length > 0) {
        products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.title} (${product.id})`)
        })
      }
    }

    // 3. Verificar clientes existentes
    console.log('\n👥 Verificando clientes...')
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email')
      .limit(5)

    if (clientsError) {
      console.error('❌ Error verificando clientes:', clientsError)
    } else {
      console.log(`📊 Clientes existentes: ${clients?.length || 0}`)
      if (clients && clients.length > 0) {
        clients.forEach((client, index) => {
          console.log(`   ${index + 1}. ${client.first_name} ${client.last_name} (${client.email})`)
        })
      }
    }

    console.log('\n✅ Configuración de base de datos completada')

  } catch (error) {
    console.error('💥 Error en configuración:', error)
  }
}

setupDatabase()