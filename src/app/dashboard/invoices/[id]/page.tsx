/**
 * Página de detalle de factura individual del cliente
 * Muestra información completa y opciones de descarga
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InvoiceDetails } from '@/components/invoices/InvoiceComponents'
import type { Invoice } from '@/types/invoices'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => {
      setInvoiceId(p.id)
    })
  }, [params])

  useEffect(() => {
    if (invoiceId) {
      loadInvoice()
    }
  }, [invoiceId])

  const loadInvoice = async () => {
    if (!invoiceId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/invoices/${invoiceId}`)
      const data = await response.json()

      if (data.success) {
        setInvoice(data.data.invoice)
      } else {
        console.error('Error cargando factura:', data.error)
        router.push('/dashboard/invoices')
      }
    } catch (error) {
      console.error('Error cargando factura:', error)
      router.push('/dashboard/invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return

    try {
      setDownloading(true)
      const response = await fetch(`/api/invoices/${invoice.id}/pdf?download=true`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `factura-${invoice.invoice_number}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Error descargando PDF')
      }
    } catch (error) {
      console.error('Error descargando PDF:', error)
    } finally {
      setDownloading(false)
    }
  }

  const handleViewPDF = () => {
    if (!invoice) return
    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No se encontró la factura
          </p>
          <Button
            onClick={() => router.push('/dashboard/invoices')}
            className="mt-4"
          >
            Volver a facturas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/invoices')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a facturas
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">
              Factura {invoice.prefix}{invoice.invoice_number}{invoice.suffix}
            </h1>
            <p className="text-muted-foreground mt-1">
              Detalles completos de la factura
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleViewPDF}
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver PDF
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Detalle de factura */}
      <InvoiceDetails invoice={invoice} />
    </div>
  )
}