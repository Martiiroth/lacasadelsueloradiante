// Tipos basados en el esquema de la base de datos

export interface CustomerRole {
  id: number
  name: 'admin' | 'sat' | 'instalador' | 'guest'
  description?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  auth_uid: string
  role_id?: number
  first_name: string
  last_name: string
  phone?: string
  email: string
  nif_cif?: string
  region?: string
  city?: string
  address_line1?: string
  address_line2?: string
  postal_code?: string
  activity?: string
  company_name?: string
  company_position?: string
  is_active: boolean
  deleted_at?: string
  created_at: string
  updated_at: string
  last_login?: string
  // Relación con role
  customer_role?: CustomerRole
}

export interface AuthUser {
  id: string
  email: string
  // Otros campos de Supabase Auth que necesitemos
}

export interface UserWithClient extends AuthUser {
  client?: Client
}

// Tipos para formularios
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
  nif_cif?: string
  region?: string
  city?: string
  address_line1?: string
  address_line2?: string
  postal_code?: string
  activity?: string
  company_name?: string
  company_position?: string
}

// Estado de autenticación
export interface AuthState {
  user: UserWithClient | null
  loading: boolean
  error: string | null
}