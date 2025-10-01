'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ProductCardData, Category } from '../../types/products'
import { ProductService } from '../../lib/products'
import ProductCard from '../../components/products/ProductCard'
import Pagination from '../../components/ui/Pagination'
import { useHydration } from '../../hooks/useHydration'
import { LoadingState, ProductSkeleton } from '../../components/ui/LoadingState'

// Componente auxiliar para mostrar categorías de forma hierárquica
interface CategoryFilterListProps {
  categories: Category[]
  selectedCategory: string
  onSelectCategory: (categoryId: string) => void
}

function CategoryFilterList({ categories, selectedCategory, onSelectCategory }: CategoryFilterListProps) {
  const parentCategories = categories.filter(cat => !cat.parent_id)
  const childCategories = categories.filter(cat => cat.parent_id)

  const renderCategory = (category: Category, level: number = 0) => {
    const children = childCategories.filter(child => child.parent_id === category.id)
    const isSelected = selectedCategory === category.id
    const hasChildren = children.length > 0

    return (
      <div key={category.id} className={`${level > 0 ? 'ml-4' : ''}`}>
        <button
          type="button"
          onClick={() => onSelectCategory(category.id)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            isSelected
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center">
            {category.name}
          </span>
        </button>
        {hasChildren && (
          <div className="mt-1">
            {children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {parentCategories.map(category => renderCategory(category))}
    </div>
  )
}

// Componente auxiliar para mostrar badges de filtros activos
interface FilterBadgeProps {
  label: string
  onRemove: () => void
}

function FilterBadge({ label, onRemove }: FilterBadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
      >
        ×
      </button>
    </span>
  )
}

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const isHydrated = useHydration()
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryTrigger, setRetryTrigger] = useState(0)
  
  // Estados para filtros
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  )
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1')
  )
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const itemsPerPage = 12

  // Función para reintentar carga
  const retryLoad = () => {
    setRetryTrigger(prev => prev + 1)
  }

  // Cargar categorías
  useEffect(() => {
    if (!isHydrated) return

    const loadCategories = async (retryCount = 0) => {
      try {
        const categoriesData = await ProductService.getCategories()
        setCategories(categoriesData)
      } catch (err) {
        console.error('Error loading categories:', err)
        if (retryCount < 3) {
          setTimeout(() => loadCategories(retryCount + 1), 1000 * Math.pow(2, retryCount))
        }
      }
    }
    loadCategories()
  }, [isHydrated, retryTrigger])

  // Cargar productos con filtros
  useEffect(() => {
    if (!isHydrated) return

    const loadProducts = async (retryCount = 0) => {
      setLoading(true)
      setError(null)
      
      try {
        console.log('🔍 [ProductsPage] Loading products with filters:', {
          searchTerm,
          selectedCategory,
          minPrice,
          maxPrice,
          sortBy,
          sortOrder,
          currentPage
        })

        const filters = {
          search: searchTerm || undefined,
          categories: selectedCategory ? [selectedCategory] : undefined,
          min_price: minPrice ? parseFloat(minPrice) : undefined,
          max_price: maxPrice ? parseFloat(maxPrice) : undefined,
        }

        console.log('📋 [ProductsPage] Filters object:', filters)

        const result = await ProductService.getProducts(
          filters,
          { 
            field: sortBy as 'title' | 'price' | 'created_at' | 'stock', 
            direction: sortOrder 
          },
          currentPage,
          itemsPerPage
        )

        console.log('📊 [ProductsPage] Service result:', result)

        if (result) {
          setProducts(result.products)
          setTotalProducts(result.total)
          setTotalPages(result.total_pages)
          console.log('✅ [ProductsPage] Products loaded:', result.products.length)
        } else {
          console.error('❌ [ProductsPage] No result from service')
          setError('No se pudieron cargar los productos')
        }
      } catch (err) {
        console.error('❌ [ProductsPage] Error loading products:', err)
        if (retryCount < 3) {
          setTimeout(() => loadProducts(retryCount + 1), 1000 * Math.pow(2, retryCount))
        } else {
          setError('Error al cargar los productos')
        }
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [isHydrated, searchTerm, selectedCategory, minPrice, maxPrice, sortBy, sortOrder, currentPage, retryTrigger])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset a primera página al buscar
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('name')
    setSortOrder('asc')
    setCurrentPage(1)
  }

  const hasActiveFilters = searchTerm || selectedCategory || minPrice || maxPrice

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nuestros Productos
          </h1>
          <p className="text-gray-600">
            Descubre nuestra amplia gama de productos para suelos radiantes y climatización
          </p>
        </div>

        {/* Filtros móvil - SOLO EN MÓVILES */}
        <div className="block lg:hidden mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <button
              type="button"
              onClick={() => setFiltersVisible(!filtersVisible)}
              className="w-full flex items-center justify-between p-3 text-left font-medium text-gray-900 hover:bg-gray-50 rounded-lg transition-colors min-h-[48px]"
            >
              <span>Filtros de búsqueda</span>
              <svg className={`w-5 h-5 transform transition-transform ${filtersVisible ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div className={`${filtersVisible ? 'block' : 'hidden'} mt-4`}>
                <form onSubmit={handleSearchSubmit} className="space-y-4">
                {/* Búsqueda por texto */}
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar productos
                  </label>
                  <div className="relative">
                    <input
                      id="search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre, marca, código..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[48px]"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium min-h-[48px]"
                  >
                    Buscar
                  </button>
                </div>

                {/* Filtro por categorías con jerarquía */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Categorías
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('')
                        setCurrentPage(1)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === ''
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Todas las categorías
                    </button>
                    
                    <CategoryFilterList
                      categories={categories}
                      selectedCategory={selectedCategory}
                      onSelectCategory={(categoryId) => {
                        setSelectedCategory(categoryId)
                        setCurrentPage(1)
                      }}
                    />
                  </div>
                </div>

                {/* Filtro de precios */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Rango de precios
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="minPrice" className="block text-xs text-gray-500 mb-1">
                        Precio mínimo
                      </label>
                      <input
                        id="minPrice"
                        type="number"
                        value={minPrice}
                        onChange={(e) => {
                          setMinPrice(e.target.value)
                          setCurrentPage(1)
                        }}
                        placeholder="€ 0"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="maxPrice" className="block text-xs text-gray-500 mb-1">
                        Precio máximo
                      </label>
                      <input
                        id="maxPrice"
                        type="number"
                        value={maxPrice}
                        onChange={(e) => {
                          setMaxPrice(e.target.value)
                          setCurrentPage(1)
                        }}
                        placeholder="€ 9999"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Ordenamiento */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Ordenar por
                  </h4>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-')
                      setSortBy(field)
                      setSortOrder(order as 'asc' | 'desc')
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="name-asc">Nombre A-Z</option>
                    <option value="name-desc">Nombre Z-A</option>
                    <option value="price-asc">Precio menor</option>
                    <option value="price-desc">Precio mayor</option>
                    <option value="created_at-desc">Más recientes</option>
                    <option value="created_at-asc">Más antiguos</option>
                  </select>
                </div>

                {/* Filtros activos y limpiar */}
                {hasActiveFilters && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Filtros activos
                      </h4>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Limpiar todo
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {searchTerm && (
                        <FilterBadge
                          label={`"${searchTerm}"`}
                          onRemove={() => setSearchTerm('')}
                        />
                      )}
                      {selectedCategory && (
                        <FilterBadge
                          label={categories.find(c => c.id === selectedCategory)?.name || 'Categoría'}
                          onRemove={() => setSelectedCategory('')}
                        />
                      )}
                      {minPrice && (
                        <FilterBadge
                          label={`Min: €${minPrice}`}
                          onRemove={() => setMinPrice('')}
                        />
                      )}
                      {maxPrice && (
                        <FilterBadge
                          label={`Max: €${maxPrice}`}
                          onRemove={() => setMaxPrice('')}
                        />
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Layout principal responsive */}
        <div className="lg:flex lg:gap-8">
          {/* Sidebar filtros desktop */}
          <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Filtros de búsqueda
              </h3>
              <form onSubmit={handleSearchSubmit} className="space-y-6">
                {/* Búsqueda por texto */}
                <div>
                  <label htmlFor="search-desktop" className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar productos
                  </label>
                  <div className="relative">
                    <input
                      id="search-desktop"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre, marca, código..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Buscar
                  </button>
                </div>

                {/* Categorías */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Categorías
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('')
                        setCurrentPage(1)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === ''
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Todas las categorías
                    </button>
                    <CategoryFilterList
                      categories={categories}
                      selectedCategory={selectedCategory}
                      onSelectCategory={(categoryId: string) => {
                        setSelectedCategory(categoryId)
                        setCurrentPage(1)
                      }}
                    />
                  </div>
                </div>

                {/* Filtros de precio */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Rango de precio
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="minPrice-desktop" className="block text-xs text-gray-500 mb-1">
                        Precio mínimo
                      </label>
                      <input
                        id="minPrice-desktop"
                        type="number"
                        value={minPrice}
                        onChange={(e) => {
                          setMinPrice(e.target.value)
                          setCurrentPage(1)
                        }}
                        placeholder="€ 0"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="maxPrice-desktop" className="block text-xs text-gray-500 mb-1">
                        Precio máximo
                      </label>
                      <input
                        id="maxPrice-desktop"
                        type="number"
                        value={maxPrice}
                        onChange={(e) => {
                          setMaxPrice(e.target.value)
                          setCurrentPage(1)
                        }}
                        placeholder="€ 9999"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Ordenamiento */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Ordenar por
                  </h4>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-')
                      setSortBy(field)
                      setSortOrder(order as 'asc' | 'desc')
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="name-asc">Nombre A-Z</option>
                    <option value="name-desc">Nombre Z-A</option>
                    <option value="price-asc">Precio menor</option>
                    <option value="price-desc">Precio mayor</option>
                    <option value="created_at-desc">Más recientes</option>
                    <option value="created_at-asc">Más antiguos</option>
                  </select>
                </div>

                {/* Filtros activos y limpiar */}
                {hasActiveFilters && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Filtros activos
                      </h4>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Limpiar todo
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {searchTerm && (
                        <FilterBadge
                          label={`"${searchTerm}"`}
                          onRemove={() => setSearchTerm('')}
                        />
                      )}
                      {selectedCategory && (
                        <FilterBadge
                          label={categories.find(c => c.id === selectedCategory)?.name || 'Categoría'}
                          onRemove={() => setSelectedCategory('')}
                        />
                      )}
                      {minPrice && (
                        <FilterBadge
                          label={`Min: €${minPrice}`}
                          onRemove={() => setMinPrice('')}
                        />
                      )}
                      {maxPrice && (
                        <FilterBadge
                          label={`Max: €${maxPrice}`}
                          onRemove={() => setMaxPrice('')}
                        />
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            {/* Encabezado de resultados */}
            {!loading && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {totalProducts} producto{totalProducts !== 1 ? 's' : ''} encontrado{totalProducts !== 1 ? 's' : ''}
                  </h2>
                  {hasActiveFilters && (
                    <p className="text-sm text-gray-500 mt-1">
                      Resultados filtrados
                    </p>
                  )}
                </div>
                {totalPages > 1 && (
                  <div className="text-sm text-gray-500">
                    Página {currentPage} de {totalPages}
                  </div>
                )}
              </div>
            )}

            {/* Contenido de productos */}
            {loading ? (
              <LoadingState
                fallback={<ProductSkeleton count={12} />}
              >
                <div></div>
              </LoadingState>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                  onClick={retryLoad}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Intentar de nuevo
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  {hasActiveFilters 
                    ? 'No se encontraron productos con los filtros aplicados'
                    : 'No hay productos disponibles'
                  }
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Ver todos los productos
                  </button>
                )}
              </div>
            ) : (
              <LoadingState>
                <>
                  {/* Grid de productos - Responsive */}
                  <div className="products-grid grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              </LoadingState>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}