'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { useHydration } from '../../hooks/useHydration'
import { LoadingState } from '../../components/ui/LoadingState'
import { OrderService } from '../../lib/orders'
import type { Order } from '../../types/checkout'

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const isHydrated = useHydration()

  useEffect(() => {
    if (!isHydrated) return
    if (user?.client?.id) {
      loadOrders()
    }
  }, [user, isHydrated, retryCount])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const clientOrders = await OrderService.getClientOrders(user!.client!.id)
      setOrders(clientOrders)
      setRetryCount(0)
    } catch (err) {
      console.error('Error loading orders:', err)
      setError('Error al cargar los pedidos')
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
        }, 1000 * Math.pow(2, retryCount))
      }
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (cents: number): string => {
    return (cents / 100).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    })
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-purple-100 text-purple-800'
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'confirmed':
        return 'Confirmado'
      case 'processing':
        return 'Procesando'
      case 'shipped':
        return 'Enviado'
      case 'delivered':
        return 'Entregado'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tus pedidos</p>
          <Link 
            href="/auth/login" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  if (!isHydrated || loading) {
    return (
      <LoadingState>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LoadingState>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Error al cargar pedidos
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadOrders}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Pedidos</h1>
          <p className="text-gray-600 mt-2">
            Revisa el estado y detalles de todos tus pedidos
          </p>
        </div>

        {orders.length === 0 ? (
          /* Estado vacío */
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              No tienes pedidos aún
            </h2>
            <p className="text-gray-600 mb-8">
              Cuando realices tu primera compra, aparecerá aquí.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Explorar Productos
            </Link>
          </div>
        ) : (
          /* Lista de pedidos */
          <div className="space-y-6">
            {orders.map((order) => {
              const confirmationNumber = `ORD-${order.id.split('-')[0].toUpperCase()}`
              const itemCount = (order as any).order_items?.length || 0
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Pedido {confirmationNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Realizado el {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="mt-3 sm:mt-0 flex items-center space-x-3">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatPrice(order.total_cents)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-gray-600">
                        {itemCount} producto{itemCount !== 1 ? 's' : ''} • 
                        Envío a {order.shipping_address.city}, {order.shipping_address.region}
                      </div>
                      <div className="mt-3 sm:mt-0 flex space-x-3">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                        >
                          Ver Detalles
                        </Link>
                        {order.status === 'delivered' && (
                          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm">
                            Volver a Comprar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Productos del pedido (preview) */}
                    {(order as any).order_items && (order as any).order_items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-4 overflow-x-auto">
                          {(order as any).order_items.slice(0, 3).map((item: any) => (
                            <div key={item.id} className="flex-shrink-0 flex items-center space-x-2 text-sm text-gray-600">
                              <span className="font-medium">
                                {item.variant?.product?.title || 'Producto'}
                              </span>
                              <span>×{item.qty}</span>
                            </div>
                          ))}
                          {(order as any).order_items.length > 3 && (
                            <span className="text-sm text-gray-500">
                              +{(order as any).order_items.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Información adicional */}
        {orders.length > 0 && (
          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">
              ¿Necesitas ayuda con un pedido?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Seguimiento de envíos</h3>
                <p className="text-blue-800">
                  Recibirás un email con el número de seguimiento cuando tu pedido sea enviado.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Devoluciones</h3>
                <p className="text-blue-800">
                  Tienes 30 días para devolver cualquier producto. 
                  <Link href="/returns" className="underline ml-1">
                    Más información
                  </Link>
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <Link
                href="/contact"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                ¿Tienes alguna pregunta? Contáctanos →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}