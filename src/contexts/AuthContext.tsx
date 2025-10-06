/**
 * AuthContext - Context de autenticación
 * 
 * ✅ SIMPLIFICADO CON ARQUITECTURA SUPABASE SSR
 * 
 * El middleware se encarga de:
 * - Refrescar tokens automáticamente en cada request
 * - Actualizar cookies
 * - Mantener sesión válida
 * 
 * Este contexto solo necesita:
 * - Hidratar estado inicial
 * - Escuchar cambios de auth (login/logout)
 * - Proveer métodos de autenticación
 */
'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
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
  // Crear cliente de Supabase para Client Components
  const supabase = createClient()
  
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })
  const [session, setSession] = useState<Session | null>(null)
  // Usar useRef en lugar de useState para evitar recreación del listener
  const isInitializedRef = useRef(false)

  // HIDRATACIÓN INICIAL - Recuperar sesión existente
  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        console.log('🔄 Initializing auth...')
        
        // Recuperar sesión del localStorage/cookies (ya refrescada por middleware)
        const { data: { session: existingSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error recovering session:', error)
          if (mounted) {
            setState({ user: null, loading: false, error: error.message })
          }
          return
        }

        if (existingSession && mounted) {
          console.log('✅ Session found:', existingSession.user.email)
          setSession(existingSession)
          
          // Cargar datos completos del usuario
          const user = await AuthService.getCurrentUser()
          setState({ user, loading: false, error: null })
          isInitializedRef.current = true
        } else {
          console.log('ℹ️ No existing session')
          if (mounted) {
            setState({ user: null, loading: false, error: null })
            isInitializedRef.current = true
          }
        }
      } catch (error: any) {
        console.error('❌ Error initializing auth:', error)
        if (mounted) {
          setState({ user: null, loading: false, error: error.message })
          isInitializedRef.current = true
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [supabase])

  // LISTENER DE EVENTOS DE AUTH - Reaccionar a cambios (login, logout, etc.)
  useEffect(() => {
    console.log('🔄 Setting up auth state listener...')
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('📡 Auth event:', event, currentSession?.user?.email || 'no user')

        // IMPORTANTE: Ignorar eventos hasta que se complete la hidratación inicial
        // Esto previene que SIGNED_IN se procese antes de la primera carga
        if (!isInitializedRef.current) {
          console.log('ℹ️ Ignoring event during initialization')
          return
        }

        // También ignorar INITIAL_SESSION explícitamente
        if (event === 'INITIAL_SESSION') {
          console.log('ℹ️ Initial session (already handled in hydration)')
          return
        }

        setSession(currentSession)

        // Manejar eventos de autenticación
        if (event === 'SIGNED_IN' && currentSession) {
          console.log('✅ User signed in')
          const user = await AuthService.getCurrentUser()
          setState({ user, loading: false, error: null })
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out')
          setState({ user: null, loading: false, error: null })
        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          console.log('🔄 Token refreshed by Supabase')
          // Token refrescado automáticamente por middleware
          // No necesitamos recargar el usuario aquí
        } else if (event === 'USER_UPDATED' && currentSession) {
          console.log('🔄 User data updated')
          const user = await AuthService.getCurrentUser()
          setState(prev => ({ ...prev, user }))
        }
      }
    )

    return () => {
      console.log('🧹 Cleaning up auth state listener')
      subscription.unsubscribe()
    }
  }, [supabase])

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
