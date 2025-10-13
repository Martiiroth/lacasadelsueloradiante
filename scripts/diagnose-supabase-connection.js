#!/usr/bin/env node

// Diagnóstico completo de la conexión con Supabase Storage
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

console.log('🔍 DIAGNÓSTICO DE SUPABASE STORAGE\n');

// 1. Verificar variables de entorno
console.log('1️⃣ Verificando variables de entorno...');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ No encontrada');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configurada' : '❌ No encontrada');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Variables de entorno faltantes. Verifica tu archivo .env');
  process.exit(1);
}

// 2. Crear cliente
console.log('\n2️⃣ Creando cliente de Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Cliente creado');

// 3. Probar conexión básica
console.log('\n3️⃣ Probando conexión básica...');
try {
  const { data, error } = await supabase.from('brands').select('count', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Error de conexión:', error.message);
  } else {
    console.log('✅ Conexión a base de datos exitosa');
  }
} catch (err) {
  console.error('❌ Error general:', err.message);
}

// 4. Listar buckets
console.log('\n4️⃣ Listando buckets de Storage...');
try {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('❌ Error listando buckets:', error.message);
    console.error('Detalles del error:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Buckets encontrados:', buckets.length);
    buckets.forEach((bucket, index) => {
      console.log(`   ${index + 1}. ${bucket.name} (público: ${bucket.public}, creado: ${bucket.created_at})`);
    });
    
    if (buckets.length === 0) {
      console.log('⚠️ No se encontraron buckets. Esto podría indicar un problema de permisos.');
    }
  }
} catch (err) {
  console.error('❌ Error general listando buckets:', err.message);
}

// 5. Verificar bucket específico
console.log('\n5️⃣ Verificando bucket "brand-logos" específicamente...');
try {
  const { data: files, error } = await supabase.storage.from('brand-logos').list();
  
  if (error) {
    console.error('❌ Error accediendo al bucket "brand-logos":', error.message);
    console.error('Código de error:', error.statusCode);
    console.error('Detalles:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Bucket "brand-logos" accesible');
    console.log(`   Archivos en el bucket: ${files.length}`);
  }
} catch (err) {
  console.error('❌ Error general:', err.message);
}

console.log('\n🎯 RESUMEN DEL DIAGNÓSTICO:');
console.log('- Si ves "No buckets found" o errores de permisos:');
console.log('  → Verifica que las credenciales de Supabase sean correctas');
console.log('  → Asegúrate de que el proyecto de Supabase esté activo');
console.log('  → Verifica que Storage esté habilitado en tu proyecto');
console.log('- Si el bucket no existe:');
console.log('  → Ve al dashboard de Supabase > Storage');
console.log('  → Crea el bucket "brand-logos" manualmente');
console.log('  → Asegúrate de marcarlo como público');