'use client'

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import type { ProductVariant } from '../../types/products'

interface AddToCartButtonProps {
  variant: ProductVariant
  quantity?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showQuantity?: boolean
}

export default function AddToCartButton({ 
  variant, 
  quantity = 1,
  className = '',
  size = 'md',
  showQuantity = false
}: AddToCartButtonProps) {
  const { user } = useAuth()
  const { addToCart, isLoading, getItemCount } = useCart()
  const [localQuantity, setLocalQuantity] = useState(quantity)
  const [isAdding, setIsAdding] = useState(false)

  const currentQuantityInCart = getItemCount(variant.id)

  const handleAddToCart = async () => {
    if (!user) {
      // TODO: Mostrar modal de login
      alert('Debes iniciar sesión para añadir productos al carrito')
      return
    }

    if (variant.stock < localQuantity) {
      alert('No hay suficiente stock disponible')
      return
    }

    setIsAdding(true)
    
    // Obtener precio correcto basado en rol del usuario
    const userRole = user.client?.customer_role?.name
    const rolePrice = userRole && variant.role_prices?.find(rp => rp.role?.name === userRole)
    const finalPrice = rolePrice ? rolePrice.price_cents : variant.price_public_cents

    const success = await addToCart({
      variant_id: variant.id,
      qty: localQuantity,
      price_cents: finalPrice
    })

    if (success) {
      // Resetear cantidad local después de añadir
      setLocalQuantity(1)
    }
    
    setIsAdding(false)
  }

  // Configuración de estilos por tamaño
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const isOutOfStock = variant.stock === 0
  const isDisabled = isLoading || isAdding || isOutOfStock

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showQuantity && !isOutOfStock && (
        <div className="flex items-center border border-gray-300 rounded-md">
          <button
            type="button"
            onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))}
            disabled={localQuantity <= 1}
            className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            −
          </button>
          <input
            type="number"
            min="1"
            max={variant.stock}
            value={localQuantity}
            onChange={(e) => setLocalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 text-center border-0 focus:ring-0"
          />
          <button
            type="button"
            onClick={() => setLocalQuantity(Math.min(variant.stock, localQuantity + 1))}
            disabled={localQuantity >= variant.stock}
            className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={isDisabled}
        className={`
          ${sizeClasses[size]}
          ${isOutOfStock 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
          ${isDisabled && !isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}
          font-medium rounded-md transition-colors duration-200 flex items-center gap-2
        `}
      >
        {isAdding ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Añadiendo...
          </>
        ) : isOutOfStock ? (
          'Sin stock'
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h-.9m15.4 0v0a1 1 0 01-1 1H9m8-1a1 1 0 01-1 1m1-1h.01M19 19a2 2 0 11-4 0 2 2 0 014 0zM9 19a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {currentQuantityInCart > 0 
              ? `Añadir más (${currentQuantityInCart} en carrito)` 
              : 'Añadir al carrito'
            }
          </>
        )}
      </button>

      {variant.stock <= 5 && variant.stock > 0 && (
        <span className="text-sm text-brand-600 font-medium">
          ¡Solo quedan {variant.stock}!
        </span>
      )}
    </div>
  )
}