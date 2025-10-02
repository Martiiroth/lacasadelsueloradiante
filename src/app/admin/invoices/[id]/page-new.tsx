'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AdminLayout from '../../../../components/admin/AdminLayout'
import { 
  DocumentTextIcon, 
  PrinterIcon, 
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface InvoiceDetails {
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
    phone?: string
    address?: string
    company_name?: string
    tax_id?: string
  }
}

export default function AdminInvoiceDetailPage() {
  const params = useParams()
  const invoiceId = params.id as string
  
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null)
  const [loading, setLoading] = useState(true)

  const loadInvoice = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invoices/${invoiceId}`)
      
      if (response.ok) {
        const data = await response.json()
        setInvoice(data.invoice)
      } else {
        console.error('Error loading invoice')
      }
    } catch (error) {
      console.error('Error loading invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (invoiceId) {
      loadInvoice()
    }
  }, [invoiceId])

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
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
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!invoice) {
    return (
      <AdminLayout activeSection="invoices">
        <div className="p-6">
          <div className="text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Factura no encontrada</h3>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeSection="invoices">
      <div className="p-6">
        {/* Header - Solo visible en pantalla */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/invoices"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Volver a Facturas
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Factura {invoice.prefix}{invoice.invoice_number}{invoice.suffix}
              </h1>
              <p className="text-gray-600">
                Cliente: {invoice.client?.company_name || 
                         `${invoice.client?.first_name} ${invoice.client?.last_name}` ||
                         'Cliente desconocido'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Factura - Diseño profesional según la imagen */}
        <div className="bg-white shadow-lg print:shadow-none print:bg-transparent">
          <div className="px-8 py-6 print:px-0 print:py-0">
            {/* Header de la factura */}
            <div className="flex justify-between items-start mb-8">
              {/* Logo y nombre de empresa */}
              <div className="flex items-center">
                <div className="w-20 h-20 bg-red-600 rounded-lg flex items-center justify-center mr-6">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                    <path d="M2 17L12 22L22 17" />
                    <path d="M2 12L12 17L22 12" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">LaCasa</h1>
                  <h2 className="text-lg text-gray-700">DEL SUELO</h2>
                  <h3 className="text-lg text-gray-700 font-semibold">RADIANTE</h3>
                </div>
              </div>
              
              {/* Información de la empresa */}
              <div className="text-right text-sm">
                <div className="font-semibold">T&V Servicios y Complementos S.L.</div>
                <div>CIF B-56715823</div>
                <div>Registro RI-AZE con el número 17208</div>
              </div>
            </div>

            {/* Título FACTURA */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">FACTURA</h1>
              
              {/* Información de la factura en dos columnas */}
              <div className="grid grid-cols-2 gap-8">
                {/* Datos del cliente */}
                <div className="text-sm">
                  <div className="font-semibold mb-2">{invoice.client?.tax_id || '78002196c'}</div>
                  <div>{invoice.client?.first_name} {invoice.client?.last_name}</div>
                  <div>Calle Nogal 13</div>
                  <div>Getafe</div>
                  <div>Comunidad de Madrid</div>
                  <div>Madrid</div>
                </div>
                
                {/* Datos de la factura */}
                <div className="text-right text-sm">
                  <div className="mb-2">
                    <span className="font-semibold">Número de factura:</span> {invoice.prefix}{invoice.invoice_number}{invoice.suffix}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Fecha de factura:</span> {formatDate(invoice.created_at)}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Número de pedido:</span> {invoice.order_id}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Fecha de pedido:</span> {formatDate(invoice.created_at)}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Método de pago:</span> Pagar con Tarjeta
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de productos */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800 text-white text-sm">
                    <th className="text-left px-4 py-2">Producto</th>
                    <th className="text-center px-4 py-2">Cantidad</th>
                    <th className="text-right px-4 py-2">Total</th>
                    <th className="text-right px-4 py-2">IVA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2 text-sm">TERMICA FT EXPRESS INHIBIDOR</td>
                    <td className="text-center px-4 py-2 text-sm">1</td>
                    <td className="text-right px-4 py-2 text-sm">31,49 €</td>
                    <td className="text-right px-4 py-2 text-sm">6,61 €</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Resumen de totales */}
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2 text-sm">
                  <span>Base imponible</span>
                  <span>35,44 €</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span>Envío</span>
                  <span>4,76 €</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span>IVA 21%</span>
                  <span>7,64 €</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-300 font-bold">
                  <span>Total</span>
                  <span>{formatPrice(invoice.total_cents)}</span>
                </div>
              </div>
            </div>

            {/* Pie de página con información legal */}
            <div className="mt-12 pt-6 border-t border-gray-300 text-xs text-gray-600 leading-relaxed">
              <p>
                Según el Reglamento General de Protección de Datos (RGPD), publicado en mayo de 2016, Vd. da su 
                consentimiento a que almacenemos su correo electrónico sin permanente con el fin de que podamos 
                contactarle en un futuro para consultar nuestros productos y servicios; así como posibles promociones 
                relacionadas. T&V Servicios y Complementos SL, inscrito en el Registro de la Agencia Española de Protección de Datos. 
                Sus datos se usarán sin ninguna otra finalidad que no sea la comercial/empresarial, usted podrá ejercer su 
                derecho de acceso, rectificación, supresión, limitación, oposición y portabilidad dirigiéndose a nuestro 
                centro referido por el envío del certificado a la Calle Nogal, 13 Getafe. Teléfono: 00000000, Madrid.
              </p>
            </div>
          </div>
        </div>
      
      {/* Estilos de impresión */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white.shadow-lg,
          .bg-white.shadow-lg * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:bg-transparent {
            background-color: transparent !important;
          }
          .print\\:px-0 {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}} />
      </div>
    </AdminLayout>
  )
}