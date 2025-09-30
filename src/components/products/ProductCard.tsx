'use client'

import Link from 'next/link'
import type { ProductCardData } from '../../types/products'
import { useAuth } from '../../contexts/AuthContext'
import OptimizedImage from '../ui/OptimizedImage'

interface ProductCardProps {
  product: ProductCardData
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth()

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2)
  }

  const displayPrice = product.role_price_cents || product.price_cents
  const hasDiscount = product.role_price_cents && product.role_price_cents < product.price_cents

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <Link href={`/products/${product.slug}`} className="flex flex-col h-full">
        <div className="relative">
          {/* Imagen del producto */}
          <OptimizedImage
            src={product.image?.url || ''}
            alt={product.image?.alt || product.title}
            className="aspect-square w-full"
            fill={true}
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
            priority={false}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_new && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                Nuevo
              </span>
            )}
            {product.is_on_sale && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                Oferta
              </span>
            )}
            {hasDiscount && user && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                Precio especial
              </span>
            )}
          </div>

          {/* Stock status */}
          {!product.in_stock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-gray-800 text-white px-3 py-1 rounded text-sm">
                Sin stock
              </span>
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 text-sm sm:text-base">
              {product.title}
            </h3>
            
            {product.short_description && (
              <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                {product.short_description}
              </p>
            )}
          </div>

          {/* Precio */}
          <div className="mt-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                {hasDiscount && user ? (
                  <>
                    <span className="text-base sm:text-lg font-bold text-green-600">
                      €{formatPrice(product.role_price_cents!)}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 line-through">
                      €{formatPrice(product.price_cents)}
                    </span>
                  </>
                ) : (
                  <span className="text-base sm:text-lg font-bold text-gray-800">
                    €{formatPrice(displayPrice)}
                  </span>
                )}
              </div>

              {/* Indicador de stock */}
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  product.in_stock ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-gray-500">
                  {product.in_stock ? 'Disponible' : 'Sin stock'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}