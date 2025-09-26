// Test para usuarios anónimos - ajustar políticas temporalmente
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAnonimo() {
  console.log('🧪 Test para usuarios anónimos\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('⚠️  PROBLEMA IDENTIFICADO:');
  console.log('   Tu aplicación intenta subir archivos como usuario ANÓNIMO');
  console.log('   Pero las políticas RLS requieren autenticación\n');

  console.log('🔧 SOLUCIONES:');
  console.log('   OPCIÓN 1: Permitir subidas anónimas (TEMPORAL para desarrollo)');
  console.log('   OPCIÓN 2: Autenticar usuarios antes de subir (RECOMENDADO)\n');

  console.log('📝 PARA OPCIÓN 1 (desarrollo temporal):');
  console.log('   Ejecuta en SQL Editor:');
  console.log('   CREATE POLICY "Allow anonymous all" ON storage.objects');
  console.log('   FOR ALL USING (bucket_id = \'product-images\');');
  console.log();

  console.log('📝 PARA OPCIÓN 2 (producción recomendada):');
  console.log('   1. Ve a /admin y haz login primero');
  console.log('   2. Luego prueba subir imágenes');
  console.log('   3. O ajusta tu app para requerir login antes de subir\n');

  // Mostrar estado actual del usuario
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('👤 Estado actual del usuario:');
  console.log('   Autenticado:', user ? '✅ Sí' : '❌ No');
  if (user) {
    console.log('   Email:', user.email);
    console.log('   ID:', user.id);
  }
}

testAnonimo();