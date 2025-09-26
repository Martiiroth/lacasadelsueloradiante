// Script para verificar datos de productos y categorías
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkData() {
  console.log('🔍 Verificando datos en la base de datos...\n')

  // Verificar categorías
  console.log('📂 CATEGORÍAS:')
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (catError) {
    console.error('❌ Error al obtener categorías:', catError)
  } else {
    console.log(`📊 Total categorías: ${categories?.length || 0}`)
    categories?.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.id})`)
    })
  }

  console.log('\n📦 PRODUCTOS:')
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select(`
      id,
      title,
      is_new,
      is_on_sale,
      product_categories (
        category_id,
        categories (
          name
        )
      )
    `)
    .order('title')

  if (prodError) {
    console.error('❌ Error al obtener productos:', prodError)
  } else {
    console.log(`📊 Total productos: ${products?.length || 0}`)
    products?.forEach(prod => {
      const categories = prod.product_categories?.map(pc => pc.categories?.name).join(', ') || 'Sin categoría'
      const badges = []
      if (prod.is_new) badges.push('NUEVO')
      if (prod.is_on_sale) badges.push('OFERTA')
      console.log(`   - ${prod.title} ${badges.length ? `[${badges.join(', ')}]` : ''} (${categories})`)
    })
  }

  console.log('\n🔗 RELACIONES PRODUCTO-CATEGORÍA:')
  const { data: relations, error: relError } = await supabase
    .from('product_categories')
    .select(`
      product_id,
      category_id,
      products (title),
      categories (name)
    `)

  if (relError) {
    console.error('❌ Error al obtener relaciones:', relError)
  } else {
    console.log(`📊 Total relaciones: ${relations?.length || 0}`)
    relations?.forEach(rel => {
      console.log(`   - ${rel.products?.title} → ${rel.categories?.name}`)
    })
  }
}

checkData().catch(console.error)