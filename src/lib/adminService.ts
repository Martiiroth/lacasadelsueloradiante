import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'
import { StorageService } from './storageService'
import { config } from 'dotenv'
import path from 'path'

// Cargar variables de entorno explícitamente (solo en el servidor)
if (typeof window === 'undefined') {
  const envPath = path.resolve(process.cwd(), '.env.local')
  console.log('🔍 Loading .env.local from:', envPath)
  const result = config({ path: envPath })
  console.log('📄 Dotenv result:', result.error ? result.error.message : 'Success')
  console.log('🔑 Environment variables after dotenv:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Available' : 'Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Available' : 'Missing')
}

// Cliente de Supabase con permisos de servicio para operaciones de admin
let supabaseAdmin: any = null

// Función para obtener el cliente admin (inicialización perezosa)
function getSupabaseAdmin() {
  // Solo funciona en el servidor
  if (typeof window !== 'undefined') {
    console.warn('⚠️ Admin client not available on client side')
    return null
  }

  if (supabaseAdmin) {
    return supabaseAdmin
  }

  console.log('🔍 Initializing admin client - checking environment variables:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Available' : '❌ Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Available' : '❌ Missing')
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      console.log('✅ Admin Supabase client initialized successfully')
      return supabaseAdmin
    } catch (error) {
      console.error('❌ Error creating admin Supabase client:', error)
      return null
    }
  } else {
    console.warn('⚠️ Admin Supabase client NOT initialized - missing environment variables')
    return null
  }
}
import type { ImageData } from '@/components/admin/ImageUpload'
import type { 
  AdminClient, 
  AdminOrder, 
  AdminStats, 
  AdminFilters,
  AdminDashboardData,
  UpdateClientAdminData,
  UpdateOrderStatusData,
  RevenueMetrics,
  ClientMetrics,
  AdminProduct,
  AdminProductVariant,
  CreateProductData,
  UpdateProductData,
  UpdateVariantData,
  AdminCategory,
  CreateCategoryData,
  UpdateCategoryData,
  ResourceData,
  AdminCoupon,
  CreateCouponData,
  UpdateCouponData
} from '../types/admin'

export class AdminService {
  // === ESTADÍSTICAS GENERALES ===
  
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const [
        clientsData,
        ordersData,
        revenueData
      ] = await Promise.all([
        // Clientes
        supabase.from('clients').select('id, is_active, created_at'),
        // Pedidos
        supabase.from('orders').select('id, status, total_cents, created_at'),
        // Revenue query específico si es necesario
        supabase.from('orders').select('total_cents').eq('status', 'delivered')
      ])

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Calcular estadísticas de clientes
      const totalClients = clientsData.data?.length || 0
      const activeClients = clientsData.data?.filter(c => c.is_active).length || 0
      const newClientsThisMonth = clientsData.data?.filter(c => 
        new Date(c.created_at) >= startOfMonth
      ).length || 0

      // Calcular estadísticas de pedidos
      const totalOrders = ordersData.data?.length || 0
      const pendingOrders = ordersData.data?.filter(o => 
        ['pending', 'confirmed', 'processing'].includes(o.status)
      ).length || 0
      const completedOrders = ordersData.data?.filter(o => 
        o.status === 'delivered'
      ).length || 0
      const ordersThisMonth = ordersData.data?.filter(o => 
        new Date(o.created_at) >= startOfMonth
      ).length || 0

      // Calcular estadísticas financieras
      const totalRevenue = revenueData.data?.reduce((sum, order) => 
        sum + (order.total_cents || 0), 0
      ) || 0
      const revenueThisMonth = ordersData.data?.filter(o => 
        new Date(o.created_at) >= startOfMonth && o.status === 'delivered'
      ).reduce((sum, order) => sum + (order.total_cents || 0), 0) || 0
      
      const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0

