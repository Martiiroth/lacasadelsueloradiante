'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AdminCategory, UpdateCategoryData } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  ArrowLeftIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  FolderIcon
} from '@heroicons/react/24/outline'

export default function EditCategory() {
  const router = useRouter()
  const params = useParams()
  const categoryId = params.id as string

  const [category, setCategory] = useState<AdminCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [parentCategories, setParentCategories] = useState<AdminCategory[]>([])

  // Form data
  const [formData, setFormData] = useState<UpdateCategoryData>({
    name: '',
    slug: '',
    parent_id: undefined
  })

  useEffect(() => {
    loadCategory()
    loadParentCategories()
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
      
      // Initialize form data
      setFormData({
        name: data.name,
        slug: data.slug,
        parent_id: data.parent_id || undefined
      })
    } catch (err) {
      console.error('Error loading category:', err)
      setError('Error al cargar la categoría')
    } finally {
      setLoading(false)
    }
  }

  const loadParentCategories = async () => {
    try {
      const data = await AdminService.getAllCategories(undefined, 100)
      // Filter out the current category and its children to prevent circular references
      const availableParents = data.filter(cat => 
        cat.id !== categoryId && 
        cat.parent_id !== categoryId &&
        !cat.parent_id // Only top-level categories as parents for simplicity
      )
      setParentCategories(availableParents)
    } catch (err) {
      console.error('Error loading parent categories:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate required fields
      if (!formData.name?.trim()) {
        throw new Error('El nombre es obligatorio')
      }

      if (!formData.slug?.trim()) {
        throw new Error('El slug es obligatorio')
      }

      // Update category
      const success = await AdminService.updateCategory(categoryId, formData)
      
      if (!success) {
        throw new Error('Error al actualizar la categoría')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/categories')
      }, 1500)

    } catch (err) {
      console.error('Error updating category:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar la categoría')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof UpdateCategoryData, value: any) => {
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error && !category) {
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
              Editar Categoría
            </h1>
            <p className="text-gray-600">Modifica la información de la categoría</p>
            {success && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Categoría actualizada correctamente
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

          {/* Statistics */}
          {category && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Estadísticas</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {category.stats?.total_products || 0}
                  </div>
                  <div className="text-sm text-blue-800">Productos</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {category.stats?.total_subcategories || 0}
                  </div>
                  <div className="text-sm text-green-800">Subcategorías</div>
                </div>
              </div>
            </div>
          )}

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
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}