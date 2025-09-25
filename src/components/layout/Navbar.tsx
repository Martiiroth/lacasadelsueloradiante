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
              <Link
                href="/categories"
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Categorías
              </Link>
              {user && (
                <Link
                  href="/orders"
                  className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Mis Pedidos
                </Link>
              )}
            </div>
          </div>

          {/* Navegación derecha */}
          <div className="flex items-center space-x-4">
            {/* Carrito de compras - siempre visible */}
            <CartIcon />
            
            {user ? (
              <>
                {/* Información del usuario */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Hola, {user.email}
                  </span>
                  {user.client?.customer_role && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {user.client.customer_role.name}
                    </span>
                  )}
                </div>

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