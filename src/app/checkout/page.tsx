'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useHydration } from '../../hooks/useHydration'
import { LoadingState } from '../../components/ui/LoadingState'
import { OrderService } from '../../lib/orders'
import BillingForm from '../../components/checkout/BillingFormClean'
import ShippingFormSimple from '../../components/checkout/ShippingFormSimple'
import PaymentForm from '../../components/checkout/PaymentForm'
import OrderSummary from '../../components/checkout/OrderSummary'
import OrderConfirmationComponent from '../../components/checkout/OrderConfirmation'
import RedsysPaymentForm from '../../components/checkout/RedsysPaymentForm'
import type { 
  CheckoutStep, 
  ShippingAddress,
  BillingAddress, 
  OrderConfirmation,
  CreateOrderData,
  PaymentMethod
} from '../../types/checkout'

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { cartItems, clearCart } = useCart()
  const isHydrated = useHydration()
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('billing')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Datos del formulario
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null)
  const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string>('')
  const [paymentMethodId, setPaymentMethodId] = useState<string>('')
  const [couponCode, setCouponCode] = useState<string>('')
  
  // Datos de pago con Redsys
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  
  // Confirmación de pedido
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null)

  // Verificar que tenga items en el carrito
  useEffect(() => {
    if (!isHydrated) return
    if (cartItems.length === 0) {
      router.push('/cart')
      return
    }
  }, [cartItems, router, isHydrated])

  // Pre-llenar información del usuario si está disponible
  useEffect(() => {
    if (!isHydrated) return
    if (user?.client && currentStep === 'shipping' && billingAddress) {
      const initialShippingData: Partial<ShippingAddress> = {
        address_line1: user.client.address_line1 || billingAddress.address_line1 || '',
        address_line2: user.client.address_line2 || billingAddress.address_line2 || '',
        city: user.client.city || billingAddress.city || '',
        region: user.client.region || billingAddress.region || '',
        postal_code: user.client.postal_code || billingAddress.postal_code || ''
      }
      
      // Solo si no hay datos previos
      if (!shippingAddress) {
        setShippingAddress(prev => prev || initialShippingData as ShippingAddress)
      }
    }
  }, [user, currentStep, shippingAddress, billingAddress, isHydrated])

  const handleBillingSubmit = (data: BillingAddress & { use_shipping_as_billing?: boolean }) => {
    setBillingAddress(data)
    setCurrentStep('shipping')
    setError(null)
  }

  const handleShippingSubmit = (data: ShippingAddress & { use_billing_as_shipping?: boolean }) => {
    setShippingAddress(data)
    setCurrentStep('payment')
    setError(null)
  }

  const handlePaymentSubmit = (data: { 
    shippingMethodId: string
    paymentMethodId: string
    couponCode?: string 
  }) => {
    setShippingMethodId(data.shippingMethodId)
    setPaymentMethodId(data.paymentMethodId)
    setCouponCode(data.couponCode || '')
    setCurrentStep('review')
    setError(null)
  }

  const handleOrderConfirm = async () => {
    if (!shippingAddress || !billingAddress) {
      setError('Faltan datos requeridos para procesar el pedido')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Obtener información del método de pago seleccionado
      const paymentMethods = await OrderService.getPaymentMethods()
      const selectedMethod = paymentMethods.find(m => m.id === paymentMethodId)
      
      if (!selectedMethod) {
        throw new Error('Método de pago no válido')
      }

      setSelectedPaymentMethod(selectedMethod)

      // Preparar datos de la orden
      const orderData: CreateOrderData = {
        client_id: user?.client?.id || null,
        guest_email: !user?.client?.id ? billingAddress.email : undefined,
        items: cartItems.map(item => ({
          variant_id: item.variant_id,
          qty: item.qty,
          price_cents: item.price_at_addition_cents
        })),
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        shipping_method_id: shippingMethodId,
        payment_method_id: paymentMethodId,
        coupon_code: couponCode || undefined
      }

      // Crear orden
      const confirmation = await OrderService.createOrder(orderData)
      
      if (confirmation) {
        // Si el método de pago es Redsys (tarjeta), redirigir al formulario de pago
        if (selectedMethod.provider === 'Redsys') {
          setPendingOrderId(confirmation.order.id)
          setOrderConfirmation(confirmation)
          setCurrentStep('payment')
          setIsLoading(false)
          return
        }

        // Para otros métodos de pago, proceder normalmente
        setOrderConfirmation(confirmation)
        setCurrentStep('confirmation')
        
        // Limpiar carrito después de orden exitosa
        await clearCart()
        
        console.log('✅ Pedido creado exitosamente:', confirmation.confirmation_number)
      } else {
        setError('Error al crear el pedido. Por favor, inténtalo de nuevo.')
      }
    } catch (err) {
      console.error('Error creating order:', err)
      setError('Error al procesar el pedido. Por favor, inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToStep = (step: CheckoutStep) => {
    setCurrentStep(step)
    setError(null)
  }

  // Mostrar loading si no hay items en el carrito o no está hidratado
  if (!isHydrated || cartItems.length === 0) {
    return (
      <LoadingState>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando checkout...</p>
          </div>
        </div>
      </LoadingState>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Compra</h1>
          
          {/* Nota informativa para usuarios no autenticados */}
          {!user && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    Checkout como invitado
                  </h3>
                  <p className="mt-1 text-sm text-green-700">
                    Puedes completar tu compra sin crear una cuenta. Solo necesitamos tu información de envío y pago.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Indicador de pasos */}
          {currentStep !== 'confirmation' && (
            <div className="mt-6">
              <nav aria-label="Progress">
                <ol className="flex items-center">
                  {[
                    { id: 'billing', name: 'Facturación', step: 1 },
                    { id: 'shipping', name: 'Envío', step: 2 },
                    { id: 'payment', name: 'Pago', step: 3 },
                    { id: 'review', name: 'Revisar', step: 4 }
                  ].map((step, stepIdx) => (
                    <li key={step.id} className={`${stepIdx !== 3 ? 'pr-8 sm:pr-20' : ''} relative`}>
                      <div className="flex items-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                            currentStep === step.id || 
                            (step.id === 'billing' && ['shipping', 'payment', 'review'].includes(currentStep)) ||
                            (step.id === 'shipping' && ['payment', 'review'].includes(currentStep)) ||
                            (step.id === 'payment' && currentStep === 'review')
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-gray-300 bg-white text-gray-500'
                          }`}
                        >
                          <span className="text-sm font-medium">{step.step}</span>
                        </div>
                        <span
                          className={`ml-3 text-sm font-medium ${
                            currentStep === step.id ||
                            (step.id === 'billing' && ['shipping', 'payment', 'review'].includes(currentStep)) ||
                            (step.id === 'shipping' && ['payment', 'review'].includes(currentStep)) ||
                            (step.id === 'payment' && currentStep === 'review')
                              ? 'text-blue-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {step.name}
                        </span>
                      </div>
                      {stepIdx !== 3 && (
                        <div
                          className={`absolute top-4 left-8 -ml-px h-0.5 w-full ${
                            (step.id === 'billing' && ['shipping', 'payment', 'review'].includes(currentStep)) ||
                            (step.id === 'shipping' && ['payment', 'review'].includes(currentStep)) ||
                            (step.id === 'payment' && currentStep === 'review')
                              ? 'bg-blue-600'
                              : 'bg-gray-300'
                          }`}
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido del paso actual */}
        <div className="mb-8">
          {currentStep === 'billing' && (
            <BillingForm
              initialData={billingAddress || undefined}
              onSubmit={handleBillingSubmit}
              isLoading={isLoading}
            />
          )}

          {currentStep === 'shipping' && billingAddress && (
            <ShippingFormSimple
              initialData={shippingAddress || undefined}
              billingAddress={billingAddress}
              onSubmit={handleShippingSubmit}
              onBack={() => handleBackToStep('billing')}
              isLoading={isLoading}
            />
          )}

          {currentStep === 'payment' && pendingOrderId && orderConfirmation && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Pedido Creado: #{orderConfirmation.confirmation_number}
                </h3>
                <p className="text-sm text-blue-700">
                  Tu pedido ha sido registrado. Por favor, completa el pago con tarjeta para confirmar tu compra.
                </p>
              </div>
              
              <RedsysPaymentForm
                orderId={pendingOrderId}
                amount={orderConfirmation.order.total_cents}
                description={`Pedido #${orderConfirmation.confirmation_number}`}
                consumerName={billingAddress?.first_name && billingAddress?.last_name 
                  ? `${billingAddress.first_name} ${billingAddress.last_name}` 
                  : undefined
                }
                autoSubmit={false}
                onSuccess={() => {
                  console.log('Redirigiendo a Redsys...')
                }}
                onError={(error) => {
                  setError(error)
                  setIsLoading(false)
                }}
              />
            </div>
          )}

          {currentStep === 'payment' && !pendingOrderId && (
            <PaymentForm
              onSubmit={handlePaymentSubmit}
              onBack={() => handleBackToStep('shipping')}
              isLoading={isLoading}
            />
          )}

          {currentStep === 'review' && shippingAddress && billingAddress && (
            <OrderSummary
              shippingAddress={shippingAddress}
              billingAddress={billingAddress}
              shippingMethodId={shippingMethodId}
              paymentMethodId={paymentMethodId}
              couponCode={couponCode}
              onConfirm={handleOrderConfirm}
              onBack={() => handleBackToStep('payment')}
              isLoading={isLoading}
            />
          )}

          {currentStep === 'confirmation' && orderConfirmation && (
            <OrderConfirmationComponent
              confirmation={orderConfirmation}
            />
          )}
        </div>
      </div>
    </div>
  )
}