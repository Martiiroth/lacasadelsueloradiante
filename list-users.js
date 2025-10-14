// Script para listar usuarios registrados en Supabase
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function listUsers() {
  console.log('👥 Listando usuarios registrados en Supabase...\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { data: authUsers, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error obteniendo usuarios:', error)
      return
    }

    if (!authUsers?.users || authUsers.users.length === 0) {
      console.log('📭 No hay usuarios registrados en Supabase Auth')
      console.log('\n🔧 Para probar el sistema, necesitas:')
      console.log('1. Registrarte en /auth/signup con javipablo0408@gmail.com')
      console.log('2. O usar un email que ya esté registrado')
      return
    }

    console.log(`📊 Total de usuarios: ${authUsers.users.length}\n`)

    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. 📧 ${user.email}`)
      console.log(`   👤 ID: ${user.id}`)
      console.log(`   📅 Creado: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`   ✅ Verificado: ${user.email_confirmed_at ? 'Sí' : 'No'}`)
      console.log('')
    })

    console.log('💡 Para probar el sistema de recuperación de contraseñas:')
    console.log('1. Usa uno de estos emails registrados')
    console.log('2. O regístrate primero con javipablo0408@gmail.com')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

listUsers()