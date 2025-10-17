'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminOrder } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  ShoppingBagIcon,
  UserIcon,
  MapPinIcon,
  CreditCardIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  TruckIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import DeliverOrderButton from '@/components/admin/DeliverOrderButton'

export default function AdminOrderDetail() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const orderId = params.id as string

  useEffect(() => {
    if (orderId) {
      loadOrderDetail()
    }
  }, [orderId])

  const loadOrderDetail = async () => {
    try {
      setLoading(true)
      const orders = await AdminService.getAllOrders({})
      const foundOrder = orders.find(o => o.id === orderId)
      
      if (foundOrder) {
        setOrder(foundOrder)
        // Debug: verificar estructura de datos
        console.log('🔍 Order data:', foundOrder)
        console.log('🔍 shipping_address:', foundOrder.shipping_address)
        console.log('🔍 client:', foundOrder.client)
        console.log('🔍 shipping_address?.billing:', foundOrder.shipping_address?.billing)
      } else {
        setError('Pedido no encontrado')
      }
    } catch (err) {
      console.error('Error loading order detail:', err)
      setError('Error al cargar el detalle del pedido')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!order) return
    
    try {
      setUpdating(true)
      const success = await AdminService.updateOrderStatus(order.id, {
        status: newStatus as any
      })
      
      if (success) {
        setOrder({ ...order, status: newStatus as any })
      } else {
        alert('Error al actualizar el estado del pedido')
      }
    } catch (err) {
      console.error('Error updating order status:', err)
      alert('Error al actualizar el estado del pedido')
    } finally {
      setUpdating(false)
    }
  }

  const deleteOrder = async () => {
    if (!order) return
    
    if (!confirm('¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.')) {
      return
    }
    
    try {
      const success = await AdminService.deleteOrder(order.id)
      
      if (success) {
        alert('Pedido eliminado correctamente')
        router.push('/admin/orders')
      } else {
        alert('Error al eliminar el pedido')
      }
    } catch (err) {
      console.error('Error deleting order:', err)
      alert('Error al eliminar el pedido')
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmado',
      'processing': 'Procesando',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'processing': 'bg-purple-100 text-purple-800',
      'shipped': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <ShoppingBagIcon className="h-8 w-8 mr-3 text-indigo-600" />
                  Pedido #{order.id.slice(-8)}
                </h1>
                <p className="mt-2 text-gray-600">
                  Creado el {new Date(order.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <DeliverOrderButton
                orderId={order.id}
                currentStatus={order.status}
                onStatusUpdate={(newStatus, message) => {
                  setOrder({ ...order, status: newStatus as any })
                  if (message) {
                    alert(message)
                  }
                }}
                disabled={updating}
              />
              <button
                onClick={() => router.push(`/admin/orders/${order.id}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={deleteOrder}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <TagIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Estado del Pedido
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    disabled={updating}
                    className="ml-4 block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="processing">Procesando</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <ShoppingBagIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Artículos del Pedido
                </h3>
              </div>
              <div className="px-6 py-4">
                {order.order_items && order.order_items.length > 0 ? (
                  <div className="space-y-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {/* Debug: mostrar qué datos tenemos */}
                            {console.log('Variant data:', item.variant)}
                            {item.variant ? (
                              // Prioritario: título específico de la variante
                              (item.variant as any).title ||
                              // Fallback: opciones concatenadas
                              [(item.variant as any).option1, (item.variant as any).option2, (item.variant as any).option3]
                                .filter(Boolean)
                                .join(' / ') ||
                              // Último recurso: mostrar que es una variante sin nombre específico
                              `${(item.variant as any).product?.title} - Variante` ||
                              'Variante sin identificar'
                            ) : (
                              'Producto sin variante'
                            )}
                          </h4>
                          {/* Mostrar producto padre como contexto si hay variante */}
                          {item.variant && (
                            <p className="text-sm text-gray-500">
                              {((item.variant as any)?.product?.title || '')}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            Cantidad: {item.qty}
                          </p>
                          {item.variant?.sku && (
                            <p className="text-xs text-gray-400">
                              SKU: {item.variant.sku}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            €{(item.price_cents / 100).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Total: €{((item.price_cents * item.qty) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay artículos en este pedido</p>
                )}
              </div>
            </div>

            {/* Addresses */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Direcciones
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Billing Address - Extraer del shipping_address */}
                  {order.shipping_address?.billing && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Dirección de Facturación</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{order.shipping_address.billing.first_name} {order.shipping_address.billing.last_name}</p>
                        <p>{order.shipping_address.billing.email}</p>
                        {order.shipping_address.billing.phone && <p>{order.shipping_address.billing.phone}</p>}
                        <p>{order.shipping_address.billing.address_line1}</p>
                        {order.shipping_address.billing.address_line2 && <p>{order.shipping_address.billing.address_line2}</p>}
                        <p>{order.shipping_address.billing.postal_code} {order.shipping_address.billing.city}</p>
                        <p>{order.shipping_address.billing.region}</p>
                        {order.shipping_address.billing.nif_cif && (
                          <p className="font-medium">NIF/CIF: {order.shipping_address.billing.nif_cif}</p>
                        )}
                        {order.shipping_address.billing.company_name && (
                          <p className="font-medium">{order.shipping_address.billing.company_name}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Shipping Address - Extraer del shipping_address */}
                  {order.shipping_address?.shipping && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Dirección de Envío</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{order.shipping_address.shipping.first_name} {order.shipping_address.shipping.last_name}</p>
                        {order.shipping_address.shipping.phone && <p>{order.shipping_address.shipping.phone}</p>}
                        <p>{order.shipping_address.shipping.address_line1}</p>
                        {order.shipping_address.shipping.address_line2 && <p>{order.shipping_address.shipping.address_line2}</p>}
                        <p>{order.shipping_address.shipping.postal_code} {order.shipping_address.shipping.city}</p>
                        <p>{order.shipping_address.shipping.region}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Cliente
                </h3>
              </div>
              <div className="px-6 py-4">
                {order.client ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.client.first_name} {order.client.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{order.client.email}</p>
                    </div>
                    
                    {/* Additional client info if available */}
                    {(order.client as any).phone && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Teléfono</p>
                        <p className="text-sm text-gray-900">{(order.client as any).phone}</p>
                      </div>
                    )}
                    
                    {(order.client as any).nif_cif && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">NIF/CIF</p>
                        <p className="text-sm text-gray-900">{(order.client as any).nif_cif}</p>
                      </div>
                    )}
                    
                    {(order.client as any).company_name && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</p>
                        <p className="text-sm text-gray-900">{(order.client as any).company_name}</p>
                        {(order.client as any).company_position && (
                          <p className="text-xs text-gray-600">{(order.client as any).company_position}</p>
                        )}
                      </div>
                    )}
                    
                    {(order.client as any).activity && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actividad</p>
                        <p className="text-sm text-gray-900">{(order.client as any).activity}</p>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-gray-200">
                      <button
                        onClick={() => router.push(`/admin/clients/${order.client?.id}`)}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Ver perfil completo del cliente →
                      </button>
                    </div>
                  </div>
                ) : order.shipping_address?.billing ? (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {order.shipping_address.billing.first_name} {order.shipping_address.billing.last_name}
                      </p>
                      <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Cliente Invitado
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{order.shipping_address.billing.email}</p>
                    </div>
                    
                    {order.shipping_address.billing.phone && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Teléfono</p>
                        <p className="text-sm text-gray-900">{order.shipping_address.billing.phone}</p>
                      </div>
                    )}
                    
                    {order.shipping_address.billing.nif_cif && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">NIF/CIF</p>
                        <p className="text-sm text-gray-900">{order.shipping_address.billing.nif_cif}</p>
                      </div>
                    )}
                    
                    {order.shipping_address.billing.company_name && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</p>
                        <p className="text-sm text-gray-900">{order.shipping_address.billing.company_name}</p>
                        {order.shipping_address.billing.company_position && (
                          <p className="text-xs text-gray-600">{order.shipping_address.billing.company_position}</p>
                        )}
                      </div>
                    )}
                    
                    {order.shipping_address.billing.activity && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actividad</p>
                        <p className="text-sm text-gray-900">{order.shipping_address.billing.activity}</p>
                      </div>
                    )}

                    {order.shipping_address.billing.city && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dirección</p>
                        <div className="text-sm text-gray-900 space-y-1">
                          <p>{order.shipping_address.billing.address_line1}</p>
                          {order.shipping_address.billing.address_line2 && <p>{order.shipping_address.billing.address_line2}</p>}
                          <p>{order.shipping_address.billing.postal_code} {order.shipping_address.billing.city}</p>
                          <p>{order.shipping_address.billing.region}</p>
                          {order.shipping_address.billing.country && <p>{order.shipping_address.billing.country}</p>}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Este pedido fue realizado por un cliente sin cuenta registrada
                      </p>
                    </div>
                  </div>
                ) : order.shipping_address && typeof order.shipping_address === 'object' ? (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        Cliente Invitado
                      </p>
                      <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Datos Legacy
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs font-medium text-gray-500 mb-2">Datos de dirección disponibles:</p>
                      <pre className="text-xs text-gray-700 overflow-auto">
                        {JSON.stringify(order.shipping_address, null, 2)}
                      </pre>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Estructura de datos antigua - necesita migración
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Cliente no encontrado</p>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CreditCardIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Resumen
                </h3>
              </div>
              <div className="px-6 py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total</span>
                  <span className="font-medium text-gray-900">€{(order.total_cents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Artículos</span>
                  <span className="text-gray-900">{order.order_items?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fecha de creación</span>
                  <span className="text-gray-900">{new Date(order.created_at).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Última actualización</span>
                  <span className="text-gray-900">{new Date(order.updated_at).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
            </div>

            {/* Invoice */}
            {order.invoice && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Factura
                  </h3>
                </div>
                <div className="px-6 py-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Número</span>
                    <span className="font-medium text-gray-900">
                      {order.invoice.prefix}{order.invoice.invoice_number}{order.invoice.suffix}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estado</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      order.invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.invoice.status === 'paid' ? 'Pagada' :
                       order.invoice.status === 'pending' ? 'Pendiente' :
                       order.invoice.status === 'overdue' ? 'Vencida' :
                       order.invoice.status === 'cancelled' ? 'Cancelada' :
                       order.invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}