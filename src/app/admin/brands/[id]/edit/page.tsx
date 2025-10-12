'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UpdateBrandData, Brand } from '@/types/brands'
import { BrandService } from '@/lib/brands'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  ArrowLeftIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface EditBrandPageProps {
  params: {
    id: string
  }
}

export default function EditBrand({ params }: EditBrandPageProps) {
  const router = useRouter()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form data
  const [formData, setFormData] = useState<UpdateBrandData>({
    name: '',
    slug: '',
    description: '',
    logo_url: '',
    website: '',
    is_active: true
  })

  useEffect(() => {
    loadBrand()
  }, [params.id])

  const loadBrand = async () => {
    try {
      setLoading(true)
      const brandData = await BrandService.getBrandById(params.id)
      
      if (!brandData) {
        setError('Marca no encontrada')
        return
      }

      setBrand(brandData)
      setFormData({
        name: brandData.name,
        slug: brandData.slug,
        description: brandData.description || '',
        logo_url: brandData.logo_url || '',
        website: brandData.website || '',
        is_active: brandData.is_active
      })
    } catch (err) {
      console.error('Error loading brand:', err)
      setError('Error al cargar la marca')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
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

      // Update brand
      const updatedBrand = await BrandService.updateBrand(params.id, formData)
      
      if (!updatedBrand) {
        throw new Error('Error al actualizar la marca')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/brands')
      }, 1500)

    } catch (err) {
      console.error('Error updating brand:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar la marca')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof UpdateBrandData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-generate slug when name changes
    if (field === 'name' && value) {
      const newSlug = generateSlug(value)
      setFormData(prev => ({
        ...prev,
        slug: newSlug
      }))
    }
  }

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      logo_url: url
    }))
  }

  const handleImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      logo_url: ''
    }))
  }

  if (loading) {
    return (
      <AdminLayout activeSection="brands">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando marca...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error && !brand) {
    return (
      <AdminLayout activeSection="brands">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <button
                  onClick={() => router.push('/admin/brands')}
                  className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                >
                  Volver a marcas
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeSection="brands">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BuildingStorefrontIcon className="w-8 h-8 text-blue-600" />
            Editar Marca: {brand?.name}
          </h1>
          <p className="mt-2 text-gray-600">
            Modifica la información de la marca
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  ¡Marca actualizada exitosamente!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  Redirigiendo a la lista de marcas...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información Básica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Marca *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Apple, Samsung, Nike..."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="url-amigable-de-la-marca"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Se genera automáticamente del nombre. Solo letras, números y guiones.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe la marca y sus características..."
                />
              </div>

              <div className="mt-6">
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                  Sitio Web
                </label>
                <input
                  type="url"
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.marca.com"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <PhotoIcon className="w-5 h-5 text-gray-600" />
                Logo de la Marca
              </h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {formData.logo_url ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={formData.logo_url}
                        alt="Logo preview"
                        className="w-16 h-16 object-contain bg-gray-100 rounded-lg p-2"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Logo actual</p>
                        <p className="text-sm text-gray-500">Imagen lista para usar</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Sube el logo de la marca
                        </span>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              // Create temporary URL for preview
                              const url = URL.createObjectURL(file)
                              handleImageUpload(url)
                              // In production, upload to storage here
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG hasta 2MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Estado
              </h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Marca activa (visible en la tienda)
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}