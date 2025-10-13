'use client'

import { useState, useEffect } from 'react'
import type { ProductVariant } from '../../types/products'
import { useAuth } from '../../contexts/AuthContext'

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onVariantChange: (variant: ProductVariant) => void
}

export default function VariantSelector({ 
  variants, 
  selectedVariant, 
  onVariantChange 
}: VariantSelectorProps) {
  const { user } = useAuth()
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    selectedVariant?.id || variants[0]?.id || ''
  )

  useEffect(() => {
    if (selectedVariantId) {
      const variant = variants.find(v => v.id === selectedVariantId)
      if (variant && variant.id !== selectedVariant?.id) {
        onVariantChange(variant)
      }
    }
  }, [selectedVariantId, variants, selectedVariant, onVariantChange])

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2)
  }

  const getRolePrice = (variant: ProductVariant) => {
    if (!user?.client?.customer_role) return null
    
    const rolePrice = variant.role_prices?.find(
      rp => rp.role?.name === user.client?.customer_role?.name
    )
    return rolePrice?.price_cents
  }

  if (variants.length <= 1) {
    return null // No mostrar selector si solo hay una variante
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Seleccionar variante</h3>
      
      <div className="grid gap-3">
        {variants.map((variant) => {
          const rolePrice = getRolePrice(variant)
          const displayPrice = rolePrice || variant.price_public_cents
          const hasDiscount = rolePrice && rolePrice < variant.price_public_cents
          const isSelected = variant.id === selectedVariantId
          const isOutOfStock = variant.stock <= 0

          return (
            <label
              key={variant.id}
              className={`
                relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${isOutOfStock ? 'opacity-75' : ''}
              `}
            >
              <input
                type="radio"
                name="variant"
                value={variant.id}
                checked={isSelected}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                disabled={false}
                className="sr-only"
              />
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {variant.title || `Variante ${variant.sku || ''}`}
                    </h4>
                    {variant.sku && (
                      <p className="text-sm text-gray-500">SKU: {variant.sku}</p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    {hasDiscount && user ? (
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-green-600">
                          €{formatPrice(rolePrice!)}
                        </p>
                        <p className="text-sm text-gray-500 line-through">
                          €{formatPrice(variant.price_public_cents)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-gray-800">
                        €{formatPrice(displayPrice)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center text-sm">
                    {variant.weight_grams && (
                      <span className="text-gray-500 mr-4">
                        Peso: {variant.weight_grams}g
                      </span>
                    )}
                    {variant.dimensions && (
                      <span className="text-gray-500">
                        Dimensiones: {JSON.stringify(variant.dimensions)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Indicador de selección */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Indicador de bajo pedido */}
              {isOutOfStock && (
                <div className="absolute top-2 left-2">
                  <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Bajo pedido
                  </span>
                </div>
              )}
            </label>
          )
        })}
      </div>
      
      {selectedVariant && user && (() => {
        const rolePrice = getRolePrice(selectedVariant)
        const hasDiscount = rolePrice && rolePrice < selectedVariant.price_public_cents
        return hasDiscount && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Precio especial para {user.client?.customer_role?.name}:</strong> 
              {' '}Ahorras €{formatPrice(selectedVariant.price_public_cents - rolePrice)}
            </p>
          </div>
        )
      })()}
    </div>
  )
}