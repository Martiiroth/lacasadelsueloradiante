import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '../../../utils/supabase/server'
import { createBuildClient } from '../../../utils/supabase/build'
import ProductClient from './ProductClient'
import Reviews from '../../../components/products/Reviews'
import ResourcesList from '../../../components/products/ResourcesList'
import { processProductDescription } from '../../../lib/textFormatter'
import Link from 'next/link'
import type { ProductWithVariants } from '../../../types/products'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

async function getProduct(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      brands (id, name, slug),
      product_variants (
        *,
        role_prices (*, customer_roles (*)),
        variant_images (*)
      ),
      product_images (*),
      product_categories (categories (*)),
      product_resources (*),
      product_reviews (*, clients (first_name, last_name))
    `)
    .eq('slug', slug)
    .order('position', { foreignTable: 'product_images', ascending: true })
    .order('created_at', { foreignTable: 'product_variants', ascending: true })
    .single()

  if (error || !data) return null

  const variants = (data.product_variants || []).map((variant: any) => {
    const rolePrices = (variant.role_prices || []).map((rp: any) => ({
      id: rp.id,
      variant_id: rp.variant_id,
      role_id: rp.role_id,
      price_cents: rp.price_cents,
      role: rp.customer_roles,
    }))
    return { ...variant, role_prices: rolePrices, images: variant.variant_images || [] }
  })

  return {
    ...data,
    variants,
    images: data.product_images || [],
    categories: (data.product_categories || []).map((pc: any) => pc.categories),
    resources: data.product_resources || [],
    reviews: data.product_reviews || [],
  }
}

export async function generateStaticParams() {
  try {
    const supabase = createBuildClient()
    const { data: products } = await supabase
      .from('products')
      .select('slug')
      .eq('is_active', true)
    return (products || []).map((p: { slug: string }) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('title, short_description, meta_title, meta_description, product_images (url, alt)')
    .eq('slug', slug)
    .single()

  if (!data) return {}

  const title = data.meta_title || data.title
  const description = data.meta_description || data.short_description || ''
  const image = (data.product_images as any[])?.[0]

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image.url, alt: image.alt || title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image.url] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.short_description || product.meta_description || '',
    image: product.images?.[0]?.url,
    sku: product.variants?.[0]?.sku,
    brand: product.brands ? { '@type': 'Brand', name: product.brands.name } : undefined,
    offers: product.variants?.length > 0 ? {
      '@type': 'Offer',
      price: (product.variants[0].price_public_cents / 100).toFixed(2),
      priceCurrency: 'EUR',
      availability: product.variants[0].stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://www.lacasadelsueloradiante.es/products/${slug}`,
      seller: { '@type': 'Organization', name: 'La Casa del Suelo Radiante' },
    } : undefined,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-gray-700">Inicio</Link></li>
            <li><span className="mx-1">›</span></li>
            <li><Link href="/products" className="hover:text-gray-700">Productos</Link></li>
            <li><span className="mx-1">›</span></li>
            <li className="text-gray-900 font-medium">{product.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Sección izquierda: galería + interactividad (client) */}
          <div className="lg:col-span-1">
            <ProductClient product={product as unknown as ProductWithVariants} />
          </div>

          {/* Sección derecha: info estática indexable */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {product.is_new && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">Nuevo</span>
                )}
                {product.is_on_sale && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">Oferta</span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
              {product.short_description && (
                <p className="text-xl text-gray-600">{product.short_description}</p>
              )}
            </div>

            {/* Categorías */}
            {product.categories && product.categories.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Categorías</h3>
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((category: any) => (
                    <span key={category.id} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Marca */}
            {product.brands && (
              <div>
                <span className="text-sm text-gray-500">Marca: </span>
                <Link href={`/marcas/${product.brands.slug}`} className="text-sm font-medium text-blue-600 hover:underline">
                  {product.brands.name}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Descripción completa */}
        {product.description && (
          <div className="mt-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Descripción del producto</h2>
              <div
                className="prose prose-lg max-w-none text-gray-700
                  prose-headings:text-gray-900
                  prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                  prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                  prose-li:text-gray-700 prose-li:mb-2
                  prose-strong:text-gray-900 prose-strong:font-semibold"
                dangerouslySetInnerHTML={{ __html: processProductDescription(product.description) }}
              />
            </div>
          </div>
        )}

        {/* Recursos */}
        {product.resources && product.resources.length > 0 && (
          <div className="mt-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <ResourcesList resources={product.resources} />
            </div>
          </div>
        )}

        {/* Reviews */}
        {product.reviews && (
          <div className="mt-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <Reviews reviews={product.reviews} productId={product.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
