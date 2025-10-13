#!/usr/bin/env node

// Test directo de subida a Supabase Storage
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Cargar variables de entorno
dotenv.config();

console.log('🧪 TEST DIRECTO DE SUPABASE STORAGE\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectUpload() {
  try {
    console.log('1️⃣ Intentando subir archivo de prueba...');
    
    // Crear un pequeño archivo de imagen de prueba (1x1 pixel PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const fileName = `test-${Date.now()}.png`;
    
    // Intentar subida directa al bucket
    const { data, error } = await supabase.storage
      .from('brand-logos')
      .upload(fileName, pngBuffer, {
        contentType: 'image/png',
        cacheControl: '3600'
      });

    if (error) {
      console.error('❌ Error en la subida:', error);
      console.error('Detalles:', JSON.stringify(error, null, 2));
      
      if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        console.log('\n💡 SOLUCIÓN:');
        console.log('1. Ve a tu dashboard de Supabase');
        console.log('2. Navega a Storage > Buckets');
        console.log('3. Crea un bucket llamado "brand-logos"');
        console.log('4. Marca la opción "Public bucket"');
        console.log('5. Guarda los cambios');
      }
      
      return;
    }

    console.log('✅ Archivo subido exitosamente!');
    console.log('📁 Path:', data.path);
    
    // Generar URL pública
    console.log('\n2️⃣ Generando URL pública...');
    const { data: urlData } = supabase.storage
      .from('brand-logos')
      .getPublicUrl(data.path);
    
    console.log('🔗 URL pública:', urlData.publicUrl);
    
    // Limpiar archivo de prueba
    console.log('\n3️⃣ Limpiando archivo de prueba...');
    const { error: deleteError } = await supabase.storage
      .from('brand-logos')
      .remove([fileName]);
    
    if (deleteError) {
      console.warn('⚠️ No se pudo limpiar:', deleteError.message);
    } else {
      console.log('✅ Archivo de prueba eliminado');
    }
    
    console.log('\n🎉 ¡Storage funcionando correctamente!');
    console.log('Ahora puedes subir imágenes desde el admin panel.');
    
  } catch (err) {
    console.error('❌ Error general:', err.message);
  }
}

testDirectUpload();