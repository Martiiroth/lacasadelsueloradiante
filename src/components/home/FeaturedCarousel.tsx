'use client'

import { useState, useEffect } from 'react'
import type { ProductCardData } from '../../types/products'
import ProductCard from '../products/ProductCard'

export default function FeaturedCarousel() {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchCarousel() {
      try {
        setError(null)
        const res = await fetch('/api/carousel/products')
        const data = await res.json()
        if (!res.ok) {
          if (!cancelled) setError('Error al cargar')
          return
        }
        if (!cancelled && Array.isArray(data?.products)) {
          setProducts(data.products)
        }
      } catch (e) {
        if (!cancelled) {
          setProducts([])
          setError('Error al cargar')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCarousel()
    return () => { cancelled = true }
  }, [])

  // Mismo contenedor que "Explora Nuestros Productos": max-w-7xl, mismo padding
  const containerClass = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'

  if (loading) {
    return (
      <section className="py-10 bg-gray-50" aria-label="Carrusel de productos destacados">
        <div className={containerClass}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos destacados</h2>
          <div className="products-grid grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse" style={{ minHeight: '400px' }}>
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 sm:p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-gray-200 rounded mb-3 w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Siempre mostrar la sección: con productos (carrusel) o vacía (mensaje)
  return (
    <section className="py-10 bg-gray-50" aria-label="Carrusel de productos destacados">
      <div className={containerClass}>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Productos destacados</h2>
        <p className="text-gray-600 mb-6">Una selección de nuestros productos más populares</p>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        {!products.length ? (
          <p className="text-gray-500 py-8 text-center">
            Aún no hay productos en el carrusel. Configúralos en <strong>Admin → Carrusel Home</strong>.
          </p>
        ) : (
          <>
            {/* Viewport: mismo ancho que el grid de productos (max-w-7xl), overflow horizontal oculto */}
            <div className="overflow-x-hidden">
              <div className="flex flex-nowrap gap-4 lg:gap-6 py-2 w-max animate-featured-carousel">
                {(() => {
                  const copies = products.length <= 3 ? 4 : 2
                  const duplicated = Array.from({ length: copies }, () => [...products]).flat()
                  return duplicated.map((product, index) => (
                    <div
                      key={`${product.id}-${index}`}
                      className="flex-shrink-0 w-[calc(50vw-1.5rem)] sm:w-[280px] md:w-[300px] lg:w-[360px]"
                    >
                      <ProductCard product={product} priority={index < 6} />
                    </div>
                  ))
                })()}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
