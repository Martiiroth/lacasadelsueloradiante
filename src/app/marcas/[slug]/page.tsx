'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BrandService } from '@/lib/brands'
import { ProductService } from '@/lib/products'
import ProductCard from '@/components/products/ProductCard'
import { useAuth } from '@/contexts/AuthContext'
import type { BrandData } from '@/types/brands'
import type { ProductCardData } from '@/types/products'

interface BrandPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function BrandPage({ params }: BrandPageProps) {
  const { user } = useAuth()
  const [slug, setSlug] = useState<string>('')
  const [brand, setBrand] = useState<BrandData | null>(null)
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [displayedCount, setDisplayedCount] = useState(12)

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setSlug(resolvedParams.slug)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (slug) {
      loadBrand()
      loadProducts()
    }
  }, [slug])

  const loadBrand = async () => {
    try {
      const brandData = await BrandService.getBrandBySlug(slug)
      setBrand(brandData)
    } catch (error) {
      console.error('Error loading brand:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const userRole = user?.client?.customer_role?.name || null
      const result = await ProductService.getProducts(
        { brand_slug: slug },
        { field: 'created_at', direction: 'desc' },
        1,
        displayedCount,
        userRole || undefined
      )
      
      if (result && result.products) {
        setProducts(result.products)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setProductsLoading(false)
    }
  }

  const loadMoreProducts = () => {
    setDisplayedCount(prev => prev + 12)
    loadProducts()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Marca no encontrada</h2>
          <p className="text-gray-600 mb-6">La marca que buscas no existe o no está disponible.</p>
          <Link 
            href="/marcas"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver todas las marcas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Brand Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Brand Logo */}
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

            {/* Brand Info */}
            <div>
              {/* Breadcrumbs */}
              <nav className="mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Link href="/" className="hover:text-gray-700">Inicio</Link>
                  <span>›</span>
                  <Link href="/marcas" className="hover:text-gray-700">Marcas</Link>
                  <span>›</span>
                  <span className="text-gray-900 font-medium">{brand.name}</span>
                </div>
              </nav>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {brand.name}
              </h1>

              {brand.description && (
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {brand.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-6">
                {brand.product_count && brand.product_count > 0 && (
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {brand.product_count} producto{brand.product_count !== 1 ? 's' : ''} disponible{brand.product_count !== 1 ? 's' : ''}
                  </div>
                )}

                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visitar sitio web
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Productos de {brand.name}
          </h2>
          <p className="text-gray-600">
            Descubre todos los productos disponibles de esta marca
          </p>
        </div>

        {/* Products Loading */}
        {productsLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3 w-3/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!productsLoading && (
          <>
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Load More Button */}
                {products.length >= displayedCount && (
                  <div className="text-center mt-12">
                    <button
                      onClick={loadMoreProducts}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Cargar más productos
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay productos disponibles
                </h3>
                <p className="text-gray-500 mb-6">
                  Esta marca no tiene productos disponibles en este momento.
                </p>
                <Link 
                  href="/marcas"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver otras marcas
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}