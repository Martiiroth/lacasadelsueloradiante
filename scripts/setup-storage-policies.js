#!/usr/bin/env node

// Configurar políticas RLS usando service role (requiere SUPABASE_SERVICE_ROLE_KEY)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 CONFIGURANDO RLS POLICIES PARA STORAGE\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL no encontrada');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY no encontrada');
  console.log('Para configurar automáticamente, necesitas:');
  console.log('1. Ve a tu dashboard de Supabase > Settings > API');
  console.log('2. Copia la "service_role" key');
  console.log('3. Añádela a tu .env como SUPABASE_SERVICE_ROLE_KEY=tu_key');
  console.log('\n🛠️ ALTERNATIVA: Ejecuta el archivo database/final_storage_fix.sql manualmente en Supabase SQL Editor');
  process.exit(0);
}

// Cliente con service role para crear políticas
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStoragePolicies() {
  try {
    console.log('1️⃣ Eliminando políticas existentes...');
    
    // Eliminar políticas existentes
    await supabase.rpc('drop_policy_if_exists', {
      table_name: 'objects',
      schema_name: 'storage',
      policy_name: 'Todos pueden ver brand logos'
    }).catch(() => {}); // Ignorar errores si no existe
    
    await supabase.rpc('drop_policy_if_exists', {
      table_name: 'objects',
      schema_name: 'storage', 
      policy_name: 'Usuarios autenticados pueden subir brand logos'
    }).catch(() => {}); // Ignorar errores si no existe
    
    console.log('2️⃣ Creando política de lectura pública...');
    
    // Crear política de lectura pública
    const { error: readError } = await supabase.rpc('create_storage_policy', {
      policy_name: 'Todos pueden ver brand logos',
      table_name: 'objects',
      operation: 'SELECT',
      definition: "bucket_id = 'brand-logos'"
    });
    
    if (readError) {
      console.error('Error creando política de lectura:', readError);
    } else {
      console.log('✅ Política de lectura creada');
    }
    
    console.log('3️⃣ Creando política de subida autenticada...');
    
    // Crear política de subida
    const { error: uploadError } = await supabase.rpc('create_storage_policy', {
      policy_name: 'Usuarios autenticados pueden subir brand logos',
      table_name: 'objects', 
      operation: 'INSERT',
      definition: "bucket_id = 'brand-logos' AND auth.role() = 'authenticated'"
    });
    
    if (uploadError) {
      console.error('Error creando política de subida:', uploadError);
    } else {
      console.log('✅ Política de subida creada');
    }
    
    console.log('\n🎉 ¡Configuración completada!');
    console.log('Ahora puedes probar subir imágenes desde el admin panel.');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.log('\n🛠️ Si hay errores, usa el método manual:');
    console.log('Ejecuta el archivo database/final_storage_fix.sql en Supabase SQL Editor');
  }
}

setupStoragePolicies();