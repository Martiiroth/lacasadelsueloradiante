const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  try {
    console.log('Verificando buckets de storage...');
    
    // Verificar si el bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error al listar buckets:', listError);
      return;
    }
    
    console.log('Buckets existentes:', buckets.map(b => b.name));
    
    const productImagesBucket = buckets.find(bucket => bucket.name === 'product-images');
    
    if (!productImagesBucket) {
      console.log('Creando bucket "product-images"...');
      
      const { data, error } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (error) {
        console.error('Error al crear bucket:', error);
      } else {
        console.log('Bucket "product-images" creado exitosamente');
      }
    } else {
      console.log('Bucket "product-images" ya existe');
    }
    
    // Verificar políticas RLS
    console.log('Las políticas RLS deben configurarse manualmente en el dashboard de Supabase');
    console.log('Necesitas crear políticas para:');
    console.log('1. SELECT - Permitir lectura pública');
    console.log('2. INSERT - Permitir subida autenticada');
    console.log('3. UPDATE - Permitir actualización autenticada');
    console.log('4. DELETE - Permitir eliminación autenticada');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

setupStorage();