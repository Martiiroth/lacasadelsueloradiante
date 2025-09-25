'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../../../contexts/AuthContext'
import { OrderService } from '../../../lib/orders'
import type { Order } from '../../../types/checkout'

export default function OrderDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && id) {
      loadOrder(id as string)
    }
  }, [user, id])

  const loadOrder = async (orderId: string) => {
    try {
      setLoading(true)
      const orderData = await OrderService.getOrder(orderId)
      
      if (orderData) {
        setOrder(orderData)
      } else {
        setError('Pedido no encontrado')
      }
    } catch (err) {
      console.error('Error loading order:', err)
      setError('Error al cargar el pedido')
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Pedido no encontrado'}
            </h1>
            <Link
              href="/orders"
              className="text-blue-600 hover:text-blue-800"
            >
              Ver todos mis pedidos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const confirmationNumber = `ORD-${order.id.split('-')[0].toUpperCase()}`

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/orders"
            className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
          >
            ← Volver a mis pedidos
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pedido {confirmationNumber}
              </h1>
              <p className="text-gray-600 mt-2">
                Realizado el {formatDate(order.created_at)}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del pedido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Productos */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Productos ({(order as any).order_items?.length || 0})
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {(order as any).order_items?.map((item: any) => (
                  <div key={item.id} className="p-6 flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.variant?.product?.images?.[0] ? (
                        <Image
                          src={item.variant.product.images[0].url}
                          alt={item.variant.product.images[0].alt || item.variant?.product?.title || ''}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Sin imagen</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.variant?.product?.title || 'Producto'}
                      </h3>
                      {item.variant?.title && (
                        <p className="text-sm text-gray-600">{item.variant.title}</p>
                      )}
                      {item.variant?.sku && (
                        <p className="text-xs text-gray-500">SKU: {item.variant.sku}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Cantidad: {item.qty}</p>
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.price_cents * item.qty)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dirección de envío */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Dirección de Envío
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">
                  {order.shipping_address.first_name} {order.shipping_address.last_name}
                </p>
                {order.shipping_address.company_name && (
                  <p className="text-gray-600">{order.shipping_address.company_name}</p>
                )}
                <p className="text-gray-600">{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && (
                  <p className="text-gray-600">{order.shipping_address.address_line2}</p>
                )}
                <p className="text-gray-600">
                  {order.shipping_address.postal_code} {order.shipping_address.city}, {order.shipping_address.region}
                </p>
                <p className="text-gray-600">{order.shipping_address.country || 'España'}</p>
                {order.shipping_address.phone && (
                  <p className="text-gray-600 mt-2">Tel: {order.shipping_address.phone}</p>
                )}
                <p className="text-gray-600">Email: {order.shipping_address.email}</p>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen del Pedido
              </h2>
              
              <dl className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <dt className="text-gray-600">ID del pedido:</dt>
                  <dd className="font-mono text-xs text-gray-900">{order.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Estado:</dt>
                  <dd className="text-gray-900">{getStatusText(order.status)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Fecha:</dt>
                  <dd className="text-gray-900">{formatDate(order.created_at)}</dd>
                </div>
              </dl>

              <div className="border-t pt-4">
                <div className="flex justify-between font-medium text-lg">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">
                    {formatPrice(order.total_cents)}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-6 space-y-3">
                {order.status === 'pending' && (
                  <button className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                    Cancelar Pedido
                  </button>
                )}
                
                <Link
                  href="/contact"
                  className="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Contactar Soporte
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}