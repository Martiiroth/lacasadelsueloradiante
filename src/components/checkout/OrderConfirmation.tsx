'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
// Componente de icono de check simple
const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)
import type { OrderConfirmation } from '../../types/checkout'

interface OrderConfirmationProps {
  confirmation: OrderConfirmation
  onNewOrder?: () => void
}

export default function OrderConfirmationComponent({ 
  confirmation, 
  onNewOrder 
}: OrderConfirmationProps) {
  const { order, order_items, confirmation_number } = confirmation
  const { clearCart } = useCart()

  useEffect(() => {
    // Scroll al inicio cuando se muestra la confirmación
    window.scrollTo(0, 0)
    
    // Asegurar que el carrito se vacia cuando se muestra la confirmación
    const ensureCartIsCleared = async () => {
      try {
        console.log('🛒 Vaciando carrito en confirmación de pedido...')
        const success = await clearCart()
        if (success) {
          console.log('✅ Carrito vaciado en confirmación')
        }
      } catch (error) {
        console.error('Error vaciando carrito en confirmación:', error)
      }
    }
    
    ensureCartIsCleared()
  }, [])

  const formatPrice = (cents: number): string => {
    return (cents / 100).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    })
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Header de confirmación */}
        <div className="bg-green-50 border-b border-green-200 px-6 py-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckIcon className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-900 mb-2">
            ¡Pedido Confirmado!
          </h1>
          <p className="text-green-700">
            Tu pedido ha sido procesado exitosamente
          </p>
        </div>

        <div className="p-6">
          {/* Información del pedido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Información del Pedido
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Número de confirmación:</dt>
                  <dd className="font-medium text-gray-900">{confirmation_number}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Pedido ID:</dt>
                  <dd className="font-mono text-xs text-gray-900">{order.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Fecha:</dt>
                  <dd className="text-gray-900">{formatDate(order.created_at)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Estado:</dt>
                  <dd className="text-gray-900 capitalize">{order.status}</dd>
                </div>
                <div className="flex justify-between font-medium">
                  <dt className="text-gray-900">Total:</dt>
                  <dd className="text-gray-900">{formatPrice(order.total_cents)}</dd>
                </div>
              </dl>
            </div>


          </div>

          {/* Instrucciones de Transferencia Bancaria */}
          {order.status === 'pending' && (
            <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
              <h2 className="text-lg font-semibold text-amber-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Instrucciones de Pago - Transferencia Bancaria
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-amber-900 mb-2">Número de cuenta (IBAN):</p>
                  <div className="flex items-center justify-between">
                    <code className="text-lg font-mono bg-white px-3 py-2 rounded border text-gray-900 flex-1 mr-2">
                      ES18 2100 8453 5102 0007 7305
                    </code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText('ES18210084535102000773051')}
                      className="text-amber-600 hover:text-amber-800 p-2 rounded transition-colors"
                      title="Copiar número de cuenta"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-amber-900 mb-2">Concepto obligatorio:</p>
                  <div className="flex items-center justify-between">
                    <code className="text-lg font-mono bg-white px-3 py-2 rounded border text-gray-900 flex-1 mr-2">
                      Pedido #{confirmation_number}
                    </code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(`Pedido #${confirmation_number}`)}
                      className="text-amber-600 hover:text-amber-800 p-2 rounded transition-colors"
                      title="Copiar concepto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <p className="font-medium text-amber-900">Titular:</p>
                  <p className="text-amber-800">La Casa del Suelo Radiante S.L.</p>
                </div>
                <div>
                  <p className="font-medium text-amber-900">Banco:</p>
                  <p className="text-amber-800">CaixaBank</p>
                </div>
                <div>
                  <p className="font-medium text-amber-900">Importe:</p>
                  <p className="text-amber-800 text-lg font-bold">{formatPrice(order.total_cents)}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded border border-amber-200">
                <h3 className="font-medium text-amber-900 mb-2">📋 Instrucciones importantes:</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Realiza la transferencia por el importe exacto: <strong>{formatPrice(order.total_cents)}</strong></li>
                  <li>• Incluye obligatoriamente el concepto: <strong>Pedido #{confirmation_number}</strong></li>
                  <li>• Una vez recibida la transferencia, procesaremos tu pedido en 24-48 horas laborables</li>
                  <li>• Recibirás un email de confirmación cuando procesemos el pago</li>
                  <li>• Si tienes dudas, contacta con nosotros indicando tu número de pedido</li>
                </ul>
              </div>
            </div>
          )}

          {/* Dirección de envío */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Dirección de Envío
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">
                {order.shipping_address.first_name} {order.shipping_address.last_name}
              </p>
              {order.shipping_address.company_name && (
                <p className="text-gray-600">{order.shipping_address.company_name}</p>
              )}
              <p className="text-gray-600">{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && (
                <p className="text-gray-600">{order.shipping_address.address_line2}</p>
              )}
              <p className="text-gray-600">
                {order.shipping_address.postal_code} {order.shipping_address.city}, {order.shipping_address.region}
              </p>
              <p className="text-gray-600">{order.shipping_address.country || 'España'}</p>
              {order.shipping_address.phone && (
                <p className="text-gray-600 mt-2">Tel: {order.shipping_address.phone}</p>
              )}
              <p className="text-gray-600">Email: {order.shipping_address.email}</p>
            </div>
          </div>

          {/* Productos pedidos */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Productos Pedidos ({order_items.length})
            </h2>
            <div className="space-y-4">
              {order_items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.variant?.product?.image ? (
                      <Image
                        src={item.variant.product.image.url}
                        alt={item.variant.product.image.alt || item.variant?.product?.title || ''}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-500 text-xs">Sin imagen</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.variant?.title || 'Variante'}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {item.variant?.product?.title || 'Producto'}
                    </p>
                    {item.variant?.sku && (
                      <p className="text-xs text-gray-500">SKU: {item.variant.sku}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Cantidad: {item.qty}</p>
                    <p className="font-medium text-gray-900">
                      {formatPrice(item.price_cents * item.qty)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Próximos pasos */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              ¿Qué sigue?
            </h2>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                Recibirás un email de confirmación con todos los detalles del pedido
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                Te notificaremos cuando tu pedido sea procesado y enviado
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                Podrás hacer seguimiento del estado de tu pedido en tu cuenta
              </li>
            </ul>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/orders/${order.id}`}
              className="flex-1 bg-blue-600 text-white text-center px-6 py-3 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Ver Detalles del Pedido
            </Link>
            <Link
              href="/products"
              className="flex-1 bg-white border border-gray-300 text-gray-700 text-center px-6 py-3 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Continuar Comprando
            </Link>
          </div>

          {/* Contacto */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              ¿Tienes alguna pregunta sobre tu pedido?{' '}
              <Link href="/contact" className="text-blue-600 hover:text-blue-800">
                Contáctanos
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}