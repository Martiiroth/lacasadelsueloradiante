/**
 * Componentes reutilizables para facturas con shadcn UI
 * Incluye listas, tarjetas, badges de estado y más
 */

"use client"

import React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  Building,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import type { Invoice, InvoiceStatus } from '@/types/invoices'
import { InvoiceService } from '@/lib/invoiceService'

// Props para componentes
interface InvoiceListProps {
  invoices: Invoice[]
  onInvoiceClick?: (invoice: Invoice) => void
  onViewInvoice?: (invoiceId: string) => void
  onDownloadPDF?: (invoiceId: string, invoiceNumber: number) => void
  showClient?: boolean
  isLoading?: boolean
}

interface InvoiceCardProps {
  invoice: Invoice
  onView?: (invoice: Invoice) => void
  onDownload?: (invoice: Invoice) => void
  showClient?: boolean
  compact?: boolean
}

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  className?: string
}

interface InvoiceStatsCardsProps {
  stats: {
    total_invoices: number
    total_amount_cents: number
    paid_count: number
    paid_amount_cents: number
    overdue_count: number
    overdue_amount_cents: number
    pending_count: number
    pending_amount_cents: number
  }
}

/**
 * Badge de estado de factura con colores y iconos
 */
export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Borrador',
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      case 'sent':
        return {
          label: 'Enviada',
          variant: 'default' as const,
          icon: FileText,
          className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        }
      case 'paid':
        return {
          label: 'Pagada',
          variant: 'default' as const,
          icon: CheckCircle,
          className: 'bg-green-100 text-green-700 hover:bg-green-200'
        }
      case 'overdue':
        return {
          label: 'Vencida',
          variant: 'destructive' as const,
          icon: AlertCircle,
          className: 'bg-red-100 text-red-700 hover:bg-red-200'
        }
      case 'cancelled':
        return {
          label: 'Cancelada',
          variant: 'secondary' as const,
          icon: X,
          className: 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-gray-100 text-gray-700'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Badge 
      variant={config.variant} 
      className={`inline-flex items-center gap-1 ${config.className} ${className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

/**
 * Tarjeta individual de factura
 */
export function InvoiceCard({ 
  invoice, 
  onView, 
  onDownload, 
  showClient = false,
  compact = false 
}: InvoiceCardProps) {
  const invoiceNumber = `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
  const formattedAmount = InvoiceService.formatPrice(invoice.total_cents, invoice.currency)
  const formattedDate = format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: es })

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault()
    onView?.(invoice)
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDownload?.(invoice)
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Info principal */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-full">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Factura {invoiceNumber}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* Cliente (si se muestra) */}
            {showClient && invoice.client && (
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {invoice.client.first_name[0]}{invoice.client.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">
                  {invoice.client.first_name} {invoice.client.last_name}
                  {invoice.client.company_name && (
                    <span className="text-gray-400"> • {invoice.client.company_name}</span>
                  )}
                </span>
              </div>
            )}

            {/* Estado y acciones */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <InvoiceStatusBadge status={invoice.status} />
                <span className="font-semibold text-lg text-gray-900">
                  {formattedAmount}
                </span>
              </div>

              {!compact && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleView}
                    className="h-8"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownload}
                    className="h-8"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    PDF
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Lista de facturas con estado de carga
 */
export function InvoiceList({ 
  invoices, 
  onInvoiceClick, 
  onViewInvoice,
  onDownloadPDF,
  showClient = false,
  isLoading = false 
}: InvoiceListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay facturas
          </h3>
          <p className="text-gray-500">
            Las facturas aparecerán aquí cuando se generen.
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleView = (invoice: Invoice) => {
    if (onViewInvoice) {
      onViewInvoice(invoice.id)
    } else if (onInvoiceClick) {
      onInvoiceClick(invoice)
    }
  }

  const handleDownload = (invoice: Invoice) => {
    if (onDownloadPDF) {
      onDownloadPDF(invoice.id, invoice.invoice_number)
    }
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <div key={invoice.id}>
          <InvoiceCard
            invoice={invoice}
            onView={handleView}
            onDownload={handleDownload}
            showClient={showClient}
          />
        </div>
      ))}
    </div>
  )
}

