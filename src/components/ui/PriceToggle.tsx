'use client'

import { usePricing } from '../../hooks/usePricing'
import { useAuth } from '../../contexts/AuthContext'

export default function PriceToggle() {
  const { showWithVAT, toggleVAT } = usePricing()
  const { user } = useAuth()

  // Solo mostrar el toggle si el usuario está autenticado
  if (!user) return null

  return (
    <div className="flex items-center justify-center mb-6">
      <div className="bg-white rounded-lg shadow-md p-4 border">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Ver precios:</span>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleVAT}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showWithVAT
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Con IVA
            </button>
            
            <button
              onClick={toggleVAT}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !showWithVAT
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sin IVA
            </button>
          </div>

          {/* Información del rol si aplica */}
          {user?.client?.customer_role?.name && ['instalador', 'distribuidor', 'mayorista'].includes(user.client.customer_role.name) && (
            <div className="flex items-center space-x-2 pl-4 border-l border-gray-200">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">
                Rol: <span className="font-medium text-green-600 capitalize">
                  {user.client.customer_role.name}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Precios con descuento por rol
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              IVA: {showWithVAT ? 'Incluido' : 'Excluido'} (21%)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}