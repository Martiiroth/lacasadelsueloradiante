'use client'

import ProtectedRoute from '../../components/auth/ProtectedRoute'
import { useAuth } from '../../contexts/AuthContext'

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              Mi Perfil
            </h1>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Información Personal
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Nombre
                      </label>
                      <p className="text-gray-800">
                        {user?.client?.first_name} {user?.client?.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Email
                      </label>
                      <p className="text-gray-800">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Teléfono
                      </label>
                      <p className="text-gray-800">
                        {user?.client?.phone || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Rol
                      </label>
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {user?.client?.customer_role?.name || 'guest'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Información de Empresa
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Empresa
                      </label>
                      <p className="text-gray-800">
                        {user?.client?.company_name || 'No especificada'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Cargo
                      </label>
                      <p className="text-gray-800">
                        {user?.client?.company_position || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        NIF/CIF
                      </label>
                      <p className="text-gray-800">
                        {user?.client?.nif_cif || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Actividad
                      </label>
                      <p className="text-gray-800">
                        {user?.client?.activity || 'No especificada'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Dirección
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Dirección
                    </label>
                    <p className="text-gray-800">
                      {user?.client?.address_line1 || 'No especificada'}
                    </p>
                    {user?.client?.address_line2 && (
                      <p className="text-gray-800">{user.client.address_line2}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Ciudad
                      </label>
                      <p className="text-gray-800">
                        {user?.client?.city || 'No especificada'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Código Postal
                      </label>
                      <p className="text-gray-800">
                        {user?.client?.postal_code || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Región
                      </label>
                      <p className="text-gray-800">
                        {user?.client?.region || 'No especificada'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                  Editar Perfil
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}