'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminProduct, AdminFilters } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  CubeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  TagIcon,
  CurrencyEuroIcon,
  ArchiveBoxIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'

export default function AdminProducts() {
  const router = useRouter()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [displayedCount, setDisplayedCount] = useState(20)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AdminFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [filters])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null)
      }
    }
    if (openMenuId) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [openMenuId])

  const loadProducts = async () => {
    try {
      setLoading(true)
      // Cargar hasta 1000 productos (o un número grande razonable)
      const data = await AdminService.getAllProducts(filters, 1000, 0)
      setProducts(data)
      setTotalCount(data.length)
      setDisplayedCount(20) // Reset display count
    } catch (err) {
      console.error('Error loading products:', err)
      setError('Error al cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    const newDisplayedCount = displayedCount + 20
    setDisplayedCount(newDisplayedCount)
  }

  const handleShowAll = () => {
    // Show all filtered products
    setDisplayedCount(10000) // Set to a large number
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({
      ...filters,
      product_search: searchTerm || undefined
    })
  }

  const handleFilterChange = () => {
    setFilters({
      ...filters,
      product_search: searchTerm || undefined
    })
  }



  const deleteProduct = async (productId: string, productTitle: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el producto "${productTitle}"? Esta acción no se puede deshacer.`)) {
      return
    }
    
    try {
      const success = await AdminService.deleteProduct(productId)
      
      if (success) {
        alert('Producto eliminado correctamente')
        loadProducts()
      } else {
        alert('Error al eliminar el producto')
      }
    } catch (err) {
      console.error('Error deleting product:', err)
      if (err instanceof Error) {
        alert(err.message)
      } else {
        alert('Error al eliminar el producto')
      }
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // Get unique types for filter
  const uniqueCategories = Array.from(new Set(
    products.flatMap(p => p.categories?.map(c => c.category.name) || []).filter(Boolean)
  ))

  // Filter products based on selected filters
  const filteredProducts = products.filter(product => {
    // Filter by category
    if (selectedType) {
      const hasCategory = product.categories?.some(c => c.category.name === selectedType)
      if (!hasCategory) return false
    }
    return true
  })

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CubeIcon className="h-8 w-8 mr-3 text-indigo-600" />
                Gestión de Productos
              </h1>
              <p className="mt-2 text-gray-600">Administra el catálogo de productos de la tienda</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Mostrando <span className="font-semibold">{Math.min(displayedCount, filteredProducts.length)}</span> de <span className="font-semibold">{filteredProducts.length}</span> productos
                {filteredProducts.length !== products.length && (
                  <span className="ml-1 text-gray-400">
                    (de {products.length} totales)
                  </span>
                )}
              </div>
              <button
                onClick={() => router.push('/admin/products/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Producto
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Buscar por título, descripción, tipo..."
                  />
                </div>
              </form>



              {/* Category Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="block w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas las categorías</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Apply Filters Button */}
              <button
                type="button"
                onClick={handleFilterChange}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filtrar
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-hidden">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.slice(0, displayedCount).map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].url}
                              alt={product.images[0].alt || product.title}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <CubeIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 break-words">
                            {product.title}
                          </div>
                          {product.short_description && (
                            <div className="text-sm text-gray-500 break-words mt-1">
                              {product.short_description.length > 100 
                                ? `${product.short_description.substring(0, 100)}...`
                                : product.short_description}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {product.categories && product.categories.length > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <TagIcon className="h-3 w-3 mr-1" />
                                {product.categories[0].category.name}
                              </span>
                            )}
                            {product.is_new && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Nuevo
                              </span>
                            )}
                            {product.is_on_sale && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                En oferta
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {product.stats?.total_variants || 0} variantes
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(product.created_at).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center text-sm font-medium ${(product.stats?.total_stock || 0) < 10 ? 'text-red-600' : 'text-green-600'}`}>
                        <ArchiveBoxIcon className="h-4 w-4 mr-1" />
                        {product.stats?.total_stock || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => router.push(`/admin/products/${product.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100"
                            title="Más opciones"
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </button>
                          {openMenuId === product.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                                <div className="py-1" role="menu">
                                  <button
                                    onClick={() => {
                                      router.push(`/admin/products/${product.id}/edit`)
                                      setOpenMenuId(null)
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    role="menuitem"
                                  >
                                    <PencilIcon className="h-4 w-4 mr-2" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      deleteProduct(product.id, product.title)
                                      setOpenMenuId(null)
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    role="menuitem"
                                  >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedStatus || selectedType 
                  ? 'No se encontraron productos que coincidan con los filtros aplicados.'
                  : 'Aún no hay productos en el catálogo.'
                }
              </p>
              {!searchTerm && !selectedStatus && !selectedType && (
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/admin/products/create')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear primer producto
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredProducts.length > 0 && displayedCount < filteredProducts.length && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cargando...
                    </>
                  ) : (
                    <>
                      Ver más productos
                      <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleShowAll}
                  disabled={loadingMore}
                  className="inline-flex items-center px-6 py-2 border-2 border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mostrar todos ({filteredProducts.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}