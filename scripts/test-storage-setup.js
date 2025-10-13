#!/usr/bin/env node

// ===================================
// TEST SUPABASE STORAGE - BRAND LOGOS
// Verificar y configurar bucket desde el cliente
// ===================================

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno SUPABASE no encontradas');
  console.log('Asegúrate de tener:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageSetup() {
  console.log('🔍 Verificando configuración de Storage...\n');

  try {
    // 1. Listar buckets
    console.log('1️⃣ Verificando buckets existentes...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError.message);
      return;
    }

    console.log('📦 Buckets encontrados:', buckets.map(b => `${b.name} (público: ${b.public})`));
    
    const brandLogoBucket = buckets.find(b => b.name === 'brand-logos');
    
    if (!brandLogoBucket) {
      console.log('\n2️⃣ Bucket "brand-logos" no encontrado. Intentando crear...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('brand-logos', {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      });

      if (createError) {
        console.error('❌ Error creando bucket:', createError.message);
        return;
      }

      console.log('✅ Bucket creado exitosamente:', newBucket);
    } else {
      console.log('✅ Bucket "brand-logos" existe');
      console.log(`   - Público: ${brandLogoBucket.public}`);
      console.log(`   - ID: ${brandLogoBucket.id}`);
    }

    // 3. Probar subida de archivo de prueba
    console.log('\n3️⃣ Probando subida de archivo...');
    
    // Crear un archivo de prueba simple
    const testContent = 'TEST IMAGE CONTENT';
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.error('❌ Error subiendo archivo:', uploadError.message);
      
      // Intentar obtener más detalles del error
      if (uploadError.message.includes('policy')) {
        console.log('\n🔧 El error parece estar relacionado con políticas RLS.');
        console.log('Soluciones posibles:');
        console.log('1. Ejecuta el script SQL: supabase_storage_fix.sql');
        console.log('2. Ve a tu dashboard de Supabase > Storage > Settings');
        console.log('3. Asegúrate de que el bucket sea público');
      }
      
      return;
    }

    console.log('✅ Archivo subido exitosamente:', uploadData);

    // 4. Probar URL pública
    console.log('\n4️⃣ Generando URL pública...');
    
    const { data: publicUrl } = supabase.storage
      .from('brand-logos')
      .getPublicUrl(testFileName);

    console.log('🔗 URL pública generada:', publicUrl.publicUrl);

    // 5. Limpiar archivo de prueba
    console.log('\n5️⃣ Limpiando archivo de prueba...');
    
    const { error: deleteError } = await supabase.storage
      .from('brand-logos')
      .remove([testFileName]);

    if (deleteError) {
      console.warn('⚠️ No se pudo eliminar el archivo de prueba:', deleteError.message);
    } else {
      console.log('✅ Archivo de prueba eliminado');
    }

    console.log('\n🎉 ¡CONFIGURACIÓN DE STORAGE COMPLETADA!');
    console.log('El bucket "brand-logos" está listo para usar.');
    console.log('\nPróximos pasos:');
    console.log('1. Prueba subir una imagen desde el admin panel');
    console.log('2. Verifica que las URLs públicas funcionen');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar test
testStorageSetup();