import { Metadata } from 'next'
import { createBuildClient } from '../../utils/supabase/build'
import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Marcas de Suelo Radiante',
  description: 'Trabajamos con las mejores marcas del sector: Fernox, Kamco, Floixem y Rems. Productos profesionales para instalaciones de suelo radiante y calefacción.',
}

export default async function MarcasPage() {
  const supabase = createBuildClient()

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug, logo_url')
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Contar productos por marca
  const brandsWithCount = await Promise.all(
    (brands || []).map(async (brand: any) => {
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('brand_id', brand.id)
        .eq('is_active', true)
      return { ...brand, product_count: count || 0 }
    })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="hover:text-gray-700">Inicio</Link></li>
              <li><span className="mx-1">›</span></li>
              <li className="text-gray-900 font-medium">Marcas</li>
            </ol>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nuestras Marcas
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Trabajamos con las mejores marcas del sector de suelo radiante y sistemas de calefacción.
            Calidad y confianza garantizada en cada producto.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {brandsWithCount.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {brandsWithCount.map((brand) => (
              <Link
                key={brand.id}
                href={`/marcas/${brand.slug}`}
                className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="aspect-square mb-4 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                    {brand.logo_url ? (
                      <Image
                        src={brand.logo_url}
                        alt={`Logo de ${brand.name}`}
                        width={120}
                        height={120}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h2 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {brand.name}
                    </h2>
                    {brand.product_count > 0 && (
                      <p className="text-sm text-gray-500">
                        {brand.product_count} producto{brand.product_count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay marcas disponibles en este momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
