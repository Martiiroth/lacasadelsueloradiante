// Tipos basados en el esquema de la base de datos para productos
import type { CustomerRole } from './auth'

export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string
  created_at: string
  updated_at: string
  // Relaciones
  parent?: Category
  children?: Category[]
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
  variants?: ProductVariant[]
  images?: ProductImage[]
  categories?: Category[]
  resources?: ProductResource[]
  reviews?: ProductReview[]
}

export interface ProductVariant {
  id: string
  product_id: string
  sku?: string
  title?: string
  price_public_cents: number
  stock: number
  weight_grams?: number
  dimensions?: Record<string, any>
  created_at: string
  updated_at: string
  // Relaciones
  product?: Product
  role_prices?: RolePrice[]
  images?: VariantImage[]
}

export interface RolePrice {
  id: string
  variant_id: string
  role_id: number
  price_cents: number
  // Relaciones
  variant?: ProductVariant
  role?: CustomerRole
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

export interface ProductResource {
  id: string
  product_id: string
  type: 'manual' | 'pdf' | 'video' | 'file'
  url: string
  label?: string
  created_at: string
}

export interface ProductReview {
  id: string
  product_id: string
  client_id: string
  rating: number // 1-5
  comment?: string
  created_at: string
  updated_at: string
  // Relaciones
  client?: {
    first_name: string
    last_name: string
  }
}

export interface Cart {
  id: string
  client_id: string
  currency: string
  created_at: string
  updated_at: string
  // Relaciones
  items?: CartItem[]
}

export interface CartItem {
  id: string
  cart_id: string
  variant_id: string
  qty: number
  price_at_addition_cents: number
  added_at: string
  // Relaciones
  variant?: ProductVariant
}

export interface Backorder {
  id: string
  variant_id: string
  client_id: string
  qty: number
  requested_at: string
  fulfilled_at?: string
}

// Tipos para componentes
export interface ProductWithVariants extends Product {
  variants: ProductVariant[]
  images: ProductImage[]
  categories: Category[]
}

export interface ProductCardData {
  id: string
  slug: string
  title: string
  short_description?: string
  is_new: boolean
  is_on_sale: boolean
  image?: ProductImage
  price_cents: number
  role_price_cents?: number
  in_stock: boolean
}

export interface ProductFilters {
  categories?: string[]
  min_price?: number
  max_price?: number
  in_stock_only?: boolean
  is_new?: boolean
  is_on_sale?: boolean
  search?: string
}

export interface ProductSort {
  field: 'title' | 'price' | 'created_at' | 'stock'
  direction: 'asc' | 'desc'
}

export interface ProductListResponse {
  products: ProductCardData[]
  total: number
  page: number
  per_page: number
  total_pages: number
}