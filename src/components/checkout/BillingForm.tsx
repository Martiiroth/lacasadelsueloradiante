'use client'

import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { BillingAddress, ShippingAddress } from '../../types/checkout'

interface ExtendedBillingAddress extends BillingAddress {
  use_shipping_as_billing?: boolean
}

interface BillingFormProps {
  initialData?: Partial<ExtendedBillingAddress>
  onSubmit: (data: BillingAddress) => void
  onBack?: () => void
  isLoading?: boolean
  shippingAddress?: ShippingAddress
}

export default function BillingForm({ 
  initialData, 
  onSubmit, 
  onBack, 
  isLoading = false,
  shippingAddress
}: BillingFormProps) {
  const { user } = useAuth()
  
  const [formData, setFormData] = useState<Partial<ExtendedBillingAddress>>({
    first_name: initialData?.first_name || user?.client?.first_name || '',
    last_name: initialData?.last_name || user?.client?.last_name || '',
    email: initialData?.email || user?.client?.email || '',
    phone: initialData?.phone || user?.client?.phone || '',
    company_name: initialData?.company_name || user?.client?.company_name || '',
    nif_cif: initialData?.nif_cif || user?.client?.nif_cif || '',
    activity: initialData?.activity || user?.client?.activity || '',
    company_position: initialData?.company_position || user?.client?.company_position || '',
    address_line1: initialData?.address_line1 || user?.client?.address_line1 || '',
    address_line2: initialData?.address_line2 || user?.client?.address_line2 || '',
    city: initialData?.city || user?.client?.city || '',
    region: initialData?.region || user?.client?.region || '',
    postal_code: initialData?.postal_code || user?.client?.postal_code || '',
    country: initialData?.country || 'España',
    use_shipping_as_billing: initialData?.use_shipping_as_billing || false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    
    if (name === 'use_shipping_as_billing' && checked && shippingAddress) {
      // Copiar datos de la dirección de envío a la de facturación
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        first_name: shippingAddress.first_name || prev.first_name,
        last_name: shippingAddress.last_name || prev.last_name,
        email: shippingAddress.email || prev.email,
        phone: shippingAddress.phone || prev.phone,
        address_line1: shippingAddress.address_line1,
        address_line2: shippingAddress.address_line2,
        city: shippingAddress.city,
        region: shippingAddress.region,
        postal_code: shippingAddress.postal_code,
        country: shippingAddress.country || 'España'
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: checked }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Campos obligatorios
    if (!formData.first_name?.trim()) newErrors.first_name = 'El nombre es obligatorio'
    if (!formData.last_name?.trim()) newErrors.last_name = 'Los apellidos son obligatorios'
    if (!formData.email?.trim()) newErrors.email = 'El email es obligatorio'
    if (!formData.address_line1?.trim()) newErrors.address_line1 = 'La dirección es obligatoria'
    if (!formData.city?.trim()) newErrors.city = 'La ciudad es obligatoria'
    if (!formData.region?.trim()) newErrors.region = 'La provincia/región es obligatoria'
    if (!formData.postal_code?.trim()) newErrors.postal_code = 'El código postal es obligatorio'

    // Validación de email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Introduce un email válido'
    }

    // Validación de NIF/CIF si es empresa
    if (formData.company_name && !formData.nif_cif?.trim()) {
      newErrors.nif_cif = 'El NIF/CIF es obligatorio para empresas'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const billingData: BillingAddress = {
      first_name: formData.first_name!,
      last_name: formData.last_name!,
      email: formData.email!,
      phone: formData.phone,
      company_name: formData.company_name,
      nif_cif: formData.nif_cif,
      activity: formData.activity,
      company_position: formData.company_position,
      address_line1: formData.address_line1!,
      address_line2: formData.address_line2,
      city: formData.city!,
      region: formData.region!,
      postal_code: formData.postal_code!,
      country: formData.country || 'España'
    }

    onSubmit(billingData)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Información de Facturación
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Opción de usar dirección de envío */}
          {shippingAddress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <input
                  id="use_shipping_as_billing"
                  name="use_shipping_as_billing"
                  type="checkbox"
                  checked={formData.use_shipping_as_billing || false}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="use_shipping_as_billing" className="ml-2 block text-sm text-blue-800">
                  Usar la misma dirección de envío para facturación
                </label>
              </div>
            </div>
          )}

          {/* Información personal */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name || ''}
                  onChange={handleInputChange}
                  disabled={formData.use_shipping_as_billing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                    errors.first_name ? 'border-red-300' : ''
                  }`}
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name || ''}
                  onChange={handleInputChange}
                  disabled={formData.use_shipping_as_billing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                    errors.last_name ? 'border-red-300' : ''
                  }`}
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  disabled={formData.use_shipping_as_billing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                    errors.email ? 'border-red-300' : ''
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  disabled={formData.use_shipping_as_billing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Información de empresa (opcional) */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Datos de Empresa (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="nif_cif" className="block text-sm font-medium text-gray-700 mb-1">
                  NIF/CIF {formData.company_name && '*'}
                </label>
                <input
                  type="text"
                  id="nif_cif"
                  name="nif_cif"
                  value={formData.nif_cif || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nif_cif ? 'border-red-300' : ''
                  }`}
                />
                {errors.nif_cif && (
                  <p className="mt-1 text-sm text-red-600">{errors.nif_cif}</p>
                )}
              </div>

              <div>
                <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-1">
                  Actividad
                </label>
                <input
                  type="text"
                  id="activity"
                  name="activity"
                  value={formData.activity || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="company_position" className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo en la Empresa
                </label>
                <input
                  type="text"
                  id="company_position"
                  name="company_position"
                  value={formData.company_position || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Dirección de facturación */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección de Facturación</h3>
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
                  disabled={formData.use_shipping_as_billing}
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
                  Dirección 2 (Opcional)
                </label>
                <input
                  type="text"
                  id="address_line2"
                  name="address_line2"
                  value={formData.address_line2 || ''}
                  onChange={handleInputChange}
                  disabled={formData.use_shipping_as_billing}
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
                    disabled={formData.use_shipping_as_billing}
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
                    disabled={formData.use_shipping_as_billing}
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
                    Provincia/Región *
                  </label>
                  <input
                    type="text"
                    id="region"
                    name="region"
                    value={formData.region || ''}
                    onChange={handleInputChange}
                    disabled={formData.use_shipping_as_billing}
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