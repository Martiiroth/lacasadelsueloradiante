// Diagnóstico de conectividad de Supabase Storage
// Ejecutar este archivo para verificar la configuración

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function diagnosticarSupabase() {
  console.log('🔍 Iniciando diagnóstico de Supabase Storage...\n');

  // 1. Verificar variables de entorno
  console.log('📋 Variables de entorno:');
  console.log('   SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NO DEFINIDA');
  console.log('   SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ NO DEFINIDA');
  console.log();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Error: Variables de entorno no configuradas correctamente');
    return;
  }

  // 2. Crear cliente de Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('✅ Cliente de Supabase creado');

  // 3. Verificar conectividad básica
  try {
    console.log('🔗 Probando conectividad básica...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('⚠️  Advertencia en auth.getSession():', error.message);
    } else {
      console.log('✅ Conectividad básica OK');
    }
  } catch (error) {
    console.error('❌ Error de conectividad básica:', error.message);
    return;
  }

  // 4. Verificar acceso a Storage
  try {
    console.log('📦 Verificando acceso a Storage...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listando buckets:', error.message);
      console.error('   Código:', error.status || 'N/A');
      console.error('   Detalles:', error);
      return;
    }

    console.log('✅ Acceso a Storage OK');
    console.log('📋 Buckets disponibles:', buckets.map(b => b.name).join(', ') || 'Ninguno');
    
    // Verificar si existe product-images
    const productImagesBucket = buckets.find(b => b.name === 'product-images');
    if (productImagesBucket) {
      console.log('✅ Bucket "product-images" encontrado');
      console.log('   Público:', productImagesBucket.public ? '✅ Sí' : '❌ No');
    } else {
      console.log('❌ Bucket "product-images" NO encontrado');
    }

  } catch (error) {
    console.error('❌ Error accediendo a Storage:', error.message);
    return;
  }

  // 5. Probar subida de archivo de prueba
  const productImagesBucket = buckets.find(b => b.name === 'product-images');
  if (productImagesBucket) {
    try {
      console.log('\n📤 Probando subida de archivo de prueba...');
      
      // Crear un archivo de prueba simple
      const testData = 'test-file-content';
      const fileName = `test-${Date.now()}.txt`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`test/${fileName}`, testData, {
          contentType: 'text/plain',
          upsert: false
        });

      if (error) {
        console.error('❌ Error subiendo archivo de prueba:', error.message);
        console.error('   Código:', error.status || 'N/A');
        console.error('   Detalles:', error);
      } else {
        console.log('✅ Archivo de prueba subido exitosamente');
        console.log('   Path:', data.path);
        
        // Limpiar - eliminar archivo de prueba
        const { error: deleteError } = await supabase.storage
          .from('product-images')
          .remove([data.path]);
        
        if (deleteError) {
          console.warn('⚠️ No se pudo limpiar el archivo de prueba:', deleteError.message);
        } else {
          console.log('✅ Archivo de prueba limpiado');
        }
      }

    } catch (error) {
      console.error('❌ Error en prueba de subida:', error.message);
    }
  }

  console.log('\n🎯 Diagnóstico completado');
}

// Ejecutar diagnóstico
diagnosticarSupabase().catch(console.error);