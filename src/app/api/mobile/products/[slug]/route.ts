/**
 * API Endpoint: Detalle de producto para app móvil
 * GET /api/mobile/products/[slug]
 * 
 * Retorna información completa de un producto específico
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{
    slug: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug requerido' },
        { status: 400 }
      )
    }
    
    // Obtener producto completo
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        slug,
        title,
        short_description,
        description,
        is_new,
        is_on_sale,
        meta_title,
        meta_description,
        created_at,
        brand:brands (
          id,
          name,
          slug,
          description,
          logo_url,
          website
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
          stock,
          weight_grams,
          dimensions,
          variant_images (
            id,
            url,
            alt,
            position
          )
        ),
        categories:product_categories (
          category:categories (
            id,
            name,
            slug
          )
        ),
        resources:product_resources (
          id,
          type,
          url,
          label
        )
      `)
      .eq('slug', slug)
      .single()
    
    if (error || !product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }
    
    // Formatear imágenes principales del producto
    const productImages = (product.images || [])
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      .map((img: any) => ({
        url: img.url,
        alt: img.alt || product.title,
        position: img.position
      }))
    
    // Formatear variantes
    const variants = (product.variants || []).map((variant: any) => {
      const variantImages = (variant.variant_images || [])
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        .map((img: any) => ({
          url: img.url,
          alt: img.alt || variant.title,
          position: img.position
        }))
      
      return {
        id: variant.id,
        sku: variant.sku,
        title: variant.title,
        price: {
          cents: variant.price_public_cents,
          formatted: `${(variant.price_public_cents / 100).toFixed(2)}€`,
          euros: (variant.price_public_cents / 100).toFixed(2)
        },
        stock: {
          quantity: variant.stock,
          available: variant.stock > 0,
          is_backorder: variant.stock === 0
        },
        weight_grams: variant.weight_grams,
        dimensions: variant.dimensions,
        images: variantImages.length > 0 ? variantImages : productImages // Si no tiene imágenes propias, usar las del producto
      }
    })
    
    // Calcular precios
    const prices = variants.map((v: any) => v.price.cents)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    // Calcular stock total
    const totalStock = variants.reduce((sum: number, v: any) => sum + v.stock.quantity, 0)
    
    // Formatear categorías
    const categories = (product.categories || [])
      .map((pc: any) => pc.category)
      .filter(Boolean)
      .map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug
      }))
    
    // Formatear recursos
    const resources = (product.resources || []).map((res: any) => ({
      id: res.id,
      type: res.type,
      url: res.url,
      label: res.label
    }))
    
    // URL del producto en la web
    const productUrl = `https://lacasadelsueloradiante.es/products/${product.slug}`
    
    // Respuesta formateada
    const formattedProduct = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      short_description: product.short_description,
      description: product.description,
      is_new: product.is_new,
      is_on_sale: product.is_on_sale,
      created_at: product.created_at,
      
      // Marca
      brand: (product.brand && !Array.isArray(product.brand)) ? {
        id: (product.brand as any).id,
        name: (product.brand as any).name,
        slug: (product.brand as any).slug,
        description: (product.brand as any).description,
        logo_url: (product.brand as any).logo_url,
        website: (product.brand as any).website
      } : null,
      
      // Imágenes
      images: productImages,
      main_image: productImages[0] || null,
      
      // Categorías
      categories,
      
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
        is_backorder: totalStock === 0
      },
      
      // Variantes
      variants,
      variants_count: variants.length,
      
      // Recursos (PDFs, manuales, etc)
      resources,
      
      // URLs
      web_url: productUrl,
      share_url: productUrl,
      
      // SEO
      meta: {
        title: product.meta_title || product.title,
        description: product.meta_description || product.short_description
      }
    }
    
    return NextResponse.json({
      success: true,
      data: formattedProduct
    })
    
  } catch (error) {
    console.error('Error in mobile product detail API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Permitir CORS
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
