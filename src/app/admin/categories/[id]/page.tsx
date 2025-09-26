'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AdminCategory } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  ArrowLeftIcon,
  ExclamationCircleIcon,
  FolderIcon,
  PencilIcon,
  TrashIcon,
  CubeIcon,
  TagIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

export default function CategoryDetail() {
  const router = useRouter()
  const params = useParams()
  const categoryId = params.id as string

  const [category, setCategory] = useState<AdminCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCategory()
  }, [categoryId])

  const loadCategory = async () => {
    try {
      setLoading(true)
      const data = await AdminService.getCategory(categoryId)
      
      if (!data) {
        setError('Categoría no encontrada')
        return
      }

      setCategory(data)
    } catch (err) {
      console.error('Error loading category:', err)
      setError('Error al cargar la categoría')
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async () => {
    if (!category) return
    
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`)) {
      return
    }
    
    try {
      const success = await AdminService.deleteCategory(category.id)
      
      if (success) {
        alert('Categoría eliminada correctamente')
        router.push('/admin/categories')
      } else {
        alert('Error al eliminar la categoría')
      }
    } catch (err) {
      console.error('Error deleting category:', err)
      if (err instanceof Error) {
        alert(err.message)
      } else {
        alert('Error al eliminar la categoría')
      }
    }
  }

  const renderCategoryHierarchy = (category: AdminCategory) => {
    return (
      <div className="flex items-center">
        {category.parent && (
          <>
            <span className="text-gray-500">{category.parent.name}</span>
            <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
          </>
        )}
        <span className="text-gray-900 font-medium">{category.name}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !category) {
    return (
      <AdminLayout>
        <div className="max-w-lg mx-auto mt-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/admin/categories')}
              className="text-indigo-600 hover:text-indigo-500"
            >
              Volver a categorías
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/categories')}
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Volver a categorías
              </button>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/admin/categories/${category.id}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={deleteCategory}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Eliminar
              </button>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FolderIcon className="h-8 w-8 mr-3 text-indigo-600" />
              Detalle de Categoría
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Información de la Categoría</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <div className="mt-1">
                    <div className="text-lg text-gray-900">{category.name}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Jerarquía</label>
                  <div className="mt-1">
                    {renderCategoryHierarchy(category)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Slug</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <TagIcon className="h-3 w-3 mr-1" />
                      {category.slug}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Creada</label>
                  <div className="mt-1 text-gray-900">
                    {new Date(category.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Última actualización</label>
                  <div className="mt-1 text-gray-900">
                    {new Date(category.updated_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Subcategories */}
            {category.children && category.children.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Subcategorías</h2>
                
                <div className="space-y-3">
                  {category.children.map(child => (
                    <div key={child.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <FolderIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{child.name}</span>
                      </div>
                      <button
                        onClick={() => router.push(`/admin/categories/${child.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        Ver detalles
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Estadísticas</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CubeIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {category.stats?.total_products || 0}
                      </div>
                      <div className="text-sm text-blue-800">Productos</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FolderIcon className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {category.stats?.total_subcategories || 0}
                      </div>
                      <div className="text-sm text-green-800">Subcategorías</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Acciones Rápidas</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/admin/categories/${category.id}/edit`)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Editar categoría
                </button>
                
                <button
                  onClick={() => router.push('/admin/categories/create')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FolderIcon className="h-4 w-4 mr-2" />
                  Nueva categoría
                </button>
                
                <button
                  onClick={() => router.push('/admin/products?category=' + category.id)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <CubeIcon className="h-4 w-4 mr-2" />
                  Ver productos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}