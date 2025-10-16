'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || 'Ha ocurrido un error'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Error de autenticación
          </h2>
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{message}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ir al inicio de sesión
          </Link>
          
          <Link
            href="/auth/forgot-password"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Solicitar nuevo enlace de recuperación
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ErrorContent />
    </Suspense>
  )
}