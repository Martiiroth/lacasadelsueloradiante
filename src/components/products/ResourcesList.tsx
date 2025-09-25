'use client'

import type { ProductResource } from '../../types/products'

interface ResourcesListProps {
  resources: ProductResource[]
}

export default function ResourcesList({ resources }: ResourcesListProps) {
  if (resources.length === 0) {
    return null
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'manual':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      case 'pdf':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      case 'video':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )
      case 'file':
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'manual': return 'Manual'
      case 'pdf': return 'PDF'
      case 'video': return 'Video'
      case 'file': return 'Archivo'
      default: return 'Recurso'
    }
  }

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'manual': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pdf': return 'bg-red-100 text-red-800 border-red-200'
      case 'video': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'file': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleResourceClick = (resource: ProductResource) => {
    // Abrir en nueva pestaña
    window.open(resource.url, '_blank', 'noopener,noreferrer')
  }

  const handleDownload = (e: React.MouseEvent, resource: ProductResource) => {
    e.stopPropagation()
    
    // Crear un enlace temporal para descargar
    const link = document.createElement('a')
    link.href = resource.url
    link.download = resource.label || `resource-${resource.id}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Agrupar recursos por tipo
  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = []
    }
    acc[resource.type].push(resource)
    return acc
  }, {} as Record<string, ProductResource[]>)

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800">
        Recursos y Documentación
      </h3>

      <div className="space-y-6">
        {Object.entries(groupedResources).map(([type, typeResources]) => (
          <div key={type} className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-700 flex items-center">
              <span className="text-gray-500 mr-2">
                {getResourceIcon(type)}
              </span>
              {getResourceTypeLabel(type)}s ({typeResources.length})
            </h4>

            <div className="grid gap-3">
              {typeResources.map((resource) => (
                <div
                  key={resource.id}
                  onClick={() => handleResourceClick(resource)}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg border ${getResourceTypeColor(resource.type)}`}>
                      {getResourceIcon(resource.type)}
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                        {resource.label || `${getResourceTypeLabel(resource.type)} del producto`}
                      </h5>
                      <p className="text-sm text-gray-500">
                        {getResourceTypeLabel(resource.type)} • Haz clic para ver
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Botón de descarga */}
                    {(resource.type === 'pdf' || resource.type === 'file') && (
                      <button
                        onClick={(e) => handleDownload(e, resource)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Descargar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    )}

                    {/* Icono de enlace externo */}
                    <div className="p-2 text-gray-400 group-hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h5 className="font-medium text-blue-800 mb-1">Información importante</h5>
            <p className="text-sm text-blue-700">
              Estos recursos te ayudarán con la instalación, configuración y mantenimiento del producto. 
              Si tienes dudas adicionales, no dudes en contactar con nuestro equipo de soporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}