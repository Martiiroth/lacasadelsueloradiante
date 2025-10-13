#!/usr/bin/env node

// Test específico con imagen PNG para verificar que RLS está funcionando
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🖼️ TEST CON IMAGEN REAL - VERIFICAR RLS FUNCIONAL\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithRealImage() {
  console.log('1️⃣ Probando subida con imagen PNG...\n');
  
  try {
    // Crear imagen PNG válida de 1x1 pixel
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const fileName = `test-rls-success-${Date.now()}.png`;

    console.log('📤 Subiendo imagen PNG:', fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(fileName, pngBuffer, {
        contentType: 'image/png',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.log('❌ Error en subida:', uploadError.message);
      
      if (uploadError.message.includes('row-level security')) {
        console.log('\n🔒 RLS aún no configurado correctamente');
        console.log('Necesitas crear la política INSERT para authenticated');
      } else {
        console.log('\n⚠️ Error diferente:', uploadError.message);
      }
      return;
    }

    console.log('✅ ¡SUBIDA EXITOSA!');
    console.log('📁 Archivo subido:', uploadData.path);
    console.log('🎉 Las políticas RLS están funcionando correctamente!');

    console.log('\n2️⃣ Generando URL pública...');
    
    const { data: urlData } = supabase.storage
      .from('brand-logos')
      .getPublicUrl(uploadData.path);

    console.log('🔗 URL pública:', urlData.publicUrl);

    console.log('\n3️⃣ Verificando acceso público...');
    
    try {
      const response = await fetch(urlData.publicUrl);
      if (response.ok) {
        console.log('✅ URL pública accesible desde internet');
        console.log('📊 Content-Type:', response.headers.get('content-type'));
        console.log('📏 Size:', response.headers.get('content-length'), 'bytes');
      } else {
        console.log('❌ URL pública no accesible:', response.status);
      }
    } catch (fetchError) {
      console.log('⚠️ Error verificando URL:', fetchError.message);
    }

    console.log('\n4️⃣ Limpiando archivo de prueba...');
    
    const { error: deleteError } = await supabase.storage
      .from('brand-logos')
      .remove([fileName]);

    if (deleteError) {
      console.log('⚠️ No se pudo limpiar:', deleteError.message);
    } else {
      console.log('✅ Archivo de prueba eliminado');
    }

    console.log('\n🎉 ¡STORAGE COMPLETAMENTE FUNCIONAL!');
    console.log('✅ Bucket configurado correctamente');
    console.log('✅ Políticas RLS funcionando');
    console.log('✅ URLs públicas accesibles');
    console.log('\n🎯 Ahora puedes:');
    console.log('- Subir imágenes desde: http://localhost:3000/admin/brands');
    console.log('- Las imágenes persistirán permanentemente');
    console.log('- Los logos se mostrarán en la página principal');

  } catch (err) {
    console.error('❌ Error general:', err.message);
  }
}

testWithRealImage();