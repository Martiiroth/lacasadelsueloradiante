import React, { useState, useEffect } from 'react'
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { ClientService } from '../../lib/clientService'
import { useHydration } from '../../hooks/useHydration'
import { LoadingState } from '../ui/LoadingState'
import type { Client, UpdateClientData } from '../../types/client'

interface InfoFieldProps {
  label: string
  value: string | undefined
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  isEditing: boolean
  fieldName: keyof UpdateClientData
  editData: UpdateClientData
  onEditChange: (field: keyof UpdateClientData, value: string) => void
}

function InfoField({ 
  label, 
  value, 
  icon: Icon, 
  isEditing, 
  fieldName, 
  editData, 
  onEditChange 
}: InfoFieldProps) {
  return (
    <div className="py-4 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center">
        <Icon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <dt className="text-sm font-medium text-gray-500">{label}</dt>
          {isEditing ? (
            <input
              type="text"
              value={editData[fieldName] || ''}
              onChange={(e) => onEditChange(fieldName, e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Ingresa ${label.toLowerCase()}`}
            />
          ) : (
            <dd className="mt-1 text-sm text-gray-900">
              {value || <span className="text-gray-400 italic">No especificado</span>}
            </dd>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PersonalInfo() {
  const { user, refreshUser } = useAuth()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const isHydrated = useHydration()
  const [editData, setEditData] = useState<UpdateClientData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    nif_cif: '',
    region: '',
    city: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    activity: '',
    company_name: '',
    company_position: ''
  })

  useEffect(() => {
    if (!isHydrated) return

    const loadClientData = async () => {
      if (!user?.client?.id) return

      try {
        setLoading(true)
        const clientData = await ClientService.getClientData(user.client.id)
        if (clientData) {
          setClient(clientData)
          setEditData({
            first_name: clientData.first_name,
            last_name: clientData.last_name,
            email: clientData.email,
            phone: clientData.phone || '',
            nif_cif: clientData.nif_cif || '',
            region: clientData.region || '',
            city: clientData.city || '',
            address_line1: clientData.address_line1 || '',
            address_line2: clientData.address_line2 || '',
            postal_code: clientData.postal_code || '',
            activity: clientData.activity || '',
            company_name: clientData.company_name || '',
            company_position: clientData.company_position || ''
          })
          setRetryCount(0)
        }
      } catch (error) {
        console.error('Error loading client data:', error)
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, 1000 * Math.pow(2, retryCount))
        }
      } finally {
        setLoading(false)
      }
    }

    loadClientData()
  }, [user?.client?.id, isHydrated, retryCount])

  const handleEditChange = (field: keyof UpdateClientData, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!user?.client?.id) return

    try {
      setSaving(true)
      const success = await ClientService.updateClient(user.client.id, editData)
      
      if (success) {
        setIsEditing(false)
        // Actualizar los datos locales
        const updatedClient = await ClientService.getClientData(user.client.id)
        if (updatedClient) {
          setClient(updatedClient)
        }
        // Refrescar el usuario en el contexto
        await refreshUser()
      } else {
        alert('Error al actualizar los datos. Por favor, inténtalo de nuevo.')
      }
    } catch (error) {
      console.error('Error saving client data:', error)
      alert('Error al actualizar los datos. Por favor, inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!client) return
    
    // Restaurar datos originales
    setEditData({
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone || '',
      nif_cif: client.nif_cif || '',
      region: client.region || '',
      city: client.city || '',
      address_line1: client.address_line1 || '',
      address_line2: client.address_line2 || '',
      postal_code: client.postal_code || '',
      activity: client.activity || '',
      company_name: client.company_name || '',
      company_position: client.company_position || ''
    })
    setIsEditing(false)
  }

  if (!isHydrated || loading) {
    return (
      <LoadingState>
        <div className="p-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </LoadingState>
    )
  }

  if (!client) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron datos del cliente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Información Personal</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu información personal y de contacto
          </p>
        </div>
        
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckIcon className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Información Personal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Datos Personales */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Datos Personales
            </h2>
          </div>
          <div className="px-6 py-4">
            <dl className="space-y-0">
              <InfoField
                label="Nombre"
                value={client.first_name}
                icon={UserIcon}
                isEditing={isEditing}
                fieldName="first_name"
                editData={editData}
                onEditChange={handleEditChange}
              />
              <InfoField
                label="Apellidos"
                value={client.last_name}
                icon={UserIcon}
                isEditing={isEditing}
                fieldName="last_name"
                editData={editData}
                onEditChange={handleEditChange}
              />
              <InfoField
                label="Email"
                value={client.email}
                icon={EnvelopeIcon}
                isEditing={false}
                fieldName="first_name"
                editData={editData}
                onEditChange={handleEditChange}
              />
              <InfoField
                label="Teléfono"
                value={client.phone}
                icon={PhoneIcon}
                isEditing={isEditing}
                fieldName="phone"
                editData={editData}
                onEditChange={handleEditChange}
              />
              <InfoField
                label="NIF/CIF"
                value={client.nif_cif}
                icon={IdentificationIcon}
                isEditing={isEditing}
                fieldName="nif_cif"
                editData={editData}
                onEditChange={handleEditChange}
              />
            </dl>
          </div>
        </div>

        {/* Dirección */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Dirección
            </h2>
          </div>
          <div className="px-6 py-4">
            <dl className="space-y-0">
              <InfoField
                label="Dirección"
                value={client.address_line1}
                icon={MapPinIcon}
                isEditing={isEditing}
                fieldName="address_line1"
                editData={editData}
                onEditChange={handleEditChange}
              />
              <InfoField
                label="Dirección 2"
                value={client.address_line2}
                icon={MapPinIcon}
                isEditing={isEditing}
                fieldName="address_line2"
                editData={editData}
                onEditChange={handleEditChange}
              />
              <InfoField
                label="Ciudad"
                value={client.city}
                icon={MapPinIcon}
                isEditing={isEditing}
                fieldName="city"
                editData={editData}
                onEditChange={handleEditChange}
              />
              <InfoField
                label="Región/Provincia"
                value={client.region}
                icon={MapPinIcon}
                isEditing={isEditing}
                fieldName="region"
                editData={editData}
                onEditChange={handleEditChange}
              />
              <InfoField
                label="Código Postal"
                value={client.postal_code}
                icon={MapPinIcon}
                isEditing={isEditing}
                fieldName="postal_code"
                editData={editData}
                onEditChange={handleEditChange}
              />
            </dl>
          </div>
        </div>

        {/* Información Profesional */}
        <div className="bg-white rounded-lg border border-gray-200 lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              Información Profesional
            </h2>
          </div>
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 space-y-0">
              <div>
                <InfoField
                  label="Empresa"
                  value={client.company_name}
                  icon={BuildingOfficeIcon}
                  isEditing={isEditing}
                  fieldName="company_name"
                  editData={editData}
                  onEditChange={handleEditChange}
                />
                <InfoField
                  label="Cargo"
                  value={client.company_position}
                  icon={BuildingOfficeIcon}
                  isEditing={isEditing}
                  fieldName="company_position"
                  editData={editData}
                  onEditChange={handleEditChange}
                />
              </div>
              <div>
                <InfoField
                  label="Actividad"
                  value={client.activity}
                  icon={BuildingOfficeIcon}
                  isEditing={isEditing}
                  fieldName="activity"
                  editData={editData}
                  onEditChange={handleEditChange}
                />
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <UserIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Información de la cuenta
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p><strong>Fecha de registro:</strong> {ClientService.formatDate(client.created_at)}</p>
              {client.last_login && (
                <p><strong>Último acceso:</strong> {ClientService.formatDate(client.last_login)}</p>
              )}
              {client.role && (
                <p><strong>Tipo de cuenta:</strong> {client.role.description || client.role.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}