'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ProductCardData } from '../../types/products'
import ProductCard from '../products/ProductCard'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function FeaturedCarousel() {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scrollX, setScrollX] = useState(0)
  const [cardWidthPx, setCardWidthPx] = useState<number | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const halfWidthRef = useRef(1)
  const stepRef = useRef(400)

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

  // Medir viewport y calcular ancho de tarjeta para que quepan N enteras (sin cortar el último bloque)
  useEffect(() => {
    if (!products.length) return
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return
    const gap = 24 // lg:gap-6
    const measure = () => {
      const vw = viewport.offsetWidth
      if (vw <= 0) return
      // N visible: 1 (< 640), 2 (640–1023), 4 (≥ 1024)
      const n = vw >= 1024 ? 4 : vw >= 640 ? 2 : 1
      const w = (vw - (n - 1) * gap) / n
      setCardWidthPx(w)
      stepRef.current = w + gap
      const tw = track.offsetWidth
      if (tw > 0) halfWidthRef.current = tw / 2
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(viewport)
    ro.observe(track)
    return () => ro.disconnect()
  }, [products.length])

  const normalize = useCallback((x: number) => {
    const half = halfWidthRef.current
    let n = x
    while (n > 0) n -= half
    while (n <= -half) n += half
    return n
  }, [])

  const goLeft = useCallback(() => {
    setScrollX((prev) => normalize(prev - stepRef.current))
  }, [normalize])

  const goRight = useCallback(() => {
    setScrollX((prev) => normalize(prev + stepRef.current))
  }, [normalize])

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

  return (
    <section className="py-10 bg-gray-50" aria-label="Carrusel de productos destacados">
      <div className={containerClass}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Productos destacados</h2>
          <p className="text-gray-600">Una selección de nuestros productos más populares.</p>
          {products.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={goLeft}
                aria-label="Anterior"
                className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={goRight}
                aria-label="Siguiente"
                className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        {!products.length ? (
          <p className="text-gray-500 py-8 text-center">
            Aún no hay productos en el carrusel. Configúralos en <strong>Admin → Carrusel Home</strong>.
          </p>
        ) : (
          <div ref={viewportRef} className="overflow-x-hidden">
            <div
              ref={trackRef}
              className="flex flex-nowrap gap-6 py-2 w-max will-change-transform transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(${scrollX}px)`,
                gap: 24
              }}
            >
              {(() => {
                const copies = products.length <= 3 ? 4 : 2
                const duplicated = Array.from({ length: copies }, () => [...products]).flat()
                const w = cardWidthPx ?? 290
                return duplicated.map((product, index) => (
                  <div
                    key={`${product.id}-${index}`}
                    className="flex-shrink-0"
                    style={{ width: w }}
                  >
                    <ProductCard product={product} priority={index < 6} />
                  </div>
                ))
              })()}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
