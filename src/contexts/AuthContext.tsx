'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { AuthService } from '../lib/auth'
import type { AuthState, UserWithClient } from '../types/auth'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (data: any) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  session: Session | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })
  const [session, setSession] = useState<Session | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [sessionCorrupted, setSessionCorrupted] = useState(false)

  // Detectar sesión corrupta y forzar limpieza
  useEffect(() => {
    if (sessionCorrupted && typeof window !== 'undefined') {
      console.error('🚨 SESSION CORRUPTED - Forcing cleanup')
      
      // Limpiar todo
      localStorage.removeItem('sb-auth-token')
      localStorage.clear()
      
      // Mostrar mensaje al usuario
      alert(
        '⚠️ Tu sesión ha expirado o está corrupta.\n\n' +
        'La página se recargará automáticamente.\n' +
        'Por favor, inicia sesión nuevamente.'
      )
      
      // Recargar la página después de un momento
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }, [sessionCorrupted])

  // FASE 1: HIDRATACIÓN INICIAL - Recuperar sesión del localStorage
  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        // Recuperar sesión del localStorage (sin petición de red)
        const { data: { session: existingSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error recovering session:', error)
          if (mounted) {
            setState({ user: null, loading: false, error: error.message })
            setIsInitialized(true)
          }
          return
        }

        if (existingSession && mounted) {
          console.log('✅ Session recovered from storage:', existingSession.user.email)
          setSession(existingSession)
          
          // Cargar datos completos del usuario
          const user = await AuthService.getCurrentUser()
          setState({ user, loading: false, error: null })
        } else {
          console.log('ℹ️ No existing session found')
          if (mounted) {
            setState({ user: null, loading: false, error: null })
          }
        }
      } catch (error: any) {
        console.error('❌ Error initializing auth:', error)
        if (mounted) {
          setState({ user: null, loading: false, error: error.message })
        }
      } finally {
        if (mounted) {
          setIsInitialized(true)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [])

  // FASE 2: LISTENER DE CAMBIOS - Reaccionar a eventos de Supabase
  useEffect(() => {
    if (!isInitialized) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔄 Auth state changed:', event, currentSession?.user?.email || 'no user')

        setSession(currentSession)

        // Manejar todos los eventos importantes
        if (event === 'INITIAL_SESSION') {
          // Primera carga - ya manejada en FASE 1
          console.log('ℹ️ Initial session detected')
          if (currentSession) {
            const user = await AuthService.getCurrentUser()
            setState({ user, loading: false, error: null })
          }
        } else if (event === 'SIGNED_IN' && currentSession) {
          console.log('✅ User signed in')
          const user = await AuthService.getCurrentUser()
          setState({ user, loading: false, error: null })
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out')
          setState({ user: null, loading: false, error: null })
        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          console.log('✅ Token refreshed successfully')
          // Session actualizada, mantener user actual (no recargar innecesariamente)
        } else if (event === 'USER_UPDATED' && currentSession) {
          console.log('🔄 User data updated')
          const user = await AuthService.getCurrentUser()
          setState(prev => ({ ...prev, user }))
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [isInitialized])

  // FASE 3: SINCRONIZACIÓN AL CAMBIAR DE PESTAÑA
  useEffect(() => {
    if (typeof window === 'undefined') return

    let attemptCount = 0
    const MAX_ATTEMPTS = 5 // Aumentado de 3 a 5 para más tolerancia
    let isRefreshing = false // Prevenir múltiples refreshes simultáneos

    const handleVisibilityChange = async () => {
      if (!document.hidden && isInitialized && !isRefreshing) {
        console.log('👁️ Tab visible - Checking session...')
        
        // Si ya tenemos una sesión válida, verificar si sigue válida
        if (session && state.user) {
          const now = Date.now() / 1000 // tiempo en segundos
          const expiresAt = session.expires_at || 0
          const timeUntilExpiry = expiresAt - now
          
          // Si la sesión expira en más de 5 minutos, no hacer nada
          if (timeUntilExpiry > 300) {
            console.log(`✅ Session still valid (expires in ${Math.floor(timeUntilExpiry / 60)} minutes)`)
            attemptCount = 0 // Reset counter on valid session
            return
          }
          
          console.log(`⚠️ Session expiring soon (${Math.floor(timeUntilExpiry)} seconds), refreshing...`)
        }
        
        isRefreshing = true
        
        try {
          attemptCount++
          
          // Intentar refrescar la sesión activamente
          const { data: { session: refreshedSession }, error: refreshError } = 
            await supabase.auth.refreshSession()
          
          if (refreshError) {
            console.error(`❌ Error refreshing session (attempt ${attemptCount}/${MAX_ATTEMPTS}):`, refreshError)
            
            // Si fallamos múltiples veces, marcar como corrupta
            if (attemptCount >= MAX_ATTEMPTS) {
              console.error('🚨 Multiple refresh failures - marking session as corrupted')
              setSessionCorrupted(true)
              isRefreshing = false
              return
            }
            
            // Si el refresh falla, intentar recuperar del localStorage
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            
            if (currentSession) {
              console.log('🔄 Using cached session from localStorage')
              setSession(currentSession)
              
              // Intentar cargar usuario - si falla, sesión corrupta
              try {
                const user = await AuthService.getCurrentUser()
                if (user) {
                  setState({ user, loading: false, error: null })
                  attemptCount = 0 // Reset counter on success
                  isRefreshing = false
                  return
                } else {
                  throw new Error('User data unavailable')
                }
              } catch (userError) {
                console.error('❌ Could not load user data:', userError)
                if (attemptCount >= MAX_ATTEMPTS) {
                  setSessionCorrupted(true)
                }
              }
            } else {
              console.log('❌ No session available')
              setSession(null)
              setState({ user: null, loading: false, error: null })
            }
            isRefreshing = false
            return
          }
          
          if (refreshedSession) {
            console.log('✅ Session refreshed successfully on visibility change')
            setSession(refreshedSession)
            attemptCount = 0 // Reset counter on successful refresh
            
            // Solo recargar user si el ID cambió o no teníamos user
            if (!state.user || refreshedSession.user.id !== session?.user.id) {
              const user = await AuthService.getCurrentUser()
              setState({ user, loading: false, error: null })
            }
          } else if (session) {
            // No se pudo refrescar pero teníamos sesión antes
            console.log('⚠️ Could not refresh, clearing session')
            setSession(null)
            setState({ user: null, loading: false, error: null })
          }
        } catch (error) {
          console.error('❌ Error syncing session:', error)
          attemptCount++
          
          if (attemptCount >= MAX_ATTEMPTS) {
            console.error('🚨 Multiple sync errors - marking session as corrupted')
            setSessionCorrupted(true)
          } else {
            // No limpiar la sesión inmediatamente, dar más oportunidades
            console.log('⚠️ Sync error, will retry on next visibility change')
          }
        } finally {
          isRefreshing = false
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    // HEARTBEAT: Verificar sesión cada 5 minutos si la tab está activa
    const heartbeatInterval = setInterval(() => {
      if (!document.hidden && session && state.user) {
        const now = Date.now() / 1000
        const expiresAt = session.expires_at || 0
        const timeUntilExpiry = expiresAt - now
        
        // Si expira en menos de 10 minutos, refrescar preventivamente
        if (timeUntilExpiry < 600 && !isRefreshing) {
          console.log('🔄 Heartbeat: Refreshing session preventively...')
          handleVisibilityChange()
        }
      }
    }, 5 * 60 * 1000) // Cada 5 minutos

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
      clearInterval(heartbeatInterval)
    }
  }, [session, isInitialized, state.user])

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    const { user, error } = await AuthService.signIn({ email, password })
    
    if (error) {
      setState(prev => ({ ...prev, loading: false, error }))
      return { error }
    }

    // El usuario se actualizará automáticamente por el listener
    return { error: null }
  }

  const signUp = async (data: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    const { user, error } = await AuthService.signUp(data)
    
    if (error) {
      setState(prev => ({ ...prev, loading: false, error }))
      return { error }
    }

    return { error: null }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))
    await AuthService.signOut()
    // El listener actualizará el estado automáticamente
  }

  const refreshUser = async () => {
    if (!session) return
    
    setState(prev => ({ ...prev, loading: true }))
    try {
      const user = await AuthService.getCurrentUser()
      setState({ user, loading: false, error: null })
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }))
    }
  }

  const value: AuthContextType = {
    ...state,
    session,
    signIn,
    signUp,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}