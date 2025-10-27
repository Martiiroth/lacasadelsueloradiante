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
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  ShoppingBagIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function AdminClientDetail() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<AdminClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const clientId = params.id as string

  useEffect(() => {
    if (clientId) {
      loadClientDetail()
    }
  }, [clientId])

  const loadClientDetail = async () => {
    try {
      setLoading(true)
      const foundClient = await AdminService.getClientById(clientId)
      
      if (foundClient) {
        setClient(foundClient)
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

  const toggleClientStatus = async () => {
    if (!client) return
    
    try {
      setUpdating(true)
      const success = await AdminService.updateClient(client.id, {
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        is_active: !client.is_active,
        phone: client.phone,
        nif_cif: client.nif_cif,
        region: client.region,
        city: client.city,
        address_line1: client.address_line1,
        address_line2: client.address_line2,
        postal_code: client.postal_code,
        activity: client.activity,
        company_name: client.company_name,
        company_position: client.company_position
      })
      
      if (success) {
        setClient({ ...client, is_active: !client.is_active })
      } else {
        alert('Error al actualizar el estado del cliente')
      }
    } catch (err) {
      console.error('Error updating client status:', err)
      alert('Error al actualizar el estado del cliente')
    } finally {
      setUpdating(false)
    }
  }

  const deleteClient = async () => {
    if (!client) return
    
    if (!confirm(`¿Estás seguro de que quieres eliminar al cliente ${client.first_name} ${client.last_name}? Esta acción no se puede deshacer.`)) {
      return
    }
    
    try {
      const success = await AdminService.deleteClient(client.id)
      
      if (success) {
        alert('Cliente eliminado correctamente')
        router.push('/admin/clients')
      } else {
        alert('Error al eliminar el cliente')
      }
    } catch (err) {
      console.error('Error deleting client:', err)
      if (err instanceof Error) {
        alert(err.message)
      } else {
        alert('Error al eliminar el cliente')
      }
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

  if (error || !client) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" />
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-lg font-medium text-indigo-600">
                    {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {client.first_name} {client.last_name}
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Cliente desde {new Date(client.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={toggleClientStatus}
                disabled={updating}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                  client.is_active 
                    ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500' 
                    : 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500'
                }`}
              >
                {client.is_active ? (
                  <>
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    {updating ? 'Desactivando...' : 'Desactivar'}
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    {updating ? 'Activando...' : 'Activar'}
                  </>
                )}
              </button>
              <button
                onClick={() => router.push(`/admin/clients/${client.id}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={deleteClient}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Información Personal
                </h3>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.first_name} {client.last_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 flex items-center text-sm text-gray-900">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`mailto:${client.email}`} className="text-indigo-600 hover:text-indigo-800">
                        {client.email}
                      </a>
                    </dd>
                  </div>
                  {client.phone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                      <dd className="mt-1 flex items-center text-sm text-gray-900">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <a href={`tel:${client.phone}`} className="text-indigo-600 hover:text-indigo-800">
                          {client.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {client.nif_cif && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">NIF/CIF</dt>
                      <dd className="mt-1 flex items-center text-sm text-gray-900">
                        <IdentificationIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {client.nif_cif}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estado</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Rol</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${AdminService.getRoleColor(client.role?.name || 'guest')}`}>
                        {AdminService.getRoleLabel(client.role?.name || 'guest')}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Company Information */}
            {(client.company_name || client.company_position || client.activity) && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Información Empresarial
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    {client.company_name && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Empresa</dt>
                        <dd className="mt-1 text-sm text-gray-900">{client.company_name}</dd>
                      </div>
                    )}
                    {client.company_position && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Cargo</dt>
                        <dd className="mt-1 text-sm text-gray-900">{client.company_position}</dd>
                      </div>
                    )}
                    {client.activity && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Actividad</dt>
                        <dd className="mt-1 text-sm text-gray-900">{client.activity}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {/* Address Information */}
            {(client.address_line1 || client.city || client.region) && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Dirección
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <div className="text-sm text-gray-900 space-y-1">
                    {client.address_line1 && <p>{client.address_line1}</p>}
                    {client.address_line2 && <p>{client.address_line2}</p>}
                    <p>
                      {client.postal_code && `${client.postal_code} `}
                      {client.city}
                    </p>
                    {client.region && <p>{client.region}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            {client.stats && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <ShoppingBagIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Estadísticas
                  </h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShoppingBagIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Total pedidos</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{client.stats.total_orders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CurrencyEuroIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Total gastado</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      €{(client.stats.total_spent_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  {client.stats.last_order_date && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">Último pedido</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(client.stats.last_order_date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Acciones Rápidas</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <button
                  onClick={() => router.push(`/admin/orders?client=${client.id}`)}
                  className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md"
                >
                  Ver todos los pedidos
                </button>
                <button
                  onClick={() => router.push(`/admin/orders/create?client=${client.id}`)}
                  className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md"
                >
                  Crear nuevo pedido
                </button>
                <button
                  onClick={() => window.open(`mailto:${client.email}`, '_blank')}
                  className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md"
                >
                  Enviar email
                </button>
                {client.phone && (
                  <button
                    onClick={() => window.open(`tel:${client.phone}`, '_blank')}
                    className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md"
                  >
                    Llamar por teléfono
                  </button>
                )}
              </div>
            </div>

            {/* Registration Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Información de Registro</h3>
              </div>
              <div className="px-6 py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fecha de registro</span>
                  <span className="text-gray-900">{new Date(client.created_at).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Última actualización</span>
                  <span className="text-gray-900">{new Date(client.updated_at).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}