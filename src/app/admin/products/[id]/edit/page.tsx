'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AdminProduct, UpdateProductData, UpdateVariantData, ResourceData, AdminCategory } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'
import ImageUpload, { ImageData } from '@/components/admin/ImageUpload'
import RolePriceManager from '@/components/admin/RolePriceManager'
import ResourceManager from '@/components/admin/ResourceManager'
import { VariantImageService, type VariantImageData } from '@/lib/variantImageService'
import type { VariantRolePrice } from '@/types/admin'
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  PhotoIcon,
  TagIcon
} from '@heroicons/react/24/outline'

export default function EditProduct() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  // Form data
  const [formData, setFormData] = useState<UpdateProductData>({
    slug: '',
    title: '',
    short_description: '',
    description: '',
    is_new: false,
    is_on_sale: false,
    meta_title: '',
    meta_description: ''
  })

  const [variants, setVariants] = useState<UpdateVariantData[]>([])
  const [images, setImages] = useState<ImageData[]>([])
  const [resources, setResources] = useState<ResourceData[]>([])

  useEffect(() => {
    loadProduct()
    loadCategories()
  }, [productId])

  const loadCategories = async () => {
    try {
      setLoadingCategories(true)
      const categoriesData = await AdminService.getAllCategories(undefined, 100)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadProduct = async () => {
    try {
      setLoading(true)
      console.log('🔍 Loading product with ID:', productId)
      const foundProduct = await AdminService.getProduct(productId)
      
      console.log('📊 Product loaded:', foundProduct ? foundProduct.title : 'null')
      
      if (!foundProduct) {
        console.error('❌ Product not found for ID:', productId)
        setError('Producto no encontrado')
        return
      }

      setProduct(foundProduct)
      
      // Initialize form data
      setFormData({
        slug: foundProduct.slug,
        title: foundProduct.title,
        short_description: foundProduct.short_description || '',
        description: foundProduct.description || '',
        is_new: foundProduct.is_new,
        is_on_sale: foundProduct.is_on_sale,
        meta_title: foundProduct.meta_title || '',
        meta_description: foundProduct.meta_description || ''
      })

      // Initialize variants with their images
      if (foundProduct.variants) {
        const variantsWithImages = await Promise.all(
          foundProduct.variants.map(async (variant) => {
            const variantImages = await VariantImageService.getVariantImages(variant.id)
            const imageData = VariantImageService.convertToImageData(variantImages)
            
            // Obtener precios por role
            const { data: rolePrices } = await supabase
              .from('role_prices')
              .select(`
                price_cents,
                customer_roles (name)
              `)
              .eq('variant_id', variant.id)
            
            const rolePricesData: VariantRolePrice[] = (rolePrices || []).map((rp: any) => ({
              role_name: rp.customer_roles.name,
              price_cents: rp.price_cents
            }))
            
            return {
              id: variant.id,
              sku: variant.sku || '',
              title: variant.title || '',
              price_public_cents: variant.price_public_cents,
              stock: variant.stock,
              weight_grams: variant.weight_grams || 0,
              dimensions: variant.dimensions,
              images: imageData,
              role_prices: rolePricesData
            }
          })
        )
        setVariants(variantsWithImages)
      }

      // Initialize images
      if (foundProduct.images) {
        setImages(foundProduct.images.map(img => ({
          id: img.id,
          url: img.url,
          alt: img.alt || '',
          position: img.position || 0
        })))
      }

      // Initialize resources
      if (foundProduct.resources) {
        setResources(foundProduct.resources.map((resource: any) => ({
          id: resource.id,
          type: resource.type,
          name: resource.label || '',
          url: resource.url,
          description: '' // No existe en BD, solo para interfaz
        })))
      }

      // Initialize categories
      if (foundProduct.categories) {
        const categoryIds = foundProduct.categories.map(c => c.category.id)
        setSelectedCategories(categoryIds)
      }
    } catch (err) {
      console.error('Error loading product:', err)
      setError('Error al cargar el producto')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate required fields
      if (!formData.title?.trim()) {
        throw new Error('El título es obligatorio')
      }

      if (!formData.slug?.trim()) {
        throw new Error('El slug es obligatorio')
      }

      if (variants.length === 0) {
        throw new Error('Debe haber al menos una variante')
      }

      // Update product
      const success = await AdminService.updateProduct(productId, formData)
      
      if (!success) {
        throw new Error('Error al actualizar el producto')
      }

      // Update variants
      const variantPromises = variants.map(async (variant, index) => {
        try {
          if (variant.id) {
            // Update existing variant
            console.log(`Updating variant ${index + 1}:`, variant.id)
            return AdminService.updateProductVariant(variant.id, variant)
          } else {
            // Create new variant
            const { id, ...variantData } = variant
            console.log(`Creating new variant ${index + 1}`)
            return AdminService.createProductVariant(productId, variantData)
          }
        } catch (error) {
          console.error(`Error processing variant ${index + 1}:`, error)
          return false
        }
      })

      const variantResults = await Promise.all(variantPromises)
      const failedVariants = variantResults.filter(result => result === false || result === null)
      
      if (failedVariants.length > 0) {
        console.error('Failed variants:', failedVariants)
        throw new Error(`Error al actualizar ${failedVariants.length} de ${variants.length} variantes`)
      }

      // Update images
      try {
        await AdminService.updateProductImages(productId, images)
      } catch (imageError: any) {
        console.error('Image update error:', imageError)
        throw new Error(`Error al actualizar las imágenes: ${imageError.message}`)
      }

      // Update resources
      try {
        await AdminService.updateProductResources(productId, resources)
      } catch (resourceError: any) {
        console.error('Resource update error:', resourceError)
        throw new Error(`Error al actualizar los recursos: ${resourceError.message}`)
      }

      // Update variant images (role prices are handled in AdminService.updateProductVariant)
      for (const variant of variants) {
        if (variant.id) {
          // Update variant images
          if (variant.images) {
            try {
              const variantImageData = VariantImageService.convertFromImageData(variant.images, variant.id)
              await VariantImageService.updateVariantImages(variant.id, variantImageData)
            } catch (variantImageError: any) {
              console.error('Variant image update error:', variantImageError)
              throw new Error(`Error al actualizar las imágenes de la variante: ${variantImageError.message}`)
            }
          }
        }
      }

      // Update categories
      try {
        await AdminService.updateProductCategories(productId, selectedCategories)
      } catch (categoryError: any) {
        console.error('Category update error:', categoryError)
        throw new Error(`Error al actualizar las categorías: ${categoryError.message}`)
      }
      
      setSuccess(true)
      setTimeout(() => {
        router.push(`/admin/products/${productId}`)
      }, 1500)

    } catch (err) {
      console.error('Error updating product:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar el producto')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof UpdateProductData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleVariantChange = (index: number, field: keyof UpdateVariantData, value: any) => {
    const updatedVariants = [...variants]
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value
    }
    setVariants(updatedVariants)
  }

  const handleVariantImagesChange = (index: number, images: ImageData[]) => {
    handleVariantChange(index, 'images', images)
  }

  const handleRolePricesChange = (index: number, rolePrices: VariantRolePrice[]) => {
    handleVariantChange(index, 'role_prices', rolePrices)
  }

  const addVariant = () => {
    setVariants(prev => [...prev, {
      sku: '',
      title: '',
      price_public_cents: 0,
      stock: 0,
      weight_grams: 0,
      dimensions: null,
      images: [],
      role_prices: []
    }])
  }

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId])
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId))
    }
  }

  const generateSlug = () => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
      
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

  if (error && !product) {
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
              onClick={() => router.push('/admin/products')}
              className="text-indigo-600 hover:text-indigo-500"
            >
              Volver a productos
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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/products')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver a productos
            </button>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
            <p className="text-gray-600">Modifica la información del producto y sus variantes</p>
            {success && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Producto actualizado correctamente
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
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Título *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
              </div>

              <div className="md:col-span-2">
                <label htmlFor="short_description" className="block text-sm font-medium text-gray-700">
                  Descripción Corta
                </label>
                <textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción Completa
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Flags */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  id="is_new"
                  type="checkbox"
                  checked={formData.is_new}
                  onChange={(e) => handleInputChange('is_new', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_new" className="ml-3 text-sm text-gray-700">
                  Producto nuevo
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="is_on_sale"
                  type="checkbox"
                  checked={formData.is_on_sale}
                  onChange={(e) => handleInputChange('is_on_sale', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_on_sale" className="ml-3 text-sm text-gray-700">
                  En oferta
                </label>
              </div>
            </div>
          </div>

          {/* SEO Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">SEO</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700">
                  Meta Título
                </label>
                <input
                  type="text"
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => handleInputChange('meta_title', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700">
                  Meta Descripción
                </label>
                <textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Variantes</h2>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Agregar Variante
              </button>
            </div>

            <div className="space-y-6">
              {variants.map((variant, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      Variante {index + 1}
                    </h3>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Título
                      </label>
                      <input
                        type="text"
                        value={variant.title}
                        onChange={(e) => handleVariantChange(index, 'title', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Precio Público (céntimos) *
                      </label>
                      <input
                        type="number"
                        value={variant.price_public_cents}
                        onChange={(e) => handleVariantChange(index, 'price_public_cents', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        min="0"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Precio base para clientes sin descuentos especiales
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Stock *
                      </label>
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Peso (gramos)
                      </label>
                      <input
                        type="number"
                        value={variant.weight_grams || 0}
                        onChange={(e) => handleVariantChange(index, 'weight_grams', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Role Prices */}
                  <div className="mt-6">
                    <RolePriceManager
                      rolePrices={variant.role_prices || []}
                      publicPrice={variant.price_public_cents || 0}
                      onChange={(rolePrices) => handleRolePricesChange(index, rolePrices)}
                    />
                  </div>

                  {/* Variant Images */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Imágenes de la Variante
                    </label>
                    <p className="text-xs text-gray-500 mb-4">
                      Estas imágenes se mostrarán cuando se seleccione esta variante. Si no hay imágenes, se usarán las imágenes generales del producto.
                    </p>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <ImageUpload 
                        images={variant.images || []} 
                        onChange={(images) => handleVariantImagesChange(index, images)}
                        maxImages={5}
                        maxFileSize={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Images */}
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <PhotoIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Imágenes del Producto
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Gestiona las imágenes del producto (máximo 10). Puedes reordenarlas arrastrando.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ImageUpload images={images} onChange={setImages} />
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <TagIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Categorías
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Selecciona las categorías a las que pertenece este producto
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <input
                      id={`category-${category.id}`}
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`category-${category.id}`} className="ml-2 block text-sm text-gray-900">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Resources */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ResourceManager resources={resources} onChange={setResources} />
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
              onClick={() => router.push(`/admin/products/${productId}`)}
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