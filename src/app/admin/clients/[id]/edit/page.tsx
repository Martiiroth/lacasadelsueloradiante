'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminClient } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
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
  XMarkIcon
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

export default function AdminClientEdit() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<AdminClient | null>(null)
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientId = params.id as string

  useEffect(() => {
    if (clientId) {
      loadClientDetail()
    }
  }, [clientId])

  const loadClientDetail = async () => {
    try {
      setLoading(true)
      const clients = await AdminService.getAllClients({})
      const foundClient = clients.find(c => c.id === clientId)
      
      if (foundClient) {
        setClient(foundClient)
        setFormData({
          first_name: foundClient.first_name || '',
          last_name: foundClient.last_name || '',
          email: foundClient.email || '',
          phone: foundClient.phone || '',
          nif_cif: foundClient.nif_cif || '',
          is_active: foundClient.is_active,
          region: foundClient.region || '',
          city: foundClient.city || '',
          address_line1: foundClient.address_line1 || '',
          address_line2: foundClient.address_line2 || '',
          postal_code: foundClient.postal_code || '',
          activity: foundClient.activity || '',
          company_name: foundClient.company_name || '',
          company_position: foundClient.company_position || ''
        })
      } else {
        setError('Cliente no encontrado')
      }
    } catch (err) {
      console.error('Error loading client detail:', err)
      setError('Error al cargar el detalle del cliente')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!client) return

    try {
      setSaving(true)
      setError(null)

      const success = await AdminService.updateClient(client.id, formData)
      
      if (success) {
        router.push(`/admin/clients/${client.id}`)
      } else {
        setError('Error al actualizar el cliente. Por favor, inténtalo de nuevo.')
      }
    } catch (err) {
      console.error('Error updating client:', err)
      setError('Error al actualizar el cliente. Por favor, inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error && !client) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Editar Cliente
              </h1>
              <p className="mt-2 text-gray-600">
                Modifica la información del cliente {client?.first_name} {client?.last_name}
              </p>
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
                  <p className="mt-1 text-sm text-gray-500">
                    Los clientes inactivos no pueden realizar pedidos
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
                    placeholder="Describe la actividad principal de la empresa..."
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
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}