/**
 * Tarjetas de estadísticas de facturas
 */
export function InvoiceStatsCards({ stats }: InvoiceStatsCardsProps) {
  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100)
  }

  const statsCards = [
    {
      title: 'Total Facturas',
      value: stats.total_invoices,
      subtitle: formatAmount(stats.total_amount_cents),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pendientes',
      value: stats.pending_count,
      subtitle: formatAmount(stats.pending_amount_cents),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Pagadas',
      value: stats.paid_count,
      subtitle: formatAmount(stats.paid_amount_cents),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Vencidas',
      value: stats.overdue_count,
      subtitle: formatAmount(stats.overdue_amount_cents),
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/**
 * Componente compacto para mostrar factura en dashboard
 */
export function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const invoiceNumber = `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
  const formattedAmount = InvoiceService.formatPrice(invoice.total_cents, invoice.currency)
  const formattedDate = format(new Date(invoice.created_at), 'dd/MM/yyyy')

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-full">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {invoiceNumber}
          </p>
          <p className="text-sm text-gray-500">
            {formattedDate}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-semibold text-gray-900">
          {formattedAmount}
        </p>
        <InvoiceStatusBadge status={invoice.status} className="text-xs" />
      </div>
    </div>
  )
}

/**
 * Detalles completos de una factura
 */
export function InvoiceDetails({ invoice }: { invoice: Invoice }) {
  const invoiceNumber = `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
  const formattedAmount = InvoiceService.formatPrice(invoice.total_cents, invoice.currency)
  const formattedDate = format(new Date(invoice.created_at), 'dd MMMM yyyy', { locale: es })
  const formattedDueDate = invoice.due_date 
    ? format(new Date(invoice.due_date), 'dd MMMM yyyy', { locale: es })
    : 'Sin fecha límite'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Factura {invoiceNumber}</span>
          <InvoiceStatusBadge status={invoice.status} />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Información general */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Información de Factura</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Número:</span>
                <span className="font-medium">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vencimiento:</span>
                <span>{formattedDueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-lg">{formattedAmount}</span>
              </div>
            </div>
          </div>

          {/* Cliente */}
          {invoice.client && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Cliente</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{invoice.client.first_name} {invoice.client.last_name}</span>
                </div>
                {invoice.client.company_name && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span>{invoice.client.company_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span>{invoice.client.email}</span>
                </div>
                {invoice.client.nif_cif && (
                  <div className="text-gray-600">
                    NIF/CIF: {invoice.client.nif_cif}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Acciones */}
        <div className="flex flex-wrap gap-2">
          <Button variant="default">
            <Eye className="h-4 w-4 mr-2" />
            Ver Factura
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Barra de filtros para facturas
 */
interface InvoiceFiltersBarProps {
  filters: any
  onFiltersChange: (filters: any) => void
  showClientFilter?: boolean
}

export function InvoiceFiltersBar({ 
  filters, 
  onFiltersChange,
  showClientFilter = false
}: InvoiceFiltersBarProps) {
  const handleStatusChange = (status: string) => {
    const currentStatus = filters.status || []
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((s: string) => s !== status)
      : [...currentStatus, status]
    
    onFiltersChange({ ...filters, status: newStatus })
  }

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = filters.status?.length > 0 || filters.search || filters.date_from || filters.date_to

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Búsqueda */}
          <div>
            <input
              type="text"
              placeholder="Buscar por número de factura..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtros de estado */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Estado</p>
            <div className="flex flex-wrap gap-2">
              {(['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const).map((status) => {
                const isActive = filters.status?.includes(status)
                return (
                  <Button
                    key={status}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                  >
                    {InvoiceService.getStatusLabel(status)}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Limpiar filtros */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}