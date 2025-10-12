/**
 * Utilidades para manejo de errores 502 Bad Gateway
 * Funciones para limpiar cookies y prevenir problemas tras actualizaciones
 */

// Función para detectar si estamos en el navegador
const isBrowser = typeof window !== 'undefined'

/**
 * Lista de cookies problemáticas que pueden causar errores 502
 */
const PROBLEMATIC_COOKIES = [
  'next-auth.session-token',
  'next-auth.csrf-token', 
  'next-auth.callback-url',
  '__Secure-next-auth.session-token',
  '__Host-next-auth.csrf-token',
  'authjs.session-token',
  'authjs.csrf-token',
  'showWithVAT'
]

/**
 * Función para limpiar todas las cookies problemáticas
 */
export function clearProblematicCookies(): void {
  if (!isBrowser) return

  console.log('🧹 Clearing problematic cookies...')
  
  PROBLEMATIC_COOKIES.forEach(cookieName => {
    // Limpiar para el dominio actual
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    
    // Limpiar para subdominios
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
    
    // Limpiar variantes seguras
    document.cookie = `__Secure-${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`
    document.cookie = `__Host-${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`
    
    console.log(`🗑️ Cleared cookie: ${cookieName}`)
  })
}

/**
 * Función para limpiar localStorage relacionado con autenticación
 */
export function clearAuthLocalStorage(): void {
  if (!isBrowser) return

  console.log('🧹 Clearing auth-related localStorage...')
  
  const keysToRemove = [
    'supabase.auth.token',
    'sb-supabase-auth-token',
    'showWithVAT',
    'user-preferences'
  ]

  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key)
      console.log(`🗑️ Cleared localStorage: ${key}`)
    }
  })
}

/**
 * Función completa para limpiar todo lo relacionado con autenticación
 */
export function performFullAuthCleanup(): void {
  console.log('🔄 Performing full authentication cleanup...')
  
  clearProblematicCookies()
  clearAuthLocalStorage()
  
  console.log('✅ Full cleanup completed')
}

/**
 * Hook personalizado para manejar errores 502
 */
export function handle502Error(): void {
  if (!isBrowser) return
  
  console.log('🚨 Handling 502 Bad Gateway error...')
  
  // Limpiar todo
  performFullAuthCleanup()
  
  // Mostrar mensaje al usuario
  const message = 'Se detectó un error de conexión. Limpiando caché y recargando...'
  
  // Crear notificación temporal
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 30px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 16px;
    font-weight: 500;
    text-align: center;
    max-width: 400px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
  `
  
  notification.innerHTML = `
    <div style="margin-bottom: 10px;">🔄</div>
    <div>${message}</div>
    <div style="margin-top: 15px; font-size: 14px; opacity: 0.8;">
      Recargando automáticamente en <span id="countdown">3</span> segundos...
    </div>
  `
  
  document.body.appendChild(notification)

  // Countdown
  let seconds = 3
  const countdownElement = document.getElementById('countdown')
  const interval = setInterval(() => {
    seconds--
    if (countdownElement) {
      countdownElement.textContent = seconds.toString()
    }
    if (seconds <= 0) {
      clearInterval(interval)
      window.location.reload()
    }
  }, 1000)
}

/**
 * Función para verificar si una cookie está corrupta
 */
export function isCookieCorrupted(cookieValue: string): boolean {
  if (!cookieValue) return false
  
  try {
    // Intentar decodificar JWT si parece ser uno
    if (cookieValue.includes('.')) {
      const parts = cookieValue.split('.')
      if (parts.length === 3) {
        // Parece un JWT, intentar decodificar
        const payload = JSON.parse(atob(parts[1]))
        
        // Verificar si ha expirado
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          return true
        }
      }
    }
    return false
  } catch (error) {
    // Si no se puede decodificar, está corrupta
    return true
  }
}

/**
 * Función para validar cookies de sesión
 */
export function validateSessionCookies(): boolean {
  if (!isBrowser) return true

  const sessionCookies = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token'
  ]

  for (const cookieName of sessionCookies) {
    const cookieValue = getCookieValue(cookieName)
    if (cookieValue && isCookieCorrupted(cookieValue)) {
      console.log(`🔍 Corrupted session cookie detected: ${cookieName}`)
      return false
    }
  }

  return true
}

/**
 * Función helper para obtener valor de cookie
 */
function getCookieValue(name: string): string | null {
  if (!isBrowser) return null
  
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

/**
 * Función para configurar auto-cleanup en errores
 */
export function setupAutoCleanup(): void {
  if (!isBrowser) return

  // Interceptar errores globales
  window.addEventListener('error', (event) => {
    const error = event.error || event.message
    
    if (error && (
      error.toString().includes('502') ||
      error.toString().includes('Bad Gateway') ||
      error.toString().includes('session') ||
      error.toString().includes('auth')
    )) {
      console.log('🔍 Auto-cleanup triggered by error:', error)
      handle502Error()
    }
  })

  // Interceptar errores de promesas no manejadas
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    
    if (error && (
      error.toString().includes('502') ||
      error.toString().includes('Bad Gateway')
    )) {
      console.log('🔍 Auto-cleanup triggered by unhandled rejection:', error)
      handle502Error()
    }
  })
}

export default {
  clearProblematicCookies,
  clearAuthLocalStorage,
  performFullAuthCleanup,
  handle502Error,
  validateSessionCookies,
  setupAutoCleanup
}