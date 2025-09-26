'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreateCategoryData, AdminCategory } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  ArrowLeftIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  FolderIcon
} from '@heroicons/react/24/outline'

export default function CreateCategory() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [parentCategories, setParentCategories] = useState<AdminCategory[]>([])

  // Form data
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    slug: '',
    parent_id: undefined
  })

  useEffect(() => {
    loadParentCategories()
  }, [])

  const loadParentCategories = async () => {
    try {
      const data = await AdminService.getAllCategories(undefined, 100)
      // Filter out subcategories for simplified hierarchy (only top-level categories as parents)
      const topLevelCategories = data.filter(cat => !cat.parent_id)
      setParentCategories(topLevelCategories)
    } catch (err) {
      console.error('Error loading parent categories:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('El nombre es obligatorio')
      }

      if (!formData.slug.trim()) {
        throw new Error('El slug es obligatorio')
      }

      // Create category
      const categoryId = await AdminService.createCategory(formData)
      
      if (!categoryId) {
        throw new Error('Error al crear la categoría')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/categories')
      }, 1500)

    } catch (err) {
      console.error('Error creating category:', err)
      setError(err instanceof Error ? err.message : 'Error al crear la categoría')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateCategoryData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generateSlug = () => {
    if (formData.name) {
      const slug = AdminService.generateCategorySlug(formData.name)
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/categories')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver a categorías
            </button>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FolderIcon className="h-8 w-8 mr-3 text-indigo-600" />
              Nueva Categoría
            </h1>
            <p className="text-gray-600">Crea una nueva categoría de productos</p>
            {success && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Categoría creada correctamente
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Información Básica</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: Suelos Radiantes"
                  required
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug *
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="suelos-radiantes"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                  >
                    Generar
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  URL amigable para la categoría (solo letras, números y guiones)
                </p>
              </div>

              <div>
                <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
                  Categoría Padre
                </label>
                <select
                  id="parent_id"
                  value={formData.parent_id || ''}
                  onChange={(e) => handleInputChange('parent_id', e.target.value || undefined)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Sin categoría padre (categoría principal)</option>
                  {parentCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Selecciona una categoría padre para crear una subcategoría
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/admin/categories')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}