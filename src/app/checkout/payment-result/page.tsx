/**
 * Página de resultado del pago con Redsys
 * Muestra el resultado del pago (éxito o error) después de la redirección desde Redsys
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function PaymentResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [orderDetails, setOrderDetails] = useState<any>(null)

  const status = searchParams.get('status')
  const orderId = searchParams.get('order')

  useEffect(() => {
    // Simular verificación del pago (opcional)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Verificando estado del pago...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {status === 'success' ? (
            // Pago exitoso
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg 
                  className="w-8 h-8 text-green-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ¡Pago Completado!
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Tu pago ha sido procesado correctamente
              </p>

              {orderId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-800 mb-1">
                    Número de pedido:
                  </p>
                  <p className="text-lg font-mono font-semibold text-green-900">
                    #{orderId.slice(0, 8)}
                  </p>
                </div>
              )}

              <div className="space-y-4 text-left bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900">¿Qué sigue?</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Recibirás un correo electrónico con la confirmación de tu pedido
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Procesaremos tu pedido y te notificaremos el estado del envío
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Puedes ver el estado de tu pedido en la sección "Mis Pedidos"
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={orderId ? `/orders/${orderId}` : '/orders'}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ver Mi Pedido
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Seguir Comprando
                </Link>
              </div>
            </div>
          ) : (
            // Pago fallido
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg 
                  className="w-8 h-8 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Pago No Completado
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                No se pudo procesar tu pago
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  El pago no se ha podido completar. Esto puede deberse a:
                </p>
                <ul className="mt-2 text-sm text-red-700 text-left space-y-1">
                  <li>• Fondos insuficientes</li>
                  <li>• Datos de la tarjeta incorrectos</li>
                  <li>• Tarjeta bloqueada o caducada</li>
                  <li>• Límite de compra excedido</li>
                </ul>
              </div>

              <div className="space-y-4 text-left bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900">¿Qué puedo hacer?</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Verifica que los datos de tu tarjeta sean correctos
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Contacta con tu banco si persiste el problema
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Prueba con otro método de pago
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/checkout"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Intentar de Nuevo
                </Link>
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Contactar Soporte
                </Link>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              ¿Necesitas ayuda? Contáctanos en{' '}
              <a href="mailto:consultas@lacasadelsueloradianteapp.com" className="text-blue-600 hover:text-blue-700">
                consultas@lacasadelsueloradianteapp.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando resultado...</p>
        </div>
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  )
}
