import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  DocumentTextIcon, 
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { ClientService } from '../../lib/clientService'
import { useHydration } from '../../hooks/useHydration'
import { LoadingState } from '../ui/LoadingState'
import type { Invoice, InvoiceFilters, InvoiceStatus } from '../../types/client'

interface InvoicesListProps {
  showFilters?: boolean
  limit?: number
}


export default function InvoicesList({ showFilters = true, limit }: InvoicesListProps) {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalInvoices, setTotalInvoices] = useState(0)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const isHydrated = useHydration()
  
  const invoicesPerPage = limit || 10
  
  // Filtros
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: [],
    date_from: '',
    date_to: ''
  })

  const loadInvoices = async (page: number = 1) => {
    if (!user?.client?.id) return

    try {
      setLoading(true)
      const offset = (page - 1) * invoicesPerPage
      const invoicesData = await ClientService.getClientInvoices(
        user.client.id, 
        filters,
        invoicesPerPage,
        offset
      )
      
      setInvoices(invoicesData)
      // Estimación similar a OrdersList
      if (invoicesData.length < invoicesPerPage && page === 1) {
        setTotalInvoices(invoicesData.length)
      } else if (invoicesData.length < invoicesPerPage) {
        setTotalInvoices((page - 1) * invoicesPerPage + invoicesData.length)
      } else {
        setTotalInvoices(page * invoicesPerPage + 1)
      }
      setRetryCount(0)
    } catch (error) {
      console.error('Error loading invoices:', error)
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
        }, 1000 * Math.pow(2, retryCount))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isHydrated) return
    loadInvoices(currentPage)
  }, [user?.client?.id, filters, currentPage, isHydrated, retryCount])

  const handleFilterChange = (newFilters: Partial<InvoiceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  const handleStatusToggle = (status: InvoiceStatus) => {
    const currentStatuses = filters.status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status]
    
    handleFilterChange({ status: newStatuses })
  }

  const clearFilters = () => {
    setFilters({
      status: [],
      date_from: '',
      date_to: ''
    })
  }

  const handleDownloadInvoice = async (invoiceId: string) => {
    // En una implementación real, esto llamaría a un endpoint para descargar el PDF
    console.log('Descargando factura:', invoiceId)
    // Por ahora, solo mostramos un mensaje
    alert('Funcionalidad de descarga de PDF en desarrollo')
  }

  const totalPages = Math.ceil(totalInvoices / invoicesPerPage)

  if (!isHydrated || loading) {
    return (
      <LoadingState>
        <div className="p-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </LoadingState>
    )
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Facturas</h1>
          <p className="text-gray-600 mt-1">
            Historial de facturas y documentos fiscales
          </p>
        </div>
        
        {showFilters && (
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtros
          </button>
        )}
      </div>

      {/* Panel de Filtros */}
      {showFilters && showFilterPanel && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Estados */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Estado de la Factura
              </label>

            </div>

            {/* Fecha desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Desde
              </label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange({ date_from: e.target.value })}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Hasta
              </label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange({ date_to: e.target.value })}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6 space-x-3">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Facturas */}
      {invoices.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 relative">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.prefix}{invoice.invoice_number}{invoice.suffix}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ClientService.formatDateShort(invoice.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ClientService.formatPrice(invoice.total_cents)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {invoice.currency.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="inline-flex items-center text-blue-600 hover:text-blue-500"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Ver
                        </Link>
                      
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando{' '}
                    <span className="font-medium">
                      {((currentPage - 1) * invoicesPerPage) + 1}
                    </span>{' '}
                    a{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * invoicesPerPage, totalInvoices)}
                    </span>{' '}
                    de{' '}
                    <span className="font-medium">{totalInvoices}</span>{' '}
                    facturas
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    
                    {/* Números de página */}
                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                      const pageNumber = index + 1
                      const isActive = pageNumber === currentPage
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isActive
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay facturas</h3>
          <p className="mt-1 text-sm text-gray-500">
            No tienes facturas que coincidan with los filtros seleccionados.
          </p>
          {(filters.status?.length || filters.date_from || filters.date_to) && (
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Resumen de facturas */}
      {invoices.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-500">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Pendientes</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {invoices.filter(inv => inv.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-green-500">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Pagadas</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {invoices.filter(inv => inv.status === 'paid').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-500">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {ClientService.formatPrice(
                    invoices.reduce((sum, inv) => sum + inv.total_cents, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}