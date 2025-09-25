'use client'

import { useState } from 'react'
import { CheckoutTestDataService } from '../../../lib/checkout-test-data'

export default function CheckoutSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const setupCheckout = async () => {
    setIsLoading(true)
    setLogs([])
    
    try {
      addLog('🚀 Iniciando configuración del sistema de checkout...')
      
      const success = await CheckoutTestDataService.setupCheckoutSystem()
      
      if (success) {
        addLog('✅ Sistema de checkout configurado exitosamente')
        addLog('📦 Métodos de envío creados')
        addLog('💳 Métodos de pago creados')
        addLog('🎫 Cupones de descuento creados')
        addLog('📄 Contador de facturas inicializado')
        addLog('🎉 ¡Listo para procesar pedidos!')
      } else {
        addLog('❌ Error en la configuración del sistema')
      }
    } catch (error) {
      console.error('Error setting up checkout:', error)
      addLog(`❌ Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearData = async () => {
    setIsLoading(true)
    setLogs([])
    
    try {
      addLog('🧹 Limpiando datos de prueba...')
      
      const success = await CheckoutTestDataService.clearTestData()
      
      if (success) {
        addLog('✅ Datos de prueba eliminados')
      } else {
        addLog('❌ Error limpiando datos')
      }
    } catch (error) {
      console.error('Error clearing data:', error)
      addLog(`❌ Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Configuración del Sistema de Checkout
          </h1>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">
                ¿Qué hace esta configuración?
              </h2>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">📦</span>
                  <span>Crea métodos de envío (Estándar, Express, Recogida en tienda)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">💳</span>
                  <span>Configura métodos de pago (Tarjeta, PayPal, Transferencia, Contrareembolso)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🎫</span>
                  <span>Crea cupones de descuento de prueba (WELCOME10, SAVE5, FREESHIP)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">📄</span>
                  <span>Inicializa el contador de facturas para numeración automática</span>
                </li>
              </ul>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={setupCheckout}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Configurando...' : 'Configurar Sistema de Checkout'}
              </button>
              
              <button
                onClick={clearData}
                disabled={isLoading}
                className="px-6 py-3 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Limpiando...' : 'Limpiar Datos'}
              </button>
            </div>

            {/* Logs */}
            {logs.length > 0 && (
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
                <h3 className="text-white mb-2 font-semibold">Log de actividad:</h3>
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            )}

            {/* Información de cupones */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-4">
                Cupones de Prueba Disponibles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-semibold text-gray-900">WELCOME10</h3>
                  <p className="text-gray-600">10% de descuento</p>
                  <p className="text-xs text-gray-500">Para nuevos clientes</p>
                </div>
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-semibold text-gray-900">SAVE5</h3>
                  <p className="text-gray-600">5€ de descuento</p>
                  <p className="text-xs text-gray-500">Descuento fijo</p>
                </div>
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-semibold text-gray-900">FREESHIP</h3>
                  <p className="text-gray-600">Envío gratuito</p>
                  <p className="text-xs text-gray-500">Sin coste de envío</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">
                ⚠️ Importante
              </h2>
              <p className="text-yellow-800">
                Esta página es solo para configuración inicial. En producción, estos datos deberían 
                configurarse a través del panel de administración o mediante migración de base de datos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}