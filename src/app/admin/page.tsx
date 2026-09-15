'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminDashboardData, AdminClient } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  getOrderStatusLabel,
  getOrderStatusColor,
} from '@/lib/adminOrderStatus'
import {
  UsersIcon,
  ShoppingBagIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  PlusIcon,
  UserPlusIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const data = await AdminService.getAdminDashboard()
      setDashboardData(data)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Error al cargar los datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout activeSection="overview">
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" />
        </div>
      </AdminLayout>
    )
  }

  if (error || !dashboardData) {
    return (
      <AdminLayout activeSection="overview">
        <div className="rounded-md border border-red-200 bg-red-50 p-6">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-2 text-sm text-red-700">
            {error || 'Error al cargar los datos del dashboard'}
          </p>
        </div>
      </AdminLayout>
    )
  }

  const { stats, recent_orders, top_clients } = dashboardData

  const actionQueues = [
    {
      id: 'pending',
      label: 'Pendientes',
      description: 'Esperan confirmación o pago',
      count: stats.orders_pending ?? 0,
      href: '/admin/orders?status=pending',
      icon: ClockIcon,
      tone: 'bg-amber-50 text-amber-900 ring-amber-200',
      iconTone: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'confirmed',
      label: 'Confirmados',
      description: 'Listos para preparar',
      count: stats.orders_confirmed ?? 0,
      href: '/admin/orders?status=confirmed',
      icon: CheckCircleIcon,
      tone: 'bg-sky-50 text-sky-900 ring-sky-200',
      iconTone: 'bg-sky-100 text-sky-700',
    },
    {
      id: 'processing',
      label: 'En preparación',
      description: 'En proceso interno',
      count: stats.orders_processing ?? 0,
      href: '/admin/orders?status=processing',
      icon: ExclamationTriangleIcon,
      tone: 'bg-violet-50 text-violet-900 ring-violet-200',
      iconTone: 'bg-violet-100 text-violet-700',
    },
    {
      id: 'shipped',
      label: 'Enviados',
      description: 'Pendientes de entrega',
      count: stats.orders_shipped ?? 0,
      href: '/admin/orders?status=shipped',
      icon: TruckIcon,
      tone: 'bg-indigo-50 text-indigo-900 ring-indigo-200',
      iconTone: 'bg-indigo-100 text-indigo-700',
    },
  ]

  const summaryCards = [
    {
      name: 'Clientes',
      stat: stats.total_clients.toLocaleString('es-ES'),
      hint: `${stats.new_clients_this_month} nuevos este mes`,
      icon: UsersIcon,
      href: '/admin/clients',
    },
    {
      name: 'Pedidos',
      stat: stats.total_orders.toLocaleString('es-ES'),
      hint: `${stats.orders_this_month} este mes`,
      icon: ShoppingBagIcon,
      href: '/admin/orders',
    },
    {
      name: 'Ingresos (entregados)',
      stat: `€${(stats.total_revenue_cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      hint: `€${(stats.revenue_this_month_cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2 })} este mes`,
      icon: CurrencyEuroIcon,
      href: '/admin/invoices',
    },
    {
      name: 'Ticket medio',
      stat: `€${(stats.average_order_value_cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      hint: `${stats.completed_orders} entregados`,
      icon: CalendarIcon,
      href: '/admin/orders?status=delivered',
    },
  ]

  const needsAttention =
    (stats.orders_pending ?? 0) +
    (stats.orders_confirmed ?? 0) +
    (stats.orders_processing ?? 0) +
    (stats.orders_shipped ?? 0)

  return (
    <AdminLayout activeSection="overview">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel</h1>
            <p className="mt-1 text-sm text-slate-500">
              {needsAttention > 0
                ? `${needsAttention} pedido${needsAttention === 1 ? '' : 's'} requieren atención`
                : 'Todo al día · sin colas pendientes'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/orders/create"
              className="inline-flex items-center rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              <PlusIcon className="mr-1.5 h-4 w-4" />
              Nuevo pedido
            </Link>
            <Link
              href="/admin/clients/create"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <UserPlusIcon className="mr-1.5 h-4 w-4" />
              Nuevo cliente
            </Link>
          </div>
        </div>

        {/* Colas accionables */}
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Colas de trabajo
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {actionQueues.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => router.push(q.href)}
                className={`group rounded-xl p-4 text-left ring-1 ring-inset transition hover:shadow-sm ${q.tone}`}
              >
                <div className="flex items-start justify-between">
                  <span className={`rounded-lg p-2 ${q.iconTone}`}>
                    <q.icon className="h-5 w-5" />
                  </span>
                  <span className="text-2xl font-bold tabular-nums">{q.count}</span>
                </div>
                <p className="mt-3 text-sm font-semibold">{q.label}</p>
                <p className="mt-0.5 text-xs opacity-80">{q.description}</p>
                <span className="mt-3 inline-flex items-center text-xs font-medium opacity-70 group-hover:opacity-100">
                  Ver pedidos
                  <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Resumen */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
                  <item.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">{item.name}</p>
                  <p className="truncate text-lg font-bold text-slate-900">{item.stat}</p>
                  <p className="truncate text-xs text-slate-400">{item.hint}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pedidos recientes */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Pedidos recientes</h3>
              <Link href="/admin/orders" className="text-xs font-medium text-red-600 hover:text-red-700">
                Ver todos
              </Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {recent_orders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-slate-900">
                        #{order.id.slice(-8)}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {order.client
                          ? `${order.client.first_name} ${order.client.last_name}`
                          : 'Cliente'}{' '}
                        · {new Date(order.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${getOrderStatusColor(order.status)}`}
                      >
                        {getOrderStatusLabel(order.status)}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        €{(order.total_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            {recent_orders.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No hay pedidos recientes</p>
            )}
          </div>

          {/* Top clientes */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Mejores clientes</h3>
              <Link href="/admin/clients" className="text-xs font-medium text-red-600 hover:text-red-700">
                Ver todos
              </Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {top_clients.map((client: AdminClient, index: number) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/clients/${client.id}`)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                          index === 0
                            ? 'bg-amber-500'
                            : index === 1
                              ? 'bg-slate-400'
                              : index === 2
                                ? 'bg-orange-700'
                                : 'bg-slate-300'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="truncate text-xs text-slate-500">{client.email}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        €
                        {client.stats
                          ? (client.stats.total_spent_cents / 100).toFixed(2)
                          : '0.00'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {client.stats ? client.stats.total_orders : 0} pedidos
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            {top_clients.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No hay datos de clientes</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
