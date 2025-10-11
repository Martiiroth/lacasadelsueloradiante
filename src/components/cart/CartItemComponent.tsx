'use client'

import Image from 'next/image'
import { CartItem } from '../../types/cart'

interface CartItemComponentProps {
  item: CartItem
  userRole: string
  onRemove: () => void
  onUpdateQuantity: (newQuantity: number) => void
}

export default function CartItemComponent({ 
  item, 
  userRole, 
  onRemove, 
  onUpdateQuantity 
}: CartItemComponentProps) {
  const variant = item.variant
  const quantity = item.qty
  const product = variant?.product

  if (!variant || !product) {
    return null // O mostrar un estado de error
  }

  // El precio se obtiene del precio almacenado al agregar al carrito
  const unitPrice = item.price_at_addition_cents / 100
  const totalPrice = unitPrice * quantity

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      onRemove()
    } else {
      onUpdateQuantity(newQuantity)
    }
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Imagen del producto */}
      <div className="flex-shrink-0 w-16 h-16 relative">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt || product.title}
            fill
            className="object-cover rounded-md"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Información del producto */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {variant.title}
        </h3>
        <p className="text-xs text-gray-500 truncate">
          {product.title}
        </p>
        <p className="text-xs text-gray-500">
          SKU: {variant.sku}
        </p>
        <p className="text-sm text-gray-600">
          €{unitPrice.toFixed(2)} cada uno
        </p>
      </div>

      {/* Controles de cantidad */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          disabled={quantity <= 1}
        >
          <span className="text-xs">-</span>
        </button>
        
        <span className="text-sm font-medium w-8 text-center">
          {quantity}
        </span>
        
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          disabled={quantity >= variant.stock}
        >
          <span className="text-xs">+</span>
        </button>
      </div>

      {/* Precio total y botón eliminar */}
      <div className="flex flex-col items-end space-y-1">
        <p className="text-sm font-medium text-gray-900">
          €{totalPrice.toFixed(2)}
        </p>
        <button
          onClick={onRemove}
          className="text-xs text-red-600 hover:text-red-800"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}