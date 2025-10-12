'use client'

import { useEffect } from 'react'

/**
 * Componente que detecta errores de red y limpia cookies automáticamente
 * Previene problemas 502 Bad Gateway relacionados con cookies corruptas
 */
export default function NetworkErrorHandler() {
  useEffect(() => {
    // Detectar errores de red globalmente
    const handleFetch = (originalFetch: typeof fetch) => {
      return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        try {
          const response = await originalFetch(input, init)
          
          // Si detectamos 502 Bad Gateway
          if (response.status === 502) {
            console.log('🚨 502 Bad Gateway detected, cleaning cookies...')
            await cleanProblematicCookies()
            
            // Mostrar notificación al usuario
            showUserNotification('Se detectó un error de conexión. Limpiando caché...')
            
            // Intentar recargar la página después de un breve delay
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          }
          
          return response
        } catch (error) {
          console.error('Network error:', error)
          
          // Si es un error de red, también limpiar cookies
          if (error instanceof TypeError && error.message.includes('fetch')) {
            console.log('🧹 Network error detected, cleaning cookies as precaution...')
            await cleanProblematicCookies()
          }
          
          throw error
        }
      }
    }

    // Sobrescribir fetch global
    const originalFetch = window.fetch
    window.fetch = handleFetch(originalFetch)

    // Limpiar al desmontar
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // Función para limpiar cookies problemáticas
  const cleanProblematicCookies = async () => {
    const problematicCookies = [
      'next-auth.session-token',
      'next-auth.csrf-token', 
      'next-auth.callback-url',
      'authjs.session-token',
      'authjs.csrf-token',
      'showWithVAT'
    ]

    problematicCookies.forEach(cookieName => {
      // Limpiar cookies del dominio actual
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
      
      console.log(`🗑️ Cleared cookie: ${cookieName}`)
    })

    // También limpiar localStorage relacionado
    const localStorageKeys = [
      'supabase.auth.token',
      'showWithVAT',
      'user-preferences'
    ]

    localStorageKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        console.log(`🗑️ Cleared localStorage: ${key}`)
      }
    })

    console.log('✅ All problematic cookies and storage cleared')
  }

  // Función para mostrar notificación al usuario
  const showUserNotification = (message: string) => {
    // Crear elemento de notificación
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f59e0b;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `
    
    notification.textContent = message
    document.body.appendChild(notification)

    // Agregar animación CSS
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)

    // Remover después de 5 segundos
    setTimeout(() => {
      notification.remove()
      style.remove()
    }, 5000)
  }

  // También detectar errores de la aplicación Next.js
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message
      
      // Detectar errores relacionados con cookies o sesiones
      if (error && (
        error.toString().includes('session') ||
        error.toString().includes('cookie') ||
        error.toString().includes('auth') ||
        error.toString().includes('502')
      )) {
        console.log('🔍 Session-related error detected:', error)
        cleanProblematicCookies()
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  return null // Este componente no renderiza nada
}