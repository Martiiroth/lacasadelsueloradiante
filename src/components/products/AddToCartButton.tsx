'use client'

import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import type { ProductVariant } from '../../types/products'

interface AddToCartButtonProps {
  variant: ProductVariant | null
  disabled?: boolean
  className?: string
  quantity?: number
}

export default function AddToCartButton({ 
  variant, 
  disabled = false, 
  className = '',
  quantity = 1
}: AddToCartButtonProps) {
  const { user } = useAuth()
  const { addToCart, isLoading: cartLoading } = useCart()
  const [message, setMessage] = useState('')

  // Calcular precio según el rol del usuario
  const getEffectivePrice = () => {
    if (!variant) return 0
    
    // Si el usuario tiene un rol y hay precio específico para ese rol
    if (user?.client?.customer_role?.name && variant.role_prices) {
      const rolePrice = variant.role_prices.find(
        rp => rp.role?.name === user.client?.customer_role?.name
      )
      if (rolePrice) {
        return rolePrice.price_cents
      }
    }
    
    // Precio público por defecto
    return variant.price_public_cents
  }

  const handleAddToCart = async () => {
    if (!variant) {
      setMessage('Selecciona una variante')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (variant.stock <= 0) {
      setMessage('Este producto no está disponible')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (quantity > variant.stock) {
      setMessage(`Solo hay ${variant.stock} unidades disponibles`)
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setMessage('')

    try {
      const effectivePrice = getEffectivePrice()
      
      const success = await addToCart({
        variant_id: variant.id,
        qty: quantity,
        price_cents: effectivePrice
      })

      if (success) {
        setMessage('¡Producto añadido al carrito!')
      } else {
        setMessage('Error al añadir al carrito')
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      setMessage('Error inesperado')
    } finally {
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const isDisabled = disabled || !variant || variant.stock <= 0 || cartLoading

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Botón de añadir al carrito */}
      <button
        onClick={handleAddToCart}
        disabled={isDisabled}
        className={`
          w-full py-3 px-6 rounded-lg font-medium transition-all
          ${isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }
          ${cartLoading ? 'animate-pulse' : ''}
        `}
      >
        {cartLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Añadiendo...
          </div>
        ) : !variant ? (
          'Selecciona una variante'
        ) : variant.stock <= 0 ? (
          'Sin stock'
        ) : (
          `Añadir al carrito (${quantity})`
        )}
      </button>

      {/* Mensaje de feedback */}
      {message && (
        <div className={`p-3 rounded-lg text-sm text-center ${
          message.includes('Error') || message.includes('no está') || message.includes('solo hay')
            ? 'bg-red-100 text-red-700 border border-red-200'
            : message.includes('iniciar sesión')
            ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Información adicional */}
      {variant && variant.stock > 0 && variant.stock <= 5 && (
        <p className="text-sm text-orange-600 text-center">
          ⚠️ Quedan solo {variant.stock} unidades
        </p>
      )}

      {/* Opción de backorder si no hay stock */}
      {variant && variant.stock <= 0 && user && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-sm text-gray-600 mb-2">
            Este producto no está en stock actualmente.
          </p>
          <button
            className="text-sm text-blue-600 hover:text-blue-800 underline"
            onClick={() => {
              // TODO: Implementar sistema de backorders
              setMessage('Funcionalidad de reserva próximamente disponible')
              setTimeout(() => setMessage(''), 3000)
            }}
          >
            Notificarme cuando esté disponible
          </button>
        </div>
      )}
    </div>
  )
}