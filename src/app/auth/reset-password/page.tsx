'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [verifying, setVerifying] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    const session = searchParams.get('session')
    const error = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    const errorDescription = searchParams.get('error_description')

    // Manejar errores específicos de Supabase
    if (error) {
      if (errorCode === 'otp_expired') {
        setError('El enlace de recuperación ha expirado. Por favor solicita uno nuevo.')
      } else if (errorCode === 'access_denied') {
        setError('Enlace de recuperación inválido o ya utilizado.')
      } else {
        setError(errorDescription || 'Error al procesar el enlace de recuperación')
      }
      setVerifying(false)
      return
    }

    // Si hay una sesión activa (de intercambio de código), es válido
    if (session === 'active' && type === 'recovery') {
      setTokenValid(true)
      setVerifying(false)
      return
    }

    // Si hay un token directo, validarlo
    if (!token || type !== 'recovery') {
      setError('Enlace de recuperación inválido o expirado')
      setVerifying(false)
      return
    }

    // El token de recuperación es válido para actualizar contraseña
    setTokenValid(true)
    setVerifying(false)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!password || !confirmPassword) {
      setError('Por favor completa todos los campos')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    try {
      const token = searchParams.get('token')
      const session = searchParams.get('session')

      // Si hay una sesión activa, usar updateUser directamente
      if (session === 'active') {
        console.log('🔄 Actualizando contraseña con sesión activa...')
        
        const { error } = await supabase.auth.updateUser({
          password: password
        })

        if (error) {
          console.error('❌ Error al actualizar contraseña:', error)
          setError(error.message || 'Error al actualizar la contraseña')
          setLoading(false)
          return
        } else {
          console.log('✅ Contraseña actualizada correctamente')
          setSuccess(true)
          setLoading(false)
          
          // Cerrar sesión después de cambiar contraseña
          try {
            await supabase.auth.signOut()
            console.log('✅ Sesión cerrada')
          } catch (signOutError) {
            console.error('⚠️ Error al cerrar sesión:', signOutError)
          }
          
          setTimeout(() => {
            router.push('/auth/login?message=Contraseña actualizada correctamente')
          }, 3000)
          return
        }
      } else {
        // Usar el token method para tokens directos
        if (!token) {
          setError('Token de recuperación faltante')
          setLoading(false)
          return
        }

        console.log('🔄 Actualizando contraseña con token...')

        const response = await fetch('/api/reset-password-recovery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recovery_token: token,
            new_password: password
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          console.error('❌ Error en API:', result)
          setError(result.error || 'Error al actualizar la contraseña')
          setLoading(false)
          return
        } else {
          console.log('✅ Contraseña actualizada correctamente via API')
          setSuccess(true)
          setLoading(false)
          setTimeout(() => {
            router.push('/auth/login?message=Contraseña actualizada correctamente')
          }, 3000)
          return
        }
      }
    } catch (err: any) {
      console.error('❌ Error inesperado:', err)
      setError(err.message || 'Error de conexión. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando enlace de recuperación...</p>
        </div>
      </div>
    )
  }

  if (error && !tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Solicitar nuevo enlace de recuperación
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Nueva contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Introduce tu nueva contraseña
        </p>

        {!success ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <input
                type="password"
                placeholder="Confirmar nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : success ? 'Contraseña actualizada' : 'Actualizar contraseña'}
            </button>
          </form>
        ) : (
          <div className="text-center mt-6">
            <p className="text-green-700 mb-4">
              Tu contraseña ha sido actualizada correctamente.
            </p>
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-500"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
