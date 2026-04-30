'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import type { ProductWithVariants, VariantImage } from '../../../types/products'
import ImageGallery from '../../../components/products/ImageGallery'
import VariantSelector from '../../../components/products/VariantSelector'
import AddToCartButton from '../../../components/products/AddToCartButton'
import { VariantImageService } from '../../../lib/variantImageService'

export default function ProductClient({ product }: { product: ProductWithVariants }) {
  const { user } = useAuth()
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id || '')
  const [quantity, setQuantity] = useState(1)
  const [variantImages, setVariantImages] = useState<VariantImage[]>([])

  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId)
  const hasMultipleVariants = (product.variants?.length || 0) > 1

  useEffect(() => {
    if (!selectedVariantId) return
    VariantImageService.getVariantImages(selectedVariantId)
      .then(images =>
        setVariantImages(images.map(img => ({
          id: img.id || '',
          variant_id: img.variant_id,
          url: img.url,
          alt: img.alt || '',
          position: img.position,
          created_at: new Date().toISOString(),
        })))
      )
      .catch(() => setVariantImages([]))
  }, [selectedVariantId])

  const userRolePrice = user?.client?.customer_role?.name && selectedVariant?.role_prices
    ? selectedVariant.role_prices.find((rp: any) => rp.role?.name === user.client?.customer_role?.name)
    : null

  const displayPrice = userRolePrice
    ? userRolePrice.price_cents / 100
    : (selectedVariant?.price_public_cents || 0) / 100

  return (
    <div className="space-y-6">
      {/* Galería de imágenes */}
      <div>
        {product.images && product.images.length > 0 ? (
          <ImageGallery
            productImages={product.images}
            variantImages={variantImages}
            productTitle={product.title}
          />
        ) : (
          <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>Sin imagen disponible</p>
            </div>
          </div>
        )}
      </div>

      {/* Selector de variantes */}
      {hasMultipleVariants && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Opciones disponibles</h3>
          <VariantSelector
            variants={product.variants}
            selectedVariant={selectedVariant || null}
            onVariantChange={(variant) => setSelectedVariantId(variant.id)}
          />
        </div>
      )}

      {!hasMultipleVariants && selectedVariant && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Producto disponible</h3>
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-800">{selectedVariant.title || product.title}</h4>
            <p className="text-lg font-bold text-gray-800">€{displayPrice.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Precio y botón de compra */}
      {selectedVariant ? (
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-gray-900">€{displayPrice.toFixed(2)}</div>
              {userRolePrice && (
                <div className="text-sm text-gray-500">
                  Precio público: €{(selectedVariant.price_public_cents / 100).toFixed(2)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-md">
              <label htmlFor="quantity" className="sr-only">Cantidad</label>
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100 transition-colors"
                disabled={quantity <= 1}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                id="quantity"
                type="number"
                min="1"
                max={selectedVariant.stock > 0 ? selectedVariant.stock : 999}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-3 py-2 text-center border-0 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity(selectedVariant.stock > 0 ? Math.min(selectedVariant.stock, quantity + 1) : quantity + 1)}
                className="p-2 hover:bg-gray-100 transition-colors"
                disabled={selectedVariant.stock > 0 && quantity >= selectedVariant.stock}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <div className="flex-1">
              <AddToCartButton variant={selectedVariant} disabled={false} quantity={quantity} />
            </div>
          </div>
        </div>
      ) : product.variants && product.variants.length > 0 ? (
        <div className="border border-gray-200 rounded-lg p-6 bg-white text-center text-gray-500">
          <p className="mb-4">Selecciona una variante para ver el precio y añadir al carrito</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-6 bg-white text-center text-gray-500">
          <p>Este producto no tiene variantes disponibles</p>
        </div>
      )}

      {/* Especificaciones técnicas */}
      {selectedVariant && (selectedVariant.weight_grams || selectedVariant.dimensions || selectedVariant.sku) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Especificaciones técnicas</h3>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            {selectedVariant.sku && (
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">SKU:</dt>
                <dd className="text-gray-600">{selectedVariant.sku}</dd>
              </div>
            )}
            {selectedVariant.weight_grams && (
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Peso:</dt>
                <dd className="text-gray-600">{selectedVariant.weight_grams}g</dd>
              </div>
            )}
            {selectedVariant.dimensions && (
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Dimensiones:</dt>
                <dd className="text-gray-600">
                  {typeof selectedVariant.dimensions === 'object'
                    ? Object.entries(selectedVariant.dimensions).map(([k, v]) => `${k}: ${v}`).join(', ')
                    : String(selectedVariant.dimensions)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}
