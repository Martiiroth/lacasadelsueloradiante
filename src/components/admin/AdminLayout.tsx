import React, { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ChartBarIcon,
  UsersIcon, 
  ShoppingBagIcon, 
  DocumentTextIcon,
  CubeIcon,
  FolderIcon,
  TicketIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { AdminToastProvider } from './AdminToast'

interface AdminLayoutProps {
  children: ReactNode
  activeSection?: 'overview' | 'clients' | 'orders' | 'invoices' | 'products' | 'categories' | 'brands' | 'coupons' | 'carousel' | 'settings'
}

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  group?: string
}

const navItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Panel General',
    href: '/admin',
    icon: ChartBarIcon,
    group: 'Inicio',
  },
  {
    id: 'orders',
    label: 'Pedidos',
    href: '/admin/orders',
    icon: ShoppingBagIcon,
    group: 'Ventas',
  },
  {
    id: 'clients',
    label: 'Clientes',
    href: '/admin/clients',
    icon: UsersIcon,
    group: 'Ventas',
  },
  {
    id: 'invoices',
    label: 'Facturas',
    href: '/admin/invoices',
    icon: DocumentTextIcon,
    group: 'Ventas',
  },
  {
    id: 'products',
    label: 'Productos',
    href: '/admin/products',
    icon: CubeIcon,
    group: 'Catálogo',
  },
  {
    id: 'categories',
    label: 'Categorías',
    href: '/admin/categories',
    icon: FolderIcon,
    group: 'Catálogo',
  },
  {
    id: 'brands',
    label: 'Marcas',
    href: '/admin/brands',
    icon: BuildingStorefrontIcon,
    group: 'Catálogo',
  },
  {
    id: 'coupons',
    label: 'Cupones',
    href: '/admin/coupons',
    icon: TicketIcon,
    group: 'Marketing',
  },
  {
    id: 'carousel',
    label: 'Carrusel Home',
    href: '/admin/carousel',
    icon: PhotoIcon,
    group: 'Marketing',
  },
]

export default function AdminLayout({ children, activeSection = 'overview' }: AdminLayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // Verificar que el usuario es admin
  const isAdmin = user?.client?.customer_role?.name === 'admin'

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Acceso Denegado
          </h1>
          <p className="mt-2 text-gray-600">
            No tienes permisos para acceder al panel de administración
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminToastProvider>
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center min-w-0 flex-1">
              <Link href="/admin" className="flex items-center min-w-0">
                <ShieldCheckIcon className="h-6 w-6 lg:h-8 lg:w-8 text-red-600 mr-2 lg:mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-lg lg:text-xl font-bold text-gray-900 truncate block">
                    Panel Admin
                  </span>
                  <div className="text-xs text-gray-500 hidden sm:block truncate">
                    La Casa del Suelo Radiante
                  </div>
                </div>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              <Link
                href="/"
                className="hidden sm:block text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
              >
                <span className="hidden lg:inline">Ver Sitio Web</span>
                <span className="lg:hidden">Sitio</span>
              </Link>
              <div className="hidden md:block text-sm min-w-0">
                <span className="text-gray-500">Admin:</span>
                <span className="ml-1 font-medium text-gray-900 truncate">
                  {user?.client?.first_name 
                    ? `${user.client.first_name} ${user.client.last_name}` 
                    : user?.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-2 lg:px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Cerrar Sesión</span>
                <span className="lg:hidden sr-only">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4 lg:gap-8">
          {/* Mobile Sidebar Navigation */}
          <div className="lg:col-span-1">
            {/* Mobile dropdown menu */}
            <div className="lg:hidden mb-4">
              <select 
                value={activeSection}
                onChange={(e) => {
                  const item = navItems.find(nav => nav.id === e.target.value)
                  if (item) window.location.href = item.href
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {navItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Desktop sidebar navigation */}
            <nav className="hidden lg:block space-y-4">
              {(['Inicio', 'Ventas', 'Catálogo', 'Marketing'] as const).map((group) => {
                const items = navItems.filter((i) => i.group === group)
                if (items.length === 0) return null
                return (
                  <div key={group}>
                    <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {group}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const isActive = activeSection === item.id
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            className={`
                              group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                              ${isActive
                                ? 'bg-red-50 border-r-2 border-red-500 text-red-700'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                              }
                            `}
                          >
                            <Icon
                              className={`
                                flex-shrink-0 mr-3 h-5 w-5
                                ${isActive ? 'text-red-500' : 'text-slate-400 group-hover:text-slate-500'}
                              `}
                            />
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </nav>

            {/* Acceso rápido */}
            <div className="hidden lg:block mt-8 p-4 bg-white rounded-lg border border-slate-200">
              <h3 className="text-sm font-medium text-slate-900 mb-3">Acceso rápido</h3>
              <div className="space-y-2">
                <Link
                  href="/admin/orders/create"
                  className="flex items-center text-sm font-medium text-red-600 hover:text-red-500"
                >
                  <PlusIcon className="mr-1.5 h-4 w-4" />
                  Nuevo pedido
                </Link>
                <Link
                  href="/admin/orders?status=pending"
                  className="block text-sm text-red-600 hover:text-red-500"
                >
                  Pedidos pendientes
                </Link>
                <Link
                  href="/admin/clients/create"
                  className="block text-sm text-red-600 hover:text-red-500"
                >
                  Nuevo cliente
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[400px] lg:min-h-[600px] p-4 lg:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
    </AdminToastProvider>
  )
}