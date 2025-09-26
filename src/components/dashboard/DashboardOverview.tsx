import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ChartBarIcon, 
  ShoppingBagIcon, 
  DocumentTextIcon,
  CurrencyEuroIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { ClientService } from '../../lib/clientService'
import { useHydration } from '../../hooks/useHydration'
import { LoadingState } from '../ui/LoadingState'
import type { ClientStats, ClientOrder, Invoice } from '../../types/client'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
  description?: string
}

function StatCard({ title, value, icon: Icon, color, description }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface OrderRowProps {
  order: ClientOrder
}

function OrderRow({ order }: OrderRowProps) {
  return (
    <Link 
      href={`/dashboard/orders/${order.id}`}
      className="block hover:bg-gray-50 transition-colors"
    >
      <div className="px-6 py-4 border-b border-gray-200 last:border-b-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Pedido #{order.id.slice(0, 8)}
            </p>
            <p className="text-sm text-gray-500">
              {ClientService.formatDateShort(order.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {ClientService.formatPrice(order.total_cents)}
            </p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ClientService.getOrderStatusColor(order.status)}`}>
              {ClientService.getOrderStatusLabel(order.status)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

interface InvoiceRowProps {
  invoice: Invoice
}

function InvoiceRow({ invoice }: InvoiceRowProps) {
  return (
    <Link 
      href={`/dashboard/invoices/${invoice.id}`}
      className="block hover:bg-gray-50 transition-colors"
    >
      <div className="px-6 py-4 border-b border-gray-200 last:border-b-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Factura #{invoice.prefix}{invoice.invoice_number}{invoice.suffix}
            </p>
            <p className="text-sm text-gray-500">
              {ClientService.formatDateShort(invoice.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {ClientService.formatPrice(invoice.total_cents)}
            </p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ClientService.getInvoiceStatusColor(invoice.status)}`}>
              {ClientService.getInvoiceStatusLabel(invoice.status)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function DashboardOverview() {
  const { user } = useAuth()
  const isHydrated = useHydration()
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<ClientOrder[]>([])
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isHydrated || !user?.client?.id) return

    const loadDashboardData = async (retryCount = 0) => {
      const maxRetries = 3
      
      try {
        setLoading(true)
        setError(null)
        
        const [statsData, ordersData, invoicesData] = await Promise.all([
          ClientService.getClientStats(user.client!.id),
          ClientService.getRecentOrders(user.client!.id, 5),
          ClientService.getRecentInvoices(user.client!.id, 5)
        ])

        setStats(statsData)
        setRecentOrders(ordersData)
        setRecentInvoices(invoicesData)
        setLoading(false)
      } catch (error) {
        console.error(`Error loading dashboard data (intento ${retryCount + 1}):`, error)
        
        if (retryCount < maxRetries) {
          setTimeout(() => loadDashboardData(retryCount + 1), (retryCount + 1) * 1000)
          return
        } else {
          setError('Error al cargar los datos del dashboard')
          setLoading(false)
        }
      }
    }

    const timeoutId = setTimeout(() => loadDashboardData(), 100)
    return () => clearTimeout(timeoutId)
  }, [isHydrated, user?.client?.id])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user?.client) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron datos del cliente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {user.client.first_name}
        </h1>
        <p className="text-gray-600 mt-1">
          Aquí tienes un resumen de tu actividad reciente
        </p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total de Pedidos"
            value={stats.total_orders}
            icon={ShoppingBagIcon}
            color="bg-blue-500"
            description="Todos los pedidos realizados"
          />
          
          <StatCard
            title="Total Gastado"
            value={ClientService.formatPrice(stats.total_spent_cents)}
            icon={CurrencyEuroIcon}
            color="bg-green-500"
            description="Importe total de compras"
          />
          
          <StatCard
            title="Pedidos Pendientes"
            value={stats.pending_orders}
            icon={ClockIcon}
            color="bg-yellow-500"
            description="En proceso o confirmados"
          />
          
          <StatCard
            title="Pedidos Completados"
            value={stats.completed_orders}
            icon={CheckCircleIcon}
            color="bg-emerald-500"
            description="Entregados exitosamente"
          />
          
          <StatCard
            title="Facturas Pendientes"
            value={stats.pending_invoices}
            icon={DocumentTextIcon}
            color="bg-orange-500"
            description="Por pagar"
          />
          
          <StatCard
            title="Facturas Pagadas"
            value={stats.paid_invoices}
            icon={CheckCircleIcon}
            color="bg-teal-500"
            description="Pagos completados"
          />
        </div>
      )}

      {/* Contenido en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pedidos Recientes */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Pedidos Recientes</h2>
              <Link 
                href="/dashboard/orders"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Ver todos
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No tienes pedidos aún</p>
                <Link 
                  href="/products"
                  className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                >
                  Explorar productos
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Facturas Recientes */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Facturas Recientes</h2>
              <Link 
                href="/dashboard/invoices"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Ver todas
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No tienes facturas aún</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}