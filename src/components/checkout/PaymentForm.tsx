'use client'

import { useState, useEffect } from 'react'
import { OrderService } from '../../lib/orders'
import type { ShippingMethod, PaymentMethod } from '../../types/checkout'

interface PaymentFormProps {
  onSubmit: (data: { shippingMethodId: string; paymentMethodId: string; couponCode?: string }) => void
  onBack?: () => void
  isLoading?: boolean
}

export default function PaymentForm({ onSubmit, onBack, isLoading = false }: PaymentFormProps) {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [couponCode, setCouponCode] = useState<string>('')
  const [couponValidating, setCouponValidating] = useState(false)
  const [couponError, setCouponError] = useState<string>('')
  const [couponSuccess, setCouponSuccess] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMethods()
  }, [])

  const loadMethods = async () => {
    try {
      setLoading(true)
      const [shipping, payment] = await Promise.all([
        OrderService.getShippingMethods(),
        OrderService.getPaymentMethods()
      ])
      
      setShippingMethods(shipping)
      setPaymentMethods(payment)
      
      // Seleccionar primer método por defecto
      if (shipping.length > 0) {
        setSelectedShippingMethod(shipping[0].id)
      }
      if (payment.length > 0) {
        setSelectedPaymentMethod(payment[0].id)
      }
    } catch (error) {
      console.error('Error loading methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) return

    setCouponValidating(true)
    setCouponError('')
    setCouponSuccess('')

    try {
      const coupon = await OrderService.validateCoupon(couponCode.trim())
      if (coupon) {
        setCouponSuccess(`Cupón aplicado: ${coupon.description || `${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : '€'} de descuento`}`)
      } else {
        setCouponError('El cupón no es válido o ha expirado')
      }
    } catch (error) {
      setCouponError('Error al validar el cupón')
    } finally {
      setCouponValidating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedShippingMethod || !selectedPaymentMethod) {
      return
    }

    onSubmit({
      shippingMethodId: selectedShippingMethod,
      paymentMethodId: selectedPaymentMethod,
      couponCode: couponSuccess ? couponCode.trim() : undefined
    })
  }

  const formatPrice = (cents: number): string => {
    return (cents / 100).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    })
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Envío y Pago
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Métodos de envío */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Método de Envío
            </h3>
            <div className="space-y-3">
              {shippingMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedShippingMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping_method"
                    value={method.id}
                    checked={selectedShippingMethod === method.id}
                    onChange={(e) => setSelectedShippingMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-500">
                          Entrega estimada: {method.estimated_days} día{method.estimated_days !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">
                        {method.price_cents === 0 ? 'Gratis' : formatPrice(method.price_cents)}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Métodos de pago */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Método de Pago
            </h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedPaymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={method.id}
                    checked={selectedPaymentMethod === method.id}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900">{method.name}</p>
                    {method.provider && (
                      <p className="text-sm text-gray-500">Proveedor: {method.provider}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Cupón de descuento */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cupón de Descuento (opcional)
            </h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value)
                    setCouponError('')
                    setCouponSuccess('')
                  }}
                  placeholder="Introduce tu código de cupón"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading || couponValidating}
                />
                {couponError && (
                  <p className="mt-1 text-sm text-red-600">{couponError}</p>
                )}
                {couponSuccess && (
                  <p className="mt-1 text-sm text-green-600">{couponSuccess}</p>
                )}
              </div>
              <button
                type="button"
                onClick={validateCoupon}
                disabled={!couponCode.trim() || couponValidating || isLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {couponValidating ? 'Validando...' : 'Aplicar'}
              </button>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isLoading}
              >
                Volver
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !selectedShippingMethod || !selectedPaymentMethod}
            >
              {isLoading ? 'Procesando...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}