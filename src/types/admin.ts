// Tipos para el panel de administración

import type { ImageData } from '@/components/admin/ImageUpload'

export interface AdminClient {
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
  role?: {
    id: number
    name: 'admin' | 'sat' | 'instalador' | 'guest'
    description?: string
  }
  // Estadísticas del cliente
  stats?: {
    total_orders: number
    total_spent_cents: number
    last_order_date?: string
  }
}

export interface AdminOrder {
  id: string
  client_id: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_cents: number
  shipping_address: any
  billing_address?: any
  created_at: string
  updated_at: string
  // Relaciones
  client?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  order_items?: {
    id: string
    qty: number
    price_cents: number
    variant?: {
      id?: string
      title?: string
      sku?: string
      option1?: string
      option2?: string
      option3?: string
      product?: {
        title: string
      }
    }
  }[]
}

export interface AdminStats {
  // Clientes
  total_clients: number
  active_clients: number
  new_clients_this_month: number
  
  // Pedidos
  total_orders: number
  pending_orders: number
  completed_orders: number
  orders_this_month: number
  
  // Financiero
  total_revenue_cents: number
  revenue_this_month_cents: number
  average_order_value_cents: number
  
  // Productos
  total_products?: number
  low_stock_products?: number
}

export interface AdminFilters {
  // Filtros de clientes
  client_status?: ('active' | 'inactive')[]
  client_role?: ('admin' | 'sat' | 'instalador' | 'guest')[]
  client_search?: string
  client_date_from?: string
  client_date_to?: string
  
  // Filtros de pedidos
  order_status?: ('pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled')[]
  order_date_from?: string
  order_date_to?: string
  order_client_search?: string
  order_min_amount?: number
  order_max_amount?: number
  
  // Filtros de productos
  product_status?: ('active' | 'draft' | 'archived')[]
  product_type?: string[]
  product_search?: string
  product_vendor?: string[]
  product_min_price?: number
  product_max_price?: number
  product_low_stock?: boolean
}

export interface AdminDashboardData {
  stats: AdminStats
  recent_orders: AdminOrder[]
  recent_clients: AdminClient[]
  top_clients: AdminClient[]
}

// Tipos para formularios de actualización admin
export interface UpdateClientAdminData {
  first_name: string
  last_name: string
  email: string
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
  is_active: boolean
  role_id?: number
}

export interface UpdateOrderStatusData {
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  notes?: string
}

// Tipos para métricas y análisis
export interface RevenueMetrics {
  daily_revenue: { date: string; amount_cents: number }[]
  monthly_revenue: { month: string; amount_cents: number }[]
  orders_by_status: { status: string; count: number }[]
  top_products: { 
    product_title: string
    total_sold: number
    revenue_cents: number
  }[]
}

export interface ClientMetrics {
  new_clients_by_month: { month: string; count: number }[]
  clients_by_role: { role: string; count: number }[]
  clients_by_region: { region: string; count: number }[]
  top_clients_by_orders: AdminClient[]
  top_clients_by_revenue: AdminClient[]
}

// Tipos para productos en admin
export interface AdminProduct {
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
  brand_id?: string
  created_at: string
  updated_at: string
  // Additional product properties
  status: 'active' | 'draft' | 'archived'
  handle: string
  type?: string
  vendor?: string
  tags?: string
  // Relaciones
  variants?: AdminProductVariant[]
  images?: AdminProductImage[]
  media?: {
    id: string
    url: string
    alt_text?: string
    position: number
  }[]
  resources?: ResourceData[]
  categories?: {
    category: {
      id: string
      name: string
      slug: string
    }
  }[]
  // Estadísticas
  stats?: {
    total_variants: number
    total_stock: number
    total_sold: number
    revenue_cents: number
  }
}

export interface AdminProductVariant {
  id: string
  product_id: string
  sku?: string
  title?: string
  price_public_cents: number
  stock: number
  weight_grams?: number
  dimensions?: any
  created_at: string
  updated_at: string
  // Additional variant properties
  option1?: string
  option2?: string
  option3?: string
  price_cents: number
  compare_at_price_cents?: number
  inventory_quantity: number
  is_active: boolean
}

export interface AdminProductImage {
  id: string
  product_id: string
  url: string
  alt?: string
  position: number
  created_at: string
}

// Tipos para formularios de productos
export interface CreateProductData {
  slug: string
  title: string
  short_description?: string
  description?: string
  is_new?: boolean
  is_on_sale?: boolean
  meta_title?: string
  meta_description?: string
  brand_id?: string
  variants: CreateVariantData[]
  categories?: string[] // IDs de categorías
  images?: CreateImageData[]
  resources?: ResourceData[]
}

export interface CreateVariantData {
  sku?: string
  title?: string
  price_public_cents: number
  stock: number
  weight_grams?: number
  dimensions?: any
  images?: ImageData[]
  role_prices?: VariantRolePrice[]
}

export interface CreateImageData {
  url: string
  alt?: string
  position: number
}

export interface UpdateProductData {
  slug?: string
  title?: string
  short_description?: string
  description?: string
  is_new?: boolean
  is_on_sale?: boolean
  meta_title?: string
  meta_description?: string
  brand_id?: string
  resources?: ResourceData[]
  status?: 'active' | 'draft' | 'archived'
  handle?: string
  type?: string
  vendor?: string
  tags?: string
}

export interface ResourceData {
  id?: string
  type: 'manual' | 'pdf' | 'video' | 'file'
  name: string
  url: string
  description?: string
}

export interface UpdateVariantData {
  id?: string
  sku?: string
  title?: string
  price_public_cents?: number
  stock?: number
  weight_grams?: number
  dimensions?: any
  images?: ImageData[]
  role_prices?: VariantRolePrice[]
}

export interface VariantRolePrice {
  role_name: 'guest' | 'instalador' | 'sat' | 'admin'
  price_cents: number
}

// Tipos para categorías en admin
export interface AdminCategory {
  id: string
  name: string
  slug: string
  parent_id?: string
  created_at: string
  updated_at: string
  // Relaciones
  parent?: AdminCategory
  children?: AdminCategory[]
  // Estadísticas
  stats?: {
    total_products: number
    total_subcategories: number
  }
}

export interface CreateCategoryData {
  name: string
  slug: string
  parent_id?: string
}

export interface UpdateCategoryData {
  name?: string
  slug?: string
  parent_id?: string
}

// Tipos para cupones en admin
export interface AdminCoupon {
  id: string
  code: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  applies_to: 'product' | 'category' | 'order'
  target_id?: string
  usage_limit?: number
  used_count: number
  valid_from?: string
  valid_to?: string
  created_at: string
  // Relaciones
  target?: {
    id: string
    name: string
    type: 'product' | 'category'
  } | null
  // Estadísticas
  stats?: {
    total_redemptions: number
    total_savings_cents: number
    active_orders: number
  }
}

export interface CreateCouponData {
  code: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  applies_to: 'product' | 'category' | 'order'
  target_id?: string
  usage_limit?: number
  valid_from?: string
  valid_to?: string
}

export interface UpdateCouponData {
  code?: string
  description?: string
  discount_type?: 'percentage' | 'fixed'
  discount_value?: number
  applies_to?: 'product' | 'category' | 'order'
  target_id?: string
  usage_limit?: number
  valid_from?: string
  valid_to?: string
}