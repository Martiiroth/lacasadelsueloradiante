/**
 * API pública: productos del carrusel de la homepage
 * GET /api/carousel/products
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { ProductCardData } from '@/types/products'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: carouselRows, error: carouselError } = await supabase
      .from('home_carousel_products')
      .select('product_id, position')
      .order('position', { ascending: true })

    if (carouselError) {
      console.error('[carousel/products] Error reading carousel:', carouselError)
      return NextResponse.json({ products: [] }, { status: 200 })
    }

    if (!carouselRows?.length) {
      return NextResponse.json({ products: [] }, { status: 200 })
    }

    const ids = carouselRows.map((r: { product_id: string }) => r.product_id)

    let query = supabase
      .from('products')
      .select(`
        id,
        slug,
        title,
        short_description,
        is_new,
        is_on_sale,
        brand_id,
        brands (
          id,
          name,
          slug,
          logo_url
        ),
        product_images (
          url,
          alt,
          position
        ),
        product_variants (
          id,
          price_public_cents,
          stock,
          role_prices (
            price_cents,
            customer_roles ( name )
          )
        )
      `)
      .in('id', ids)

    const { data: productsData, error: productsError } = await query

    if (productsError || !productsData?.length) {
      return NextResponse.json({ products: [] }, { status: 200 })
    }

    const byId = new Map(productsData.map((p: any) => [p.id, p]))
    const mapped = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((product: any) => {
        const variants = product.product_variants || []
        if (!variants.length) return null
        const minPublicPrice = Math.min(...variants.map((v: any) => v.price_public_cents))
        const cheapestVariant = variants.find((v: any) => v.price_public_cents === minPublicPrice)
        let rolePrice: number | undefined
        if (cheapestVariant?.role_prices?.length) {
          const rp = cheapestVariant.role_prices[0]
          rolePrice = rp?.price_cents
        }
        const image = product.product_images?.sort((a: any, b: any) => a.position - b.position)[0]
        return {
          id: product.id,
          slug: product.slug,
          title: product.title,
          short_description: product.short_description,
          is_new: product.is_new,
          is_on_sale: product.is_on_sale,
          image,
          price_cents: minPublicPrice,
          role_price_cents: rolePrice,
          in_stock: variants.some((v: any) => v.stock > 0),
          brand_id: product.brand_id,
          brand: product.brands
            ? {
                id: product.brands.id,
                name: product.brands.name,
                slug: product.brands.slug,
                logo_url: product.brands.logo_url
              }
            : undefined
        }
      })
    const products = mapped.filter((p) => p != null) as ProductCardData[]

    return NextResponse.json({ products })
  } catch (e) {
    console.error('[carousel/products] Error:', e)
    return NextResponse.json({ products: [] }, { status: 200 })
  }
}
