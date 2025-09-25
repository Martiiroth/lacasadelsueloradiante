'use client'

import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Bienvenido a La Casa del Suelo Radiante
          </h1>
          
          {user ? (
            <div className="mb-8">
              <p className="text-xl text-gray-600">
                ¡Hola {user.client?.first_name || user.email?.split('@')[0] || 'Usuario'}! Estamos preparando algo especial para ti.
              </p>
              {user.client?.customer_role && (
                <p className="text-sm text-gray-500 mt-2">
                  Rol: {user.client.customer_role.name}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xl text-gray-600 mb-8">
              Inicia sesión para acceder a precios especiales y funcionalidades exclusivas.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Productos de Calidad
              </h3>
              <p className="text-gray-600">
                Los mejores sistemas de calefacción por suelo radiante del mercado.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Precios Especiales
              </h3>
              <p className="text-gray-600">
                Diferentes tarifas según tu perfil profesional.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Soporte Técnico
              </h3>
              <p className="text-gray-600">
                Asesoramiento especializado para tus proyectos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}