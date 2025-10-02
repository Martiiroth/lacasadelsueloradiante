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
    address_line1?: string
    address_line2?: string
    city?: string
    region?: string
    postal_code?: string
    company_name?: string
    nif_cif?: string
  }
  order?: {
    id: string
    created_at: string
    shipping_address?: any
    billing_address?: any
    order_items?: Array<{
      id: string
      qty: number
      price_cents: number
      variant?: {
        id: string
        title: string
        sku?: string
        product?: {
          title: string
        }
      }
    }>
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
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!invoice) {
    return (
      <AdminLayout activeSection="invoices">
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Factura no encontrada</h1>
          <Link
            href="/admin/invoices"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a Facturas
          </Link>
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
        <div className="bg-white shadow-lg print:shadow-none print:bg-transparent invoice-content">
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
                <div>CIF B-86715893</div>
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
                  <div className="font-semibold mb-2">{invoice.client?.nif_cif || 'Sin NIF/CIF'}</div>
                  <div>{invoice.client?.first_name} {invoice.client?.last_name}</div>
                  {invoice.client?.company_name && (
                    <div className="font-medium">{invoice.client.company_name}</div>
                  )}
                  <div>{invoice.client?.address_line1 || 'Dirección no disponible'}</div>
                  {invoice.client?.address_line2 && <div>{invoice.client.address_line2}</div>}
                  <div>{invoice.client?.postal_code} {invoice.client?.city || 'Ciudad no disponible'}</div>
                  <div>{invoice.client?.region || 'Región no disponible'}</div>
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
                    <span className="font-semibold">Número de pedido:</span> #{invoice.order_id.slice(-8).toUpperCase()}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Fecha de pedido:</span> {invoice.order?.created_at ? formatDate(invoice.order.created_at) : formatDate(invoice.created_at)}
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
                    <th className="text-right px-4 py-2">Precio (sin IVA)</th>
                    <th className="text-right px-4 py-2">IVA</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.order?.order_items && invoice.order.order_items.length > 0 ? (
                    invoice.order.order_items.map((item) => {
                      // Calcular precio sin IVA (el precio almacenado incluye IVA del 21%)
                      const priceWithIVA = item.price_cents * item.qty
                      const priceWithoutIVA = Math.round(priceWithIVA / 1.21)
                      const ivaAmount = priceWithIVA - priceWithoutIVA
                      
                      return (
                        <tr key={item.id} className="border-b border-gray-200">
                          <td className="px-4 py-2 text-sm">
                            {item.variant?.product?.title || item.variant?.title || 'Producto sin nombre'}
                          </td>
                          <td className="text-center px-4 py-2 text-sm">{item.qty}</td>
                          <td className="text-right px-4 py-2 text-sm">{formatPrice(priceWithoutIVA)}</td>
                          <td className="text-right px-4 py-2 text-sm">{formatPrice(ivaAmount)}</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr className="border-b border-gray-200">
                      <td colSpan={4} className="px-4 py-2 text-sm text-center text-gray-500">
                        No hay items disponibles para esta factura
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Resumen de totales */}
            <div className="flex justify-end">
              <div className="w-64">
                {(() => {
                  // Calcular totales basados en los items reales
                  const subtotal = invoice.order?.order_items?.reduce((sum, item) => 
                    sum + (item.price_cents * item.qty), 0) || invoice.total_cents
                  
                  // IVA del 21% (calculado sobre el subtotal)
                  const baseImponible = Math.round(subtotal / 1.21)
                  const iva = subtotal - baseImponible
                  
                  // Por ahora asumimos que no hay gastos de envío separados
                  // ya que el total_cents incluye todo
                  const shipping = 0
                  
                  return (
                    <>
                      <div className="flex justify-between py-2 text-sm">
                        <span>Base imponible</span>
                        <span>{formatPrice(baseImponible)}</span>
                      </div>
                      {shipping > 0 && (
                        <div className="flex justify-between py-2 text-sm">
                          <span>Envío</span>
                          <span>{formatPrice(shipping)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 text-sm">
                        <span>IVA 21%</span>
                        <span>{formatPrice(iva)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-t border-gray-300 font-bold">
                        <span>Total</span>
                        <span>{formatPrice(invoice.total_cents)}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Pie de página con información legal */}
            <div className="mt-12 pt-6 border-t border-gray-300 text-xs text-gray-600 leading-relaxed">
              <p>
                Sus datos serán tratados con la finalidad de gestionar la relación comercial con Vd. y prestarle los servicios solicitados. Los datos se conservarán mientras dure la relación comercial y, posteriormente, durante los plazos de prescripción legal. La base legal del tratamiento es la ejecución del contrato. Sus datos no se comunicarán a terceros, salvo obligación legal. Puede ejercer sus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición dirigiéndose a TYV SERVICIOS Y COMPLEMENTOS SL – Avenida de Europa, 26. Edificio 3. Planta baja oficina B207. 28224 Pozuelo de Alarcón (Madrid) o enviando un correo electrónico a: administracion@lacasadelsuelo.com acreditando su identidad mediante copia del DNI. Asimismo, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos.
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