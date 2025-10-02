import { supabase } from './supabase'
import type { 
  Product, 
  ProductWithVariants, 
  ProductCardData, 
  ProductFilters, 
  ProductSort, 
  ProductListResponse,
  ProductVariant,
  RolePrice,
  Cart,
  CartItem,
  Category,
  ProductReview
} from '../types/products'

export class ProductService {
  // Verificar si hay productos disponibles para ciertos filtros (optimización)
  static async hasProducts(filters?: Partial<ProductFilters>): Promise<boolean> {
    try {
      let query = supabase
        .from('products')
        .select('id')
        .eq('is_active', true)
        .limit(1)

      // Aplicar filtros básicos
      if (filters?.category) {
        query = query.eq('category_id', filters.category)
      }
      
      if (filters?.is_on_sale) {
        query = query.eq('is_on_sale', true)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Error in hasProducts:', error)
        return true // En caso de error, asumir que sí hay productos para hacer la carga normal
      }
      
      return (data && data.length > 0)
    } catch (error) {
      console.error('Error checking if products exist:', error)
      return true // En caso de error, asumir que sí hay productos
    }
  }

  // Asegurar que hay datos de prueba
  static async ensureTestProducts(): Promise<void> {
    try {
      // Verificar si existen productos
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id')
        .limit(1)

      if (!existingProducts || existingProducts.length === 0) {
        console.log('🆕 Creating test products for catalog...')
        
        // Crear algunos productos de ejemplo
        const testProducts = [
          {
            slug: 'termostato-digital-wifi',
            title: 'Termostato Digital WiFi Inteligente',
            short_description: 'Control remoto de temperatura con conectividad WiFi y programación semanal',
            description: 'Termostato inteligente con pantalla táctil y control remoto mediante app móvil.',
            is_new: true,
            is_on_sale: false
          },
          {
            slug: 'kit-suelo-radiante-basico',
            title: 'Kit Suelo Radiante Básico 50m²',
            short_description: 'Kit completo para instalación de suelo radiante en espacios de hasta 50m²',
            description: 'Kit básico que incluye tubería, colector y accesorios para instalación completa.',
            is_new: false,
            is_on_sale: true
          },
          {
            slug: 'bomba-circulacion-alta-eficiencia',
            title: 'Bomba de Circulación Alta Eficiencia',
            short_description: 'Bomba de circulación de bajo consumo para sistemas de calefacción',
            description: 'Bomba de circulación de alta eficiencia energética con control electrónico.',
            is_new: false,
            is_on_sale: false
          }
        ]

        for (const product of testProducts) {
          const { data: newProduct, error } = await supabase
            .from('products')
            .insert(product)
            .select()
            .single()

          if (!error && newProduct) {
            // Crear variante para cada producto
            await supabase
              .from('product_variants')
              .insert({
                product_id: newProduct.id,
                sku: `SKU-${product.slug.toUpperCase()}`,
                title: 'Modelo Estándar',
                price_public_cents: Math.floor(Math.random() * 50000) + 10000, // Precio aleatorio entre 100-500€
                stock: Math.floor(Math.random() * 20) + 5 // Stock aleatorio entre 5-25
              })
          }
        }
        
        console.log('✅ Test products created successfully')
      }
    } catch (error) {
      console.error('Error ensuring test products:', error)
    }
  }

