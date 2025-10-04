'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminProduct } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  CubeIcon,
  TagIcon,
  BuildingStorefrontIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CurrencyEuroIcon,
  ArchiveBoxIcon,
  ShoppingBagIcon,
  CalendarIcon,
  PhotoIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function AdminProductDetail() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const productId = params.id as string

  useEffect(() => {
    if (productId) {
      loadProductDetail()
    }
  }, [productId])

  const loadProductDetail = async () => {
    try {
      setLoading(true)
      const products = await AdminService.getAllProducts({})
      const foundProduct = products.find(p => p.id === productId)
      
      if (foundProduct) {
        setProduct(foundProduct)
      } else {
        setError('Producto no encontrado')
      }
    } catch (err) {
      console.error('Error loading product detail:', err)
      setError('Error al cargar el detalle del producto')
    } finally {
      setLoading(false)
    }
  }

  // Status toggle removed - field not in current schema

  const deleteProduct = async () => {
    if (!product) return
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el producto "${product.title}"? Esta acción no se puede deshacer.`)) {
      return
    }
    
    try {
      const success = await AdminService.deleteProduct(product.id)
      
      if (success) {
        alert('Producto eliminado correctamente')
        router.push('/admin/products')
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

  if (error || !product) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
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
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-16 w-16 mr-4">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].alt || product.title}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <CubeIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {product.title}
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Creado el {new Date(product.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={deleteProduct}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CubeIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Información del Producto
                </h3>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Título</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.title}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Slug</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{product.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Producto Nuevo</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.is_new ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.is_new ? 'Sí' : 'No'}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">En Oferta</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.is_on_sale ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.is_on_sale ? 'Sí' : 'No'}
                      </span>
                    </dd>
                  </div>
                  {product.categories && product.categories.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Categorías</dt>
                      <dd className="mt-1 flex flex-wrap gap-2">
                        {product.categories.map((cat) => (
                          <span key={cat.category.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <TagIcon className="h-3 w-3 mr-1" />
                            {cat.category.name}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                  {product.short_description && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Descripción Corta</dt>
                      <dd className="mt-1 text-sm text-gray-900">{product.short_description}</dd>
                    </div>
                  )}
                  {product.description && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Descripción Completa</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{product.description}</dd>
                    </div>
                  )}
                  {product.meta_title && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Meta Título</dt>
                      <dd className="mt-1 text-sm text-gray-900">{product.meta_title}</dd>
                    </div>
                  )}
                  {product.meta_description && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Meta Descripción</dt>
                      <dd className="mt-1 text-sm text-gray-900">{product.meta_description}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Product Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <CubeIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Variantes ({product.variants.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Variante
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {product.variants.map((variant) => (
                        <tr key={variant.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{variant.title || 'Variante'}</div>
                            {variant.sku && (
                              <div className="text-xs text-gray-500 font-mono">
                                SKU: {variant.sku}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {variant.sku || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              €{(variant.price_public_cents / 100).toFixed(2)}
                            </div>
                            {variant.weight_grams && variant.weight_grams > 0 && (
                              <div className="text-xs text-gray-500">
                                {variant.weight_grams}g
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${variant.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                              {variant.stock}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Activa
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product Images */}
            {product.images && product.images.length > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <PhotoIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Imágenes ({product.images.length})
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {product.images.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.url}
                          alt={image.alt || `Imagen ${image.position}`}
                          className="h-24 w-full object-cover rounded-lg"
                        />
                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {image.position}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            {product.stats && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <ShoppingBagIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Estadísticas
                  </h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CubeIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Variantes</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{product.stats.total_variants}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ArchiveBoxIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Stock total</span>
                    </div>
                    <span className={`text-sm font-medium ${product.stats.total_stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {product.stats.total_stock}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShoppingBagIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Vendidos</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{product.stats.total_sold}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CurrencyEuroIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Ingresos</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      €{(product.stats.revenue_cents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Acciones Rápidas</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <button
                  onClick={() => router.push(`/admin/orders?product=${product.id}`)}
                  className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md"
                >
                  Ver pedidos de este producto
                </button>
                <button
                  onClick={() => window.open(`/products/${product.slug}`, '_blank')}
                  className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md"
                >
                  Ver en la tienda
                </button>
                <button
                  onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                  className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md"
                >
                  Editar producto
                </button>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Información</h3>
              </div>
              <div className="px-6 py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fecha de creación</span>
                  <span className="text-gray-900">{new Date(product.created_at).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Última actualización</span>
                  <span className="text-gray-900">{new Date(product.updated_at).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ID del producto</span>
                  <span className="text-gray-900 font-mono text-xs">{product.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}