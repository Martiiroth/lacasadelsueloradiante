import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '../../../utils/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import ProductCard from '../../../components/products/ProductCard'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

async function getBrand(slug: string) {
  const supabase = await createClient()

  const { data: brand, error } = await supabase
    .from('brands')
    .select('id, name, slug, logo_url, is_active, created_at, updated_at')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !brand) return null

  const { data: products, count } = await supabase
    .from('products')
    .select(`
      id, slug, title, short_description, is_new, is_on_sale,
      product_variants (id, price_public_cents, stock),
      product_images (url, alt)
    `, { count: 'exact' })
    .eq('brand_id', brand.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const mappedProducts = (products || []).map((p: any) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    short_description: p.short_description,
    is_new: p.is_new,
    is_on_sale: p.is_on_sale,
    image: p.product_images?.[0]
      ? { id: '', product_id: p.id, url: p.product_images[0].url, alt: p.product_images[0].alt || p.title, position: 0, created_at: '' }
      : undefined,
    price_cents: p.product_variants?.[0]?.price_public_cents || 0,
    in_stock: (p.product_variants?.[0]?.stock || 0) > 0,
    role_price_cents: undefined,
  }))

  return { ...brand, product_count: count || 0, products: mappedProducts }
}

export async function generateStaticParams() {
  const supabase = await createClient()
  const { data: brands } = await supabase
    .from('brands')
    .select('slug')
    .eq('is_active', true)
  return (brands || []).map((b: { slug: string }) => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('brands')
    .select('name, logo_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!data) return {}

  const title = `${data.name} — Productos para suelo radiante`
  const description = `Compra productos de ${data.name} para suelo radiante y calefacción. Catálogo completo con inhibidores, anticongelantes, filtros y más.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: data.logo_url ? [{ url: data.logo_url, alt: `Logo ${data.name}` }] : [],
    },
  }
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params
  const brand = await getBrand(slug)

  if (!brand) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    logo: brand.logo_url,
    url: `https://www.lacasadelsueloradiante.es/marcas/${slug}`,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Brand Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Logo */}
            <div className="text-center lg:text-left">
              <div className="inline-block p-8 bg-gray-50 rounded-xl">
                {brand.logo_url ? (
                  <Image
                    src={brand.logo_url}
                    alt={`Logo de ${brand.name}`}
                    width={200}
                    height={200}
                    className="max-w-full max-h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-400">
                    <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div>
              <nav aria-label="Breadcrumb" className="mb-4">
                <ol className="flex items-center space-x-2 text-sm text-gray-500">
                  <li><Link href="/" className="hover:text-gray-700">Inicio</Link></li>
                  <li><span className="mx-1">›</span></li>
                  <li><Link href="/marcas" className="hover:text-gray-700">Marcas</Link></li>
                  <li><span className="mx-1">›</span></li>
                  <li className="text-gray-900 font-medium">{brand.name}</li>
                </ol>
              </nav>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{brand.name}</h1>

              {brand.product_count > 0 && (
                <div className="flex items-center text-gray-600 mb-6">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  {brand.product_count} producto{brand.product_count !== 1 ? 's' : ''} disponible{brand.product_count !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Productos de {brand.name}</h2>
          <p className="text-gray-600">Descubre todos los productos disponibles de esta marca</p>
        </div>

        {brand.products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {brand.products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos disponibles</h3>
            <p className="text-gray-500 mb-6">Esta marca no tiene productos disponibles en este momento.</p>
            <Link href="/marcas" className="text-blue-600 hover:text-blue-700 font-medium">
              Ver otras marcas
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
