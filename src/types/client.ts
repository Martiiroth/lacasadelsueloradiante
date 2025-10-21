// Tipos para el dashboard del cliente

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
  // Relaciones
  role?: CustomerRole
}

export interface CustomerRole {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface ClientOrder {
  id: string
  client_id: string
  status: OrderStatus
  total_cents: number
  shipping_address: any // JSON
  billing_address?: any // JSON
  created_at: string
  updated_at: string
  // Relaciones
  order_items?: OrderItem[]
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface OrderItem {
  id: string
  order_id: string
  variant_id: string
  qty: number
  price_cents: number
  // Relaciones
  variant?: ProductVariant
}

export interface ProductVariant {
  id: string
  product_id: string
  sku?: string
  title?: string
  price_public_cents: number
  stock: number
  weight_grams?: number
  dimensions?: any // JSON
  created_at: string
  updated_at: string
  // Relaciones
  product?: Product
  images?: VariantImage[]
}

export interface Product {
  id: string
  slug: string
  title: string
  short_description?: string
  description?: string
  is_new: boolean
  is_on_sale: boolean
  meta_title?: string
  meta_description?: string
  og_image?: string
  created_at: string
  updated_at: string
  // Relaciones
  images?: ProductImage[]
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt?: string
  position: number
  created_at: string
}

export interface VariantImage {
  id: string
  variant_id: string
  url: string
  alt?: string
  position: number
  created_at: string
}

// Tipos para formularios de actualización
export interface UpdateClientData {
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
}

// Tipos para estadísticas del dashboard
export interface ClientStats {
  total_orders: number
  total_spent_cents: number
  pending_orders: number
  completed_orders: number
}

// Tipos para filtros y búsqueda
export interface OrderFilters {
  status?: OrderStatus[]
  date_from?: string
  date_to?: string
  search?: string
}

// Tipo para el dashboard del cliente
export interface ClientDashboardData {
  client: Client
  stats: ClientStats
  recent_orders: ClientOrder[]
}