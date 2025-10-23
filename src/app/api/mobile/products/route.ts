/**
 * API Endpoint: Listar productos para app móvil
 * GET /api/mobile/products
 * 
 * Retorna lista de productos con información básica, imágenes y URLs
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parámetros de filtrado
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category') // slug de categoría
    const search = searchParams.get('search') // búsqueda por título
    const brandId = searchParams.get('brand_id')
    const isNew = searchParams.get('is_new') === 'true'
    const isOnSale = searchParams.get('is_on_sale') === 'true'
    const inStock = searchParams.get('in_stock') === 'true'
    
    // Construir query base
    let query = supabase
      .from('products')
      .select(`
        id,
        slug,
        title,
        short_description,
        is_new,
        is_on_sale,
        brand:brands (
          id,
          name,
          slug,
          logo_url
        ),
        images:product_images (
          id,
          url,
          alt,
          position
        ),
        variants:product_variants (
          id,
          sku,
          title,
          price_public_cents,
          stock
        ),
        categories:product_categories (
          category:categories (
            id,
            name,
            slug
          )
        )
      `)
      .order('created_at', { ascending: false })
    
    // Aplicar filtros
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }
    
    if (brandId) {
      query = query.eq('brand_id', brandId)
    }
    
    if (isNew) {
      query = query.eq('is_new', true)
    }
    
    if (isOnSale) {
      query = query.eq('is_on_sale', true)
    }
    
    // Paginación
    query = query.range(offset, offset + limit - 1)
    
    const { data: products, error } = await query
    
    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Error al obtener productos' },
        { status: 500 }
      )
    }
    
    // Filtrar por categoría si se especifica
    let filteredProducts = products || []
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.categories?.some((pc: any) => pc.category?.slug === category)
      )
    }
    
    // Filtrar por stock si se solicita
    if (inStock) {
      filteredProducts = filteredProducts.filter(product =>
        product.variants?.some((v: any) => v.stock > 0)
      )
    }
    
    // Formatear datos para la app
    const formattedProducts = filteredProducts.map((product: any) => {
      // Obtener la primera imagen o null
      const mainImage = product.images
        ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))[0]
      
      // Obtener la variante principal (primera o la de menor precio)
      const mainVariant = product.variants
        ?.sort((a: any, b: any) => a.price_public_cents - b.price_public_cents)[0]
      
      // Calcular stock total
      const totalStock = product.variants
        ?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0
      
      // Obtener precio mínimo y máximo
      const prices = product.variants?.map((v: any) => v.price_public_cents) || []
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      
      // URL del producto en la web
      const productUrl = `https://lacasadelsueloradiante.es/products/${product.slug}`
      
      return {
        id: product.id,
        slug: product.slug,
        title: product.title,
        short_description: product.short_description,
        is_new: product.is_new,
        is_on_sale: product.is_on_sale,
        
        // Imagen principal
        image: mainImage ? {
          url: mainImage.url,
          alt: mainImage.alt || product.title
        } : null,
        
        // Todas las imágenes
        images: product.images?.map((img: any) => ({
          url: img.url,
          alt: img.alt || product.title,
          position: img.position
        })) || [],
        
        // Marca
        brand: product.brand ? {
          id: product.brand.id,
          name: product.brand.name,
          slug: product.brand.slug,
          logo_url: product.brand.logo_url
        } : null,
        
        // Categorías
        categories: product.categories?.map((pc: any) => ({
          id: pc.category?.id,
          name: pc.category?.name,
          slug: pc.category?.slug
        })).filter(Boolean) || [],
        
        // Precio
        price: {
          min_cents: minPrice,
          max_cents: maxPrice,
          formatted_min: `${(minPrice / 100).toFixed(2)}€`,
          formatted_max: `${(maxPrice / 100).toFixed(2)}€`,
          has_range: minPrice !== maxPrice
        },
        
        // Stock
        stock: {
          total: totalStock,
          available: totalStock > 0,
          is_backorder: totalStock === 0 // Productos bajo pedido
        },
        
        // Variantes
        variants_count: product.variants?.length || 0,
        
        // URLs
        web_url: productUrl,
        api_url: `https://lacasadelsueloradiante.es/api/mobile/products/${product.slug}`
      }
    })
    
    return NextResponse.json({
      success: true,
      data: formattedProducts,
      pagination: {
        limit,
        offset,
        returned: formattedProducts.length,
        has_more: formattedProducts.length === limit
      },
      filters_applied: {
        category,
        search,
        brand_id: brandId,
        is_new: isNew,
        is_on_sale: isOnSale,
        in_stock: inStock
      }
    })
    
  } catch (error) {
    console.error('Error in mobile products API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Permitir CORS para la app móvil
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  )
}
