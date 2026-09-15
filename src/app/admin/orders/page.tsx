'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminOrder, AdminFilters } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminToast } from '@/components/admin/AdminToast'
import {
  getOrderStatusLabel,
  getOrderStatusColor,
  ORDER_STATUS_FLOW,
} from '@/lib/adminOrderStatus'
import {
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline'

function AdminOrdersInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success, error: toastError } = useAdminToast()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [displayedCount, setDisplayedCount] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AdminFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const statusFromUrl = searchParams.get('status') || ''
    setSelectedStatus(statusFromUrl)
    setFilters((prev) => ({
      ...prev,
      order_status: statusFromUrl ? [statusFromUrl as any] : undefined,
    }))
  }, [searchParams])

  useEffect(() => {
    loadOrders()
  }, [filters])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null)
        setConfirmDeleteId(null)
      }
    }
    if (openMenuId || confirmDeleteId) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [openMenuId, confirmDeleteId])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await AdminService.getAllOrders(filters, 1000, 0)
      setOrders(data)
      setDisplayedCount(20)
    } catch (err) {
      console.error('Error loading orders:', err)
      setError('Error al cargar los pedidos')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({
      ...filters,
      order_client_search: searchTerm || undefined,
    })
  }

  const applyStatusFilter = (status: string) => {
    setSelectedStatus(status)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    router.replace(`/admin/orders${params.toString() ? `?${params}` : ''}`)
    setFilters({
      ...filters,
      order_status: status ? [status as any] : undefined,
      order_date_from: dateFrom || undefined,
      order_date_to: dateTo || undefined,
    })
  }

  const handleFilterChange = () => {
    setFilters({
      ...filters,
      order_status: selectedStatus ? [selectedStatus as any] : undefined,
      order_date_from: dateFrom || undefined,
      order_date_to: dateTo || undefined,
    })
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const ok = await AdminService.updateOrderStatus(orderId, {
        status: newStatus as any,
      })
      if (ok) {
        success(`Estado actualizado a ${getOrderStatusLabel(newStatus)}`)
        loadOrders()
      } else {
        toastError('Error al actualizar el estado del pedido')
      }
    } catch (err) {
      console.error('Error updating order status:', err)
      toastError('Error al actualizar el estado del pedido')
    }
  }

  const deleteOrder = async (orderId: string) => {
    try {
      const ok = await AdminService.deleteOrder(orderId)
      if (ok) {
        success('Pedido eliminado')
        setConfirmDeleteId(null)
        loadOrders()
      } else {
        toastError('Error al eliminar el pedido')
      }
    } catch (err) {
      console.error('Error deleting order:', err)
      toastError('Error al eliminar el pedido')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <ClockIcon className="h-4 w-4" />
      case 'confirmed':
      case 'delivered':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'shipped':
        return <TruckIcon className="h-4 w-4" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <AdminLayout activeSection="orders">
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout activeSection="orders">
        <div className="rounded-md border border-red-200 bg-red-50 p-6">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </div>
      </AdminLayout>
    )
  }

  const visibleOrders = orders.slice(0, displayedCount)
  const chipStatuses = [
    { id: '', label: 'Todos' },
    ...ORDER_STATUS_FLOW.map((s) => ({ id: s, label: getOrderStatusLabel(s) })),
    { id: 'cancelled', label: 'Cancelado' },
  ]

  return (
    <AdminLayout activeSection="orders">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
              <ShoppingBagIcon className="h-7 w-7 text-red-600" />
              Pedidos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''}
              {selectedStatus ? ` · ${getOrderStatusLabel(selectedStatus)}` : ''}
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/orders/create')}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Nuevo pedido
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {chipStatuses.map((chip) => {
            const active = selectedStatus === chip.id
            return (
              <button
                key={chip.id || 'all'}
                type="button"
                onClick={() => applyStatusFilter(chip.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                  active
                    ? 'bg-slate-900 text-white ring-slate-900'
                    : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {chip.label}
              </button>
            )
          })}
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <form onSubmit={handleSearch} className="lg:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Buscar por cliente o email..."
                />
              </div>
            </form>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={handleFilterChange}
                className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
            <ShoppingBagIcon className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">No hay pedidos</h3>
            <p className="mt-1 text-sm text-slate-500">
              {selectedStatus
                ? `No hay pedidos en estado “${getOrderStatusLabel(selectedStatus)}”.`
                : 'Cuando lleguen pedidos aparecerán aquí.'}
            </p>
            <button
              type="button"
              onClick={() => router.push('/admin/orders/create')}
              className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <PlusIcon className="mr-1.5 h-4 w-4" />
              Crear pedido
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[720px] divide-y divide-slate-100">
                <thead className="sticky top-0 bg-slate-50/95 backdrop-blur">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Pedido</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleOrders.map((order) => {
                    const clientName = order.client
                      ? `${order.client.first_name} ${order.client.last_name}`
                      : order.billing_address
                        ? `${order.billing_address.first_name} ${order.billing_address.last_name}`
                        : '—'
                    const clientEmail = order.client?.email || order.billing_address?.email || ''
                    return (
                      <tr
                        key={order.id}
                        className="cursor-pointer hover:bg-slate-50/80"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-semibold text-slate-900">
                            #{order.id.slice(-8)}
                          </span>
                          {order.order_items && (
                            <div className="text-xs text-slate-400">{order.order_items.length} art.</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-900">{clientName}</div>
                          <div className="max-w-[200px] truncate text-xs text-slate-500">{clientEmail}</div>
                          {!order.client && order.billing_address && (
                            <span className="mt-0.5 inline-flex rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                              Invitado
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {new Date(order.created_at).toLocaleDateString('es-ES')}
                          <div className="text-xs text-slate-400">
                            {new Date(order.created_at).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-900">
                          €{(order.total_cents / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-medium ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-red-500 ${getOrderStatusColor(order.status)}`}
                          >
                            <option value="pending">Pendiente</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="processing">Procesando</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => router.push(`/admin/orders/${order.id}`)}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              title="Ver"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/admin/orders/${order.id}/edit`)}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)}
                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                              >
                                <EllipsisVerticalIcon className="h-4 w-4" />
                              </button>
                              {openMenuId === order.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                  <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                                    <button
                                      onClick={() => {
                                        setConfirmDeleteId(order.id)
                                        setOpenMenuId(null)
                                      }}
                                      className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                      <TrashIcon className="mr-2 h-4 w-4" />
                                      Eliminar
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {visibleOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 active:bg-slate-50"
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-sm font-semibold text-slate-900">
                        #{order.id.slice(-8)}
                      </div>
                      <div className="mt-0.5 text-sm text-slate-700">
                        {order.client
                          ? `${order.client.first_name} ${order.client.last_name}`
                          : order.billing_address
                            ? `${order.billing_address.first_name} ${order.billing_address.last_name}`
                            : 'Cliente'}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {new Date(order.created_at).toLocaleDateString('es-ES')} · €
                        {(order.total_cents / 100).toFixed(2)}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getOrderStatusColor(order.status)}`}
                    >
                      {getStatusIcon(order.status)}
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {displayedCount < orders.length && (
              <div className="flex justify-center gap-3 border-t border-slate-100 px-4 py-4">
                <button
                  type="button"
                  onClick={() => setDisplayedCount((c) => c + 20)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cargar más
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayedCount(10000)}
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  Ver todos ({orders.length})
                </button>
              </div>
            )}
          </div>
        )}

        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
              <h3 className="text-base font-semibold text-slate-900">Eliminar pedido</h3>
              <p className="mt-2 text-sm text-slate-600">
                Esta acción no se puede deshacer. ¿Eliminar el pedido #
                {confirmDeleteId.slice(-8)}?
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => deleteOrder(confirmDeleteId)}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default function AdminOrders() {
  return (
    <Suspense
      fallback={
        <AdminLayout activeSection="orders">
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" />
          </div>
        </AdminLayout>
      }
    >
      <AdminOrdersInner />
    </Suspense>
  )
}
