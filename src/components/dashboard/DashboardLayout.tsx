import React, { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  UserIcon, 
  ShoppingBagIcon, 
  DocumentTextIcon, 
  ArrowRightOnRectangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'

interface DashboardLayoutProps {
  children: ReactNode
  activeSection?: 'overview' | 'personal-info' | 'orders' | 'invoices'
}

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const navItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Resumen',
    href: '/dashboard',
    icon: ChartBarIcon
  },
  {
    id: 'personal-info',
    label: 'Información Personal',
    href: '/dashboard/personal-info',
    icon: UserIcon
  },
  {
    id: 'orders',
    label: 'Mis Pedidos',
    href: '/dashboard/orders',
    icon: ShoppingBagIcon
  },
  {
    id: 'invoices',
    label: 'Facturas',
    href: '/dashboard/invoices',
    icon: DocumentTextIcon
  }
]

export default function DashboardLayout({ children, activeSection = 'overview' }: DashboardLayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">
                La Casa del Suelo Radiante
              </span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-500">Bienvenido,</span>
                <span className="ml-1 font-medium text-gray-900">
                  {user?.client?.first_name 
                    ? `${user.client.first_name} ${user.client.last_name}` 
                    : user?.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Mobile Navigation */}
          <div className="lg:col-span-1">
            {/* Mobile dropdown menu */}
            <div className="lg:hidden mb-4">
              <select 
                value={activeSection}
                onChange={(e) => {
                  const item = navItems.find(nav => nav.id === e.target.value)
                  if (item) window.location.href = item.href
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {navItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:block space-y-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.id
                const Icon = item.icon

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive 
                        ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon 
                      className={`
                        flex-shrink-0 mr-3 h-5 w-5
                        ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                      `} 
                    />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Quick Actions - Hidden on mobile */}
            <div className="hidden lg:block mt-8 p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Acciones Rápidas</h3>
              <div className="space-y-2">
                <Link 
                  href="/products"
                  className="block text-sm text-blue-600 hover:text-blue-500"
                >
                  Ver Productos
                </Link>
                <Link 
                  href="/cart"
                  className="block text-sm text-blue-600 hover:text-blue-500"
                >
                  Ver Carrito
                </Link>
                <Link 
                  href="/support"
                  className="block text-sm text-blue-600 hover:text-blue-500"
                >
                  Soporte
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[400px] lg:min-h-[600px] p-4 lg:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}