import { createClient } from '@/utils/supabase/client'
import type { 
  Brand, 
  BrandData, 
  CreateBrandData, 
  UpdateBrandData, 
  BrandFilters,
  BrandListResponse 
} from '@/types/brands'

export class BrandService {
  private static supabase = createClient()

  /**
   * Obtener todas las marcas activas
   */
  static async getBrands(filters: BrandFilters = {}): Promise<BrandListResponse> {
    try {
      let query = this.supabase
        .from('brands')
        .select(`
          id,
          name,
          slug,
          description,
          logo_url,
          website,
          is_active,
          created_at,
          updated_at
        `)

      // Aplicar filtros
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }

      // Ordenar por nombre
      query = query.order('name', { ascending: true })

      const { data: brands, error, count } = await query

      if (error) {
        console.error('Error fetching brands:', error)
        return { brands: [], total: 0 }
      }

      // Si necesitamos contar productos por marca
      const brandsWithCounts = await Promise.all(
        (brands || []).map(async (brand) => {
          const { count: productCount } = await this.supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('brand_id', brand.id)

          return {
            ...brand,
            product_count: productCount || 0
          } as BrandData
        })
      )

      return {
        brands: brandsWithCounts,
        total: count || 0
      }
    } catch (error) {
      console.error('Error in getBrands:', error)
      return { brands: [], total: 0 }
    }
  }

  /**
   * Obtener una marca por slug
   */
  static async getBrandBySlug(slug: string): Promise<BrandData | null> {
    try {
      const { data: brand, error } = await this.supabase
        .from('brands')
        .select(`
          id,
          name,
          slug,
          description,
          logo_url,
          website,
          is_active,
          created_at,
          updated_at
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching brand by slug:', error)
        return null
      }

      // Obtener productos de la marca
      const { data: products, count: productCount } = await this.supabase
        .from('products')
        .select(`
          id,
          slug,
          title,
          short_description,
          is_new,
          is_on_sale,
          product_variants (
            id,
            price_public_cents,
            stock
          ),
          product_images (
            url,
            alt
          )
        `)
        .eq('brand_id', brand.id)
        .limit(6) // Productos destacados

      // Transformar productos al formato ProductCardData
      const featuredProducts = (products || []).map(product => ({
        id: product.id,
        slug: product.slug,
        title: product.title,
        short_description: product.short_description,
        is_new: product.is_new,
        is_on_sale: product.is_on_sale,
        image_url: product.product_images[0]?.url || '/images/placeholder.jpg',
        image_alt: product.product_images[0]?.alt || product.title,
        price_cents: product.product_variants[0]?.price_public_cents || 0,
        in_stock: (product.product_variants[0]?.stock || 0) > 0,
        role_price_cents: undefined // Se calculará dinámicamente si es necesario
      }))

      return {
        ...brand,
        product_count: productCount || 0,
        featured_products: featuredProducts
      } as BrandData
    } catch (error) {
      console.error('Error in getBrandBySlug:', error)
      return null
    }
  }

  /**
   * Obtener una marca por ID
   */
  static async getBrandById(id: string): Promise<Brand | null> {
    try {
      const { data: brand, error } = await this.supabase
        .from('brands')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching brand by ID:', error)
        return null
      }

      return brand as Brand
    } catch (error) {
      console.error('Error in getBrandById:', error)
      return null
    }
  }

  /**
   * Crear una nueva marca
   */
  static async createBrand(brandData: CreateBrandData): Promise<Brand | null> {
    try {
      const { data: brand, error } = await this.supabase
        .from('brands')
        .insert([brandData])
        .select()
        .single()

      if (error) {
        console.error('Error creating brand:', error)
        return null
      }

      return brand as Brand
    } catch (error) {
      console.error('Error in createBrand:', error)
      return null
    }
  }

  /**
   * Actualizar una marca
   */
  static async updateBrand(id: string, brandData: UpdateBrandData): Promise<Brand | null> {
    try {
      const { data: brand, error } = await this.supabase
        .from('brands')
        .update({
          ...brandData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating brand:', error)
        return null
      }

      return brand as Brand
    } catch (error) {
      console.error('Error in updateBrand:', error)
      return null
    }
  }

  /**
   * Eliminar una marca (soft delete)
   */
  static async deleteBrand(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('brands')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error deleting brand:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteBrand:', error)
      return false
    }
  }

  /**
   * Generar slug a partir del nombre
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno solo
      .replace(/^-|-$/g, '') // Quitar guiones al inicio y final
  }

  /**
   * Verificar si un slug está disponible
   */
  static async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('brands')
        .select('id')
        .eq('slug', slug)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query.single()

      if (error && error.code === 'PGRST116') {
        // No encontrado, slug disponible
        return true
      }

      // Si hay datos, el slug no está disponible
      return !data
    } catch (error) {
      console.error('Error checking slug availability:', error)
      return false
    }
  }

  /**
   * Obtener marcas populares (con más productos)
   */
  static async getPopularBrands(limit: number = 8): Promise<BrandData[]> {
    try {
      const { data: brands, error } = await this.supabase
        .from('brands')
        .select(`
          id,
          name,
          slug,
          description,
          logo_url,
          website,
          is_active,
          created_at,
          updated_at,
          products!inner(id)
        `)
        .eq('is_active', true)
        .limit(limit)

      if (error) {
        console.error('Error fetching popular brands:', error)
        return []
      }

      // Contar productos y ordenar
      const brandsWithCounts = brands?.map(brand => ({
        ...brand,
        product_count: brand.products?.length || 0
      })).sort((a, b) => (b.product_count || 0) - (a.product_count || 0))

      return brandsWithCounts || []
    } catch (error) {
      console.error('Error in getPopularBrands:', error)
      return []
    }
  }
}