#!/usr/bin/env node

// Verificar estado de autenticación y políticas RLS
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔐 DIAGNÓSTICO DE AUTENTICACIÓN Y RLS\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseAuth() {
  console.log('1️⃣ Verificando estado de autenticación...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('❌ Error obteniendo usuario:', error.message);
    }
    
    if (user) {
      console.log('✅ Usuario autenticado:', user.email);
      console.log('🆔 ID:', user.id);
      console.log('🎭 Rol:', user.role);
    } else {
      console.log('⚠️ No hay usuario autenticado');
      console.log('💡 PROBLEMA IDENTIFICADO: Necesitas estar logueado para subir archivos');
      console.log('\n🛠️ SOLUCIÓN:');
      console.log('1. Ve a: http://localhost:3000/auth/login');
      console.log('2. Inicia sesión con tu cuenta');
      console.log('3. Luego prueba subir imágenes desde el admin panel');
      return;
    }
    
  } catch (err) {
    console.log('❌ Error verificando autenticación:', err.message);
  }

  console.log('\n2️⃣ Probando subida con usuario autenticado...');
  
  try {
    // Crear imagen PNG de prueba
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const fileName = `test-auth-${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(fileName, pngBuffer, {
        contentType: 'image/png'
      });

    if (uploadError) {
      console.log('❌ Error en subida:', uploadError.message);
      
      if (uploadError.message.includes('row-level security')) {
        console.log('\n🔒 Análisis del error RLS:');
        console.log('- Usuario autenticado: ✅');
        console.log('- Políticas creadas: ✅ (según tu reporte)');
        console.log('- Error persiste: ❌');
        console.log('\n💡 POSIBLES CAUSAS:');
        console.log('1. Las políticas no se aplicaron correctamente');
        console.log('2. Hay un delay en la propagación de políticas');
        console.log('3. La política INSERT tiene una condición incorrecta');
        console.log('\n🔧 SOLUCIONES:');
        console.log('1. Espera 1-2 minutos y prueba otra vez');
        console.log('2. Verifica que la política INSERT sea exactamente:');
        console.log('   WITH CHECK: bucket_id = \'brand-logos\'');
        console.log('3. Asegúrate de que Target roles sea "authenticated"');
      }
      return;
    }

    console.log('✅ ¡ÉXITO! Archivo subido:', uploadData.path);
    console.log('🎉 RLS configurado correctamente');
    
    // Limpiar
    await supabase.storage.from('brand-logos').remove([fileName]);
    console.log('✅ Archivo de prueba eliminado');

  } catch (err) {
    console.log('❌ Error general:', err.message);
  }
}

diagnoseAuth();