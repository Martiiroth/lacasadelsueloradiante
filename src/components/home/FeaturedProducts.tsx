'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ProductCardData, Category } from '../../types/products'
import { ProductService } from '../../lib/products'
import ProductCard from '../products/ProductCard'

interface FeaturedProductsProps {
  title?: string
  showFilters?: boolean
  onSaleOnly?: boolean
  limit?: number
}

export default function FeaturedProducts({ 
  title = "Productos Destacados",
  showFilters = true,
  onSaleOnly = false,
  limit = 8
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await ProductService.getCategories()
        setCategories(categoriesData.slice(0, 6)) // Solo mostrar las primeras 6 categorías
      } catch (err) {
        console.error('Error loading categories:', err)
      }
    }
    
    if (showFilters) {
      loadCategories()
    }
  }, [showFilters])

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      console.log(`🔄 FeaturedProducts: Cargando ${limit} productos...`)
      
      setLoading(true)
      setError(null)
      
      try {
        const filters = {
          category: selectedCategory || undefined,
          is_on_sale: onSaleOnly ? true : undefined,
        }

        const result = await ProductService.getProducts(
          filters,
          { 
            field: sortBy as 'title' | 'price' | 'created_at' | 'stock', 
            direction: sortOrder 
          },
          1,
          limit
        )

        if (result) {
          setProducts(result.products)
          console.log(`✅ FeaturedProducts: ${result.products.length} productos cargados`)
        } else {
          setError('No se pudieron cargar los productos')
          setProducts([])
        }
      } catch (err) {
        console.error('❌ FeaturedProducts error:', err)
        setError('Error al cargar los productos')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [selectedCategory, sortBy, sortOrder, onSaleOnly, limit])

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {onSaleOnly 
              ? "Aprovecha nuestras ofertas especiales en productos de calidad premium"
              : "Descubre nuestra selección de productos para sistemas de calefacción por suelo radiante"
            }
          </p>
        </div>

        {/* Filtros */}
        {showFilters && !onSaleOnly && (
          <div className="mb-12">
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              {/* Filtro de categorías */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === ''
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Selector de ordenamiento */}
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-gray-600">
                  Ordenar por:
                </label>
                <select
                  id="sort"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field)
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="created_at-desc">Más recientes</option>
                  <option value="title-asc">Nombre A-Z</option>
                  <option value="title-desc">Nombre Z-A</option>
                  <option value="price-asc">Precio menor</option>
                  <option value="price-desc">Precio mayor</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Grid de productos */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3 w-3/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              ⚠️ {error}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {onSaleOnly 
                ? 'No hay productos en oferta en este momento'
                : 'No se encontraron productos'
              }
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Botón ver más */}
            <div className="text-center">
              <Link
                href={onSaleOnly ? "/products?is_on_sale=true" : "/products"}
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                {onSaleOnly ? 'Ver todas las ofertas' : 'Ver todos los productos'}
                <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}