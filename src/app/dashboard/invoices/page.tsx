/**
 * Página principal de facturas del cliente
 * Muestra listado de facturas con filtros y acceso a detalles/PDFs
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  InvoiceList, 
  InvoiceStatsCards, 
  InvoiceFiltersBar 
} from '@/components/invoices/InvoiceComponents'
import type { Invoice, InvoiceStats, InvoiceFilters } from '@/types/invoices'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw } from 'lucide-react'

export default function ClientInvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [filters, setFilters] = useState<InvoiceFilters>({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadInvoices()
    loadStats()
  }, [filters, page])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      
      // Construir query params
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('per_page', '10')
      
      if (filters.status && filters.status.length > 0) {
        params.set('status', filters.status.join(','))
      }
      
      if (filters.date_from) {
        params.set('date_from', filters.date_from)
      }
      
      if (filters.date_to) {
        params.set('date_to', filters.date_to)
      }
      
      if (filters.search) {
        params.set('search', filters.search)
      }

      const response = await fetch(`/api/invoices?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setInvoices(data.data.invoices)
        setTotalPages(data.data.total_pages)
      } else {
        console.error('Error cargando facturas:', data.error)
      }
    } catch (error) {
      console.error('Error cargando facturas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/invoices/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const handleViewInvoice = (invoiceId: string) => {
    router.push(`/dashboard/invoices/${invoiceId}`)
  }

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: number) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf?download=true`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `factura-${invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Error descargando PDF')
      }
    } catch (error) {
      console.error('Error descargando PDF:', error)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mis Facturas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y descarga tus facturas
          </p>
        </div>
        
        <Button
          onClick={() => loadInvoices()}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="mb-8">
          <InvoiceStatsCards stats={stats} />
        </div>
      )}

      {/* Filtros */}
      <div className="mb-6">
        <InvoiceFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Lista de facturas */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No se encontraron facturas
          </p>
        </div>
      ) : (
        <>
          <InvoiceList
            invoices={invoices}
            onViewInvoice={handleViewInvoice}
            onDownloadPDF={handleDownloadPDF}
          />

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
              >
                Anterior
              </Button>
              
              <div className="flex items-center px-4">
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
              </div>
              
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}