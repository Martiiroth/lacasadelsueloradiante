// Tipos para el sistema de marcas

export interface Brand {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  website?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BrandData {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  website?: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Campos adicionales para listados con estadísticas
  product_count?: number
  featured_products?: ProductCardData[]
}

export interface CreateBrandData {
  name: string
  slug: string
  logo_url?: string
  is_active?: boolean
}

export interface UpdateBrandData {
  name?: string
  slug?: string
  logo_url?: string
  is_active?: boolean
}

export interface BrandFilters {
  is_active?: boolean
  search?: string
  with_products_only?: boolean
}

export interface BrandListResponse {
  brands: BrandData[]
  total: number
  page?: number
  limit?: number
}

// Re-exportar tipos de productos que necesitamos
import type { ProductCardData } from './products'
export type { ProductCardData }