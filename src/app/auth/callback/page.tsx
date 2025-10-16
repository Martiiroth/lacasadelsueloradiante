'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Manejar tokens que lleguen via hash (después del #)
    const handleHashParams = () => {
      const hash = window.location.hash
      const searchParams = new URLSearchParams(window.location.search)
      
      console.log('🔍 Callback page - Hash:', hash)
      console.log('🔍 Callback page - Search:', window.location.search)
      
      // Extraer parámetros del hash si existen
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const hashToken = hashParams.get('access_token') || hashParams.get('token')
        const hashType = hashParams.get('type')
        const hashError = hashParams.get('error')
        
        console.log('🔍 Hash params:', { 
          token: hashToken, 
          type: hashType, 
          error: hashError 
        })
        
        if (hashError) {
          router.push(`/auth/error?message=${encodeURIComponent(hashError)}`)
          return
        }
        
        if (hashToken && (hashType === 'recovery' || !hashType)) {
          router.push(`/auth/reset-password?token=${hashToken}&type=recovery`)
          return
        }
      }
      
      // Extraer parámetros de query string
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      const error = searchParams.get('error')
      
      console.log('🔍 Query params:', { token, type, error })
      
      if (error) {
        router.push(`/auth/error?message=${encodeURIComponent(error)}`)
        return
      }
      
      if (token && (type === 'recovery' || !type)) {
        router.push(`/auth/reset-password?token=${token}&type=recovery`)
        return
      }
      
      // Si no hay parámetros válidos, mostrar error
      console.log('❌ No hay parámetros válidos, redirigiendo a error')
      router.push('/auth/error?message=Enlace+inválido+o+expirado')
    }

    // Ejecutar después de que el componente se monte
    handleHashParams()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Procesando enlace de recuperación...</p>
      </div>
    </div>
  )
}