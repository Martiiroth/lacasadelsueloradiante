// Script para verificar que las variables de entorno se están cargando correctamente
console.log('🔍 Verificando variables de entorno...')

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ No encontrada')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No encontrada')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ No encontrada')

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('🔧 Service Role Key detectada - Longitud:', process.env.SUPABASE_SERVICE_ROLE_KEY.length, 'caracteres')
  console.log('🔧 Primeros 10 caracteres:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...')
} else {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY no está disponible')
}