"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Download, Eye, Calendar, CreditCard, Building2, User } from 'lucide-react'

interface InvoiceItem {
  id: string
  qty: number
  price_cents: number
  variant?: {
    title?: string
    product?: {
      title?: string
    }
  }
}

interface InvoiceClient {
  first_name?: string
  last_name?: string
  email?: string
  company_name?: string
  nif_cif?: string
}

interface Invoice {
  id: string
  invoice_number: number
  prefix: string
  suffix: string
  total_cents: number
  currency: string
  created_at: string
  due_date?: string
  client?: InvoiceClient
  order?: {
    id: string
    order_items?: InvoiceItem[]
  }
}

interface InvoiceCardProps {
  invoice: Invoice
  onDownloadPDF?: () => void
  onViewDetails?: () => void
  className?: string
}

export function InvoiceCard({ 
  invoice, 
  onDownloadPDF, 
  onViewDetails, 
  className = "" 
}: InvoiceCardProps) {
  const invoiceNumber = `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
  const totalAmount = (invoice.total_cents / 100).toFixed(2)
  const clientName = invoice.client 
    ? `${invoice.client.first_name || ''} ${invoice.client.last_name || ''}`.trim() 
    : 'Cliente no especificado'
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Card className={`w-full hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              Factura {invoiceNumber}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(invoice.created_at)}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {totalAmount}€
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Cliente */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {invoice.client?.company_name ? (
            <Building2 className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span>
            {invoice.client?.company_name || clientName}
          </span>
          {invoice.client?.nif_cif && (
            <Badge variant="secondary" className="text-xs">
              {invoice.client.nif_cif}
            </Badge>
          )}
        </div>

        {/* Información de pago */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CreditCard className="h-4 w-4" />
          <span>Pago con tarjeta • {invoice.currency}</span>
        </div>

        {/* Productos si están disponibles */}
        {invoice.order?.order_items && invoice.order.order_items.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Productos</h4>
            <div className="max-h-32 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Producto</TableHead>
                    <TableHead className="text-xs text-right">Cant.</TableHead>
                    <TableHead className="text-xs text-right">Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.order.order_items.map((item) => {
                    const productName = item.variant?.product?.title || 
                                     item.variant?.title || 
                                     'Producto'
                    const itemTotal = (item.price_cents * item.qty / 100).toFixed(2)
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs font-medium">
                          {productName}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {item.qty}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {itemTotal}€
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver detalles
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onDownloadPDF}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface InvoiceListProps {
  invoices: Invoice[]
  onDownloadPDF?: (invoiceId: string) => void
  onViewDetails?: (invoiceId: string) => void
  className?: string
}

export function InvoiceList({ 
  invoices, 
  onDownloadPDF, 
  onViewDetails,
  className = ""
}: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-gray-400 mb-4">
            <CreditCard className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay facturas
          </h3>
          <p className="text-gray-500 text-center max-w-sm">
            Las facturas aparecerán aquí cuando se generen automáticamente al entregar pedidos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`grid gap-4 ${className}`}>
      {invoices.map((invoice) => (
        <InvoiceCard
          key={invoice.id}
          invoice={invoice}
          onDownloadPDF={() => onDownloadPDF?.(invoice.id)}
          onViewDetails={() => onViewDetails?.(invoice.id)}
        />
      ))}
    </div>
  )
}