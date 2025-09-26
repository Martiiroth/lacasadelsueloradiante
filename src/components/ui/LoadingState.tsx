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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
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