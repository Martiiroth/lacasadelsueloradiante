'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ProductCardData, Category } from '../../types/products'
import { ProductService } from '../../lib/products'
import ProductCard from '../products/ProductCard'

// Componente para filtro de categoría individual (con subcategorías)
interface CategoryFilterProps {
  category: Category
  selectedCategory: string
  onSelectCategory: (categoryId: string) => void
}

function CategoryFilter({ category, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isSelected = selectedCategory === category.id
  const hasChildren = category.children && category.children.length > 0

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            setIsOpen(!isOpen)
          } else {
            onSelectCategory(category.id)
          }
        }}
        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
          isSelected
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span className="flex items-center">
          {category.name}
        </span>
        {hasChildren && (
          <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>
            ▶
          </span>
        )}
      </button>
      
      {/* Subcategorías */}
      {hasChildren && isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {category.children?.map((child) => (
            <button
              key={child.id}
              onClick={() => onSelectCategory(child.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedCategory === child.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {child.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente para la grilla de productos
interface ProductGridProps {
  products: ProductCardData[]
  loading: boolean
  error: string | null
  limit: number
  onSaleOnly: boolean
}

function ProductGrid({ products, loading, error, limit, onSaleOnly }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          {onSaleOnly 
            ? 'No hay productos en oferta en este momento'
            : 'No se encontraron productos'
          }
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
  )
}

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
  const [searchTerm, setSearchTerm] = useState('')

  // Cargar categorías con jerarquía
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await ProductService.getCategories()
        
        // Organizar categorías por jerarquía (padres e hijos)
        const parentCategories = allCategories.filter(cat => !cat.parent_id)
        const childCategories = allCategories.filter(cat => cat.parent_id)
        
        // Asignar hijos a sus padres
        const categoriesWithChildren = parentCategories.map(parent => ({
          ...parent,
          children: childCategories.filter(child => child.parent_id === parent.id)
        }))
        
        setCategories(categoriesWithChildren.slice(0, 8)) // Mostrar hasta 8 categorías principales
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
          search: searchTerm || undefined,
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
  }, [selectedCategory, sortBy, sortOrder, onSaleOnly, limit, searchTerm])

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

        {/* Layout con sidebar de filtros */}
        {showFilters && !onSaleOnly ? (
          <div className="flex gap-8">
            {/* Sidebar de filtros */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Filtros
                </h3>

                {/* Buscador */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Buscar productos
                  </h4>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre, marca, código..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Filtro por categorías */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Categorías
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === ''
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Todos los productos
                    </button>
                    
                    {categories.map((category) => (
                      <CategoryFilter
                        key={category.id}
                        category={category}
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                      />
                    ))}
                  </div>
                </div>

                {/* Filtro de ordenamiento */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Ordenar por
                  </h4>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-')
                      setSortBy(field)
                      setSortOrder(order as 'asc' | 'desc')
                    }}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="created_at-desc">Más recientes</option>
                    <option value="title-asc">Nombre A-Z</option>
                    <option value="title-desc">Nombre Z-A</option>
                    <option value="price-asc">Precio menor</option>
                    <option value="price-desc">Precio mayor</option>
                  </select>
                </div>

                {/* Badges de filtros activos */}
                {(selectedCategory || searchTerm) && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        Filtros activos
                      </h4>
                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setSelectedCategory('')
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Limpiar todo
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {searchTerm && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          "{searchTerm}"
                          <button
                            onClick={() => setSearchTerm('')}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {selectedCategory && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {categories.find(c => c.id === selectedCategory)?.name}
                          <button
                            onClick={() => setSelectedCategory('')}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contenido principal */}
            <div className="flex-1">
              {/* Grid de productos con el contenido actual */}
              <ProductGrid 
                products={products}
                loading={loading}
                error={error}
                limit={limit}
                onSaleOnly={onSaleOnly}
              />
            </div>
          </div>
        ) : (
          /* Layout sin filtros para productos en oferta */
          <ProductGrid 
            products={products}
            loading={loading}
            error={error}
            limit={limit}
            onSaleOnly={onSaleOnly}
          />
        )}


      </div>
    </section>
  )
}