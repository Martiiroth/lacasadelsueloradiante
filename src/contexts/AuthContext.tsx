'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthService } from '../lib/auth'
import type { AuthState, UserWithClient } from '../types/auth'
import { useHydration } from '../hooks/useHydration'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (data: any) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })
  const isHydrated = useHydration()

  useEffect(() => {
    if (!isHydrated) return
    
    // Verificar si hay una sesión actual
    getCurrentUser()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      console.log('AuthContext - Auth state changed:', user)
      setState(prev => ({ ...prev, user, loading: false }))
    })

    return () => subscription.unsubscribe()
  }, [isHydrated])

  const getCurrentUser = async () => {
    try {
      const user = await AuthService.getCurrentUser()
      console.log('AuthContext - User loaded:', user)
      if (user?.client) {
        console.log('AuthContext - Client data:', user.client)
      } else {
        console.warn('AuthContext - No client data found for user:', user?.email)
      }
      setState(prev => ({ ...prev, user, loading: false }))
    } catch (error) {
      console.error('AuthContext - Error loading user:', error)
      setState(prev => ({ 
        ...prev, 
        user: null, 
        loading: false, 
        error: 'Error loading user data' 
      }))
    }
  }

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
    setState({ user: null, loading: false, error: null })
  }

  const refreshUser = async () => {
    setState(prev => ({ ...prev, loading: true }))
    await getCurrentUser()
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshUser,
  }

  // Prevenir hydration mismatch mostrando un loading inicial
  if (!isHydrated) {
    return (
      <AuthContext.Provider value={{ ...value, loading: true }}>
        {children}
      </AuthContext.Provider>
    )
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