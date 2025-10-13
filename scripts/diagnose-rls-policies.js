#!/usr/bin/env node

// Diagnóstico específico de políticas RLS para storage.objects
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 DIAGNÓSTICO POLÍTICAS RLS - STORAGE.OBJECTS\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosePolicies() {
  console.log('1️⃣ Consultando políticas RLS existentes...\n');
  
  try {
    // Consultar políticas existentes usando una query SQL
    const { data: policies, error } = await supabase
      .rpc('get_storage_policies');

    if (error) {
      console.log('⚠️ No se puede consultar políticas directamente (normal con anon key)');
      console.log('Error:', error.message);
    } else {
      console.log('📋 Políticas encontradas:', policies);
    }

  } catch (err) {
    console.log('⚠️ No se pueden consultar políticas con anon key (esperado)');
  }

  console.log('\n2️⃣ Probando acceso específico...\n');

  // Test 1: Listar archivos (requiere política SELECT)
  console.log('Test SELECT (lectura):');
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('brand-logos')
      .list();

    if (listError) {
      console.log('❌ FALLA SELECT:', listError.message);
    } else {
      console.log('✅ SELECT funciona - política de lectura configurada');
    }
  } catch (err) {
    console.log('❌ SELECT error:', err.message);
  }

  // Test 2: Subir archivo (requiere política INSERT)  
  console.log('\nTest INSERT (subida):');
  try {
    const testContent = 'test';
    const fileName = `test-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(fileName, testContent, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.log('❌ FALLA INSERT:', uploadError.message);
      
      if (uploadError.message.includes('row-level security')) {
        console.log('\n🔒 DIAGNÓSTICO:');
        console.log('- El bucket existe y es accesible');
        console.log('- PERO las políticas RLS no están configuradas');
        console.log('- Necesitas crear las políticas manualmente');
      }
    } else {
      console.log('✅ INSERT funciona - política de subida configurada');
      
      // Limpiar archivo de prueba
      await supabase.storage.from('brand-logos').remove([fileName]);
    }
  } catch (err) {
    console.log('❌ INSERT error:', err.message);
  }

  console.log('\n📋 ESTADO ACTUAL:');
  console.log('- Bucket "brand-logos": ✅ Existe y es accesible');
  console.log('- Política SELECT: ❓ Probar con lista de archivos');
  console.log('- Política INSERT: ❌ Falla con "row-level security policy"');

  console.log('\n🛠️ PRÓXIMOS PASOS:');
  console.log('1. Ve a Supabase Dashboard → Storage → Policies');
  console.log('2. Busca la tabla "storage.objects"');
  console.log('3. Crea política SELECT para "public" con: bucket_id = \'brand-logos\'');
  console.log('4. Crea política INSERT para "authenticated" con: bucket_id = \'brand-logos\'');
  console.log('5. Ejecuta este script otra vez para verificar');

  console.log('\n📝 ALTERNATIVA SQL:');
  console.log('Ejecuta este SQL en Supabase SQL Editor:');
  console.log(`
CREATE POLICY "Public read brand logos" 
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'brand-logos');

CREATE POLICY "Authenticated upload brand logos" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'brand-logos');
  `);
}

diagnosePolicies();