  // Obtener lista de productos con filtros
  static async getProducts(
    filters: ProductFilters = {},
    sort: ProductSort = { field: 'created_at', direction: 'desc' },
    page: number = 1,
    perPage: number = 12
  ): Promise<ProductListResponse | null> {
    try {
      // Debug log para desarrollo
      console.log(`🔍 ProductService: Consultando productos...`)
      
      console.log('🔧 ProductService: Building query with filters:', filters)
      console.log('🔧 ProductService: Sort:', sort)

      let query = supabase
        .from('products')
        .select(`
          id,
          slug,
          title,
          short_description,
          is_new,
          is_on_sale,
          product_images (
            url,
            alt,
            position
          ),
          product_variants (
            id,
            price_public_cents,
            stock
          ),
          product_categories (
            category_id
          )
        `, { count: 'exact' })

      // Aplicar filtros
      if (filters.search) {
        console.log('🔍 Applying search filter:', filters.search)
        query = query.ilike('title', `%${filters.search}%`)
      }

      // Filtro por categoría (individual o múltiple)
      const categoriesToFilter = filters.category ? [filters.category] : filters.categories
      if (categoriesToFilter && categoriesToFilter.length > 0) {
        console.log('🔍 Applying category filter:', categoriesToFilter)
        // Usamos una subconsulta para filtrar por categorías
        const { data: productIds } = await supabase
          .from('product_categories')
          .select('product_id')
          .in('category_id', categoriesToFilter)
        
        if (productIds && productIds.length > 0) {
          const ids = productIds.map((item: any) => item.product_id)
          query = query.in('id', ids)
        } else {
          // No hay productos con estas categorías, devolver resultado vacío
          return {
            products: [],
            total: 0,
            page,
            per_page: perPage,
            total_pages: 0
          }
        }
      }

      if (filters.is_new) {
        console.log('🔍 Applying new filter')
        query = query.eq('is_new', true)
      }

      if (filters.is_on_sale) {
        console.log('🔍 Applying sale filter')
        query = query.eq('is_on_sale', true)
      }

      if (filters.min_price) {
        console.log('🔍 Applying min price filter:', filters.min_price)
        query = query.gte('product_variants.price_public_cents', filters.min_price * 100)
      }

      if (filters.max_price) {
        console.log('🔍 Applying max price filter:', filters.max_price)
        query = query.lte('product_variants.price_public_cents', filters.max_price * 100)
      }

      if (filters.in_stock_only) {
        console.log('🔍 Applying stock filter')
        query = query.gt('product_variants.stock', 0)
      }

      // Aplicar ordenamiento
      const orderColumn = sort.field === 'price' ? 'product_variants.price_public_cents' : 
                         sort.field === 'title' ? 'title' :
                         sort.field === 'stock' ? 'product_variants.stock' : 'created_at'
      
      console.log('🔍 Applying sort:', orderColumn, sort.direction)
      query = query.order(orderColumn, { ascending: sort.direction === 'asc' })

      // Aplicar paginación
      const from = (page - 1) * perPage
      const to = from + perPage - 1
      console.log('🔍 Applying pagination:', { from, to, page, perPage })
      query = query.range(from, to)

      console.log('🚀 Executing query...')
      const { data, error, count } = await query

      console.log('📊 Query result:', { data: data?.length, error, count })

      if (error) {
        console.error('❌ ProductService error:', error)
        return null
      }
      
      console.log(`📊 ProductService: ${data?.length || 0} productos encontrados`)

      // Transformar datos para ProductCardData
      const products: ProductCardData[] = (data || []).map((product: any) => ({
        id: product.id,
        slug: product.slug,
        title: product.title,
        short_description: product.short_description,
        is_new: product.is_new,
        is_on_sale: product.is_on_sale,
        image: product.product_images?.[0],
        price_cents: Math.min(...product.product_variants.map((v: any) => v.price_public_cents)),
        in_stock: product.product_variants.some((v: any) => v.stock > 0)
      }))

      return {
        products,
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: Math.ceil((count || 0) / perPage)
      }
    } catch (error) {
      console.error('❌ [ProductService] Error in getProducts:', error)
      return null
    }
  }

