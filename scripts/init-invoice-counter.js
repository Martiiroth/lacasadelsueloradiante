// Script para inicializar el contador de facturas
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initInvoiceCounter() {
  try {
    console.log('🔍 Verificando tabla invoice_counters...')

    // Verificar si ya existe un contador
    const { data: existingCounter, error: checkError } = await supabase
      .from('invoice_counters')
      .select('*')
      .limit(1)
      .single()

    if (existingCounter) {
      console.log('✅ Ya existe un contador de facturas:')
      console.log(`   Prefijo: ${existingCounter.prefix}`)
      console.log(`   Próximo número: ${existingCounter.next_number}`)
      console.log(`   Sufijo: ${existingCounter.suffix}`)
      return
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error verificando contador:', checkError)
      return
    }

    // Crear contador inicial
    console.log('📄 Creando contador inicial de facturas...')
    const { data: newCounter, error: createError } = await supabase
      .from('invoice_counters')
      .insert({
        prefix: 'FAC-',
        suffix: '',
        next_number: 1
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creando contador:', createError)
      return
    }

    console.log('✅ Contador de facturas creado exitosamente:')
    console.log(`   ID: ${newCounter.id}`)
    console.log(`   Prefijo: ${newCounter.prefix}`)
    console.log(`   Próximo número: ${newCounter.next_number}`)
    console.log(`   Sufijo: ${newCounter.suffix}`)

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar
initInvoiceCounter()