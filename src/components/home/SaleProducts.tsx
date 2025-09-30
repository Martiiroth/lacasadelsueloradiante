'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ProductCardData } from '../../types/products'
import { ProductService } from '../../lib/products'
import ProductCard from '../products/ProductCard'
import { useHydration } from '../../hooks/useHydration'
import { LoadingState, ProductSkeleton } from '../ui/LoadingState'

interface SaleProductsProps {
  limit?: number
}

export default function SaleProducts({ limit = 6 }: SaleProductsProps) {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isHydrated = useHydration()

  // Función para reintentar carga
  const handleRetry = () => {
    setError(null)
    setLoading(true)
    // Force re-trigger del useEffect
    setProducts([])
  }

  useEffect(() => {
    if (!isHydrated) return

    const loadSaleProducts = async (retryCount = 0) => {
      const maxRetries = 3
      
      console.log(`🔄 SaleProducts: Cargando ${limit} productos en oferta... (intento ${retryCount + 1})`)
      
      setLoading(true)
      setError(null)
      
      try {
        const result = await ProductService.getProducts(
          { is_on_sale: true },
          { field: 'created_at', direction: 'desc' },
          1,
          limit
        )

        if (result && result.products.length > 0) {
          setProducts(result.products)
          console.log(`✅ SaleProducts: ${result.products.length} productos en oferta cargados`)
          setLoading(false)
        } else if (retryCount < maxRetries) {
          setTimeout(() => loadSaleProducts(retryCount + 1), (retryCount + 1) * 1000)
          return
        } else {
          setProducts([])
          setLoading(false)
        }
      } catch (err) {
        console.error(`❌ SaleProducts error (intento ${retryCount + 1}):`, err)
        
        if (retryCount < maxRetries) {
          setTimeout(() => loadSaleProducts(retryCount + 1), (retryCount + 1) * 1000)
          return
        } else {
          setError('Error al cargar los productos en oferta')
          setProducts([])
          setLoading(false)
        }
      }
    }

    const timeoutId = setTimeout(() => loadSaleProducts(), 150)
    return () => clearTimeout(timeoutId)
  }, [isHydrated, limit])

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🔥 Productos en Oferta
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3 w-3/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              ⚠️ {error}
            </div>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Recargar página
              </button>
              <button 
                onClick={handleRetry}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0 && !loading && !error) {
    return null // No mostrar la sección si no hay productos en oferta
  }

  return (
    <LoadingState 
      fallback={
        <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-4">
                🔥 ¡Ofertas Especiales!
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                <span className="text-red-600">Productos en Oferta</span>
              </h2>
            </div>
            <ProductSkeleton count={limit} />
          </div>
        </section>
      }
      delay={100}
    >
      <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-200 rounded-full opacity-20"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-orange-200 rounded-full opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header con diseño llamativo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            ¡Ofertas Especiales!
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            <span className="text-red-600">Productos en Oferta</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Aprovecha nuestros precios especiales en productos seleccionados. 
            <span className="font-semibold text-red-600"> Ofertas por tiempo limitado</span>
          </p>
        </div>

        {/* Grid de productos en oferta */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-12">
          {products.map((product) => (
            <div key={product.id} className="transform hover:scale-105 transition-transform duration-300">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 inline-block">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center text-red-600">
                <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-semibold">¡No te pierdas estas ofertas!</span>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Descubre todos los productos con descuentos especiales
            </p>
            
            <Link
              href="/products?is_on_sale=true"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Ver Todas las Ofertas
              <svg className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
    </LoadingState>
  )
}