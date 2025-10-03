'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../../../contexts/AuthContext'
import DashboardLayout from '../../../../components/dashboard/DashboardLayout'
import { ClientService } from '../../../../lib/clientService'
import type { ClientOrder, OrderItem } from '../../../../types/client'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [order, setOrder] = useState<ClientOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderId = params.id as string

  useEffect(() => {
    const loadOrderDetail = async () => {
      if (!user?.client?.id || !orderId) return

      try {
        setLoading(true)
        setError(null)
        const orderData = await ClientService.getClientOrder(user.client.id, orderId)
        
        if (orderData) {
          setOrder(orderData)
        } else {
          setError('Pedido no encontrado')
        }
      } catch (error) {
        console.error('Error loading order detail:', error)
        setError('Error al cargar el detalle del pedido')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadOrderDetail()
    }
  }, [user?.client?.id, orderId, authLoading])

  if (authLoading || loading) {
    return (
      <DashboardLayout activeSection="orders">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Denegado
          </h1>
          <p className="text-gray-600 mb-4">
            Debes iniciar sesión para acceder a esta página
          </p>
          <a 
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <DashboardLayout activeSection="orders">
        <div className="p-6">
          <div className="text-center py-12">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{error}</h3>
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard/orders')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver a Pedidos
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout activeSection="orders">
        <div className="p-6">
          <div className="text-center py-12">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Pedido no encontrado</h3>
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard/orders')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver a Pedidos
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5" />
      case 'confirmed':
      case 'processing':
        return <ShoppingBagIcon className="h-5 w-5" />
      case 'shipped':
        return <TruckIcon className="h-5 w-5" />
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5" />
      default:
        return <ShoppingBagIcon className="h-5 w-5" />
    }
  }

  return (
    <DashboardLayout activeSection="orders">
      <div className="p-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/orders')}
              className="inline-flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver a Pedidos
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Pedido #{order.id.slice(0, 8)}
              </h1>
              <p className="text-gray-600 mt-1">
                Realizado el {ClientService.formatDate(order.created_at)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${ClientService.getOrderStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="ml-2">{ClientService.getOrderStatusLabel(order.status)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Detalles del Pedido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Productos */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Productos</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      {/* Imagen del producto */}
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {item.variant?.images?.[0]?.url || item.variant?.product?.images?.[0]?.url ? (
                          <img
                            src={item.variant.images?.[0]?.url || item.variant.product?.images?.[0]?.url}
                            alt={item.variant.product?.title || 'Producto'}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Información del producto */}
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {item.variant?.product?.title || 'Producto'}
                        </h3>
                        {item.variant?.title && (
                          <p className="text-sm text-gray-500">
                            Variante: {item.variant.title}
                          </p>
                        )}
                        {item.variant?.sku && (
                          <p className="text-xs text-gray-400">
                            SKU: {item.variant.sku}
                          </p>
                        )}
                      </div>
                      
                      {/* Cantidad y precio */}
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {ClientService.formatPrice(item.price_cents)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Cantidad: {item.qty}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          Total: {ClientService.formatPrice(item.price_cents * item.qty)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

           

          {/* Resumen del Pedido */}
          <div className="space-y-6">
            {/* Total */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Resumen</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    {ClientService.formatPrice(order.total_cents)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-base font-medium">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">
                      {ClientService.formatPrice(order.total_cents)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}