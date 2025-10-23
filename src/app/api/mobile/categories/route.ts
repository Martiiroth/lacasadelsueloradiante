/**
 * API Endpoint: Listar categorías para app móvil
 * GET /api/mobile/categories
 * 
 * Retorna lista de categorías con contador de productos
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get('include_products') === 'true'
    
    // Obtener categorías
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        parent_id,
        parent:categories!parent_id (
          id,
          name,
          slug
        )
      `)
      .order('name')
    
    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Error al obtener categorías' },
        { status: 500 }
      )
    }
    
    // Contar productos por categoría
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (category: any) => {
        const { count } = await supabase
          .from('product_categories')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
        
        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          parent: category.parent ? {
            id: category.parent.id,
            name: category.parent.name,
            slug: category.parent.slug
          } : null,
          products_count: count || 0
        }
      })
    )
    
    // Si se solicitan productos, incluir lista resumida
    let formattedCategories = categoriesWithCount
    
    if (includeProducts) {
      formattedCategories = await Promise.all(
        categoriesWithCount.map(async (category: any) => {
          const { data: productCategories } = await supabase
            .from('product_categories')
            .select(`
              product:products (
                id,
                slug,
                title,
                images:product_images (
                  url,
                  alt,
                  position
                )
              )
            `)
            .eq('category_id', category.id)
            .limit(5)
          
          const products = (productCategories || [])
            .map((pc: any) => {
              const product = pc.product
              const mainImage = product.images
                ?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))[0]
              
              return {
                id: product.id,
                slug: product.slug,
                title: product.title,
                image: mainImage ? {
                  url: mainImage.url,
                  alt: mainImage.alt || product.title
                } : null,
                web_url: `https://lacasadelsueloradiante.es/products/${product.slug}`
              }
            })
          
          return {
            ...category,
            featured_products: products
          }
        })
      )
    }
    
    return NextResponse.json({
      success: true,
      data: formattedCategories,
      total: formattedCategories.length
    })
    
  } catch (error) {
    console.error('Error in mobile categories API:', error)
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
