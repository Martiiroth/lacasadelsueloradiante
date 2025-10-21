/**
 * Página de detalle de factura individual del admin
 * Muestra información completa y opciones de gestión
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Eye, Loader2, Mail, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InvoiceDetails } from '@/components/invoices/InvoiceComponents'
import type { Invoice, InvoiceStatus } from '@/types/invoices'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PageProps {
  params: {
    id: string
  }
}

export default function AdminInvoiceDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  useEffect(() => {
    loadInvoice()
  }, [params.id])

  const loadInvoice = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invoices/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setInvoice(data.data.invoice)
      } else {
        console.error('Error cargando factura:', data.error)
        router.push('/admin/invoices')
      }
    } catch (error) {
      console.error('Error cargando factura:', error)
      router.push('/admin/invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: InvoiceStatus) => {
    if (!invoice) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (data.success) {
        setInvoice(data.data.invoice)
      } else {
        console.error('Error actualizando factura:', data.error)
      }
    } catch (error) {
      console.error('Error actualizando factura:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkAsPaid = () => {
    handleUpdateStatus('paid')
  }

  const handleResend = () => {
    handleUpdateStatus('sent')
  }

  const handleCancel = async () => {
    await handleUpdateStatus('cancelled')
    setShowCancelDialog(false)
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
            onClick={() => router.push('/admin/invoices')}
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
          onClick={() => router.push('/admin/invoices')}
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
              Gestión administrativa de la factura
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Acciones de visualización */}
            <Button
              onClick={handleViewPDF}
              variant="outline"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver PDF
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              variant="outline"
              size="sm"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar
            </Button>

            {/* Acciones de gestión según estado */}
            {invoice.status === 'sent' && (
              <Button
                onClick={handleMarkAsPaid}
                disabled={updating}
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Marcar como Pagada
              </Button>
            )}

            {invoice.status === 'overdue' && (
              <>
                <Button
                  onClick={handleMarkAsPaid}
                  disabled={updating}
                  size="sm"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Marcar como Pagada
                </Button>
                <Button
                  onClick={handleResend}
                  disabled={updating}
                  variant="outline"
                  size="sm"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Reenviar
                </Button>
              </>
            )}

            {['draft', 'sent'].includes(invoice.status) && (
              <Button
                onClick={() => setShowCancelDialog(true)}
                disabled={updating}
                variant="destructive"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Detalle de factura */}
      <InvoiceDetails invoice={invoice} />

      {/* Dialog de confirmación de cancelación */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la factura. ¿Estás seguro de que deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sí, cancelar factura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}