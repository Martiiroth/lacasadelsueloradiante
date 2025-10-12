'use client'

import { useState, useEffect } from 'react'
import { AdminService } from '@/lib/adminService'
import { BrandService } from '@/lib/brands'
import type { CreateProductData, CreateVariantData, AdminCategory, VariantRolePrice, ResourceData } from '@/types/admin'
import type { Brand } from '@/types/brands'
import ImageUpload, { type ImageData } from '@/components/admin/ImageUpload'
import RolePriceManager from '@/components/admin/RolePriceManager'
import ResourceManager from '@/components/admin/ResourceManager'
import { ArrowLeftIcon, CubeIcon, TagIcon, PhotoIcon, CheckIcon, PlusIcon, MinusIcon, XMarkIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CreateProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [images, setImages] = useState<ImageData[]>([])
  const [resources, setResources] = useState<ResourceData[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Omit<CreateProductData, 'images'>>({
    slug: '',
    title: '',
    short_description: '',
    description: '',
    is_new: false,
    is_on_sale: false,
    meta_title: '',
    meta_description: '',
    brand_id: '',
    variants: [{
      sku: '',
      title: 'Variante por defecto',
      price_public_cents: 0,
      stock: 0,
      weight_grams: 0,
      images: [],
      role_prices: []
    }],
    categories: []
  })

  // Estado para mostrar valores vacíos en inputs mientras no se haya introducido nada
  const [displayValues, setDisplayValues] = useState<{
    [variantIndex: number]: {
      price?: string
      stock?: string
      weight?: string
    }
  }>({})

  useEffect(() => {
    loadCategories()
    loadBrands()
  }, [])

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

  const loadBrands = async () => {
    try {
      setLoadingBrands(true)
      const result = await BrandService.getBrands({ is_active: true })
      setBrands(result.brands)
    } catch (error) {
      console.error('Error loading brands:', error)
    } finally {
      setLoadingBrands(false)
    }
  }

  const generateSlug = () => {
    if (formData.title) {
      const slug = AdminService.generateProductHandle(formData.title)
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setError('El título es obligatorio')
      return
    }

    if (!formData.slug.trim()) {
      setError('El slug es obligatorio')
      return
    }

    if (!formData.categories || formData.categories.length === 0) {
      setError('Debes seleccionar al menos una categoría')
      return
    }

    if (formData.variants.length === 0 || formData.variants.every(v => v.price_public_cents <= 0)) {
      setError('Debe haber al menos una variante con precio mayor a 0')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Convert images to CreateImageData format
      const imageData = images.map((img, index) => ({
        url: img.url,
        alt: img.alt || '',
        position: index
      }))

      const productData: CreateProductData = {
        ...formData,
        images: imageData,
        resources: resources
      }

      const productId = await AdminService.createProduct(productData)
      if (productId) {
        router.push('/admin/products')
      }
    } catch (error: any) {
      setError(error.message || 'Error al crear el producto')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleVariantChange = (index: number, field: keyof CreateVariantData, value: any) => {
    const updatedVariants = [...formData.variants]
    updatedVariants[index] = { ...updatedVariants[index], [field]: value }
    setFormData(prev => ({ ...prev, variants: updatedVariants }))
  }

  const handleVariantImagesChange = (index: number, images: ImageData[]) => {
    handleVariantChange(index, 'images', images)
  }

  const handleRolePricesChange = (index: number, rolePrices: VariantRolePrice[]) => {
    handleVariantChange(index, 'role_prices', rolePrices)
  }

  const addVariant = () => {
    const newIndex = formData.variants.length
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        sku: '',
        title: `Variante ${prev.variants.length + 1}`,
        price_public_cents: 0,
        stock: 0,
        weight_grams: 0,
        images: [],
        role_prices: []
      }]
    }))
    // Inicializar valores de display vacíos para la nueva variante
    setDisplayValues(prev => ({
      ...prev,
      [newIndex]: { price: '', stock: '', weight: '' }
    }))
  }

  const removeVariant = (index: number) => {
    if (formData.variants.length > 1) {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index)
      }))
    }
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        categories: [...(prev.categories || []), categoryId]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        categories: (prev.categories || []).filter(id => id !== categoryId)
      }))
    }
  }

  const handleBrandChange = (brandId: string) => {
    setFormData(prev => ({
      ...prev,
      brand_id: brandId || undefined
    }))
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
              <CubeIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Crear Nuevo Producto
              </h1>
              <p className="mt-2 text-gray-600">
                Añade un nuevo producto al catálogo con imágenes y variantes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Product Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CubeIcon className="h-5 w-5 mr-2 text-gray-400" />
              Información Básica
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Información principal del producto
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Título del Producto *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Ej: Suelo radiante por agua"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug (URL) *
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="slug"
                    id="slug"
                    required
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    className="flex-1 block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                    placeholder="suelo-radiante-por-agua"
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

              <div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      id="is_new"
                      name="is_new"
                      type="checkbox"
                      checked={formData.is_new}
                      onChange={(e) => handleChange('is_new', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_new" className="ml-2 block text-sm text-gray-900">
                      Producto nuevo
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="is_on_sale"
                      name="is_on_sale"  
                      type="checkbox"
                      checked={formData.is_on_sale}
                      onChange={(e) => handleChange('is_on_sale', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_on_sale" className="ml-2 block text-sm text-gray-900">
                      En oferta
                    </label>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="short_description" className="block text-sm font-medium text-gray-700">
                  Descripción Corta
                </label>
                <textarea
                  name="short_description"
                  id="short_description"
                  rows={2}
                  value={formData.short_description}
                  onChange={(e) => handleChange('short_description', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Breve descripción que aparecerá en listados..."
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción Completa
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Descripción detallada del producto..."
                />
              </div>

              <div>
                <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700">
                  Meta Título (SEO)
                </label>
                <input
                  type="text"
                  name="meta_title"
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => handleChange('meta_title', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Título para motores de búsqueda"
                />
              </div>

              <div>
                <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700">
                  Meta Descripción (SEO)
                </label>
                <input
                  type="text"
                  name="meta_description"
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => handleChange('meta_description', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Descripción para motores de búsqueda"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <PhotoIcon className="h-5 w-5 mr-2 text-gray-400" />
              Imágenes del Producto
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Sube imágenes del producto (máximo 10). Puedes reordenarlas arrastrando.
            </p>
          </div>
          <div className="px-6 py-4">
            <ImageUpload images={images} onChange={setImages} />
          </div>
        </div>

        {/* Product Variants */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CubeIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Variantes del Producto
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Define las diferentes opciones y precios del producto
                </p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Añadir Variante
              </button>
            </div>
          </div>
          <div className="px-6 py-4 space-y-6">
            {formData.variants.map((variant, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">
                    Variante {index + 1}
                  </h4>
                  {formData.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Título de la Variante *
                    </label>
                    <input
                      type="text"
                      value={variant.title}
                      onChange={(e) => handleVariantChange(index, 'title', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Ej: Pequeño, Mediano, Grande"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                      placeholder="Código único"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Precio Público (€) *
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={displayValues[index]?.price ?? (variant.price_public_cents > 0 ? (variant.price_public_cents / 100).toFixed(2) : '')}
                      onChange={(e) => {
                        const value = e.target.value
                        setDisplayValues(prev => ({
                          ...prev,
                          [index]: { ...prev[index], price: value }
                        }))
                        // Solo actualizar si es un número válido o vacío
                        const numValue = parseFloat(value.replace(',', '.'))
                        if (!isNaN(numValue) && numValue >= 0) {
                          handleVariantChange(index, 'price_public_cents', Math.round(numValue * 100))
                        } else if (value === '' || value === '0') {
                          handleVariantChange(index, 'price_public_cents', 0)
                        }
                      }}
                      onBlur={(e) => {
                        // Al salir del campo, formatear el valor
                        const numValue = parseFloat(e.target.value.replace(',', '.'))
                        if (!isNaN(numValue) && numValue > 0) {
                          setDisplayValues(prev => ({
                            ...prev,
                            [index]: { ...prev[index], price: numValue.toFixed(2) }
                          }))
                        } else {
                          setDisplayValues(prev => ({
                            ...prev,
                            [index]: { ...prev[index], price: '' }
                          }))
                        }
                      }}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="123.42"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Precio en euros (ej: 123.42)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Stock
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={displayValues[index]?.stock ?? (variant.stock > 0 ? variant.stock.toString() : '')}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '') // Solo números
                        setDisplayValues(prev => ({
                          ...prev,
                          [index]: { ...prev[index], stock: value }
                        }))
                        handleVariantChange(index, 'stock', parseInt(value || '0'))
                      }}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Peso (gramos)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={displayValues[index]?.weight ?? ((variant.weight_grams && variant.weight_grams > 0) ? variant.weight_grams.toString() : '')}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '') // Solo números
                        setDisplayValues(prev => ({
                          ...prev,
                          [index]: { ...prev[index], weight: value }
                        }))
                        handleVariantChange(index, 'weight_grams', parseInt(value || '0'))
                      }}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="500"
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

        {/* Categories */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <TagIcon className="h-5 w-5 mr-2 text-gray-400" />
              Categorías *
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Selecciona al menos una categoría para este producto
            </p>
          </div>
          <div className="px-6 py-4">
            {loadingCategories ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : categories.length > 0 ? (
              <div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center">
                      <input
                        id={`category-${category.id}`}
                        type="checkbox"
                        checked={(formData.categories || []).includes(category.id)}
                        onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`category-${category.id}`} className="ml-2 block text-sm text-gray-900">
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Seleccionadas: <span className="font-medium text-indigo-600">
                    {formData.categories?.length || 0}
                  </span>
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  No hay categorías disponibles. Crea categorías primero.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Brand Selection */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BuildingStorefrontIcon className="h-5 w-5 mr-2 text-gray-400" />
              Marca
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Selecciona la marca del producto (opcional)
            </p>
          </div>
          <div className="px-6 py-4">
            {loadingBrands ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Option: No brand */}
                  <div className="relative">
                    <input
                      id="brand-none"
                      type="radio"
                      name="brand"
                      value=""
                      checked={!formData.brand_id}
                      onChange={(e) => handleBrandChange(e.target.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="brand-none" className="ml-2 block text-sm text-gray-900">
                      Sin marca específica
                    </label>
                  </div>
                  
                  {/* Brand options */}
                  {brands.map((brand) => (
                    <div key={brand.id} className="relative">
                      <input
                        id={`brand-${brand.id}`}
                        type="radio"
                        name="brand"
                        value={brand.id}
                        checked={formData.brand_id === brand.id}
                        onChange={(e) => handleBrandChange(e.target.value)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <label htmlFor={`brand-${brand.id}`} className="ml-2 flex items-center text-sm text-gray-900">
                        {brand.logo_url && (
                          <img
                            src={brand.logo_url}
                            alt={`${brand.name} logo`}
                            className="w-6 h-6 object-contain mr-2 bg-gray-100 rounded p-0.5"
                          />
                        )}
                        {brand.name}
                      </label>
                    </div>
                  ))}
                </div>
                
                {brands.length === 0 && (
                  <div className="text-center py-8">
                    <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      No hay marcas disponibles.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Crea marcas desde el panel de administración.
                    </p>
                  </div>
                )}

                {formData.brand_id && (
                  <p className="mt-3 text-xs text-gray-500">
                    Marca seleccionada: <span className="font-medium text-indigo-600">
                      {brands.find(b => b.id === formData.brand_id)?.name || 'Desconocida'}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Product Resources */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <ResourceManager resources={resources} onChange={setResources} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando producto...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Crear producto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}