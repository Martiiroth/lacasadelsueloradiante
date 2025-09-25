'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'

export default function CartPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    cartItems, 
    updateCartItem, 
    removeFromCart, 
    clearCart, 
    getTotalItems, 
    getTotalPrice,
    isLoading 
  } = useCart()
  
  const [isClearing, setIsClearing] = useState(false)

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) {
      await removeFromCart(itemId)
    } else {
      await updateCartItem(itemId, { qty: newQty })
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    await removeFromCart(itemId)
  }

  const handleClearCart = async () => {
    setIsClearing(true)
    await clearCart()
    setIsClearing(false)
  }

  const handleCheckout = () => {
    router.push('/checkout')
  }

  const formatPrice = (cents: number): string => {
    return (cents / 100).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    })
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Tu Carrito</h1>
            <div className="bg-white rounded-lg shadow-sm border p-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6m0 0h9m-9 0h2" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tu carrito está vacío
              </h2>
              <p className="text-gray-600 mb-8">
                Parece que aún no has añadido ningún producto a tu carrito.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Ver Productos
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tu Carrito</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Productos ({getTotalItems()})
                </h2>
                <button
                  onClick={handleClearCart}
                  disabled={isClearing || isLoading}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {isClearing ? 'Vaciando...' : 'Vaciar carrito'}
                </button>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Imagen del producto */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.variant?.product?.image ? (
                          <Image
                            src={item.variant.product.image.url}
                            alt={item.variant.product.image.alt || item.variant?.product?.title || ''}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Sin imagen</span>
                          </div>
                        )}
                      </div>

                      {/* Información del producto */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {item.variant?.product?.title || 'Producto'}
                        </h3>
                        {item.variant?.title && (
                          <p className="text-sm text-gray-600">{item.variant.title}</p>
                        )}
                        {item.variant?.sku && (
                          <p className="text-xs text-gray-500">SKU: {item.variant.sku}</p>
                        )}
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatPrice(item.price_at_addition_cents)}
                        </p>
                      </div>

                      {/* Controles de cantidad */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.qty - 1)}
                          disabled={isLoading}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.qty + 1)}
                          disabled={isLoading}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      {/* Precio total del item */}
                      <div className="text-right">
                        <p className="text-lg font-medium text-gray-900">
                          {formatPrice(item.price_at_addition_cents * item.qty)}
                        </p>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isLoading}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 mt-1"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen del Pedido
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({getTotalItems()} productos)</span>
                  <span className="text-gray-900">{formatPrice(getTotalPrice() * 100)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className="text-gray-900">Calculado en checkout</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-medium text-gray-900">Total estimado</span>
                    <span className="text-lg font-medium text-gray-900">
                      {formatPrice(getTotalPrice() * 100)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={isLoading || cartItems.length === 0}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Proceder al Checkout
                </button>
                
                <Link
                  href="/products"
                  className="block w-full text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Continuar Comprando
                </Link>
              </div>

              {/* Información adicional */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Envío gratuito en pedidos superiores a 50€
                </div>
                <div className="flex items-center text-sm text-gray-600 mt-2">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Devoluciones gratuitas en 30 días
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}