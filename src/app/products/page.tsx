'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ProductCardData, Category } from '../../types/products'
import { ProductService } from '../../lib/products'
import ProductCard from '../../components/products/ProductCard'
import Pagination from '../../components/ui/Pagination'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtros
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

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await ProductService.getCategories()
        setCategories(categoriesData)
      } catch (err) {
        console.error('Error loading categories:', err)
      }
    }
    loadCategories()
  }, [])

  // Cargar productos con filtros
  useEffect(() => {
    const loadProducts = async () => {
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
        setError('Error al cargar los productos')
        console.error('❌ [ProductsPage] Error loading products:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [searchTerm, selectedCategory, minPrice, maxPrice, sortBy, sortOrder, currentPage])

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

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {/* Búsqueda */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar productos
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, marca, código..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* Filtros adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Categoría */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Precio mínimo */}
              <div>
                <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Precio mínimo
                </label>
                <input
                  id="minPrice"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="€ Min"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Precio máximo */}
              <div>
                <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Precio máximo
                </label>
                <input
                  id="maxPrice"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="€ Max"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Ordenar por */}
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                  Ordenar por
                </label>
                <select
                  id="sort"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field)
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name-asc">Nombre (A-Z)</option>
                  <option value="name-desc">Nombre (Z-A)</option>
                  <option value="price-asc">Precio (menor a mayor)</option>
                  <option value="price-desc">Precio (mayor a menor)</option>
                  <option value="created_at-desc">Más recientes</option>
                  <option value="created_at-asc">Más antiguos</option>
                </select>
              </div>
            </div>

            {/* Limpiar filtros */}
            {hasActiveFilters && (
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  {totalProducts} producto{totalProducts !== 1 ? 's' : ''} encontrado{totalProducts !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Contenido principal */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
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
          <>
            {/* Grid de productos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
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
        )}
      </div>
    </div>
  )
}