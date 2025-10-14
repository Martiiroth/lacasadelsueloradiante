'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminOrder, AdminFilters } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

export default function AdminOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [displayedCount, setDisplayedCount] = useState(20)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AdminFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadOrders()
  }, [filters])

  const loadOrders = async () => {
    try {
      setLoading(true)
      // Cargar hasta 1000 pedidos (o un número grande razonable)
      const data = await AdminService.getAllOrders(filters, 1000, 0)
      setOrders(data)
      setTotalCount(data.length)
      setDisplayedCount(20) // Reset display count
    } catch (err) {
      console.error('Error loading orders:', err)
      setError('Error al cargar los pedidos')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    const newDisplayedCount = displayedCount + 20
    setDisplayedCount(newDisplayedCount)
  }

  const handleShowAll = () => {
    // Show all filtered orders
    setDisplayedCount(10000) // Set to a large number
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({
      ...filters,
      order_client_search: searchTerm || undefined
    })
  }

  const handleFilterChange = () => {
    setFilters({
      ...filters,
      order_status: selectedStatus ? [selectedStatus as any] : undefined,
      order_date_from: dateFrom || undefined,
      order_date_to: dateTo || undefined
    })
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const success = await AdminService.updateOrderStatus(orderId, {
        status: newStatus as any
      })
      
      if (success) {
        // Recargar pedidos
        loadOrders()
      } else {
        alert('Error al actualizar el estado del pedido')
      }
    } catch (err) {
      console.error('Error updating order status:', err)
      alert('Error al actualizar el estado del pedido')
    }
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const success = await AdminService.deleteOrder(orderId)
      
      if (success) {
        // Recargar pedidos
        loadOrders()
        alert('Pedido eliminado correctamente')
      } else {
        alert('Error al eliminar el pedido')
      }
    } catch (err) {
      console.error('Error deleting order:', err)
      alert('Error al eliminar el pedido')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'processing':
        return <ClockIcon className="h-4 w-4" />
      case 'shipped':
        return <TruckIcon className="h-4 w-4" />
      case 'delivered':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
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

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
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
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <ShoppingBagIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-indigo-600" />
                Gestión de Pedidos
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Administra todos los pedidos de la plataforma</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="text-sm text-gray-500 text-center sm:text-left">
                Mostrando {Math.min(displayedCount, orders.length)} de {orders.length} pedidos
              </div>
              <button
                onClick={() => router.push('/admin/orders/create')}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Pedido
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Search */}
              <form onSubmit={handleSearch} className="lg:col-span-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Buscar por cliente..."
                  />
                </div>
              </form>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="processing">Procesando</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>

              {/* Date From */}
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />

              {/* Date To */}
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />

              {/* Apply Filters Button */}
              <div className="lg:col-span-5">
                <button
                  type="button"
                  onClick={handleFilterChange}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List - Responsive Design */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.slice(0, displayedCount).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingBagIcon className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.id.slice(-8)}
                          </div>
                          {order.invoice && (
                            <div className="text-sm text-gray-500">
                              Factura: {order.invoice.prefix}{order.invoice.invoice_number}{order.invoice.suffix}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.client ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.client.first_name} {order.client.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.client.email}
                          </div>
                        </div>
                      ) : order.billing_address ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            <span className="inline-flex items-center">
                              {order.billing_address.first_name} {order.billing_address.last_name}
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Invitado
                              </span>
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.billing_address.email}
                          </div>
                          {order.billing_address.phone && (
                            <div className="text-xs text-gray-400">
                              Tel: {order.billing_address.phone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Cliente no encontrado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-0 bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmado</option>
                          <option value="processing">Procesando</option>
                          <option value="shipped">Enviado</option>
                          <option value="delivered">Entregado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        €{(order.total_cents / 100).toFixed(2)}
                      </div>
                      {order.order_items && (
                        <div className="text-sm text-gray-500">
                          {order.order_items.length} artículos
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {new Date(order.created_at).toLocaleDateString('es-ES')}
                      </div>
                      <div className="text-xs">
                        {new Date(order.created_at).toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/orders/${order.id}/edit`)}
                          className="text-gray-600 hover:text-gray-900 flex items-center"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Shown only on mobile/tablet */}
          <div className="lg:hidden">
            <div className="divide-y divide-gray-200">
              {orders.slice(0, displayedCount).map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <ShoppingBagIcon className="h-8 w-8 text-gray-400 mr-3 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          Pedido #{order.id.slice(-8)}
                        </div>
                        {order.invoice && (
                          <div className="text-sm text-gray-500">
                            Factura: {order.invoice.prefix}{order.invoice.invoice_number}{order.invoice.suffix}
                          </div>
                        )}
                        {order.client ? (
                          <div className="mt-1">
                            <div className="text-sm text-gray-900">
                              {order.client.first_name} {order.client.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.client.email}
                            </div>
                          </div>
                        ) : order.billing_address ? (
                          <div className="mt-1">
                            <div className="text-sm text-gray-900">
                              <span className="inline-flex items-center">
                                {order.billing_address.first_name} {order.billing_address.last_name}
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Invitado
                                </span>
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.billing_address.email}
                            </div>
                            {order.billing_address.phone && (
                              <div className="text-xs text-gray-400">
                                Tel: {order.billing_address.phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Cliente no encontrado</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/orders/${order.id}/edit`)}
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-1">ESTADO</span>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-indigo-500 outline-none ${AdminService.getOrderStatusColor(order.status)}`}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="processing">Procesando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-1">TOTAL</span>
                      <div className="text-sm font-medium text-gray-900">
                        €{(order.total_cents / 100).toFixed(2)}
                      </div>
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {order.order_items.length} artículos
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-1">FECHA</span>
                      <div className="text-sm text-gray-900">
                        {new Date(order.created_at).toLocaleDateString('es-ES')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {orders.length > 0 && displayedCount < orders.length && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cargando...
                    </>
                  ) : (
                    <>
                      Ver más pedidos
                      <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleShowAll}
                  disabled={loadingMore}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 border-2 border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mostrar todos ({orders.length})
                </button>
              </div>
            </div>
          )}

          {orders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pedidos</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedStatus || dateFrom || dateTo
                  ? 'No se encontraron pedidos que coincidan con los filtros aplicados.'
                  : 'Aún no hay pedidos registrados en la plataforma.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}