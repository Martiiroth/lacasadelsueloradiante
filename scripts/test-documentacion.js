// Test completo siguiendo la documentación oficial de Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testCompleto() {
  console.log('🧪 Test completo de Supabase Storage siguiendo documentación oficial\n');

  // 1. Verificar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('📋 Configuración:');
  console.log('   URL:', supabaseUrl || '❌ FALTA');
  console.log('   Anon Key:', supabaseAnonKey ? '✅ Presente' : '❌ FALTA');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('\n❌ Variables de entorno faltantes en .env.local');
    return;
  }

  // 2. Crear cliente como en la documentación
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Cliente Supabase creado\n');

  try {
    // 3. Test básico de conexión
    console.log('🔗 Probando conexión básica...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError && !authError.message.includes('session')) {
      console.error('❌ Error de conexión:', authError.message);
      return;
    }
    
    console.log('✅ Conexión OK');
    console.log('   Usuario autenticado:', user ? `${user.email}` : 'No (anónimo)');

    // 4. Test de storage siguiendo documentación
    console.log('\n📤 Probando subida de archivo...');
    
    // Crear archivo de prueba como en la documentación
    const testContent = 'test file content from documentation example';
    const file = new Blob([testContent], { type: 'text/plain' });
    const fileName = `test-${Date.now()}.txt`;
    
    // Subir como en la documentación
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images') // 👈 nombre del bucket
      .upload(`uploads/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Error al subir:', uploadError.message);
      
      // Diagnóstico específico
      if (uploadError.message.includes('Bucket not found')) {
        console.log('\n💡 SOLUCIÓN: El bucket "product-images" no existe');
        console.log('   1. Ve al dashboard de Supabase');
        console.log('   2. Storage → Create bucket');
        console.log('   3. Nombre: "product-images"');
        console.log('   4. Público: ✅');
      }
      
      if (uploadError.message.includes('row-level security policy')) {
        console.log('\n💡 SOLUCIÓN: Faltan políticas RLS');
        console.log('   Ejecuta las políticas del archivo POLITICAS_SIMPLES.md');
      }
      
      return;
    }

    console.log('✅ Subido correctamente:', uploadData.path);

    // 5. Test de URL pública como en la documentación
    console.log('\n🔗 Obteniendo URL pública...');
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(uploadData.path);

    console.log('✅ URL pública:', urlData.publicUrl);

    // 6. Test de listado como en la documentación  
    console.log('\n📂 Listando archivos...');
    const { data: listData, error: listError } = await supabase.storage
      .from('product-images')
      .list('uploads', { limit: 10 });

    if (listError) {
      console.warn('⚠️ Error listando:', listError.message);
    } else {
      console.log('✅ Archivos encontrados:', listData.length);
      console.log('   Archivos:', listData.map(f => f.name).join(', '));
    }

    // 7. Limpiar archivo de prueba
    console.log('\n🧹 Limpiando archivo de prueba...');
    const { error: deleteError } = await supabase.storage
      .from('product-images')
      .remove([uploadData.path]);

    if (deleteError) {
      console.warn('⚠️ Error eliminando:', deleteError.message);
    } else {
      console.log('✅ Archivo eliminado');
    }

    console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
    console.log('   Tu configuración de Supabase Storage está correcta');
    console.log('   Ya puedes subir imágenes en tu aplicación');

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

testCompleto();