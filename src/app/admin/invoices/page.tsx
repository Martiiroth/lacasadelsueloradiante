'use client'

import React, { useState, useEffect } from 'react'
import { AdminService } from '../../../lib/adminService'
import { InvoiceService } from '../../../lib/invoiceService'
import AdminLayout from '../../../components/admin/AdminLayout'
import { 
  DocumentTextIcon, 
  EyeIcon, 
  PlusIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface AdminInvoice {
  id: string
  client_id: string
  order_id: string
  invoice_number: number
  prefix: string
  suffix: string
  total_cents: number
  currency: string
  created_at: string
  due_date?: string
  client?: {
    first_name: string
    last_name: string
    email: string
    company_name?: string
  }
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [loading, setLoading] = useState(true)

  const loadInvoices = async () => {
    try {
      setLoading(true)
      // Usar el endpoint de API para obtener todas las facturas
      const response = await fetch('/api/admin/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100)
  }



  if (loading) {
    return (
      <AdminLayout activeSection="invoices">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeSection="invoices">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Facturas</h1>
            <p className="text-gray-600 mt-1">
              Administrar facturas generadas automáticamente
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Facturas</p>
                <p className="text-2xl font-semibold text-gray-900">{invoices.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Este Mes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {invoices.filter((inv: AdminInvoice) => {
                    const invoiceDate = new Date(inv.created_at)
                    const now = new Date()
                    return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Importe Total</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPrice(invoices.reduce((sum: number, inv: AdminInvoice) => sum + inv.total_cents, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de facturas */}
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
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimiento
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
                  {invoices.map((invoice: AdminInvoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.prefix}{invoice.invoice_number}{invoice.suffix}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.client?.company_name || 
                           `${invoice.client?.first_name} ${invoice.client?.last_name}` ||
                           'Cliente desconocido'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {invoice.client?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(invoice.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(invoice.total_cents)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a
                          href={`/admin/invoices/${invoice.id}`}
                          className="inline-flex items-center text-blue-600 hover:text-blue-500"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Ver Factura
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay facturas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Las facturas se generan automáticamente cuando los pedidos se marcan como entregados.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}