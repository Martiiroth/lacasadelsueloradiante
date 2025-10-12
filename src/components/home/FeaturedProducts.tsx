'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ProductCardData, Category } from '../../types/products'
import { ProductService } from '../../lib/products'
import ProductCard from '../products/ProductCard'
import { useAuth } from '../../contexts/AuthContext'
import { usePricing } from '../../hooks/usePricing'
import { useHydration } from '../../hooks/useHydration'
import { LoadingState, ProductSkeleton, FilterSkeleton } from '../ui/LoadingState'

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
  displayedCount: number
  totalCount: number
  onSaleOnly: boolean
  onRetry?: () => void
  onLoadMore?: () => void
  onShowAll?: () => void
}

function ProductGrid({ products, loading, error, displayedCount, totalCount, onSaleOnly, onRetry, onLoadMore, onShowAll }: ProductGridProps) {
  if (loading && products.length === 0) {
    return (
      <div className="products-grid grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
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
        <div className="space-x-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Recargar página
          </button>
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
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

  const hasMore = displayedCount < totalCount

  return (
    <>
      <div className="products-grid grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
        {products.slice(0, displayedCount).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Indicador de productos mostrados */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">
          Mostrando <span className="font-semibold">{Math.min(displayedCount, products.length)}</span> de <span className="font-semibold">{totalCount}</span> productos
        </p>
      </div>

      {/* Botones de acción */}
      <div className="text-center space-y-4">
        {hasMore && onLoadMore && (
          <div>
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cargando...
                </>
              ) : (
                <>
                  Ver más productos
                  <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
        
        {hasMore && onShowAll && (
          <div>
            <button
              onClick={onShowAll}
              disabled={loading}
              className="inline-flex items-center px-8 py-3 border-2 border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cargando todos los productos...
                </>
              ) : (
                <>
                  {onSaleOnly ? 'Ver todas las ofertas' : 'Ver todos los productos'}
                  <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
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
  const { user } = useAuth()
  const { showWithVAT, toggleVAT } = usePricing()
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [displayedCount, setDisplayedCount] = useState(limit)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const isHydrated = useHydration()

  // Función para cargar más productos
  const handleLoadMore = async () => {
    setLoadingMore(true)
    const newDisplayedCount = displayedCount + 8
    
    // Si ya tenemos suficientes productos cargados, solo aumentamos el contador
    if (products.length >= newDisplayedCount) {
      setDisplayedCount(newDisplayedCount)
      setLoadingMore(false)
      return
    }

    // Si no, cargamos más productos
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
        newDisplayedCount,
        user?.client?.customer_role?.name
      )

      if (result) {
        setProducts(result.products)
        setTotalCount(result.total)
        setDisplayedCount(newDisplayedCount)
      }
    } catch (err) {
      console.error('Error loading more products:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  // Función para cargar TODOS los productos
  const handleShowAll = async () => {
    setLoadingMore(true)
    
    // Si ya tenemos todos los productos cargados, solo mostramos todos
    if (products.length >= totalCount) {
      setDisplayedCount(totalCount)
      setLoadingMore(false)
      return
    }

    // Si no, cargamos todos los productos
    try {
      const filters = {
        category: selectedCategory || undefined,
        is_on_sale: onSaleOnly ? true : undefined,
        search: searchTerm || undefined,
      }

      console.log(`🔄 Cargando TODOS los productos (${totalCount})...`)
      const result = await ProductService.getProducts(
        filters,
        { 
          field: sortBy as 'title' | 'price' | 'created_at' | 'stock', 
          direction: sortOrder 
        },
        1,
        totalCount, // Cargamos todos los productos disponibles
        user?.client?.customer_role?.name
      )

      if (result) {
        setProducts(result.products)
        setTotalCount(result.total)
        setDisplayedCount(result.total)
        console.log(`✅ Todos los productos cargados: ${result.products.length}`)
      }
    } catch (err) {
      console.error('Error loading all products:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  // Función para reintentar carga
  const handleRetry = () => {
    setError(null)
    setLoading(true)
    setDisplayedCount(limit)
    // Force re-trigger del useEffect cambiando un state
    setSearchTerm(prev => prev + '')
  }

  // Cargar categorías con jerarquía - solo después de hidratación
  useEffect(() => {
    if (!isHydrated || !showFilters) return

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
    
    loadCategories()
  }, [isHydrated, showFilters])

  // Cargar productos de forma optimizada con verificación previa
  useEffect(() => {
    if (!isHydrated) return

    const loadProducts = async () => {
      console.log(`🔄 FeaturedProducts: Verificando disponibilidad de productos...`)
      
      setLoading(true)
      setError(null)
      
      try {
        const filters = {
          category: selectedCategory || undefined,
          is_on_sale: onSaleOnly ? true : undefined,
          search: searchTerm || undefined,
        }

        console.log(`🔄 Cargando productos iniciales...`)
        const result = await ProductService.getProducts(
          filters,
          { 
            field: sortBy as 'title' | 'price' | 'created_at' | 'stock', 
            direction: sortOrder 
          },
          1,
          100, // Cargamos un número mayor para tener productos disponibles
          user?.client?.customer_role?.name
        )

        if (result) {
          setProducts(result.products)
          setTotalCount(result.total)
          setDisplayedCount(limit) // Reset displayed count
          console.log(`✅ FeaturedProducts: ${result.products.length} de ${result.total} productos cargados`)
        } else {
          setProducts([])
          setTotalCount(0)
          console.log(`⚠️ No se pudo obtener resultado de productos`)
        }
        setLoading(false)
      } catch (err) {
        console.error(`❌ FeaturedProducts error:`, err)
        setError('Error al cargar los productos')
        setProducts([])
        setLoading(false)
      }
    }

    loadProducts()
  }, [isHydrated, selectedCategory, sortBy, sortOrder, onSaleOnly, limit, searchTerm])

  const renderContent = () => {
    if (showFilters && !onSaleOnly) {
      return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <LoadingState 
            fallback={<FilterSkeleton />}
            delay={100}
          >
            {/* Sidebar de filtros - Responsivo */}
            <div className="w-full lg:w-64 lg:flex-shrink-0 mb-6 lg:mb-0">
              <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6 lg:sticky lg:top-8">
                {/* Header con botón plegable en móvil */}
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Filtros
                    </h3>
                    {/* Indicador de filtros activos en móvil */}
                    {(selectedCategory || searchTerm) && (
                      <span className="ml-2 lg:hidden inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
                        {(selectedCategory ? 1 : 0) + (searchTerm ? 1 : 0)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className="lg:hidden p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    aria-label={filtersOpen ? 'Cerrar filtros' : 'Abrir filtros'}
                  >
                    <svg 
                      className={`w-5 h-5 transform transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Contenido plegable de filtros */}
                <div className={`lg:block transition-all duration-300 ease-in-out overflow-hidden ${
                  filtersOpen 
                    ? 'max-h-[2000px] opacity-100' 
                    : 'max-h-0 opacity-0'
                } lg:max-h-none lg:opacity-100`}>
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[48px]"
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

                {/* Control de IVA - Solo para usuarios autenticados */}
                {user && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Visualización de precios
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-600">Ver precios:</span>
                        <div className="flex bg-white rounded-md border border-gray-200 p-1">
                          <button
                            onClick={toggleVAT}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              showWithVAT
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            Con IVA
                          </button>
                          <button
                            onClick={toggleVAT}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              !showWithVAT
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            Sin IVA
                          </button>
                        </div>
                      </div>
                      
                      {/* Información del rol si aplica */}
                      {user?.client?.customer_role?.name && ['instalador', 'distribuidor', 'mayorista'].includes(user.client.customer_role.name) && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Tu rol:</span>
                          <span className="font-medium text-green-600 capitalize flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                            {user.client.customer_role.name}
                          </span>
                        </div>
                      )}
                      
                      {/* Información de IVA */}
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        IVA España: 21% • {showWithVAT ? 'Incluido' : 'Excluido'}
                      </div>
                    </div>
                  </div>
                )}

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
                          &quot;{searchTerm}&quot;
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
            </div>
          </LoadingState>

          {/* Contenido principal */}
          <div className="flex-1">
            <ProductGrid 
              products={products}
              loading={loading || loadingMore}
              error={error}
              displayedCount={displayedCount}
              totalCount={totalCount}
              onSaleOnly={onSaleOnly}
              onRetry={handleRetry}
              onLoadMore={handleLoadMore}
              onShowAll={handleShowAll}
            />
          </div>
        </div>
      )
    } else {
      return (
        <ProductGrid 
          products={products}
          loading={loading || loadingMore}
          error={error}
          displayedCount={displayedCount}
          totalCount={totalCount}
          onSaleOnly={onSaleOnly}
          onRetry={handleRetry}
          onLoadMore={handleLoadMore}
          onShowAll={handleShowAll}
        />
      )
    }
  }

  return (
    <LoadingState 
      fallback={
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {onSaleOnly 
                  ? "Aprovecha nuestras ofertas especiales en productos de calidad premium"
                  : "Descubre nuestra selección de productos para sistemas de calefacción por suelo radiante"
                }
              </p>
            </div>
            <ProductSkeleton count={limit} />
          </div>
        </section>
      }
      delay={150}
    >
      <section id="productos" className="py-16 bg-white">
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

          {renderContent()}
        </div>
      </section>
    </LoadingState>
  )
}