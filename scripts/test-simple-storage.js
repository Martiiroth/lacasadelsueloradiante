// Diagnóstico simple de Supabase Storage
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testStorage() {
  console.log('🧪 Probando Supabase Storage...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno no configuradas');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Crear un archivo de prueba
    const testContent = new Blob(['test content'], { type: 'text/plain' });
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    const fileName = `test-${Date.now()}.txt`;
    
    console.log('📤 Intentando subir archivo de prueba...');

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(`test/${fileName}`, testFile, {
        contentType: 'text/plain',
        upsert: false
      });

    if (error) {
      console.error('❌ Error:', error.message);
      console.error('   Código:', error.status || 'N/A');
      
      if (error.message.includes('Bucket not found')) {
        console.log('\n💡 SOLUCIÓN:');
        console.log('   El bucket "product-images" no existe o no es accesible');
        console.log('   1. Verifica que el bucket exista en el dashboard');
        console.log('   2. Verifica que sea público');
        console.log('   3. Configura las políticas RLS');
      } else if (error.message.includes('row-level security policy')) {
        console.log('\n💡 SOLUCIÓN:');
        console.log('   Falta configurar las políticas RLS');
        console.log('   Ve a SQL Editor y ejecuta las políticas del archivo SUPABASE_STORAGE_SETUP.md');
      }
      
      return;
    }

    console.log('✅ Archivo subido exitosamente!');
    console.log('   Path:', data.path);

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    console.log('✅ URL pública generada:', urlData.publicUrl);

    // Limpiar - eliminar archivo de prueba
    const { error: deleteError } = await supabase.storage
      .from('product-images')
      .remove([data.path]);

    if (deleteError) {
      console.warn('⚠️ No se pudo eliminar el archivo de prueba:', deleteError.message);
    } else {
      console.log('✅ Archivo de prueba eliminado');
    }

    console.log('\n🎉 ¡Storage configurado correctamente!');
    console.log('   Tu aplicación ya puede subir imágenes');

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

testStorage();