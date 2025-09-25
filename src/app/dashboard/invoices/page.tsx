'use client'

import React from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import InvoicesList from '../../../components/dashboard/InvoicesList'

export default function InvoicesPage() {
  const { user, loading } = useAuth()

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
      <InvoicesList />
    </DashboardLayout>
  )
}