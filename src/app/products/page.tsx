import { Metadata } from 'next'
import { createBuildClient } from '../../utils/supabase/build'
import ProductCard from '../../components/products/ProductCard'
import Link from 'next/link'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Productos para Suelo Radiante',
  description: 'Catálogo completo de productos para suelo radiante: inhibidores, anticongelantes, filtros magnéticos, limpiadores y accesorios de las mejores marcas.',
}

export default async function ProductsPage() {
  const supabase = createBuildClient()

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, slug, title, short_description, is_new, is_on_sale,
      product_variants (id, price_public_cents, stock),
      product_images (url, alt, position)
    `)
    .order('created_at', { ascending: false })

  const mappedProducts = (products || []).map((p: any) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    short_description: p.short_description,
    is_new: p.is_new,
    is_on_sale: p.is_on_sale,
    image: p.product_images?.sort((a: any, b: any) => a.position - b.position)[0]
      ? {
          id: '',
          product_id: p.id,
          url: p.product_images[0].url,
          alt: p.product_images[0].alt || p.title,
          position: 0,
          created_at: '',
        }
      : undefined,
    price_cents: p.product_variants?.[0]?.price_public_cents || 0,
    in_stock: (p.product_variants?.[0]?.stock || 0) > 0,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="hover:text-gray-700">Inicio</Link></li>
              <li><span className="mx-1">›</span></li>
              <li className="text-gray-900 font-medium">Productos</li>
            </ol>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Productos para Suelo Radiante
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Catálogo completo de inhibidores, anticongelantes, filtros magnéticos, limpiadores
            y accesorios para instalaciones de suelo radiante y calefacción.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {mappedProducts.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-6">{mappedProducts.length} productos disponibles</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mappedProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay productos disponibles en este momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
