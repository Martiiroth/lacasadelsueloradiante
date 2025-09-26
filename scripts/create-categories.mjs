// Script para crear categorías de ejemplo con jerarquía padre-hijo
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function createSampleCategories() {
  console.log('🏗️ Creando categorías de ejemplo...\n')

  // Categorías principales (padre)
  const parentCategories = [
    {
      name: 'Termostatos',
      slug: 'termostatos'
    },
    {
      name: 'Sistemas de Suelo Radiante',
      slug: 'sistemas-suelo-radiante'
    },
    {
      name: 'Calderas y Calefacción',
      slug: 'calderas-calefaccion'
    },
    {
      name: 'Accesorios y Componentes',
      slug: 'accesorios-componentes'
    }
  ]

  // Insertar categorías padre
  const insertedParents = []
  for (const category of parentCategories) {
    const { data, error } = await supabase
      .from('categories')
      .upsert(category, { onConflict: 'slug' })
      .select()
      .single()

    if (error) {
      console.error(`❌ Error insertando categoría ${category.name}:`, error)
    } else {
      console.log(`✅ Categoría padre creada: ${data.name}`)
      insertedParents.push(data)
    }
  }

  // Categorías hijas
  const childCategories = [
    // Hijos de Termostatos
    {
      name: 'Termostatos Digitales',
      slug: 'termostatos-digitales',
      parent_name: 'Termostatos'
    },
    {
      name: 'Termostatos WiFi',
      slug: 'termostatos-wifi',
      parent_name: 'Termostatos'
    },
    {
      name: 'Termostatos Analógicos',
      slug: 'termostatos-analogicos',
      parent_name: 'Termostatos'
    },
    
    // Hijos de Sistemas de Suelo Radiante
    {
      name: 'Sistemas Eléctricos',
      slug: 'sistemas-electricos',
      parent_name: 'Sistemas de Suelo Radiante'
    },
    {
      name: 'Sistemas por Agua',
      slug: 'sistemas-agua',
      parent_name: 'Sistemas de Suelo Radiante'
    },
    {
      name: 'Kits Completos',
      slug: 'kits-completos',
      parent_name: 'Sistemas de Suelo Radiante'
    },
    
    // Hijos de Calderas y Calefacción
    {
      name: 'Calderas de Gas',
      slug: 'calderas-gas',
      parent_name: 'Calderas y Calefacción'
    },
    {
      name: 'Calderas de Condensación',
      slug: 'calderas-condensacion',
      parent_name: 'Calderas y Calefacción'
    },
    {
      name: 'Bombas de Calor',
      slug: 'bombas-calor',
      parent_name: 'Calderas y Calefacción'
    },
    
    // Hijos de Accesorios y Componentes
    {
      name: 'Colectores',
      slug: 'colectores',
      parent_name: 'Accesorios y Componentes'
    },
    {
      name: 'Tuberías y Conexiones',
      slug: 'tuberias-conexiones',
      parent_name: 'Accesorios y Componentes'
    },
    {
      name: 'Válvulas y Reguladores',
      slug: 'valvulas-reguladores',
      parent_name: 'Accesorios y Componentes'
    }
  ]

  // Insertar categorías hijo
  for (const childCategory of childCategories) {
    const parent = insertedParents.find(p => p.name === childCategory.parent_name)
    if (parent) {
      const { data, error } = await supabase
        .from('categories')
        .upsert({
          name: childCategory.name,
          slug: childCategory.slug,
          parent_id: parent.id
        }, { onConflict: 'slug' })
        .select()
        .single()

      if (error) {
        console.error(`❌ Error insertando subcategoría ${childCategory.name}:`, error)
      } else {
        console.log(`  ✅ Subcategoría creada: ${data.name} → ${parent.name}`)
      }
    }
  }

  console.log('\n🎉 ¡Categorías de ejemplo creadas exitosamente!')
}

createSampleCategories().catch(console.error)