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
        console.log('🔄 Auth state changed:', event, currentSession?.user?.email)

        setSession(currentSession)

        if (event === 'SIGNED_IN' && currentSession) {
          const user = await AuthService.getCurrentUser()
          setState({ user, loading: false, error: null })
        } else if (event === 'SIGNED_OUT') {
          setState({ user: null, loading: false, error: null })
        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          console.log('✅ Token refreshed successfully')
          // Session actualizada, mantener user actual
        } else if (event === 'USER_UPDATED' && currentSession) {
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

    const handleVisibilityChange = async () => {
      if (!document.hidden && isInitialized) {
        console.log('👁️ Tab visible - Syncing session...')
        
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          
          // Sincronizar si hay discrepancia entre estado y localStorage
          if (currentSession && !session) {
            console.log('🔄 Recovering lost session...')
            setSession(currentSession)
            const user = await AuthService.getCurrentUser()
            setState({ user, loading: false, error: null })
          } else if (!currentSession && session) {
            console.log('🔄 Clearing stale session...')
            setSession(null)
            setState({ user: null, loading: false, error: null })
          } else if (currentSession && session && currentSession.user.id !== session.user.id) {
            console.log('🔄 Session mismatch - Updating...')
            setSession(currentSession)
            const user = await AuthService.getCurrentUser()
            setState({ user, loading: false, error: null })
          }
        } catch (error) {
          console.error('❌ Error syncing session:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [session, isInitialized])

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