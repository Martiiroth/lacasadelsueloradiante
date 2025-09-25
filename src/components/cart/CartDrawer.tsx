'use client'

import { Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '../../contexts/CartContext'
import { Dialog, Transition } from '@headlessui/react'
import { useAuth } from '../../contexts/AuthContext'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter()
  const { cart, cartItems, isLoading, removeFromCart, updateCartItem, clearCart, getTotalPrice } = useCart()
  const { user } = useAuth()

  const handleRemoveFromCart = async (cartItemId: string) => {
    try {
      await removeFromCart(cartItemId)
    } catch (error) {
      console.error('Error removing item from cart:', error)
    }
  }

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    try {
      await updateCartItem(cartItemId, { qty: newQuantity })
    } catch (error) {
      console.error('Error updating cart item quantity:', error)
    }
  }

  const handleCheckout = () => {
    onClose() // Cerrar el drawer
    router.push('/checkout')
  }

  const handleClearCart = async () => {
    try {
      await clearCart()
    } catch (error) {
      console.error('Error clearing cart:', error)
    }
  }

  const totalPrice = getTotalPrice()
  const userRole = user?.client?.customer_role?.name || 'particular'

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-500 sm:duration-700"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-500 sm:duration-700"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                  <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <Dialog.Title className="text-lg font-medium text-gray-900">
                        Carrito de compras
                      </Dialog.Title>
                      <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                          onClick={onClose}
                        >
                          <span className="sr-only">Cerrar panel</span>
                          <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mt-8">
                      {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                      ) : !cartItems || cartItems.length === 0 ? (
                        <div className="text-center py-8">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h-.9m15.4 0v0a1 1 0 01-1 1H9m8-1a1 1 0 01-1 1m1-1h.01M19 19a2 2 0 11-4 0 2 2 0 014 0zM9 19a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">Tu carrito está vacío</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Comienza agregando algunos productos fantásticos.
                          </p>
                        </div>
                      ) : (
                        <div className="flow-root">
                          <ul role="list" className="-my-6 divide-y divide-gray-200">
                            {cartItems.map((item) => (
                              <li key={item.id} className="py-6 flex">
                                <div className="flex items-center space-x-4 w-full">
                                  {/* Placeholder para imagen */}
                                  <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                  </div>

                                  {/* Información del item */}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-gray-900">
                                      Producto ID: {item.variant_id}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      €{(item.price_at_addition_cents / 100).toFixed(2)} c/u
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Cantidad: {item.qty}
                                    </p>
                                  </div>

                                  {/* Controles */}
                                  <div className="flex flex-col items-end space-y-2">
                                    <p className="text-sm font-medium text-gray-900">
                                      €{((item.price_at_addition_cents * item.qty) / 100).toFixed(2)}
                                    </p>
                                    <button
                                      onClick={() => handleRemoveFromCart(item.id)}
                                      className="text-xs text-red-600 hover:text-red-800"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {cartItems && cartItems.length > 0 && (
                    <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <p>Subtotal</p>
                        <p>€{totalPrice.toFixed(2)}</p>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        Envío e impuestos calculados al finalizar la compra.
                      </p>
                      <div className="mt-6 space-y-3">
                        <button
                          onClick={handleClearCart}
                          className="w-full flex justify-center items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Vaciar carrito
                        </button>
                        <button
                          onClick={handleCheckout}
                          disabled={cartItems.length === 0 || isLoading}
                          className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Proceder al Pago
                        </button>
                      </div>
                      <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                        <p>
                          o{' '}
                          <button
                            type="button"
                            className="font-medium text-blue-600 hover:text-blue-500"
                            onClick={onClose}
                          >
                            Continuar comprando
                            <span aria-hidden="true"> &rarr;</span>
                          </button>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}