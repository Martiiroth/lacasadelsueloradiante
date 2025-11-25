import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

const baseUrl = 'https://www.lacasadelsueloradiante.es'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString().split('T')[0]

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/productos`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/marcas`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/politicas-privacidad`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/aviso-legal`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/aviso-cookies`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/politicas-devolucion`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Obtener productos de la base de datos
  let productPages: MetadataRoute.Sitemap = []
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false })

    if (!error && products) {
      productPages = products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updated_at 
          ? new Date(product.updated_at).toISOString().split('T')[0]
          : currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error)
  }

  // Obtener marcas de la base de datos
  let brandPages: MetadataRoute.Sitemap = []
  try {
    const { data: brands, error } = await supabase
      .from('brands')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (!error && brands) {
      brandPages = brands.map((brand) => ({
        url: `${baseUrl}/marcas/${brand.slug}`,
        lastModified: brand.updated_at 
          ? new Date(brand.updated_at).toISOString().split('T')[0]
          : currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Error fetching brands for sitemap:', error)
  }

  return [...staticPages, ...productPages, ...brandPages]
}

