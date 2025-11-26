'use client'

import { useEffect, useState } from 'react'

interface LoadingStateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  delay?: number
}

/**
 * Componente que maneja mejor los estados de carga inicial
 * Espera un momento antes de mostrar el contenido para evitar flashes
 */
export function LoadingState({ children, fallback, delay = 300 }: LoadingStateProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!isReady) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Skeleton para productos
 */
export function ProductSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="products-grid grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse" style={{ minHeight: '400px' }}>
          <div className="aspect-square bg-gray-200" style={{ width: '100%', paddingBottom: '100%', position: 'relative' }}>
            <div className="absolute inset-0 bg-gray-200"></div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="h-4 bg-gray-200 rounded mb-2" style={{ width: '90%' }}></div>
            <div className="h-3 bg-gray-200 rounded mb-3" style={{ width: '75%' }}></div>
            <div className="h-5 bg-gray-200 rounded" style={{ width: '50%' }}></div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton para filtros
 */
export function FilterSkeleton() {
  return (
    <div className="w-64 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
        <div className="h-6 bg-gray-200 rounded mb-6 w-3/4 animate-pulse"></div>
        
        {/* Buscador skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded mb-3 w-1/2 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Categorías skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded mb-3 w-1/3 animate-pulse"></div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Ordenamiento skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded mb-3 w-1/2 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}