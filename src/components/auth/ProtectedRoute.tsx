'use client'

import { useAuth } from '../../contexts/AuthContext'
import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'sat' | 'instalador' | 'guest'
  fallbackPath?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = '/' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No hay usuario autenticado, redirigir
        router.push(fallbackPath)
        return
      }

      if (requiredRole && user.client?.customer_role?.name !== requiredRole) {
        // Usuario no tiene el rol requerido
        router.push(fallbackPath)
        return
      }
    }
  }, [user, loading, requiredRole, router, fallbackPath])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredRole && user.client?.customer_role?.name !== requiredRole) {
    return null
  }

  return <>{children}</>
}

// Hook para verificar permisos
export function usePermissions() {
  const { user } = useAuth()
  
  const hasRole = (role: 'admin' | 'sat' | 'instalador' | 'guest') => {
    return user?.client?.customer_role?.name === role
  }

  const isAdmin = () => hasRole('admin')
  const isSat = () => hasRole('sat')
  const isInstalador = () => hasRole('instalador')
  const isGuest = () => hasRole('guest')

  return {
    hasRole,
    isAdmin,
    isSat,
    isInstalador,
    isGuest,
    role: user?.client?.customer_role?.name
  }
}