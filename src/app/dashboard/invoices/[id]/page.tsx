'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  ArrowLeftIcon, 
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CurrencyEuroIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../../../contexts/AuthContext'
import { useHydration } from '../../../../hooks/useHydration'
import DashboardLayout from '../../../../components/dashboard/DashboardLayout'

interface InvoiceDetail {
  id: string
  prefix: string
  invoice_number: number
  suffix: string
  created_at: string
  total_cents: number
  currency: string
  status: string
  client: {
    first_name: string
    last_name: string
    company_name?: string
    nif_cif?: string
    address_line1?: string
    address_line2?: string
    city?: string
    postal_code?: string
  }
  order?: {
    id: string
    created_at: string
    order_items: Array<{
      id: string
      qty: number
      price_cents: number
      variant: {
        title: string
        product: {
          title: string
        }
      }
    }>
  }
}

export default function InvoiceDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const invoiceId = params.id as string
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isHydrated = useHydration()

  // Función para formatear precios
  const formatPrice = (cents: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100)
  }

  // Función para formatear fechas
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  // Función para obtener color del estado
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  // Función para obtener etiqueta del estado
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'Pagada'
      case 'pending':
        return 'Pendiente'
      case 'overdue':
        return 'Vencida'
      case 'cancelled':
        return 'Cancelada'
      default:
        return 'Generada'
    }
  }

  const loadInvoice = async () => {
    if (!invoiceId) return

    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/invoices/${invoiceId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Factura no encontrada')
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para ver esta factura')
        }
        throw new Error('Error al cargar la factura')
      }
      
      const data = await response.json()
      setInvoice(data.invoice)
      
    } catch (error) {
      console.error('Error loading invoice:', error)
      setError(error instanceof Error ? error.message : 'Error al cargar la factura')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isHydrated || !user) return
    loadInvoice()
  }, [invoiceId, isHydrated, user])

  const handleDownloadInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
      if (!response.ok) {
        throw new Error('Error al generar el PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${invoice?.prefix}${invoice?.invoice_number}${invoice?.suffix}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('Error al descargar la factura. Inténtalo de nuevo.')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Denegado
          </h1>
          <p className="text-gray-600 mb-4">
            Debes iniciar sesión para acceder a esta página
          </p>
          <Link 
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout activeSection="invoices">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link
              href="/dashboard/invoices"
              className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Volver a Facturas
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {invoice ? `Factura ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}` : 'Detalle de Factura'}
            </h1>
          </div>
          
          {invoice && (
            <button
              onClick={handleDownloadInvoice}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Descargar PDF
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadInvoice}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Detail */}
        {invoice && !loading && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
                    <CurrencyEuroIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Total</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatPrice(invoice.total_cents)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-purple-100">
                    <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Fecha</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(invoice.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Content */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 invoice-content">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mr-6">
                    <DocumentTextIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">LA CASA</h1>
                    <h2 className="text-lg text-gray-700">DEL SUELO</h2>
                    <h3 className="text-lg font-semibold text-gray-900">RADIANTE</h3>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div className="font-semibold">T&V Servicios y Complementos S.L.</div>
                  <div>CIF B-86715893</div>
                  <div>Registro RI-AZE con el número 17208</div>
                </div>
              </div>

              {/* Invoice Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Client Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Facturar a:</h3>
                  <div className="text-sm space-y-1">
                    <div className="font-semibold">{invoice.client.first_name} {invoice.client.last_name}</div>
                    {invoice.client.company_name && (
                      <div>{invoice.client.company_name}</div>
                    )}
                    <div>CIF/NIF: {invoice.client.nif_cif || 'No especificado'}</div>
                    {invoice.client.address_line1 && (
                      <div>
                        {invoice.client.address_line1}
                        {invoice.client.address_line2 && `, ${invoice.client.address_line2}`}
                        <br />
                        {invoice.client.city && `${invoice.client.city}, `}
                        {invoice.client.postal_code}
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Info */}
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    FACTURA {invoice.prefix}{invoice.invoice_number}{invoice.suffix}
                  </h2>
                  <div className="text-sm space-y-1">
                    <div><strong>Número de factura:</strong> {invoice.prefix}{invoice.invoice_number}{invoice.suffix}</div>
                    <div><strong>Fecha de factura:</strong> {formatDate(invoice.created_at)}</div>
                    {invoice.order && (
                      <>
                        <div><strong>Número de pedido:</strong> #{invoice.order.id.slice(-8).toUpperCase()}</div>
                        <div><strong>Fecha de pedido:</strong> {formatDate(invoice.order.created_at)}</div>
                      </>
                    )}
                    <div><strong>Método de pago:</strong> Pagar con Tarjeta</div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              {invoice.order?.order_items && invoice.order.order_items.length > 0 && (
                <div className="mb-8">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Producto</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Cantidad</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Precio (sin IVA)</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">IVA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.order.order_items.map((item) => {
                        const basePrice = Math.round(item.price_cents / 1.21)
                        const vatPrice = item.price_cents - basePrice
                        
                        return (
                          <tr key={item.id}>
                            <td className="border border-gray-300 px-4 py-2 text-sm">
                              {item.variant?.product?.title || item.variant?.title || 'Producto'}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-sm">{item.qty}</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm">{formatPrice(basePrice)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm">{formatPrice(vatPrice)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-80">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Base imponible</span>
                      <span>{formatPrice(Math.round(invoice.total_cents / 1.21))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>IVA 21%</span>
                      <span>{formatPrice(invoice.total_cents - Math.round(invoice.total_cents / 1.21))}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatPrice(invoice.total_cents)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Text */}
              <div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
                <p>
                  Sus datos serán tratados con la finalidad de gestionar la relación comercial con Vd. y prestarle los servicios solicitados. 
                  Los datos se conservarán mientras dure la relación comercial y, posteriormente, durante los plazos de prescripción legal. 
                  La base legal del tratamiento es la ejecución del contrato. Sus datos no se comunicarán a terceros, salvo obligación legal. 
                  Puede ejercer sus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición 
                  dirigiéndose a TYV SERVICIOS Y COMPLEMENTOS SL – Avenida de Europa, 26. Edificio 3. Planta baja oficina B207. 
                  28224 Pozuelo de Alarcón (Madrid) o enviando un correo electrónico a: administracion@lacasadelsuelo.com acreditando 
                  su identidad mediante copia del DNI. Asimismo, tiene derecho a presentar una reclamación ante la Agencia Española 
                  de Protección de Datos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}