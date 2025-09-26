'use client'

import React, { useState } from 'react'
import { 
  PlusIcon, 
  TrashIcon,
  DocumentTextIcon,
  DocumentIcon,
  VideoCameraIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline'

export interface ResourceData {
  id?: string
  type: 'manual' | 'pdf' | 'video' | 'file'
  name: string
  url: string
  description?: string
}

interface ResourceManagerProps {
  resources: ResourceData[]
  onChange: (resources: ResourceData[]) => void
}

const ResourceManager: React.FC<ResourceManagerProps> = ({
  resources,
  onChange
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleAddResource = () => {
    const newResource: ResourceData = {
      type: 'pdf',
      name: '',
      url: '',
      description: ''
    }
    onChange([...resources, newResource])
    setEditingIndex(resources.length)
  }

  const handleUpdateResource = (index: number, field: keyof ResourceData, value: string) => {
    const updatedResources = [...resources]
    updatedResources[index] = {
      ...updatedResources[index],
      [field]: value
    }
    onChange(updatedResources)
  }

  const handleRemoveResource = (index: number) => {
    const updatedResources = resources.filter((_, i) => i !== index)
    onChange(updatedResources)
    setEditingIndex(null)
  }

  const getResourceIcon = (type: ResourceData['type']) => {
    switch (type) {
      case 'manual':
        return <DocumentTextIcon className="h-5 w-5" />
      case 'pdf':
        return <DocumentIcon className="h-5 w-5" />
      case 'video':
        return <VideoCameraIcon className="h-5 w-5" />
      case 'file':
        return <PaperClipIcon className="h-5 w-5" />
      default:
        return <DocumentIcon className="h-5 w-5" />
    }
  }

  const getResourceTypeLabel = (type: ResourceData['type']) => {
    switch (type) {
      case 'manual':
        return 'Manual'
      case 'pdf':
        return 'PDF'
      case 'video':
        return 'Video'
      case 'file':
        return 'Archivo'
      default:
        return 'Archivo'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Recursos del Producto
        </h3>
        <button
          type="button"
          onClick={handleAddResource}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Añadir Recurso
        </button>
      </div>

      {resources.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <DocumentIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No hay recursos añadidos</p>
          <p className="text-sm">Haz clic en "Añadir Recurso" para comenzar</p>
        </div>
      )}

      <div className="space-y-3">
        {resources.map((resource, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            {editingIndex === index ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Recurso *
                    </label>
                    <select
                      value={resource.type}
                      onChange={(e) => handleUpdateResource(index, 'type', e.target.value as ResourceData['type'])}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="manual">Manual</option>
                      <option value="pdf">PDF</option>
                      <option value="video">Video</option>
                      <option value="file">Archivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Recurso *
                    </label>
                    <input
                      type="text"
                      value={resource.name}
                      onChange={(e) => handleUpdateResource(index, 'name', e.target.value)}
                      placeholder="Ej: Manual de instalación"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL del Recurso *
                  </label>
                  <input
                    type="url"
                    value={resource.url}
                    onChange={(e) => handleUpdateResource(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={resource.description || ''}
                    onChange={(e) => handleUpdateResource(index, 'description', e.target.value)}
                    placeholder="Descripción del recurso..."
                    rows={2}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    disabled={!resource.name.trim() || !resource.url.trim()}
                    className="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 text-gray-400">
                    {getResourceIcon(resource.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {resource.name || 'Sin nombre'}
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {getResourceTypeLabel(resource.type)}
                      </span>
                    </div>
                    {resource.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {resource.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {resource.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(index)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveResource(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResourceManager