// Script para crear bucket de product-images automáticamente
// Nota: Este script requiere permisos de administrador o service key

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function crearBucket() {
  console.log('🚀 Intentando crear bucket "product-images"...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno no encontradas');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Verificar si el bucket ya existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listando buckets:', listError.message);
      return;
    }

    const existingBucket = buckets.find(b => b.name === 'product-images');
    if (existingBucket) {
      console.log('✅ El bucket "product-images" ya existe');
      return;
    }

    // Intentar crear el bucket
    console.log('📦 Creando bucket "product-images"...');
    
    const { data, error } = await supabase.storage.createBucket('product-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      console.error('❌ Error creando bucket:', error.message);
      console.error('   Código de error:', error.status);
      
      if (error.message.includes('row-level security policy')) {
        console.log('\n💡 SOLUCIÓN MANUAL REQUERIDA:');
        console.log('   El bucket debe crearse manualmente desde el dashboard de Supabase');
        console.log('   Ve a: https://supabase.lacasadelsueloradianteapp.com');
        console.log('   1. Storage → New bucket');
        console.log('   2. Nombre: "product-images"');
        console.log('   3. Público: ✅ Activado');
        console.log('   4. Tipos MIME: image/jpeg,image/jpg,image/png,image/webp');
        console.log('   5. Tamaño máximo: 5MB');
      }
      
      return;
    }

    console.log('✅ Bucket creado exitosamente');
    console.log('📋 Datos del bucket:', data);

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

crearBucket();