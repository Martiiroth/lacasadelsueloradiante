'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ProductCardData } from '../../types/products'
import ProductCard from '../products/ProductCard'

const AUTO_SPEED = 0.4 // píxeles por frame (~24px/s a 60fps)

export default function FeaturedCarousel() {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scrollX, setScrollX] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const halfWidthRef = useRef(1)
  const rafRef = useRef<number>(0)
  const isDraggingRef = useRef(false)
  const hasCapturedRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartScrollRef = useRef(0)
  const viewportRef = useRef<HTMLDivElement>(null)
  const DRAG_THRESHOLD = 8 // px: solo capturar después de este movimiento para no bloquear clics

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

  // Medir ancho del track (mitad = una vuelta del bucle infinito)
  useEffect(() => {
    if (!products.length || !trackRef.current) return
    const el = trackRef.current
    const measure = () => {
      const w = el.offsetWidth
      if (w > 0) halfWidthRef.current = w / 2
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [products.length])

  // Bucle automático (solo cuando no se arrastra)
  useEffect(() => {
    if (!products.length) return
    function tick() {
      if (isDraggingRef.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      setScrollX((prev) => {
        const half = halfWidthRef.current
        let next = prev - AUTO_SPEED
        if (next <= -half) next += half
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [products.length])

  const normalize = useCallback((x: number) => {
    const half = halfWidthRef.current
    let n = x
    while (n > 0) n -= half
    while (n <= -half) n += half
    return n
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragStartXRef.current = e.clientX
      dragStartScrollRef.current = scrollX
      hasCapturedRef.current = false
    },
    [scrollX]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const dx = e.clientX - dragStartXRef.current
      if (!hasCapturedRef.current) {
        if (Math.abs(dx) >= DRAG_THRESHOLD && viewportRef.current) {
          hasCapturedRef.current = true
          isDraggingRef.current = true
          viewportRef.current.setPointerCapture(e.pointerId)
          setScrollX((prev) => normalize(prev + dx))
          dragStartXRef.current = e.clientX
        }
        return
      }
      const delta = e.clientX - dragStartXRef.current
      dragStartXRef.current = e.clientX
      setScrollX((prev) => normalize(prev + delta))
    },
    [scrollX, normalize]
  )

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (viewportRef.current && hasCapturedRef.current) {
      viewportRef.current.releasePointerCapture(e.pointerId)
    }
    isDraggingRef.current = false
    hasCapturedRef.current = false
  }, [])

  const onPointerLeave = useCallback(() => {
    isDraggingRef.current = false
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
        <p className="text-gray-600 mb-6">Una selección de nuestros productos más populares. Arrastra para mover el carrusel.</p>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        {!products.length ? (
          <p className="text-gray-500 py-8 text-center">
            Aún no hay productos en el carrusel. Configúralos en <strong>Admin → Carrusel Home</strong>.
          </p>
        ) : (
          <>
            <div
              ref={viewportRef}
              className="overflow-x-hidden select-none cursor-grab active:cursor-grabbing touch-pan-x"
              style={{ userSelect: 'none' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerLeave}
              onPointerCancel={onPointerUp}
            >
              <div
                ref={trackRef}
                className="flex flex-nowrap gap-4 lg:gap-6 py-2 w-max will-change-transform"
                style={{ transform: `translateX(${scrollX}px)` }}
              >
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
