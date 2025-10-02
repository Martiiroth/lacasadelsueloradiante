'use client'

import React, { useState } from 'react'
import {
  CheckCircleIcon,
  DocumentTextIcon,
  TruckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface DeliverOrderButtonProps {
  orderId: string
  currentStatus: string
  onStatusUpdate: (newStatus: string, message?: string) => void
  disabled?: boolean
}

export default function DeliverOrderButton({ 
  orderId, 
  currentStatus, 
  onStatusUpdate,
  disabled = false 
}: DeliverOrderButtonProps) {
  const [isDelivering, setIsDelivering] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Solo mostrar el botón si el pedido no está ya entregado o cancelado
  const canDeliver = !['delivered', 'cancelled'].includes(currentStatus)

  const handleDeliver = async () => {
    if (!canDeliver || disabled || isDelivering) return

    setIsDelivering(true)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const message = result.invoice 
          ? `Pedido marcado como entregado. Factura ${result.invoice.number} generada automáticamente.`
          : 'Pedido marcado como entregado.'
        
        onStatusUpdate('delivered', message)
        setShowConfirmation(false)
      } else {
        throw new Error(result.error || 'Error al marcar como entregado')
      }
    } catch (error) {
      console.error('Error delivering order:', error)
      alert('Error al marcar el pedido como entregado: ' + (error as Error).message)
    } finally {
      setIsDelivering(false)
    }
  }

  if (!canDeliver) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setShowConfirmation(true)}
        disabled={disabled || isDelivering}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Marcar como entregado y generar factura automáticamente"
      >
        {isDelivering ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Entregando...
          </>
        ) : (
          <>
            <TruckIcon className="h-4 w-4 mr-2" />
            Marcar como Entregado
          </>
        )}
      </button>

      {/* Modal de confirmación */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Icono */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              
              {/* Título */}
              <div className="mt-5 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Confirmar Entrega del Pedido
                </h3>
                
                {/* Descripción */}
                <div className="mt-4 text-sm text-gray-600">
                  <p className="mb-3">
                    ¿Estás seguro de que quieres marcar este pedido como <strong>entregado</strong>?
                  </p>
                  
                  {/* Información sobre la factura */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-left">
                        <p className="font-medium text-blue-900">Generación Automática de Factura</p>
                        <p className="text-blue-700 text-xs mt-1">
                          Al marcar como entregado, se generará automáticamente una factura para este pedido.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Advertencia si es necesario */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-left">
                        <p className="font-medium text-amber-900">Importante</p>
                        <p className="text-amber-700 text-xs mt-1">
                          Esta acción cambiará el estado del pedido y no se puede deshacer fácilmente.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Botones */}
                <div className="mt-6 flex justify-center space-x-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeliver}
                    disabled={isDelivering}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {isDelivering ? 'Procesando...' : 'Confirmar Entrega'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}