'use client'

import { useState } from 'react'
import type { ShippingAddress, BillingAddress } from '../../types/checkout'

interface ShippingFormProps {
  initialData?: Partial<ShippingAddress>
  billingAddress?: BillingAddress // Para poder usar la misma dirección
  onSubmit: (data: ShippingAddress & { use_billing_as_shipping?: boolean }) => void
  onBack?: () => void
  isLoading?: boolean
}

export default function ShippingForm({ 
  initialData, 
  billingAddress,
  onSubmit, 
  onBack, 
  isLoading = false 
}: ShippingFormProps) {
  
  const [formData, setFormData] = useState<Partial<ShippingAddress> & { use_billing_as_shipping?: boolean }>({
    address_line1: initialData?.address_line1 || '',
    address_line2: initialData?.address_line2 || '',
    city: initialData?.city || '',
    region: initialData?.region || '',
    postal_code: initialData?.postal_code || '',
    country: initialData?.country || 'España',
    use_billing_as_shipping: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked }))

    // Si marca "usar dirección de facturación", copiar los datos
    if (name === 'use_billing_as_shipping' && checked && billingAddress) {
      setFormData(prev => ({
        ...prev,
        address_line1: billingAddress.address_line1,
        address_line2: billingAddress.address_line2 || '',
        city: billingAddress.city,
        region: billingAddress.region,
        postal_code: billingAddress.postal_code,
        country: billingAddress.country || 'España',
        use_billing_as_shipping: true
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Campos obligatorios
    if (!formData.address_line1?.trim()) newErrors.address_line1 = 'La dirección es obligatoria'
    if (!formData.city?.trim()) newErrors.city = 'La ciudad es obligatoria'
    if (!formData.region?.trim()) newErrors.region = 'La provincia/región es obligatoria'
    if (!formData.postal_code?.trim()) newErrors.postal_code = 'El código postal es obligatorio'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const shippingData: ShippingAddress & { use_billing_as_shipping?: boolean } = {
      address_line1: formData.address_line1!,
      address_line2: formData.address_line2,
      city: formData.city!,
      region: formData.region!,
      postal_code: formData.postal_code!,
      country: formData.country || 'España',
      use_billing_as_shipping: formData.use_billing_as_shipping
    }

    onSubmit(shippingData)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Dirección de Envío
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Opción de usar dirección de facturación */}
          {billingAddress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <input
                  id="use_billing_as_shipping"
                  name="use_billing_as_shipping"
                  type="checkbox"
                  checked={formData.use_billing_as_shipping || false}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="use_billing_as_shipping" className="ml-2 block text-sm text-blue-800">
                  Usar la misma dirección de facturación para envío
                </label>
              </div>
              {billingAddress && (
                <div className="mt-2 text-sm text-blue-700">
                  {billingAddress.address_line1}, {billingAddress.postal_code} {billingAddress.city}, {billingAddress.region}
                </div>
              )}
            </div>
          )}

          {/* Dirección de envío */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección de Entrega</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  id="address_line1"
                  name="address_line1"
                  value={formData.address_line1 || ''}
                  onChange={handleInputChange}
                  disabled={formData.use_billing_as_shipping}
                  placeholder="Calle, número, piso, puerta..."
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                    errors.address_line1 ? 'border-red-300' : ''
                  }`}
                />
                {errors.address_line1 && (
                  <p className="mt-1 text-sm text-red-600">{errors.address_line1}</p>
                )}
              </div>

              <div>
                <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección Adicional (Opcional)
                </label>
                <input
                  type="text"
                  id="address_line2"
                  name="address_line2"
                  value={formData.address_line2 || ''}
                  onChange={handleInputChange}
                  disabled={formData.use_billing_as_shipping}
                  placeholder="Información adicional de dirección"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal *
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code || ''}
                    onChange={handleInputChange}
                    disabled={formData.use_billing_as_shipping}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                      errors.postal_code ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.postal_code && (
                    <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleInputChange}
                    disabled={formData.use_billing_as_shipping}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                      errors.city ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    id="region"
                    name="region"
                    value={formData.region || ''}
                    onChange={handleInputChange}
                    disabled={formData.use_billing_as_shipping}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                      errors.region ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.region && (
                    <p className="mt-1 text-sm text-red-600">{errors.region}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-between pt-6">
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
              disabled={isLoading}
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Cargando...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}