      return {
        total_clients: totalClients,
        active_clients: activeClients,
        new_clients_this_month: newClientsThisMonth,
        total_orders: totalOrders,
        pending_orders: pendingOrders,
        completed_orders: completedOrders,
        orders_this_month: ordersThisMonth,
        total_revenue_cents: totalRevenue,
        revenue_this_month_cents: revenueThisMonth,
        average_order_value_cents: averageOrderValue
      }
    } catch (error) {
      console.error('Error getting admin stats:', error)
      return {
        total_clients: 0,
        active_clients: 0,
        new_clients_this_month: 0,
        total_orders: 0,
        pending_orders: 0,
        completed_orders: 0,
        orders_this_month: 0,
        total_revenue_cents: 0,
        revenue_this_month_cents: 0,
        average_order_value_cents: 0
      }
    }
  }

  // === GESTIÓN DE CLIENTES ===
  
  static async getAllClients(
    filters?: AdminFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<AdminClient[]> {
    try {
      let query = supabase
        .from('clients')
        .select(`
          *,
          role:customer_roles (
            id,
            name,
            description
          )
        `)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters?.client_status && filters.client_status.length > 0) {
        if (filters.client_status.includes('active')) {
          query = query.eq('is_active', true)
        } else if (filters.client_status.includes('inactive')) {
          query = query.eq('is_active', false)
        }
      }

      if (filters?.client_search) {
        query = query.or(`
          first_name.ilike.%${filters.client_search}%,
          last_name.ilike.%${filters.client_search}%,
          email.ilike.%${filters.client_search}%,
          company_name.ilike.%${filters.client_search}%
        `)
      }

      if (filters?.client_date_from) {
        query = query.gte('created_at', filters.client_date_from)
      }

      if (filters?.client_date_to) {
        query = query.lte('created_at', filters.client_date_to)
      }

      // Paginación
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching clients:', error)
        return []
      }

      // Enriquecer con estadísticas básicas
      const clientsWithStats = await Promise.all(
        (data || []).map(async (client) => {
          const stats = await this.getClientStats(client.id)
          return {
            ...client,
            stats
          }
        })
      )

      return clientsWithStats
    } catch (error) {
      console.error('Error in getAllClients:', error)
      return []
    }
  }

  static async getClientStats(clientId: string) {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_cents, created_at')
        .eq('client_id', clientId)

      const totalOrders = orders?.length || 0
      const totalSpent = orders?.reduce((sum, order) => sum + (order.total_cents || 0), 0) || 0
      const lastOrderDate = orders && orders.length > 0 
        ? orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : undefined

      return {
        total_orders: totalOrders,
        total_spent_cents: totalSpent,
        last_order_date: lastOrderDate
      }
    } catch (error) {
      console.error('Error getting client stats:', error)
      return {
        total_orders: 0,
        total_spent_cents: 0
      }
    }
  }

  static async updateClient(clientId: string, data: UpdateClientAdminData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)

      if (error) {
        console.error('Error updating client:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateClient:', error)
      return false
    }
  }

  static async createClient(data: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    nif_cif?: string
    is_active?: boolean
    region?: string
    city?: string
    address_line1?: string
    address_line2?: string
    postal_code?: string
    activity?: string
    company_name?: string
    company_position?: string
  }): Promise<boolean> {
    try {
      console.log('Creating client with email:', data.email)
      
      let authData, authError

      const adminClient = getSupabaseAdmin()
      if (adminClient) {
        // Use admin client if available (preferred method)
        console.log('Using admin client to create user')
        const result = await adminClient.auth.admin.createUser({
          email: data.email,
          password: 'Lacasadelsueloradiante2025',
          email_confirm: true, // Auto-confirm the email
          user_metadata: {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone
          }
        })
        authData = result.data
        authError = result.error
      } else {
        // Si no hay service role key, no podemos crear usuarios sin afectar la sesión actual
        console.error('Service role key is required to create users from admin panel')
        throw new Error('⚠️ SUPABASE_SERVICE_ROLE_KEY es requerida para crear usuarios desde el panel de administración. Esto previene cerrar la sesión del administrador actual.')
      }

      if (authError || !authData.user) {
        console.error('Error creating user account:', authError)
        throw new Error(authError?.message || 'Failed to create user account')
      }

      console.log('User account created successfully:', authData.user.id)

      // Get default role (guest) first
      const { data: defaultRole, error: roleError } = await supabase
        .from('customer_roles')
        .select('id')
        .eq('name', 'guest')
        .single()

      if (roleError) {
        console.warn('Could not find default role "guest":', roleError)
      }

      // Then create the client record with the user ID and default role
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          auth_uid: authData.user.id, // Reference to auth user
          role_id: defaultRole?.id || null, // Assign default role if found
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          nif_cif: data.nif_cif,
          region: data.region,
          city: data.city,
          address_line1: data.address_line1,
          address_line2: data.address_line2,
          postal_code: data.postal_code,
          activity: data.activity,
          company_name: data.company_name,
          company_position: data.company_position,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (clientError) {
        console.error('Error creating client record:', clientError)
        
        // Rollback: Delete the created auth user
        try {
          const adminClient = getSupabaseAdmin()
          if (adminClient) {
            await adminClient.auth.admin.deleteUser(authData.user.id)
            console.log('Rolled back user creation using admin client')
          } else {
            console.log('Cannot rollback user creation - service role key not configured')
          }
        } catch (rollbackError) {
          console.error('Error rolling back user creation:', rollbackError)
        }
        
        throw new Error(clientError.message || 'Failed to create client record')
      }

      console.log('Client record created successfully with role:', defaultRole?.id || 'none')

      console.log('Client creation completed successfully')
      return true
    } catch (error) {
      console.error('Error in createClient:', error)
      throw error // Re-throw to let the calling component handle the error
    }
  }

  static async deleteClient(clientId: string): Promise<boolean> {
    try {
      // First check if the client has any orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('client_id', clientId)

      if (ordersError) {
        console.error('Error checking client orders:', ordersError)
        return false
      }

      if (orders && orders.length > 0) {
        // If client has orders, we should not delete them
        // Instead, we could deactivate them or show an error
        console.error('Cannot delete client with existing orders')
        throw new Error('No se puede eliminar un cliente que tiene pedidos asociados')
      }

      // Delete the client
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) {
        console.error('Error deleting client:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteClient:', error)
      throw error // Re-throw to let the calling component handle the error message
    }
  }

  // === GESTIÓN DE PEDIDOS ===
  
  static async getAllOrders(
    filters?: AdminFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<AdminOrder[]> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          client:clients (
            id,
            first_name,
            last_name,
            email
          ),
          order_items (
            id,
            qty,
            price_cents,
            variant:product_variants (
              product:products (
                title
              )
            )
          ),
          invoice:invoices (
            id,
            invoice_number,
            prefix,
            suffix,
            status
          )
        `)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters?.order_status && filters.order_status.length > 0) {
        query = query.in('status', filters.order_status)
      }

      if (filters?.order_date_from) {
        query = query.gte('created_at', filters.order_date_from)
      }

      if (filters?.order_date_to) {
        query = query.lte('created_at', filters.order_date_to)
      }

      if (filters?.order_min_amount) {
        query = query.gte('total_cents', filters.order_min_amount * 100)
      }

      if (filters?.order_max_amount) {
        query = query.lte('total_cents', filters.order_max_amount * 100)
      }

      // Paginación
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching orders:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllOrders:', error)
      return []
    }
  }

  static async updateOrderStatus(orderId: string, data: UpdateOrderStatusData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: data.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) {
        console.error('Error updating order status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateOrderStatus:', error)
      return false
    }
  }

  static async deleteOrder(orderId: string): Promise<boolean> {
    try {
      // First delete order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId)

      if (itemsError) {
        console.error('Error deleting order items:', itemsError)
        return false
      }

      // Then delete invoice if exists
      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('order_id', orderId)

      if (invoiceError) {
        console.error('Error deleting invoice:', invoiceError)
        // Continue anyway, invoice might not exist
      }

      // Finally delete the order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (error) {
        console.error('Error deleting order:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteOrder:', error)
      return false
    }
  }

  static async createOrder(orderData: {
    client_id: string
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
    total_cents: number
    billing_address: any
    shipping_address: any
    items: Array<{
      product_title: string
      qty: number
      price_cents: number
    }>
  }): Promise<string | null> {
    try {
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: orderData.client_id,
          status: orderData.status,
          total_cents: orderData.total_cents,
          billing_address: orderData.billing_address,
          shipping_address: orderData.shipping_address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (orderError || !order) {
        console.error('Error creating order:', orderError)
        return null
      }

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        qty: item.qty,
        price_cents: item.price_cents,
        // Note: In a real implementation, you'd need to handle product variants
        // For now, we'll store the product title in a way that works
        variant_id: null,
        created_at: new Date().toISOString()
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Error creating order items:', itemsError)
        // Rollback - delete the order
        await supabase.from('orders').delete().eq('id', order.id)
        return null
      }

      return order.id
    } catch (error) {
      console.error('Error in createOrder:', error)
      return null
    }
  }

  // === GESTIÓN DE PRODUCTOS ===
  
  static async getAllProducts(
    filters?: AdminFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<AdminProduct[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          variants:product_variants (
            id,
            title,
            sku,
            price_public_cents,
            stock,
            weight_grams,
            dimensions,
            created_at,
            updated_at
          ),
          images:product_images (
            id,
            url,
            alt,
            position,
            created_at
          ),
          categories:product_categories!inner (
            category:categories (
              id,
              name,
              slug
            )
          )
        `)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters?.product_search) {
        query = query.or(`
          title.ilike.%${filters.product_search}%,
          description.ilike.%${filters.product_search}%,
          short_description.ilike.%${filters.product_search}%
        `)
      }

      // Paginación
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching products:', error)
        return []
      }

      // Enriquecer con estadísticas
      const productsWithStats = await Promise.all(
        (data || []).map(async (product) => {
          const stats = await this.getProductStats(product.id)
          return {
            ...product,
            stats
          }
        })
      )

      return productsWithStats
    } catch (error) {
      console.error('Error in getAllProducts:', error)
      return []
    }
  }

  static async getProductStats(productId: string) {
    try {
      const { data: variants } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('product_id', productId)

      const totalVariants = variants?.length || 0
      const totalStock = variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0

      // Get sales data through order_items -> product_variants
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          qty, 
          price_cents, 
          variant:product_variants!inner(
            product_id
          )
        `)
        .eq('variant.product_id', productId)

      const totalSold = orderItems?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0
      const revenueCents = orderItems?.reduce((sum, item) => sum + ((item.qty || 0) * (item.price_cents || 0)), 0) || 0

      return {
        total_variants: totalVariants,
        total_stock: totalStock,
        total_sold: totalSold,
        revenue_cents: revenueCents
      }
    } catch (error) {
      console.error('Error getting product stats:', error)
      return {
        total_variants: 0,
        total_stock: 0,
        total_sold: 0,
        revenue_cents: 0
      }
    }
  }

  static async createProduct(data: CreateProductData): Promise<string | null> {
    try {
      console.log('Creating product:', data.title)

      // Create the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          slug: data.slug,
          title: data.title,
          short_description: data.short_description,
          description: data.description,
          is_new: data.is_new ?? false,
          is_on_sale: data.is_on_sale ?? false,
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (productError || !product) {
        console.error('Error creating product:', productError)
        throw new Error(productError?.message || 'Failed to create product')
      }

      console.log('Product created successfully:', product.id)

      // Create variants
      if (data.variants && data.variants.length > 0) {
        const variants = data.variants.map(variant => ({
          product_id: product.id,
          sku: variant.sku,
          title: variant.title,
          price_public_cents: variant.price_public_cents,
          stock: variant.stock || 0,
          weight_grams: variant.weight_grams,
          dimensions: variant.dimensions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { data: createdVariants, error: variantsError } = await supabase
          .from('product_variants')
          .insert(variants)
          .select('id, title')

        if (variantsError) {
          console.error('Error creating variants:', variantsError)
          // Rollback - delete the product
          await supabase.from('products').delete().eq('id', product.id)
          throw new Error('Failed to create product variants')
        }

        console.log(`Created ${variants.length} variants`)

        // Create variant images and role prices if any variants have them
        if (createdVariants && data.variants) {
          for (let i = 0; i < data.variants.length; i++) {
            const variantData = data.variants[i]
            const createdVariant = createdVariants[i]
            
            if (!createdVariant) continue

            // Create variant images
            if (variantData.images && variantData.images.length > 0) {
              const variantImages = variantData.images.map((imageItem, index) => ({
                variant_id: createdVariant.id,
                url: imageItem.url,
                alt: imageItem.alt || '',
                position: index
              }))

              const { error: variantImagesError } = await supabase
                .from('variant_images')
                .insert(variantImages)

              if (variantImagesError) {
                console.warn(`Error creating images for variant ${createdVariant.id}:`, variantImagesError)
              } else {
                console.log(`Created ${variantImages.length} images for variant ${createdVariant.id}`)
              }
            }

            // Create role prices
            if (variantData.role_prices && variantData.role_prices.length > 0) {
              // Get role IDs first
              const { data: roles } = await supabase
                .from('customer_roles')
                .select('id, name')

              const rolePriceData = variantData.role_prices.map(rp => {
                const role = roles?.find(r => r.name === rp.role_name)
                return {
                  variant_id: createdVariant.id,
                  role_id: role?.id,
                  price_cents: rp.price_cents
                }
              }).filter(rp => rp.role_id) // Only include valid roles

              if (rolePriceData.length > 0) {
                const { error: rolePricesError } = await supabase
                  .from('role_prices')
                  .insert(rolePriceData)

                if (rolePricesError) {
                  console.warn(`Error creating role prices for variant ${createdVariant.id}:`, rolePricesError)
                } else {
                  console.log(`Created ${rolePriceData.length} role prices for variant ${createdVariant.id}`)
                }
              }
            }
          }
        }
      }

      // Create categories relationships
      if (data.categories && data.categories.length > 0) {
        const categoryRelations = data.categories.map(categoryId => ({
          product_id: product.id,
          category_id: categoryId
        }))

        const { error: categoriesError } = await supabase
          .from('product_categories')
          .insert(categoryRelations)

        if (categoriesError) {
          console.warn('Error creating category relations:', categoriesError)
          // Don't fail the entire operation for categories
        } else {
          console.log(`Created ${categoryRelations.length} category relations`)
        }
      }

      // Create images
      if (data.images && data.images.length > 0) {
        const images = data.images.map(imageItem => ({
          product_id: product.id,
          url: imageItem.url,
          alt: imageItem.alt,
          position: imageItem.position,
          created_at: new Date().toISOString()
        }))

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(images)

        if (imagesError) {
          console.warn('Error creating images:', imagesError)
          // Don't fail the entire operation for images
        } else {
          console.log(`Created ${images.length} images`)
        }
      }

      // Create resources
      if (data.resources && data.resources.length > 0) {
        const resources = data.resources.map(resource => ({
          product_id: product.id,
          type: resource.type,
          label: resource.name,
          url: resource.url,
          created_at: new Date().toISOString()
        }))

        const { error: resourcesError } = await supabase
          .from('product_resources')
          .insert(resources)

        if (resourcesError) {
          console.warn('Error creating resources:', resourcesError)
          // Don't fail the entire operation for resources
        } else {
          console.log(`Created ${resources.length} resources`)
        }
      }

      console.log('Product creation completed successfully')
      return product.id
    } catch (error) {
      console.error('Error in createProduct:', error)
      throw error
    }
  }

  static async updateProduct(productId: string, data: UpdateProductData): Promise<boolean> {
    try {
      // Exclude resources from product update as they're handled separately
      const { resources, ...productData } = data
      
      const { error } = await supabase
        .from('products')
        .update({
          ...productData,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) {
        console.error('Error updating product:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateProduct:', error)
      return false
    }
  }

  static async updateProductVariant(variantId: string, data: UpdateVariantData): Promise<boolean> {
    try {
      // Exclude images and role_prices fields from variant update as they're handled separately
      const { images, role_prices, ...variantData } = data
      
      const { error } = await supabase
        .from('product_variants')
        .update({
          ...variantData,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId)

      if (error) {
        console.error('Error updating product variant:', error)
        return false
      }

      // Handle role prices if provided
      if (role_prices && role_prices.length > 0) {
        // First, delete existing role prices for this variant
        const { error: deleteError } = await supabase
          .from('role_prices')
          .delete()
          .eq('variant_id', variantId)

        if (deleteError) {
          console.error('Error deleting existing role prices:', deleteError)
          return false
        }

        // Get role IDs first
        const { data: roles, error: rolesError } = await supabase
          .from('customer_roles')
          .select('id, name')

        if (rolesError) {
          console.error('Error fetching customer roles:', rolesError)
          return false
        }

        // Insert new role prices
        const rolePricesData = role_prices.map(rp => {
          const role = roles?.find(r => r.name === rp.role_name)
          return {
            variant_id: variantId,
            role_id: role?.id,
            price_cents: rp.price_cents
          }
        }).filter(rp => rp.role_id) // Only include valid roles

        if (rolePricesData.length > 0) {
          const { error: insertError } = await supabase
            .from('role_prices')
            .insert(rolePricesData)

          if (insertError) {
            console.error('Error inserting role prices:', insertError)
            return false
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error in updateProductVariant:', error)
      return false
    }
  }

  static async createProductVariant(productId: string, data: Omit<UpdateVariantData, 'id'>): Promise<string | null> {
    try {
      // Exclude images and role_prices fields from variant creation as they're handled separately
      const { images, role_prices, ...variantData } = data
      
      const { data: variant, error } = await supabase
        .from('product_variants')
        .insert({
          product_id: productId,
          ...variantData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error || !variant) {
        console.error('Error creating product variant:', error)
        return null
      }

      // Handle role prices if provided
      if (role_prices && role_prices.length > 0) {
        // Get role IDs first
        const { data: roles, error: rolesError } = await supabase
          .from('customer_roles')
          .select('id, name')

        if (rolesError) {
          console.error('Error fetching customer roles:', rolesError)
          return null
        }

        const rolePricesData = role_prices.map(rp => {
          const role = roles?.find(r => r.name === rp.role_name)
          return {
            variant_id: variant.id,
            role_id: role?.id,
            price_cents: rp.price_cents
          }
        }).filter(rp => rp.role_id) // Only include valid roles

        if (rolePricesData.length > 0) {
          const { error: insertError } = await supabase
            .from('role_prices')
            .insert(rolePricesData)

          if (insertError) {
            console.error('Error inserting role prices:', insertError)
            return null
          }
        }
      }

      return variant.id
    } catch (error) {
      console.error('Error in createProductVariant:', error)
      return null
    }
  }

  static async deleteProductVariant(variantId: string): Promise<boolean> {
    try {
      // Check if variant has any orders
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('id')
        .eq('variant_id', variantId)

      if (orderItemsError) {
        console.error('Error checking variant orders:', orderItemsError)
        return false
      }

      if (orderItems && orderItems.length > 0) {
        throw new Error('No se puede eliminar una variante que tiene pedidos asociados')
      }

      // Delete role prices first
      const { error: rolePricesError } = await supabase
        .from('role_prices')
        .delete()
        .eq('variant_id', variantId)

      if (rolePricesError) {
        console.error('Error deleting variant role prices:', rolePricesError)
        return false
      }

      // Delete variant images
      const { error: imagesError } = await supabase
        .from('variant_images')
        .delete()
        .eq('variant_id', variantId)

      if (imagesError) {
        console.error('Error deleting variant images:', imagesError)
        return false
      }

      // Finally delete the variant
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId)

      if (error) {
        console.error('Error deleting product variant:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteProductVariant:', error)
      throw error
    }
  }

  static async updateProductImages(productId: string, images: ImageData[]): Promise<boolean> {
    try {
      console.log('updateProductImages called with:', { productId, imageCount: images.length })
      
      // Validate that the product exists
      const { data: productExists, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('id', productId)
        .single()

      if (productError || !productExists) {
        throw new Error(`Product with ID ${productId} not found`)
      }

      // Get existing images to clean up storage if needed
      const { data: existingImages } = await supabase
        .from('product_images')
        .select('url')
        .eq('product_id', productId)

      // Delete existing images from database
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId)

      if (deleteError) {
        console.error('Error deleting existing product images:', deleteError)
        throw new Error(`Error deleting existing images: ${deleteError.message}`)
      }

      console.log('Successfully deleted existing images from database')

      // Clean up old images from storage that are no longer being used
      if (existingImages && existingImages.length > 0) {
        const newImageUrls = images.map(img => img.url)
        const imagesToDelete = existingImages.filter(existing => 
          !newImageUrls.includes(existing.url) &&
          existing.url.includes('supabase') // Only delete Supabase storage URLs
        )

        for (const imageToDelete of imagesToDelete) {
          try {
            const path = StorageService.extractPathFromUrl(imageToDelete.url)
            if (path) {
              await StorageService.deleteFile(path)
              console.log('Deleted unused image from storage:', path)
            }
          } catch (storageError) {
            console.warn('Failed to delete image from storage:', imageToDelete.url, storageError)
            // Don't fail the entire operation for storage cleanup errors
          }
        }
      }

      // If no new images, we're done
      if (images.length === 0) {
        console.log('No new images to insert')
        return true
      }

      // Filter only images that are properly uploaded (have paths) or are valid URLs
      const validImages = images.filter(img => {
        // Accept images with storage paths (properly uploaded)
        if (img.path) return true
        
        // Accept valid HTTP/HTTPS URLs that are not blob URLs
        return img.url && 
               img.url.trim() !== '' && 
               (img.url.startsWith('http://') || img.url.startsWith('https://')) &&
               !img.url.startsWith('blob:')
      })
      
      console.log('Filtered images:', { original: images.length, valid: validImages.length })
      
      if (validImages.length === 0) {
        console.log('No valid images to insert - only temporary URLs found')
        return true
      }

      // Insert new images
      const imageData = validImages.map((img, index) => ({
        product_id: productId,
        url: img.url,
        alt: img.alt || '',
        position: index
      }))

      console.log('Inserting image data:', imageData)

      const { error: insertError } = await supabase
        .from('product_images')
        .insert(imageData)

      if (insertError) {
        console.error('Error inserting product images:', insertError)
        throw new Error(`Error inserting images: ${insertError.message}`)
      }

      console.log('Successfully inserted images')
      return true
    } catch (error) {
      console.error('Error in updateProductImages:', error)
      throw error
    }
  }

  static async updateProductResources(productId: string, resources: ResourceData[]): Promise<boolean> {
    try {
      console.log('updateProductResources called with:', { productId, resourceCount: resources.length })

      // Delete existing resources
      const { error: deleteError } = await supabase
        .from('product_resources')
        .delete()
        .eq('product_id', productId)

      if (deleteError) {
        console.error('Error deleting existing resources:', deleteError)
        throw deleteError
      }

      if (resources.length === 0) {
        console.log('No resources to insert')
        return true
      }

      // Insert new resources
      const resourceData = resources.map(resource => ({
        product_id: productId,
        type: resource.type,
        label: resource.name,
        url: resource.url
      }))

      const { error: insertError } = await supabase
        .from('product_resources')
        .insert(resourceData)

      if (insertError) {
        console.error('Error inserting resources:', insertError)
        throw insertError
      }

      console.log('Successfully inserted resources')
      return true
    } catch (error) {
      console.error('Error in updateProductResources:', error)
      throw error
    }
  }

  static async getProduct(productId: string): Promise<AdminProduct | null> {
    try {
      console.log('🔍 AdminService.getProduct called with productId:', productId)
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          variants:product_variants (
            id,
            sku,
            title,
            price_public_cents,
            stock,
            weight_grams,
            dimensions,
            created_at,
            updated_at
          ),
          images:product_images (
            id,
            url,
            alt,
            position,
            created_at
          ),
          resources:product_resources (
            id,
            type,
            label,
            url,
            created_at
          ),
          categories:product_categories (
            category:categories (
              id,
              name,
              slug
            )
          )
        `)
        .eq('id', productId)
        .single()

      console.log('📊 Query result:', { hasData: !!data, error, productId })

      if (error || !data) {
        console.error('❌ Error fetching product:', error)
        console.error('❌ Product ID searched:', productId)
        return null
      }

      console.log('✅ Product found:', data.title)

      // Enrich with statistics
      const stats = await this.getProductStats(data.id)
      
      return {
        ...data,
        stats
      }
    } catch (error) {
      console.error('Error in getProduct:', error)
      return null
    }
  }

  static async deleteProduct(productId: string): Promise<boolean> {
    try {
      // Check if product has any orders
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('id, variant:product_variants!inner(product_id)')
        .eq('variant.product_id', productId)

      if (orderItemsError) {
        console.error('Error checking product orders:', orderItemsError)
        return false
      }

      if (orderItems && orderItems.length > 0) {
        throw new Error('No se puede eliminar un producto que tiene pedidos asociados')
      }

      // Get images to delete from storage
      const { data: images } = await supabase
        .from('product_images')
        .select('url')
        .eq('product_id', productId)

      // Delete images from storage first
      if (images && images.length > 0) {
        for (const image of images) {
          try {
            if (image.url.includes('supabase')) { // Only delete Supabase storage URLs
              const path = StorageService.extractPathFromUrl(image.url)
              if (path) {
                await StorageService.deleteFile(path)
                console.log('Deleted image from storage:', path)
              }
            }
          } catch (storageError) {
            console.warn('Failed to delete image from storage:', image.url, storageError)
            // Continue with deletion even if some images fail to delete from storage
          }
        }
      }

      // Delete images from database
      const { error: imagesError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId)

      if (imagesError) {
        console.warn('Error deleting product images from database:', imagesError)
      }

      // Delete resources
      const { error: resourcesError } = await supabase
        .from('product_resources')
        .delete()
        .eq('product_id', productId)

      if (resourcesError) {
        console.warn('Error deleting product resources:', resourcesError)
      }

      // Delete category relations
      const { error: categoriesError } = await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', productId)

      if (categoriesError) {
        console.warn('Error deleting product category relations:', categoriesError)
      }

      // Delete variants
      const { error: variantsError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId)

      if (variantsError) {
        console.error('Error deleting product variants:', variantsError)
        return false
      }

      // Delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) {
        console.error('Error deleting product:', error)
        return false
      }

      console.log('Product deleted successfully with storage cleanup')
      return true
    } catch (error) {
      console.error('Error in deleteProduct:', error)
      throw error
    }
  }

  // === DASHBOARD DATA ===
  
  static async getAdminDashboard(): Promise<AdminDashboardData | null> {
    try {
      const [stats, recentOrders, recentClients] = await Promise.all([
        this.getAdminStats(),
        this.getAllOrders(undefined, 5),
        this.getAllClients(undefined, 5)
      ])

      // Top clients by revenue
      const topClients = recentClients
        .sort((a, b) => (b.stats?.total_spent_cents || 0) - (a.stats?.total_spent_cents || 0))
        .slice(0, 5)

      return {
        stats,
        recent_orders: recentOrders,
        recent_clients: recentClients,
        top_clients: topClients
      }
    } catch (error) {
      console.error('Error getting admin dashboard:', error)
      return null
    }
  }

  // === UTILIDADES ===
  
  static formatPrice(cents: number): string {
    return (cents / 100).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    })
  }

  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  static formatDateShort(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  static getOrderStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmado',
      'processing': 'Procesando',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    }
    
    return statusLabels[status] || status
  }

  static getOrderStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'pending': 'text-yellow-600 bg-yellow-50',
      'confirmed': 'text-blue-600 bg-blue-50',
      'processing': 'text-purple-600 bg-purple-50',
      'shipped': 'text-indigo-600 bg-indigo-50',
      'delivered': 'text-green-600 bg-green-50',
      'cancelled': 'text-red-600 bg-red-50'
    }
    
    return statusColors[status] || 'text-gray-600 bg-gray-50'
  }

  static getRoleLabel(roleName: string): string {
    const roleLabels: Record<string, string> = {
      'admin': 'Administrador',
      'sat': 'SAT',
      'instalador': 'Instalador',
      'guest': 'Cliente'
    }
    
    return roleLabels[roleName] || roleName
  }

  static getRoleColor(roleName: string): string {
    const roleColors: Record<string, string> = {
      'admin': 'text-red-600 bg-red-50',
      'sat': 'text-purple-600 bg-purple-50',
      'instalador': 'text-blue-600 bg-blue-50',
      'guest': 'text-gray-600 bg-gray-50'
    }
    
    return roleColors[roleName] || 'text-gray-600 bg-gray-50'
  }

  static getProductStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'active': 'Activo',
      'draft': 'Borrador',
      'archived': 'Archivado'
    }
    
    return statusLabels[status] || status
  }

  static getProductStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'active': 'text-green-600 bg-green-50',
      'draft': 'text-yellow-600 bg-yellow-50',
      'archived': 'text-gray-600 bg-gray-50'
    }
    
    return statusColors[status] || 'text-gray-600 bg-gray-50'
  }

  static generateProductHandle(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  }

  // === GESTIÓN DE CATEGORÍAS ===

  static async getAllCategories(
    filters?: AdminFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<AdminCategory[]> {
    try {
      let query = supabase
        .from('categories')
        .select(`
          *,
          parent:categories!parent_id (
            id,
            name,
            slug
          ),
          children:categories!parent_id (
            id,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters?.product_search) {
        query = query.or(`
          name.ilike.%${filters.product_search}%,
          slug.ilike.%${filters.product_search}%
        `)
      }

      // Paginación
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching categories:', error)
        return []
      }

      // Enriquecer con estadísticas
      const categoriesWithStats = await Promise.all(
        (data || []).map(async (category) => {
          const stats = await this.getCategoryStats(category.id)
          return {
            ...category,
            stats
          }
        })
      )

      return categoriesWithStats
    } catch (error) {
      console.error('Error in getAllCategories:', error)
      return []
    }
  }

  static async getCategoryStats(categoryId: string) {
    try {
      // Count products in this category
      const { data: productCount } = await supabase
        .from('product_categories')
        .select('product_id')
        .eq('category_id', categoryId)

      // Count subcategories
      const { data: subcategoriesCount } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', categoryId)

      return {
        total_products: productCount?.length || 0,
        total_subcategories: subcategoriesCount?.length || 0
      }
    } catch (error) {
      console.error('Error getting category stats:', error)
      return {
        total_products: 0,
        total_subcategories: 0
      }
    }
  }

  static async getCategory(categoryId: string): Promise<AdminCategory | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          parent:categories!parent_id (
            id,
            name,
            slug
          ),
          children:categories!parent_id (
            id,
            name,
            slug
          )
        `)
        .eq('id', categoryId)
        .single()

      if (error || !data) {
        console.error('Error fetching category:', error)
        return null
      }

      // Enrich with statistics
      const stats = await this.getCategoryStats(data.id)
      
      return {
        ...data,
        stats
      }
    } catch (error) {
      console.error('Error in getCategory:', error)
      return null
    }
  }

  static async createCategory(data: CreateCategoryData): Promise<string | null> {
    try {
      console.log('Creating category:', data.name)

      // Validate slug uniqueness
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', data.slug)
        .single()

      if (existingCategory) {
        throw new Error('Ya existe una categoría con este slug')
      }

      // Create the category
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .insert({
          name: data.name,
          slug: data.slug,
          parent_id: data.parent_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (categoryError || !category) {
        console.error('Error creating category:', categoryError)
        throw new Error(categoryError?.message || 'Failed to create category')
      }

      console.log('Category created successfully:', category.id)
      return category.id
    } catch (error) {
      console.error('Error in createCategory:', error)
      throw error
    }
  }

  static async updateCategory(categoryId: string, data: UpdateCategoryData): Promise<boolean> {
    try {
      // If updating slug, validate uniqueness
      if (data.slug) {
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', data.slug)
          .neq('id', categoryId)
          .single()

        if (existingCategory) {
          throw new Error('Ya existe una categoría con este slug')
        }
      }

      const { error } = await supabase
        .from('categories')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)

      if (error) {
        console.error('Error updating category:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateCategory:', error)
      throw error
    }
  }

  static async deleteCategory(categoryId: string): Promise<boolean> {
    try {
      // Check if category has products
      const { data: products, error: productsError } = await supabase
        .from('product_categories')
        .select('product_id')
        .eq('category_id', categoryId)

      if (productsError) {
        console.error('Error checking category products:', productsError)
        return false
      }

      if (products && products.length > 0) {
        throw new Error('No se puede eliminar una categoría que tiene productos asociados')
      }

      // Check if category has subcategories
      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', categoryId)

      if (subcategoriesError) {
        console.error('Error checking subcategories:', subcategoriesError)
        return false
      }

      if (subcategories && subcategories.length > 0) {
        throw new Error('No se puede eliminar una categoría que tiene subcategorías')
      }

      // Delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) {
        console.error('Error deleting category:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteCategory:', error)
      throw error
    }
  }

  static generateCategorySlug(name: string): string {
    return name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  }

  // === GESTIÓN DE CUPONES ===

  static async getAllCoupons(
    filters?: AdminFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<AdminCoupon[]> {
    try {
      let query = supabase
        .from('coupons')
        .select(`
          id,
          code,
          description,
          discount_type,
          discount_value,
          applies_to,
          target_id,
          usage_limit,
          used_count,
          valid_from,
          valid_to,
          created_at
        `)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters?.product_search) {
        query = query.or(`
          code.ilike.%${filters.product_search}%,
          description.ilike.%${filters.product_search}%
        `)
      }

      // Paginación
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching coupons:', error)
        return []
      }

      // Enriquecer con información del target y estadísticas
      const couponsWithStats = await Promise.all(
        (data || []).map(async (coupon) => {
          const [target, stats] = await Promise.all([
            this.getCouponTarget(coupon.target_id, coupon.applies_to),
            this.getCouponStats(coupon.id)
          ])
          
          return {
            ...coupon,
            target,
            stats
          }
        })
      )

      return couponsWithStats
    } catch (error) {
      console.error('Error in getAllCoupons:', error)
      return []
    }
  }

  static async getCouponTarget(targetId?: string, appliesTo?: string) {
    if (!targetId || appliesTo === 'order') {
      return null
    }

    try {
      if (appliesTo === 'product') {
        const { data } = await supabase
          .from('products')
          .select('id, title')
          .eq('id', targetId)
          .single()
        
        return data ? { id: data.id, name: data.title, type: 'product' as const } : null
      } else if (appliesTo === 'category') {
        const { data } = await supabase
          .from('categories')
          .select('id, name')
          .eq('id', targetId)
          .single()
        
        return data ? { id: data.id, name: data.name, type: 'category' as const } : null
      }
      
      return null
    } catch (error) {
      console.error('Error getting coupon target:', error)
      return null
    }
  }

  static async getCouponStats(couponId: string) {
    try {
      // Get redemptions
      const { data: redemptions } = await supabase
        .from('coupon_redemptions')
        .select(`
          id,
          order:orders (
            total_cents,
            status
          )
        `)
        .eq('coupon_id', couponId)

      const totalRedemptions = redemptions?.length || 0
      const activeOrders = redemptions?.filter(r => 
        r.order && typeof r.order === 'object' && 
        ['pending', 'confirmed', 'processing', 'shipped'].includes((r.order as any).status)
      ).length || 0

      // Calculate total savings (this is an approximation)
      // In a real scenario, you'd want to store the actual discount amount
      const totalSavingsCents = 0

      return {
        total_redemptions: totalRedemptions,
        total_savings_cents: totalSavingsCents,
        active_orders: activeOrders
      }
    } catch (error) {
      console.error('Error getting coupon stats:', error)
      return {
        total_redemptions: 0,
        total_savings_cents: 0,
        active_orders: 0
      }
    }
  }

  static async getCoupon(couponId: string): Promise<AdminCoupon | null> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          id,
          code,
          description,
          discount_type,
          discount_value,
          applies_to,
          target_id,
          usage_limit,
          used_count,
          valid_from,
          valid_to,
          created_at
        `)
        .eq('id', couponId)
        .single()

      if (error || !data) {
        console.error('Error fetching coupon:', error)
        return null
      }

      // Enrich with target and statistics
      const [target, stats] = await Promise.all([
        this.getCouponTarget(data.target_id, data.applies_to),
        this.getCouponStats(data.id)
      ])
      
      return {
        ...data,
        target,
        stats
      }
    } catch (error) {
      console.error('Error in getCoupon:', error)
      return null
    }
  }

  static async createCoupon(data: CreateCouponData): Promise<string | null> {
    try {
      console.log('Creating coupon:', data.code)

      // Validate code uniqueness
      const { data: existingCoupon } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', data.code)
        .single()

      if (existingCoupon) {
        throw new Error('Ya existe un cupón con este código')
      }

      // Validate target exists if specified
      if (data.target_id && data.applies_to !== 'order') {
        const targetExists = await this.validateCouponTarget(data.target_id, data.applies_to)
        if (!targetExists) {
          throw new Error(`El ${data.applies_to === 'product' ? 'producto' : 'categoría'} especificado no existe`)
        }
      }

      // Create the coupon
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .insert({
          code: data.code.toUpperCase(),
          description: data.description,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          applies_to: data.applies_to,
          target_id: data.target_id || null,
          usage_limit: data.usage_limit || null,
          used_count: 0,
          valid_from: data.valid_from ? new Date(data.valid_from).toISOString() : null,
          valid_to: data.valid_to ? new Date(data.valid_to).toISOString() : null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (couponError || !coupon) {
        console.error('Error creating coupon:', couponError)
        throw new Error(couponError?.message || 'Failed to create coupon')
      }

      console.log('Coupon created successfully:', coupon.id)
      return coupon.id
    } catch (error) {
      console.error('Error in createCoupon:', error)
      throw error
    }
  }

  static async validateCouponTarget(targetId: string, appliesTo: string): Promise<boolean> {
    try {
      if (appliesTo === 'product') {
        const { data } = await supabase
          .from('products')
          .select('id')
          .eq('id', targetId)
          .single()
        return !!data
      } else if (appliesTo === 'category') {
        const { data } = await supabase
          .from('categories')
          .select('id')
          .eq('id', targetId)
          .single()
        return !!data
      }
      return true
    } catch (error) {
      console.error('Error validating coupon target:', error)
      return false
    }
  }

  static async updateCoupon(couponId: string, data: UpdateCouponData): Promise<boolean> {
    try {
      // If updating code, validate uniqueness
      if (data.code) {
        const { data: existingCoupon } = await supabase
          .from('coupons')
          .select('id')
          .eq('code', data.code.toUpperCase())
          .neq('id', couponId)
          .single()

        if (existingCoupon) {
          throw new Error('Ya existe un cupón con este código')
        }
      }

      // If updating target, validate it exists
      if (data.target_id && data.applies_to && data.applies_to !== 'order') {
        const targetExists = await this.validateCouponTarget(data.target_id, data.applies_to)
        if (!targetExists) {
          throw new Error(`El ${data.applies_to === 'product' ? 'producto' : 'categoría'} especificado no existe`)
        }
      }

      const updateData: any = { ...data }
      
      // Format dates
      if (data.valid_from) {
        updateData.valid_from = new Date(data.valid_from).toISOString()
      }
      if (data.valid_to) {
        updateData.valid_to = new Date(data.valid_to).toISOString()
      }
      
      // Uppercase code
      if (data.code) {
        updateData.code = data.code.toUpperCase()
      }

      const { error } = await supabase
        .from('coupons')
        .update(updateData)
        .eq('id', couponId)

      if (error) {
        console.error('Error updating coupon:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateCoupon:', error)
      throw error
    }
  }

  static async deleteCoupon(couponId: string): Promise<boolean> {
    try {
      // Check if coupon has been used
      const { data: redemptions, error: redemptionsError } = await supabase
        .from('coupon_redemptions')
        .select('id')
        .eq('coupon_id', couponId)

      if (redemptionsError) {
        console.error('Error checking coupon redemptions:', redemptionsError)
        return false
      }

      if (redemptions && redemptions.length > 0) {
        throw new Error('No se puede eliminar un cupón que ya ha sido utilizado')
      }

      // Delete the coupon
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId)

      if (error) {
        console.error('Error deleting coupon:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteCoupon:', error)
      throw error
    }
  }

  static generateCouponCode(prefix: string = 'SAVE'): string {
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}${randomString}`
  }

  static formatDiscountValue(discountType: string, discountValue: number): string {
    if (discountType === 'percentage') {
      return `${discountValue}%`
    } else {
      return this.formatPrice(discountValue)
    }
  }

  static getCouponStatusLabel(coupon: AdminCoupon): string {
    const now = new Date()
    const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null
    const validTo = coupon.valid_to ? new Date(coupon.valid_to) : null
    
    if (validFrom && now < validFrom) {
      return 'Programado'
    } else if (validTo && now > validTo) {
      return 'Expirado'
    } else if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return 'Agotado'
    } else {
      return 'Activo'
    }
  }

  static getCouponStatusColor(coupon: AdminCoupon): string {
    const status = this.getCouponStatusLabel(coupon)
    const statusColors: Record<string, string> = {
      'Activo': 'text-green-600 bg-green-50',
      'Programado': 'text-blue-600 bg-blue-50',
      'Expirado': 'text-red-600 bg-red-50',
      'Agotado': 'text-gray-600 bg-gray-50'
    }
    
    return statusColors[status] || 'text-gray-600 bg-gray-50'
  }
}