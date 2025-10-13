#!/usr/bin/env node

// Test final después de configurar las políticas RLS
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 TEST FINAL - VERIFICAR STORAGE DESPUÉS DE CONFIGURAR RLS\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageAfterRLS() {
  console.log('1️⃣ Verificando acceso al bucket...');
  
  try {
    // Probar listar archivos en el bucket
    const { data: files, error: listError } = await supabase.storage
      .from('brand-logos')
      .list();

    if (listError) {
      console.error('❌ Error listando archivos:', listError.message);
    } else {
      console.log(`✅ Acceso al bucket exitoso. Archivos encontrados: ${files.length}`);
    }

  } catch (err) {
    console.error('❌ Error de acceso:', err.message);
  }

  console.log('\n2️⃣ Probando subida de imagen...');
  
  try {
    // Crear imagen PNG de prueba (1x1 pixel)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const fileName = `test-rls-${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(fileName, pngBuffer, {
        contentType: 'image/png',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('❌ Error subiendo imagen:', uploadError.message);
      
      if (uploadError.message.includes('row-level security')) {
        console.log('\n🔒 RLS aún no configurado correctamente. Necesitas:');
        console.log('1. Ir a Supabase Dashboard → Storage → Policies');
        console.log('2. Crear política SELECT para public con: bucket_id = \'brand-logos\'');
        console.log('3. Crear política INSERT para authenticated con: bucket_id = \'brand-logos\'');
      }
      
      return;
    }

    console.log('✅ ¡Subida exitosa!');
    console.log('📁 Archivo:', uploadData.path);

    console.log('\n3️⃣ Generando URL pública...');
    
    const { data: urlData } = supabase.storage
      .from('brand-logos')
      .getPublicUrl(uploadData.path);

    console.log('🔗 URL pública:', urlData.publicUrl);

    console.log('\n4️⃣ Verificando acceso público a la URL...');
    
    try {
      const response = await fetch(urlData.publicUrl);
      if (response.ok) {
        console.log('✅ URL pública accesible');
      } else {
        console.error('❌ URL pública no accesible:', response.status);
      }
    } catch (fetchError) {
      console.error('❌ Error probando URL:', fetchError.message);
    }

    console.log('\n5️⃣ Limpiando archivo de prueba...');
    
    const { error: deleteError } = await supabase.storage
      .from('brand-logos')
      .remove([fileName]);

    if (deleteError) {
      console.warn('⚠️ No se pudo limpiar:', deleteError.message);
    } else {
      console.log('✅ Archivo de prueba eliminado');
    }

    console.log('\n🎉 ¡STORAGE COMPLETAMENTE FUNCIONAL!');
    console.log('Ahora puedes:');
    console.log('- Subir imágenes desde http://localhost:3000/admin/brands');
    console.log('- Las imágenes persistirán permanentemente');
    console.log('- Los logos se mostrarán en la página principal');

  } catch (err) {
    console.error('❌ Error general:', err.message);
  }
}

testStorageAfterRLS();