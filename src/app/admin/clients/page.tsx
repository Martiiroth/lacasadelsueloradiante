'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminClient, AdminFilters } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

export default function AdminClients() {
  const router = useRouter()
  const [clients, setClients] = useState<AdminClient[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [displayedCount, setDisplayedCount] = useState(20)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AdminFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [availableRoles, setAvailableRoles] = useState<{ id: number; name: string; description?: string }[]>([])
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  useEffect(() => {
    loadClients()
    loadRoles()
  }, [filters])

  const loadClients = async () => {
    try {
      setLoading(true)
      // Cargar hasta 1000 clientes (o un número grande razonable)
      const data = await AdminService.getAllClients(filters, 1000, 0)
      setClients(data)
      setTotalCount(data.length)
      setDisplayedCount(20) // Reset display count
    } catch (err) {
      console.error('Error loading clients:', err)
      setError('Error al cargar los clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    const newDisplayedCount = displayedCount + 20
    setDisplayedCount(newDisplayedCount)
  }

  const handleShowAll = () => {
    // Show all filtered clients
    setDisplayedCount(10000) // Set to a large number
  }

  const loadRoles = async () => {
    try {
      const roles = await AdminService.getAllRoles()
      setAvailableRoles(roles)
    } catch (err) {
      console.error('Error loading roles:', err)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({
      ...filters,
      client_search: searchTerm || undefined
    })
  }

  const handleFilterChange = () => {
    setFilters({
      ...filters,
      client_role: selectedRole ? [selectedRole as any] : undefined,
      client_status: selectedStatus ? [selectedStatus as any] : undefined
    })
  }

  const toggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      const client = clients.find(c => c.id === clientId)
      if (!client) return

      const success = await AdminService.updateClient(clientId, {
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        is_active: !currentStatus,
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
        // Recargar clientes
        loadClients()
      } else {
        alert('Error al actualizar el estado del cliente')
      }
    } catch (err) {
      console.error('Error updating client status:', err)
      alert('Error al actualizar el estado del cliente')
    }
  }

  const changeClientRole = async (clientId: string, newRoleId: number) => {
    try {
      const client = clients.find(c => c.id === clientId)
      const newRole = availableRoles.find(r => r.id === newRoleId)
      const currentRole = client?.role?.name || 'guest'
      
      if (!client || !newRole) return

      // Confirmación para cambios sensibles de rol
      if (currentRole === 'admin' || newRole.name === 'admin') {
        const currentRoleLabel = AdminService.getRoleLabel(currentRole as any)
        const newRoleLabel = AdminService.getRoleLabel(newRole.name as any)
        const message = `¿Cambiar el rol de ${client.first_name} ${client.last_name}?\n\nDe: ${currentRoleLabel}\nA: ${newRoleLabel}\n\nEste cambio afectará los permisos del usuario.`
        
        if (!confirm(message)) {
          return
        }
      }

      setUpdatingRole(clientId)
      const success = await AdminService.updateClientRole(clientId, newRoleId)
      
      if (success) {
        // Actualizar el cliente localmente
        setClients(prevClients => 
          prevClients.map(client => {
            if (client.id === clientId) {
              return { 
                ...client, 
                role_id: newRoleId, 
                role: {
                  id: newRole.id,
                  name: newRole.name as 'admin' | 'sat' | 'instalador' | 'guest',
                  description: newRole.description
                }
              }
            }
            return client
          })
        )
        
        // Mostrar mensaje de éxito
        alert(`Rol actualizado correctamente a "${AdminService.getRoleLabel(newRole.name as any)}"`)
      } else {
        alert('Error al actualizar el rol del cliente')
      }
    } catch (err) {
      console.error('Error updating client role:', err)
      alert('Error al actualizar el rol del cliente')
    } finally {
      setUpdatingRole(null)
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

  if (error) {
    return (
      <AdminLayout>
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
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-indigo-600" />
                Gestión de Clientes
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Administra los clientes registrados en la plataforma</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="text-sm text-gray-500 text-center sm:text-left">
                Mostrando {Math.min(displayedCount, clients.length)} de {clients.length} clientes
              </div>
              <button
                onClick={() => router.push('/admin/clients/create')}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Buscar por nombre, email..."
                  />
                </div>
              </form>

              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="block w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="sat">SAT</option>
                <option value="instalador">Instalador</option>
                <option value="guest">Cliente</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>

              {/* Apply Filters Button */}
              <button
                type="button"
                onClick={handleFilterChange}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filtrar
              </button>
            </div>
          </div>
        </div>

        {/* Clients List - Responsive Design */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estadísticas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.slice(0, displayedCount).map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {client.first_name} {client.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="text-sm text-gray-500">
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative group">
                        <select
                          value={client.role_id || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              changeClientRole(client.id, parseInt(e.target.value))
                            }
                          }}
                          disabled={updatingRole === client.id}
                          title={`Cambiar rol de ${client.first_name} ${client.last_name}`}
                          className={`text-xs font-medium rounded-full px-3 py-1 pr-8 border-0 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-opacity-100 transition-all duration-200 ${AdminService.getRoleColor(client.role?.name || 'guest')} ${updatingRole === client.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80 hover:shadow-md'}`}
                        >
                          {availableRoles.map(role => (
                            <option key={role.id} value={role.id} className="bg-white text-gray-900">
                              {AdminService.getRoleLabel(role.name as any)}
                            </option>
                          ))}
                        </select>
                        
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          {updatingRole === client.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-gray-500 border-t-transparent"></div>
                          ) : (
                            <svg className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>

                        {client.role?.description && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {client.role.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleClientStatus(client.id, client.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                          client.is_active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {client.is_active ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.stats ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            €{(client.stats.total_spent_cents / 100).toFixed(2)}
                          </div>
                          <div className="text-xs">
                            {client.stats.total_orders} pedidos
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin pedidos</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/admin/clients/${client.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/clients/${client.id}/edit`)}
                          className="text-gray-600 hover:text-gray-900 flex items-center"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Shown only on mobile/tablet */}
          <div className="lg:hidden">
            <div className="divide-y divide-gray-200">
              {clients.slice(0, displayedCount).map((client) => (
                <div key={client.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-base font-medium text-indigo-600">
                            {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {client.first_name} {client.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="text-sm text-gray-500">
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => router.push(`/admin/clients/${client.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/clients/${client.id}/edit`)}
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-1">ROL</span>
                      <div className="relative group">
                        <select
                          value={client.role_id || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              changeClientRole(client.id, parseInt(e.target.value))
                            }
                          }}
                          disabled={updatingRole === client.id}
                          className={`text-xs font-medium rounded-full px-3 py-1 pr-8 border-0 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-opacity-100 transition-all duration-200 ${AdminService.getRoleColor(client.role?.name || 'guest')} ${updatingRole === client.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80 hover:shadow-md'}`}
                        >
                          {availableRoles.map(role => (
                            <option key={role.id} value={role.id} className="bg-white text-gray-900">
                              {AdminService.getRoleLabel(role.name as any)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          {updatingRole === client.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-gray-500 border-t-transparent"></div>
                          ) : (
                            <svg className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-1">ESTADO</span>
                      <button
                        onClick={() => toggleClientStatus(client.id, client.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                          client.is_active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {client.is_active ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Inactivo
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-1">ESTADÍSTICAS</span>
                      <div className="text-sm text-gray-900">
                        {client.stats ? (
                          <>
                            <div className="font-medium">
                              €{(client.stats.total_spent_cents / 100).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {client.stats.total_orders} pedidos
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400">Sin pedidos</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-1">REGISTRO</span>
                      <div className="text-sm text-gray-900">
                        {new Date(client.created_at).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {clients.length > 0 && displayedCount < clients.length && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cargando...
                    </>
                  ) : (
                    <>
                      Ver más clientes
                      <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleShowAll}
                  disabled={loadingMore}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 border-2 border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mostrar todos ({clients.length})
                </button>
              </div>
            </div>
          )}

          {clients.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedRole || selectedStatus 
                  ? 'No se encontraron clientes que coincidan con los filtros aplicados.'
                  : 'Aún no hay clientes registrados en la plataforma.'
                }
              </p>
              {!searchTerm && !selectedRole && !selectedStatus && (
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/admin/clients/create')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear primer cliente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}