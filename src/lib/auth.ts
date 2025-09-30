import { supabase } from './supabase'
import type { LoginCredentials, RegisterData, Client, UserWithClient } from '../types/auth'

export class AuthService {
  // Login con email y password
  static async signIn(credentials: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) throw error

      // Actualizar last_login en la tabla clients
      if (data.user) {
        await this.updateLastLogin(data.user.id)
      }

      return { user: data.user, error: null }
    } catch (error: any) {
      return { user: null, error: error.message }
    }
  }

  // Registro de nuevo usuario
  static async signUp(registerData: RegisterData) {
    try {
      console.log('Starting user registration for:', registerData.email)

      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: `${registerData.first_name} ${registerData.last_name}`,
            first_name: registerData.first_name,
            last_name: registerData.last_name,
            phone: registerData.phone || null,
            nif_cif: registerData.nif_cif || null,
            region: registerData.region || null,
            city: registerData.city || null,
            address_line1: registerData.address_line1 || null,
            address_line2: registerData.address_line2 || null,
            postal_code: registerData.postal_code || null,
            activity: registerData.activity || null,
            company_name: registerData.company_name || null,
            company_position: registerData.company_position || null,
          }
        }
      })

      if (error) {
        console.error('Supabase auth error:', error)
        throw error
      }

      console.log('User created successfully:', data.user?.id)

      // Crear inmediatamente el registro de cliente para asegurar consistency
      if (data.user) {
        try {
          const clientResult = await this.createClientRecord(data.user.id, registerData)
          if (clientResult.error) {
            console.error('Error creating client record:', clientResult.error)
            // No lanzamos error aqui para no bloquear el registro
            // El trigger podria haber funcionado de todas formas
          } else {
            console.log('Client record created successfully')
          }
        } catch (error) {
          console.error('Error creating client record:', error)
          // No lanzamos error aqui para no bloquear el registro
        }
      }

      return { user: data.user, error: null }
    } catch (error: any) {
      console.error('Registration error:', error)
      let errorMessage = error.message

      // Proporcionar mensajes más amigables para errores comunes
      if (error.message?.includes('User already registered')) {
        errorMessage = 'Este email ya está registrado. ¿Quieres iniciar sesión?'
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'El formato del email no es válido'
      } else if (error.message?.includes('Password')) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres'
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Demasiados intentos. Espera un momento antes de volver a intentar'
      }

      return { user: null, error: errorMessage }
    }
  }

  // Logout
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  // Obtener el usuario actual con sus datos de cliente
  static async getCurrentUser(): Promise<UserWithClient | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null

      // Obtener datos del cliente desde la DB
      const client = await this.getClientByAuthUid(user.id)

      return {
        id: user.id,
        email: user.email || '',
        client
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Obtener datos del cliente por auth_uid
  static async getClientByAuthUid(authUid: string): Promise<Client | undefined> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          customer_role:customer_roles(*)
        `)
        .eq('auth_uid', authUid)
        .single()

      if (error) {
        console.error('Error fetching client:', error)
        return undefined
      }

      return data
    } catch (error) {
      console.error('Error in getClientByAuthUid:', error)
      return undefined
    }
  }

  // Actualizar last_login
  static async updateLastLogin(authUid: string) {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ last_login: new Date().toISOString() })
        .eq('auth_uid', authUid)

      if (error) {
        console.error('Error updating last login:', error)
      }
    } catch (error) {
      console.error('Error in updateLastLogin:', error)
    }
  }

  // Crear registro de cliente manualmente (fallback si el trigger falla)
  static async createClientRecord(authUid: string, registerData: RegisterData) {
    try {
      // Obtener el role 'guest' por defecto
      const { data: defaultRole, error: roleError } = await supabase
        .from('customer_roles')
        .select('id')
        .eq('name', 'guest')
        .single()

      if (roleError) {
        console.warn('Could not find default role "guest":', roleError)
      }

      const { error } = await supabase
        .from('clients')
        .insert({
          auth_uid: authUid,
          role_id: defaultRole?.id || null, // Asignar role por defecto
          email: registerData.email,
          first_name: registerData.first_name,
          last_name: registerData.last_name,
          phone: registerData.phone || null,
          nif_cif: registerData.nif_cif || null,
          region: registerData.region || null,
          city: registerData.city || null,
          address_line1: registerData.address_line1 || null,
          address_line2: registerData.address_line2 || null,
          postal_code: registerData.postal_code || null,
          activity: registerData.activity || null,
          company_name: registerData.company_name || null,
          company_position: registerData.company_position || null,
        })

      if (error) {
        console.error('Error creating client record:', error)
        return { error: error.message }
      }

      return { error: null }
    } catch (error: any) {
      console.error('Error in createClientRecord:', error)
      return { error: error.message }
    }
  }

  // Actualizar datos del cliente
  static async updateClientData(authUid: string, updates: Partial<Client>) {
    try {
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('auth_uid', authUid)

      if (error) {
        console.error('Error updating client data:', error)
        return { error: error.message }
      }

      return { error: null }
    } catch (error: any) {
      console.error('Error in updateClientData:', error)
      return { error: error.message }
    }
  }

  // Escuchar cambios en el estado de autenticación
  static onAuthStateChange(callback: (user: UserWithClient | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const client = await this.getClientByAuthUid(session.user.id)
        callback({
          id: session.user.id,
          email: session.user.email || '',
          client
        })
      } else {
        callback(null)
      }
    })
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    }
  }
}