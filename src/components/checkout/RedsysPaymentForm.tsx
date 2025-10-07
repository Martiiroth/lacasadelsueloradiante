/**
 * Componente: RedsysPaymentForm
 * Maneja el proceso de pago con tarjeta a través de Redsys
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { RedsysFormData } from '@/lib/redsys'

interface RedsysPaymentFormProps {
  orderId: string
  amount: number // En céntimos
  description?: string
  consumerName?: string
  onSuccess?: () => void
  onError?: (error: string) => void
  autoSubmit?: boolean
}

export default function RedsysPaymentForm({
  orderId,
  amount,
  description,
  consumerName,
  onSuccess,
  onError,
  autoSubmit = false
}: RedsysPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<RedsysFormData | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Preparar transacción de pago
  const preparePayment = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/redsys/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          amount,
          description: description || `Pedido #${orderId}`,
          consumerName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al preparar el pago')
      }

      if (data.success && data.paymentForm) {
        setPaymentData(data.paymentForm)
        onSuccess?.()
        return data.paymentForm
      } else {
        throw new Error('Respuesta inesperada del servidor')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al preparar el pago'
      setError(errorMessage)
      onError?.(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-enviar formulario cuando se reciben los datos de pago
  useEffect(() => {
    if (paymentData && autoSubmit && formRef.current) {
      console.log('🚀 Redirigiendo a Redsys...')
      formRef.current.submit()
    }
  }, [paymentData, autoSubmit])

  // Enviar formulario manualmente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (paymentData && formRef.current) {
      formRef.current.submit()
    } else {
      const data = await preparePayment()
      if (data && formRef.current) {
        // Esperar un momento para que el formulario se actualice
        setTimeout(() => {
          formRef.current?.submit()
        }, 100)
      }
    }
  }

  // Preparar pago al montar el componente si autoSubmit está activo
  useEffect(() => {
    if (autoSubmit) {
      preparePayment()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const formatAmount = (cents: number) => {
    return (cents / 100).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    })
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg 
              className="w-8 h-8 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pago con Tarjeta
          </h2>
          <p className="text-gray-600">
            Pago seguro procesado por Redsys
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Pedido:</span>
            <span className="font-medium text-gray-900">#{orderId.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Importe:</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatAmount(amount)}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg 
                className="w-5 h-5 text-red-400 mr-3" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600">Preparando pago seguro...</p>
          </div>
        )}

        {!autoSubmit && !isLoading && (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {paymentData ? 'Ir a Redsys' : 'Proceder al Pago'}
          </button>
        )}

        {/* Formulario oculto para enviar a Redsys */}
        {paymentData && (
          <form
            ref={formRef}
            method="POST"
            action={paymentData.redsysUrl}
            style={{ display: 'none' }}
          >
            <input
              type="hidden"
              name="Ds_SignatureVersion"
              value={paymentData.Ds_SignatureVersion}
            />
            <input
              type="hidden"
              name="Ds_MerchantParameters"
              value={paymentData.Ds_MerchantParameters}
            />
            <input
              type="hidden"
              name="Ds_Signature"
              value={paymentData.Ds_Signature}
            />
          </form>
        )}

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <svg 
              className="w-4 h-4 mr-1" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" 
                clipRule="evenodd" 
              />
            </svg>
            Pago seguro con cifrado SSL
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Aceptamos Visa, Mastercard y otras tarjetas
          </p>
        </div>
      </div>
    </div>
  )
}
