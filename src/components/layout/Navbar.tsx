'use client'

import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthModal from '../auth/AuthModal'

export default function Navbar() {
  const { user, signOut, loading } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')

  const handleSignOut = async () => {
    await signOut()
  }

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
  }

  return (
    <>
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-800">
                La Casa del Suelo Radiante
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                <a href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Inicio
                </a>
                <a href="/productos" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Productos
                </a>
                <a href="/contacto" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Contacto
                </a>
                {user && (
                  <>
                    <a href="/perfil" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                      Mi Perfil
                    </a>
                    <a href="/database-test" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-xs">
                      DB Test
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="text-gray-700">Hola, </span>
                    <span className="font-medium text-gray-900">
                      {user.client?.first_name || user.email?.split('@')[0] || 'Usuario'}
                    </span>
                    {user.client?.customer_role && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {user.client.customer_role.name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu button - TODO: implement mobile menu */}
        <div className="md:hidden">
          {/* Mobile menu implementation */}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  )
}