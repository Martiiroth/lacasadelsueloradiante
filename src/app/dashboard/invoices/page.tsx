'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { InvoiceList } from '../../../components/ui/InvoiceComponents'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { RefreshCw, Download } from 'lucide-react'

export default function InvoicesPage() {
  const { user, loading } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInvoices = async () => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/invoices-new?action=get_all', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Error al cargar facturas')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setInvoices(data.data?.invoices || [])
      } else {
        throw new Error(data.error || 'Error desconocido')
      }
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar facturas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices-new/${invoiceId}/pdf`)
      
      if (!response.ok) {
        throw new Error('Error al generar el PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('Error al descargar la factura. Inténtalo de nuevo.')
    }
  }

  const handleViewDetails = (invoiceId: string) => {
    window.location.href = `/dashboard/invoices/${invoiceId}`
  }

  useEffect(() => {
    fetchInvoices()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
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
          <a 
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout activeSection="invoices">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">Facturas</CardTitle>
                <CardDescription>
                  Gestiona y descarga tus facturas
                </CardDescription>
              </div>
              <Button 
                onClick={fetchInvoices} 
                disabled={isLoading}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando facturas...</span>
            </CardContent>
          </Card>
        )}

        {/* Invoices List */}
        {!isLoading && !error && (
          <InvoiceList
            invoices={invoices}
            onDownloadPDF={handleDownloadPDF}
            onViewDetails={handleViewDetails}
            className="md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
          />
        )}
      </div>
    </DashboardLayout>
  )
}