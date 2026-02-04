'use client'

import { useState, useEffect } from 'react'
import type { ProductCardData } from '../../types/products'
import ProductCard from '../products/ProductCard'

export default function FeaturedCarousel() {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchCarousel() {
      try {
        const res = await fetch('/api/carousel/products')
        const data = await res.json()
        if (!cancelled && Array.isArray(data?.products)) {
          setProducts(data.products)
        }
      } catch (e) {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCarousel()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <section className="py-10 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos destacados</h2>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-72 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg" />
                <div className="h-4 bg-gray-200 rounded mt-3 w-3/4" />
                <div className="h-4 bg-gray-200 rounded mt-2 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!products.length) return null

  // Duplicar suficientes veces para que el bucle infinito se vea fluido (al menos 2 copias; si hay pocos productos, más copias)
  const copies = products.length <= 3 ? 4 : 2
  const duplicated = Array.from({ length: copies }, () => [...products]).flat()

  return (
    <section className="py-10 bg-gray-50 overflow-hidden" aria-label="Carrusel de productos destacados">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Productos destacados</h2>
        <p className="text-gray-600 mt-1">Una selección de nuestros productos más populares</p>
      </div>
      {/* Contenedor que recorta la pista (viewport del carrusel) */}
      <div className="w-full overflow-x-hidden">
        <div className="flex flex-nowrap gap-6 py-2 w-max animate-featured-carousel">
          {duplicated.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="flex-shrink-0 w-[260px] sm:w-[280px] md:w-[300px]"
            >
              <ProductCard product={product} priority={index < 6} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
