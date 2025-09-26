'use client'

import { useEffect, useState } from 'react'

/**
 * Hook para evitar problemas de hydration mismatch
 * Retorna true solo después de que el componente se haya hidratado en el cliente
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

/**
 * Componente wrapper que previene hydration mismatch
 */
interface ClientOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const isHydrated = useHydration()
  
  if (!isHydrated) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}