  // Obtener producto individual con todas sus relaciones
  static async getProductBySlug(slug: string, userRole?: string): Promise<ProductWithVariants | null> {
    try {
      console.log(`🔍 ProductService: Loading product with slug: ${slug}`)
      console.log(`👤 User role: ${userRole || 'no role'}`)
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (
            *,
            role_prices (
              *,
              customer_roles (*)
            ),
            variant_images (
              *
            )
          ),
          product_images (
            *
          ),
          product_categories (
            categories (*)
          ),
          product_resources (
            *
          ),
          product_reviews (
            *,
            clients (
              first_name,
              last_name
            )
          )
        `)
        .eq('slug', slug)
        .order('position', { foreignTable: 'product_images', ascending: true })
        .order('position', { foreignTable: 'product_variants.variant_images', ascending: true })
        .order('created_at', { foreignTable: 'product_variants', ascending: true })
        .single()

      if (error) {
        console.error('❌ Error fetching product:', error)
        return null
      }

      if (!data) {
        console.log('❌ Product not found')
        return null
      }

      console.log(`📦 Product loaded: ${data.title}`)
      console.log(`🔧 Variants found: ${data.product_variants?.length || 0}`)
      console.log(`🖼️ Images found: ${data.product_images?.length || 0}`)

      // Procesar role prices y mantener estructura completa
      if (data.product_variants) {
        data.product_variants = data.product_variants.map((variant: any) => {
          // Transformar role_prices para que tenga la estructura correcta
          const rolePrices = variant.role_prices?.map((rp: any) => ({
            id: rp.id,
            variant_id: rp.variant_id,
            role_id: rp.role_id,
            price_cents: rp.price_cents,
            role: rp.customer_roles
          })) || []
          
          // Encontrar precio específico para el usuario actual
          const userRolePrice = rolePrices.find((rp: any) => 
            rp.role?.name === userRole
          )
          
          return {
            ...variant,
            role_prices: rolePrices,
            role_price_cents: userRolePrice?.price_cents,
            images: variant.variant_images || []
          }
        })
      }

      const processedData = {
        ...data,
        variants: data.product_variants || [],
        images: data.product_images || [],
        categories: data.product_categories?.map((pc: any) => pc.categories) || [],
        resources: data.product_resources || [],
        reviews: data.product_reviews || []
      }

      console.log('✅ Product data processed successfully')
      return processedData
      
    } catch (error) {
      console.error('❌ Error in getProductBySlug:', error)
      return null
    }
  }

  // Obtener categorías con relaciones padre-hijo
  static async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          parent_id,
          created_at,
          updated_at
        `)
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getCategories:', error)
      return []
    }
  }

  // Obtener precio específico para un rol
  static async getRolePrice(variantId: string, roleId: number): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('role_prices')
        .select('price_cents')
        .eq('variant_id', variantId)
        .eq('role_id', roleId)
        .single()

      if (error) return null
      return data.price_cents
    } catch (error) {
      return null
    }
  }

  // Añadir producto al carrito
  static async addToCart(
    clientId: string, 
    variantId: string, 
    quantity: number = 1
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Primero obtener o crear el carrito del usuario
      let { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('client_id', clientId)
        .single()

      if (cartError && cartError.code === 'PGRST116') {
        // No existe carrito, crear uno nuevo
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ client_id: clientId })
          .select('id')
          .single()

        if (createError || !newCart) {
          return { success: false, error: createError?.message || 'Error creating cart' }
        }
        cart = newCart
      } else if (cartError || !cart) {
        return { success: false, error: cartError?.message || 'Error accessing cart' }
      }

      // Obtener precio actual de la variante
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('price_public_cents')
        .eq('id', variantId)
        .single()

      if (variantError) {
        return { success: false, error: 'Variante no encontrada' }
      }

      // Verificar si el producto ya está en el carrito
      const { data: existingItem, error: existingError } = await supabase
        .from('cart_items')
        .select('id, qty')
        .eq('cart_id', cart.id)
        .eq('variant_id', variantId)
        .single()

      if (existingItem) {
        // Actualizar cantidad
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ qty: existingItem.qty + quantity })
          .eq('id', existingItem.id)

        if (updateError) {
          return { success: false, error: updateError.message }
        }
      } else {
        // Añadir nuevo item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            variant_id: variantId,
            qty: quantity,
            price_at_addition_cents: variant.price_public_cents
          })

        if (insertError) {
          return { success: false, error: insertError.message }
        }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Obtener carrito del usuario
  static async getCart(clientId: string): Promise<Cart | null> {
    try {
      const { data, error } = await supabase
        .from('carts')
        .select(`
          *,
          cart_items (
            *,
            product_variants (
              *,
              products (
                title,
                slug
              ),
              product_images (
                url,
                alt
              )
            )
          )
        `)
        .eq('client_id', clientId)
        .single()

      if (error) {
        console.error('Error fetching cart:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getCart:', error)
      return null
    }
  }

  // Actualizar cantidad en carrito
  static async updateCartItemQuantity(
    itemId: string, 
    quantity: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (quantity <= 0) {
        // Eliminar item si cantidad es 0 o menor
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId)

        if (error) {
          return { success: false, error: error.message }
        }
      } else {
        // Actualizar cantidad
        const { error } = await supabase
          .from('cart_items')
          .update({ qty: quantity })
          .eq('id', itemId)

        if (error) {
          return { success: false, error: error.message }
        }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Añadir reseña
  static async addReview(
    productId: string,
    clientId: string,
    rating: number,
    comment?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          client_id: clientId,
          rating,
          comment
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}