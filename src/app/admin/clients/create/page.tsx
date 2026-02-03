'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  UserIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'

interface ClientFormData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  nif_cif?: string
  is_active: boolean
  region?: string
  city?: string
  address_line1?: string
  address_line2?: string
  postal_code?: string
  activity?: string
  company_name?: string
  company_position?: string
}

export default function AdminClientCreate() {
  const router = useRouter()
  const [formData, setFormData] = useState<ClientFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    nif_cif: '',
    is_active: true,
    region: '',
    city: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    activity: '',
    company_name: '',
    company_position: ''
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setCreating(true)
      setError(null)

      // Validaciones básicas
      if (!formData.first_name.trim()) {
        setError('El nombre es obligatorio')
        return
      }
      if (!formData.last_name.trim()) {
        setError('Los apellidos son obligatorios')
        return
      }
      if (!formData.email.trim()) {
        setError('El email es obligatorio')
        return
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('El formato del email no es válido')
        return
      }

      // Sesión fresca y Bearer para la API
      const supabase = createClient()
      let { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        const { data: refreshed } = await supabase.auth.refreshSession()
        session = refreshed.session ?? null
      }
      if (!session?.access_token) {
        setError('Tu sesión ha expirado. Inicia sesión de nuevo.')
        return
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(formData),
      })

      // Leer el texto de la respuesta una sola vez
      const text = await response.text()

      if (!text || text.trim() === '') {
        if (response.status === 403) {
          setError('No autorizado (403). Verifica que tu usuario tenga rol admin y que SUPABASE_SERVICE_ROLE_KEY esté configurada en el servidor.')
          return
        }
        if (response.status === 401) {
          setError('Tu sesión ha expirado. Inicia sesión de nuevo.')
          return
        }
        throw new Error(`El servidor devolvió una respuesta vacía (${response.status})`)
      }

      // Intentar parsear JSON
      let result
      try {
        result = JSON.parse(text)
      } catch (parseError) {
        console.error('Error parseando JSON:', parseError, 'Respuesta:', text)
        if (!response.ok) {
          throw new Error(`Error al crear el cliente: ${response.status} - ${text}`)
        }
        throw new Error('El servidor devolvió una respuesta inválida')
      }

      if (!response.ok) {
        if (response.status === 401) {
          await supabase.auth.signOut()
          setError('Tu sesión ha expirado. Inicia sesión de nuevo.')
          return
        }
        if (response.status === 403) {
          setError(result.message || 'No tienes permisos para crear clientes. Verifica que tu usuario tenga rol admin.')
          return
        }
        throw new Error(result.message || `Error al crear el cliente (${response.status})`)
      }

      if (result.success) {
        alert(`Cliente creado correctamente.\n\nEmail: ${formData.email}\nContraseña: Lacasadelsueloradiante2025\n\nEl cliente puede usar estas credenciales para iniciar sesión.`)
        router.push('/admin/clients')
      } else {
        setError(result.message || 'Error al crear el cliente. Por favor, inténtalo de nuevo.')
      }
    } catch (err) {
      console.error('Error creating client:', err)
      if (err instanceof Error) {
        if (err.message.includes('duplicate key') || err.message.includes('already exists')) {
          setError('Ya existe un usuario con este email')
        } else if (err.message.includes('password')) {
          setError('Error al configurar la contraseña del usuario')
        } else if (err.message.includes('email')) {
          setError('Error al enviar el email de confirmación')
        } else {
          setError('Error al crear el cliente: ' + err.message)
        }
      } else {
        setError('Error al crear el cliente. Por favor, inténtalo de nuevo.')
      }
    } finally {
      setCreating(false)
    }
  }

  const handleReset = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      nif_cif: '',
      is_active: true,
      region: '',
      city: '',
      address_line1: '',
      address_line2: '',
      postal_code: '',
      activity: '',
      company_name: '',
      company_position: ''
    })
    setError(null)
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                <UserPlusIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Crear Nuevo Cliente
                </h1>
                <p className="mt-2 text-gray-600">
                  Añade un nuevo cliente al sistema con su información completa
                </p>
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Se creará automáticamente una cuenta de usuario con la contraseña: <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">Lacasadelsueloradiante2025</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                Información Personal
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Información básica del cliente (campos obligatorios marcados con *)
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    id="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Nombre del cliente"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    id="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Apellidos del cliente"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    <PhoneIcon className="h-4 w-4 inline mr-1" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="+34 600 000 000"
                  />
                </div>

                <div>
                  <label htmlFor="nif_cif" className="block text-sm font-medium text-gray-700">
                    <IdentificationIcon className="h-4 w-4 inline mr-1" />
                    NIF/CIF
                  </label>
                  <input
                    type="text"
                    name="nif_cif"
                    id="nif_cif"
                    value={formData.nif_cif}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="12345678A o A12345678"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Cliente activo
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Los clientes inactivos no pueden realizar pedidos. Por defecto, los clientes nuevos se crean como activos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-400" />
                Información Empresarial
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Información opcional sobre la empresa del cliente
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    id="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Nombre de la empresa"
                  />
                </div>

                <div>
                  <label htmlFor="company_position" className="block text-sm font-medium text-gray-700">
                    Cargo en la empresa
                  </label>
                  <input
                    type="text"
                    name="company_position"
                    id="company_position"
                    value={formData.company_position}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Director, Gerente, etc."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="activity" className="block text-sm font-medium text-gray-700">
                    Actividad empresarial
                  </label>
                  <textarea
                    name="activity"
                    id="activity"
                    rows={3}
                    value={formData.activity}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Describe la actividad principal de la empresa del cliente..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                Dirección
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Información opcional de la dirección del cliente
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700">
                    Dirección línea 1
                  </label>
                  <input
                    type="text"
                    name="address_line1"
                    id="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Calle, número, piso..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700">
                    Dirección línea 2
                  </label>
                  <input
                    type="text"
                    name="address_line2"
                    id="address_line2"
                    value={formData.address_line2}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Información adicional de la dirección..."
                  />
                </div>

                <div>
                  <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                    Código postal
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="12345"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Madrid, Barcelona, etc."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                    Provincia/Región
                  </label>
                  <input
                    type="text"
                    name="region"
                    id="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Comunidad de Madrid, Cataluña, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Limpiar formulario
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando cliente...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Crear cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}