// Script para mostrar usuarios disponibles para login
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function mostrarUsuarios() {
  console.log('👤 Buscando usuarios disponibles para login...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Intentar obtener clientes (que son usuarios)
    const { data: clients, error } = await supabase
      .from('clients')
      .select('email, first_name, last_name, is_active')
      .eq('is_active', true)
      .limit(10);

    if (error) {
      console.error('❌ Error consultando usuarios:', error.message);
      console.log('\n💡 Posibles usuarios por defecto:');
      console.log('   admin@lacasadelsueloradiante.com');
      console.log('   admin@example.com');
      console.log('   test@test.com');
      return;
    }

    if (!clients || clients.length === 0) {
      console.log('❌ No se encontraron usuarios activos');
      console.log('\n💡 Necesitas crear un usuario administrador');
      console.log('   1. Ve a Supabase Dashboard → Authentication → Users');
      console.log('   2. Create new user');
      console.log('   3. Email: admin@lacasadelsueloradiante.com');
      console.log('   4. Password: (la que quieras)');
      console.log('   5. Confirm email: ✅');
      return;
    }

    console.log('✅ Usuarios disponibles:');
    clients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.email}`);
      if (client.first_name || client.last_name) {
        console.log(`      Nombre: ${client.first_name} ${client.last_name}`);
      }
    });

    console.log('\n🔑 Para autenticarte:');
    console.log('   1. Ve a: http://localhost:3001/auth/login');
    console.log('   2. Usa uno de los emails mostrados arriba');
    console.log('   3. Si no recuerdas la contraseña, puedes resetearla en Supabase Dashboard');

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

mostrarUsuarios();