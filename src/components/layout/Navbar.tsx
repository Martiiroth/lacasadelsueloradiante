'use client'

import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import CartIcon from '../cart/CartIcon'

export default function Navbar() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y navegación principal */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                La Casa del Suelo Radiante
              </h1>
            </Link>
            
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                href="/products"
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Productos
              </Link>
            </div>
          </div>

          {/* Navegación derecha */}
          <div className="flex items-center space-x-4">
            {/* Carrito de compras - siempre visible */}
            <CartIcon />
            
            {user ? (
              <>
                {/* Botón del Panel - Admin o Cliente */}
                <Link
                  href={user.client?.customer_role?.name === 'admin' ? '/admin' : '/dashboard'}
                  className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {user.client?.customer_role?.name === 'admin' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  <span>{user.client?.customer_role?.name === 'admin' ? 'Panel Admin' : 'Mi Panel'}</span>
                  {user.client?.customer_role && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.client.customer_role.name === 'admin' 
                        ? 'bg-red-200 text-red-800' 
                        : 'bg-blue-200 text-blue-800'
                    }`}>
                      {user.client.customer_role.name === 'admin' ? 'Admin' : user.client.customer_role.name}
                    </span>
                  )}
                </Link>

                {/* Botón de cerrar sesión */}
                <button
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}