#!/usr/bin/env node

// Método alternativo: verificar si podemos crear el bucket desde la aplicación
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔄 MÉTODO ALTERNATIVO: Recrear bucket con políticas\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function tryAlternativeSetup() {
  console.log('1️⃣ Intentando eliminar bucket existente...');
  
  // Intentar eliminar bucket existente
  const { error: deleteError } = await supabase.storage.deleteBucket('brand-logos');
  
  if (deleteError) {
    console.log('⚠️ No se pudo eliminar (probablemente no tienes permisos):', deleteError.message);
  } else {
    console.log('✅ Bucket eliminado');
  }
  
  console.log('\n2️⃣ Intentando crear nuevo bucket con configuración completa...');
  
  // Crear bucket con todas las configuraciones
  const { data, error } = await supabase.storage.createBucket('brand-logos', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    fileSizeLimit: 2 * 1024 * 1024 // 2MB
  });
  
  if (error) {
    console.error('❌ Error creando bucket:', error.message);
    console.log('\n💡 RECOMENDACIÓN:');
    console.log('Usa la interfaz web de Supabase para configurar Storage.');
    console.log('Lee las instrucciones en: STORAGE_SETUP_INSTRUCTIONS.md');
    return;
  }
  
  console.log('✅ Bucket creado exitosamente:', data);
  
  console.log('\n3️⃣ Probando subida de prueba...');
  
  // Probar subida
  const testImage = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('brand-logos')
    .upload('test.png', testImage, {
      contentType: 'image/png'
    });
  
  if (uploadError) {
    console.error('❌ Error en subida de prueba:', uploadError.message);
  } else {
    console.log('✅ ¡Subida exitosa!');
    console.log('🎉 Storage configurado y funcionando');
    
    // Limpiar
    await supabase.storage.from('brand-logos').remove(['test.png']);
  }
}

tryAlternativeSetup();