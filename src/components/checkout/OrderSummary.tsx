'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { OrderService } from '../../lib/orders'
import { useHydration } from '../../hooks/useHydration'
import { LoadingState } from '../ui/LoadingState'
import type { 
  CheckoutSummary, 
  ShippingAddress,
  BillingAddress, 
  ShippingMethod, 
  PaymentMethod 
} from '../../types/checkout'

interface OrderSummaryProps {
  shippingAddress: ShippingAddress
  billingAddress: BillingAddress
  shippingMethodId: string
  paymentMethodId: string
  couponCode?: string
  onConfirm: () => void
  onBack?: () => void
  isLoading?: boolean
}

export default function OrderSummary({ 
  shippingAddress,
  billingAddress,
  shippingMethodId,
  paymentMethodId,
  couponCode,
  onConfirm,
  onBack,
  isLoading = false
}: OrderSummaryProps) {
  const { user } = useAuth()
  const { cartItems } = useCart()
  const isHydrated = useHydration()
  const [summary, setSummary] = useState<CheckoutSummary | null>(null)
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isHydrated) return
    loadSummary()
  }, [isHydrated, cartItems, shippingMethodId, couponCode])

  const loadSummary = async () => {
    try {
      setLoading(true)
      
      // Cargar resumen de checkout
      const checkoutSummary = await OrderService.calculateCheckoutSummary(
        cartItems,
        shippingMethodId,
        couponCode
      )
      
      if (checkoutSummary) {
        setSummary(checkoutSummary)
        setShippingMethod(checkoutSummary.shipping_method)
      }

      // Cargar método de pago
      const paymentMethods = await OrderService.getPaymentMethods()
      const selectedPaymentMethod = paymentMethods.find(m => m.id === paymentMethodId)
      if (selectedPaymentMethod) {
        setPaymentMethod(selectedPaymentMethod)
      }

    } catch (error) {
      console.error('Error loading order summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (cents: number): string => {
    return (cents / 100).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    })
  }

  if (loading || !summary) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Resumen del Pedido
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información del pedido */}
          <div className="space-y-6">
            {/* Productos */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Productos ({summary.items.length})
              </h3>
              <div className="space-y-4">
                {summary.items.map((item) => (
                  <div key={item.variant_id} className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.variant?.product?.image ? (
                        <Image
                          src={item.variant.product.image.url}
                          alt={item.variant.product.image.alt || item.variant?.product?.title || ''}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Sin imagen</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.variant?.title || 'Variante'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.variant?.product?.title || 'Producto'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Cantidad: {item.qty}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(item.price_cents * item.qty)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Advertencia para productos bajo pedido */}
              {summary.items.some(item => item.variant && item.variant.stock <= 0) && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-orange-800">
                        Productos bajo pedido incluidos
                      </h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Este pedido incluye productos bajo pedido que se fabricarán/enviarán una vez confirmado el pago. Tiempo estimado de entrega: 7-15 días laborables.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dirección de envío */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Dirección de Envío
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">
                  {shippingAddress.full_name}
                </p>
                {shippingAddress.company && (
                  <p className="text-gray-600">{shippingAddress.company}</p>
                )}
                <p className="text-gray-600">{shippingAddress.address_line1}</p>
                {shippingAddress.address_line2 && (
                  <p className="text-gray-600">{shippingAddress.address_line2}</p>
                )}
                <p className="text-gray-600">
                  {shippingAddress.postal_code} {shippingAddress.city}, {shippingAddress.region}
                </p>
                <p className="text-gray-600">{shippingAddress.country || 'España'}</p>
                {shippingAddress.phone && (
                  <p className="text-gray-600 mt-2">Tel: {shippingAddress.phone}</p>
                )}

              </div>
            </div>

            {/* Método de envío */}
            {shippingMethod && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Método de Envío
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{shippingMethod.name}</p>
                      <p className="text-sm text-gray-600">
                        Entrega estimada: {shippingMethod.estimated_days} día{shippingMethod.estimated_days !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {shippingMethod.price_cents === 0 ? 'Gratis' : formatPrice(shippingMethod.price_cents)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dirección de facturación */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Dirección de Facturación
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">
                  {billingAddress.first_name} {billingAddress.last_name}
                </p>
                {billingAddress.company_name && (
                  <p className="text-gray-600">{billingAddress.company_name}</p>
                )}
                {billingAddress.nif_cif && (
                  <p className="text-gray-600">NIF/CIF: {billingAddress.nif_cif}</p>
                )}
                <p className="text-gray-600">{billingAddress.address_line1}</p>
                {billingAddress.address_line2 && (
                  <p className="text-gray-600">{billingAddress.address_line2}</p>
                )}
                <p className="text-gray-600">
                  {billingAddress.postal_code} {billingAddress.city}, {billingAddress.region}
                </p>
                <p className="text-gray-600">{billingAddress.country || 'España'}</p>
                {billingAddress.phone && (
                  <p className="text-gray-600 mt-2">Tel: {billingAddress.phone}</p>
                )}
                <p className="text-gray-600">Email: {billingAddress.email}</p>
              </div>
            </div>

            {/* Método de pago */}
            {paymentMethod && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Método de Pago
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{paymentMethod.name}</p>
                  {paymentMethod.provider && (
                    <p className="text-sm text-gray-600">Proveedor: {paymentMethod.provider}</p>
                  )}
                  
                  {/* Información adicional para transferencia bancaria */}
                  {paymentMethod.name.toLowerCase().includes('transferencia') && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm font-medium text-blue-900 mb-2">📋 Recordatorio:</p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Realiza la transferencia a: <strong>ES18 2100 8453 5102 0007 7305</strong> (CaixaBank)</li>
                        <li>• Incluye en el concepto el número de pedido que recibirás</li>
                        <li>• El pedido se procesará en 24-48h tras recibir el pago</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Resumen de precios */}
          <div>
            <div className="bg-gray-50 rounded-lg p-6 sticky top-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Resumen de Precios
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(summary.subtotal_cents)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className="text-gray-900">
                    {summary.shipping_cents === 0 ? 'Gratis' : formatPrice(summary.shipping_cents)}
                  </span>
                </div>
                
                {summary.discount_cents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuento</span>
                    <span className="text-green-600">-{formatPrice(summary.discount_cents)}</span>
                  </div>
                )}
                
                {summary.applied_coupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cupón: {summary.applied_coupon.code}</span>
                    <span className="text-green-600">✓</span>
                  </div>
                )}
                
                {summary.tax_cents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA</span>
                    <span className="text-gray-900">{formatPrice(summary.tax_cents)}</span>
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-medium text-gray-900">Total</span>
                    <span className="text-lg font-medium text-gray-900">
                      {formatPrice(summary.total_cents)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nota para usuarios no autenticados */}
              {!user && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-green-800">
                        Checkout como invitado
                      </h3>
                      <p className="mt-1 text-sm text-green-700">
                        Tu pedido se procesará sin necesidad de crear una cuenta. Recibirás un email de confirmación.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? 'Procesando Pedido...' : 'Confirmar Pedido'}
                </button>
                
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Volver
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
