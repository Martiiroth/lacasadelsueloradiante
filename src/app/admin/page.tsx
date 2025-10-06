'use client'

import React, { useState, useEffect } from 'react'
import { AdminDashboardData, AdminClient } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  ChartBarIcon,
  UsersIcon,
  ShoppingBagIcon,
  CurrencyEuroIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

export default function AdminDashboard() {
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
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !dashboardData) {
    return (
      <AdminLayout>
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
                <p>{error || 'Error al cargar los datos del dashboard'}</p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const { stats, recent_orders, top_clients } = dashboardData

  const statCards = [
    {
      name: 'Total Clientes',
      stat: stats.total_clients.toLocaleString(),
      icon: UsersIcon,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: 'Total Pedidos',
      stat: stats.total_orders.toLocaleString(),
      icon: ShoppingBagIcon,
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'Ingresos Totales',
      stat: `€${(stats.total_revenue_cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      icon: CurrencyEuroIcon,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      name: 'Pedidos Este Mes',
      stat: stats.orders_this_month.toLocaleString(),
      icon: CalendarIcon,
      color: 'text-purple-600 bg-purple-100'
    }
  ]

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="mt-2 text-gray-600">Resumen de la actividad de tu tienda</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((item) => (
            <div key={item.name} className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
              <dt>
                <div className={`absolute rounded-md p-3 ${item.color}`}>
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
              </dd>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Pedidos Recientes
              </h3>
              <div className="flow-root">
                <ul className="-my-3 divide-y divide-gray-200">
                  {recent_orders.map((order) => (
                    <li key={order.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              Pedido #{order.id.slice(-8)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.client ? `${order.client.first_name} ${order.client.last_name}` : 'Cliente'} • {new Date(order.created_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-3 ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'confirmed' ? 'bg-indigo-100 text-indigo-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'delivered' ? 'Entregado' :
                             order.status === 'pending' ? 'Pendiente' :
                             order.status === 'processing' ? 'Procesando' :
                             order.status === 'shipped' ? 'Enviado' :
                             order.status === 'confirmed' ? 'Confirmado' :
                             order.status === 'cancelled' ? 'Cancelado' :
                             order.status}
                          </span>
                          <p className="text-sm font-medium text-gray-900">
                            €{(order.total_cents / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {recent_orders.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No hay pedidos recientes</p>
              )}
            </div>
          </div>

          {/* Top Clients */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Mejores Clientes
              </h3>
              <div className="flow-root">
                <ul className="-my-3 divide-y divide-gray-200">
                  {top_clients.map((client: AdminClient, index: number) => (
                    <li key={client.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-400' :
                              index === 2 ? 'bg-brand-600' :
                              'bg-indigo-500'
                            }`}>
                              {index + 1}
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {client.first_name} {client.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {client.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            €{client.stats ? (client.stats.total_spent_cents / 100).toFixed(2) : '0.00'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {client.stats ? client.stats.total_orders : 0} pedidos
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {top_clients.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No hay datos de clientes</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}