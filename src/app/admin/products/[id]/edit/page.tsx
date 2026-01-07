/**
 * Página de edición de producto
 * 
 * ✅ MIGRADO A ARQUITECTURA SUPABASE SSR
 * Usa cliente browser compatible (lib/supabase.ts wrapper)
 * 
 * Client Component con auto-save y auto-recuperación
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AdminProduct, UpdateProductData, UpdateVariantData, ResourceData, AdminCategory } from '@/types/admin'
import { Brand } from '@/types/brands'
import { AdminService } from '@/lib/adminService'
import { BrandService } from '@/lib/brands'
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
  TagIcon,
  BuildingStorefrontIcon
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
  const [autoRecovered, setAutoRecovered] = useState(false)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  const [loadingBrands, setLoadingBrands] = useState(false)

  // Form data
  const [formData, setFormData] = useState<UpdateProductData>({
    slug: '',
    title: '',
    short_description: '',
    description: '',
    is_new: false,
    is_on_sale: false,
    meta_title: '',
    meta_description: '',
    brand_id: ''
  })

  const [variants, setVariants] = useState<UpdateVariantData[]>([])
  const [images, setImages] = useState<ImageData[]>([])
  const [resources, setResources] = useState<ResourceData[]>([])

  // Estado para mostrar valores vacíos en inputs mientras no se haya introducido nada
  const [displayValues, setDisplayValues] = useState<{
    [variantIndex: number]: {
      price?: string
      stock?: string
      weight?: string
    }
  }>({})

  // Auto-guardado del formulario en localStorage
  const AUTOSAVE_KEY = `product_edit_autosave_${productId}`
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Guardar estado del formulario en localStorage cuando cambia
  useEffect(() => {
    // NO auto-guardar si se está guardando (evita conflictos)
    if (!loading && product && !saving) {
      const autosaveData = {
        formData,
        variants,
        images,
        resources,
        selectedCategories,
        timestamp: Date.now()
      }
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosaveData))
      setHasUnsavedChanges(true)
      console.log('💾 Auto-guardado realizado')
    }
  }, [formData, variants, images, resources, selectedCategories, loading, product, saving])

  // Recuperar cambios automáticamente al volver a la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      // NO recuperar si se está guardando (evita conflictos)
      if (saving) {
        console.log('⏸️ Guardando... ignorando recuperación automática')
        return
      }

      if (!document.hidden && product && hasUnsavedChanges) {
        console.log('👁️ Pestaña visible - Verificando auto-guardado...')
        
        const autosaveData = localStorage.getItem(AUTOSAVE_KEY)
        if (autosaveData) {
          try {
            const parsed = JSON.parse(autosaveData)
            const autosaveAge = Date.now() - parsed.timestamp
            
            // Si hay cambios recientes (menos de 1 hora)
            if (autosaveAge < 3600000) {
              const autosaveAgeMinutes = Math.floor(autosaveAge / 60000)
              const autosaveAgeSeconds = Math.floor(autosaveAge / 1000)
              
              console.log(`🔄 Auto-guardado encontrado (${autosaveAgeSeconds}s ago)`)
              
              // Recuperar automáticamente sin preguntar
              setFormData(parsed.formData)
              setVariants(parsed.variants)
              setImages(parsed.images)
              setResources(parsed.resources)
              setSelectedCategories(parsed.selectedCategories)
              
              console.log('✅ Cambios recuperados automáticamente')
              
              // Mostrar notificación temporal
              setAutoRecovered(true)
              setTimeout(() => setAutoRecovered(false), 4000)
            }
          } catch (error) {
            console.error('Error recuperando auto-guardado:', error)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [product, hasUnsavedChanges, saving, AUTOSAVE_KEY])

  // Limpiar auto-guardado al desmontar o al guardar exitosamente
  useEffect(() => {
    return () => {
      // Solo limpiamos si el componente se desmonta completamente
      // No si es por cambio de pestaña (que no desmonta en Next.js)
    }
  }, [])

  useEffect(() => {
    loadProduct()
    loadCategories()
    loadBrands()
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
      
      // Verificar si hay datos auto-guardados
      const autosaveData = localStorage.getItem(AUTOSAVE_KEY)
      const hasAutosave = autosaveData !== null
      
      if (hasAutosave) {
        try {
          const parsed = JSON.parse(autosaveData)
          const autosaveAge = Date.now() - parsed.timestamp
          const autosaveAgeMinutes = Math.floor(autosaveAge / 60000)
          
          // Si el auto-guardado es muy reciente (menos de 30 segundos), ignorarlo
          // Probablemente es de la recuperación automática, no cambios reales del usuario
          if (autosaveAge < 30000) {
            console.log('🔄 Auto-guardado muy reciente (<30s), ignorando y limpiando')
            localStorage.removeItem(AUTOSAVE_KEY)
          }
          // Si el auto-guardado tiene menos de 1 hora pero más de 30 segundos, preguntar
          else if (autosaveAge < 3600000) { // 1 hora
            const confirmRestore = confirm(
              `🔄 Se encontraron cambios no guardados de hace ${autosaveAgeMinutes} minuto(s).\n\n` +
              `¿Deseas recuperar estos cambios?\n\n` +
              `• SÍ: Recuperar cambios no guardados\n` +
              `• NO: Cargar datos originales del producto`
            )
            
            if (confirmRestore) {
              console.log('✅ Recuperando datos auto-guardados')
              setFormData(parsed.formData)
              setVariants(parsed.variants)
              setImages(parsed.images)
              setResources(parsed.resources)
              setSelectedCategories(parsed.selectedCategories)
              setLoading(false)
              return // Salir sin cargar datos originales
            } else {
              console.log('❌ Usuario rechazó recuperar auto-guardado')
              localStorage.removeItem(AUTOSAVE_KEY)
            }
          } else {
            // Auto-guardado muy antiguo, eliminarlo
            console.log('🗑️ Auto-guardado muy antiguo, eliminando')
            localStorage.removeItem(AUTOSAVE_KEY)
          }
        } catch (parseError) {
          console.error('Error parsing autosave data:', parseError)
          localStorage.removeItem(AUTOSAVE_KEY)
        }
      }
      
      // Cargar datos originales del producto
      // Initialize form data
      setFormData({
        slug: foundProduct.slug,
        title: foundProduct.title,
        short_description: foundProduct.short_description || '',
        description: foundProduct.description || '',
        is_new: foundProduct.is_new,
        is_on_sale: foundProduct.is_on_sale,
        meta_title: foundProduct.meta_title || '',
        meta_description: foundProduct.meta_description || '',
        brand_id: foundProduct.brand_id || ''
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
    console.log('🚀 [GUARDAR] Iniciando proceso de guardado...')
    console.log('🚀 [GUARDAR] Estado inicial - saving:', saving)
    setSaving(true)
    console.log('🚀 [GUARDAR] setSaving(true) ejecutado')
    setError(null)
    setSuccess(false)

    try {
      console.log('🔍 [GUARDAR] Validando campos requeridos...')
      // Validate required fields
      if (!formData.title?.trim()) {
        throw new Error('El título es obligatorio')
      }

      if (!formData.slug?.trim()) {
        throw new Error('El slug es obligatorio')
      }
      console.log('✅ [GUARDAR] Validación exitosa')

      // Warning for products without categories (but allow saving)
      if (!selectedCategories || selectedCategories.length === 0) {
        console.log('⚠️ [GUARDAR] Producto sin categorías, solicitando confirmación...')
        const confirmSave = confirm('⚠️ Este producto no tiene ninguna categoría asignada.\n\nSe recomienda asignar al menos una categoría para una mejor organización.\n\n¿Deseas guardar de todos modos?')
        if (!confirmSave) {
          console.log('❌ [GUARDAR] Usuario canceló guardado (sin categorías)')
          setSaving(false)
          return
        }
        console.log('✅ [GUARDAR] Usuario confirmó guardado sin categorías')
      }

      if (variants.length === 0) {
        throw new Error('Debe haber al menos una variante')
      }
      console.log(`✅ [GUARDAR] ${variants.length} variante(s) para procesar`)

      // Update product
      console.log('📝 [GUARDAR] Actualizando producto...')
      const success = await AdminService.updateProduct(productId, formData)
      console.log('📝 [GUARDAR] Resultado updateProduct:', success)
      
      if (!success) {
        throw new Error('Error al actualizar el producto')
      }
      console.log('✅ [GUARDAR] Producto actualizado exitosamente')

      // Update variants
      console.log('📝 [GUARDAR] Actualizando variantes...')
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
      console.log('📝 [GUARDAR] Resultados de variantes:', variantResults)
      const failedVariants = variantResults.filter(result => result === false || result === null)
      
      if (failedVariants.length > 0) {
        console.error('❌ [GUARDAR] Failed variants:', failedVariants)
        throw new Error(`Error al actualizar ${failedVariants.length} de ${variants.length} variantes`)
      }
      console.log('✅ [GUARDAR] Todas las variantes actualizadas exitosamente')

      // Validar imágenes del producto antes de actualizar
      const uploadingProductImages = images.filter(img => img.uploading)
      if (uploadingProductImages.length > 0) {
        throw new Error('Espera a que todas las imágenes terminen de subirse antes de guardar')
      }
      
      // Filtrar imágenes válidas
      console.log('🔍 Validando imágenes del producto:', images.length, 'imágenes')
      const validProductImages = images.filter(img => {
        if (img.error) {
          console.log('❌ Imagen excluida por error:', img.url)
          return false
        }
        if (img.file) {
          console.log('❌ Imagen excluida por archivo pendiente:', img.url)
          return false
        }
        // Si tiene path, está subida y es válida (prioridad)
        if (img.path) {
          console.log('✅ Imagen válida (tiene path):', img.url)
          return true
        }
        // Excluir URLs blob temporales
        if (img.url && img.url.startsWith('blob:')) {
          console.log('❌ Imagen excluida por blob URL:', img.url)
          return false
        }
        // Aceptar URLs válidas (HTTP/HTTPS)
        const isValid = img.url && 
               img.url.trim() !== '' && 
               (img.url.startsWith('http://') || img.url.startsWith('https://'))
        
        if (isValid) {
          console.log('✅ Imagen válida (URL válida):', img.url)
        } else {
          console.log('❌ Imagen excluida (URL inválida):', img.url)
        }
        
        return isValid
      })
      
      console.log(`📊 Imágenes del producto: ${images.length} total, ${validProductImages.length} válidas`)

      // Update images
      console.log('🖼️ [GUARDAR] Actualizando imágenes del producto...')
      try {
        await AdminService.updateProductImages(productId, validProductImages)
        console.log('✅ [GUARDAR] Imágenes actualizadas exitosamente')
      } catch (imageError: any) {
        console.error('❌ [GUARDAR] Image update error:', imageError)
        throw new Error(`Error al actualizar las imágenes: ${imageError.message}`)
      }

      // Update resources
      console.log('📄 [GUARDAR] Actualizando recursos del producto...')
      try {
        await AdminService.updateProductResources(productId, resources)
        console.log('✅ [GUARDAR] Recursos actualizados exitosamente')
      } catch (resourceError: any) {
        console.error('❌ [GUARDAR] Resource update error:', resourceError)
        throw new Error(`Error al actualizar los recursos: ${resourceError.message}`)
      }

      // Validar y actualizar imágenes de variantes
      console.log('🖼️ [GUARDAR] Validando y actualizando imágenes de variantes...')
      
      // Primero validar que no haya imágenes subiendo
      const variantImagesUploading = variants.some((variant) => {
        if (!variant.images || variant.images.length === 0) return false
        return variant.images.some((img: ImageData) => {
          // Si tiene path, está subida (válida)
          if (img.path) return false
          // Verificar si está subiendo o tiene errores
          return img.uploading || img.error || img.file || (img.url && img.url.startsWith('blob:'))
        })
      })
      
      if (variantImagesUploading) {
        throw new Error('Espera a que todas las imágenes de las variantes terminen de subirse antes de guardar')
      }
      
      // Actualizar imágenes de variantes
      for (const variant of variants) {
        if (variant.id) {
          // Update variant images
          if (variant.images && variant.images.length > 0) {
            try {
              // Filtrar solo imágenes válidas
              const validVariantImages = variant.images.filter((img: ImageData) => {
                if (img.error) return false
                if (img.file) return false
                // Si tiene path, está subida y es válida (prioridad)
                if (img.path) return true
                // Excluir URLs blob temporales
                if (img.url && img.url.startsWith('blob:')) return false
                // Aceptar URLs válidas (HTTP/HTTPS)
                return img.url && 
                       img.url.trim() !== '' && 
                       (img.url.startsWith('http://') || img.url.startsWith('https://'))
              })
              
              if (validVariantImages.length > 0) {
                console.log(`🖼️ [GUARDAR] Procesando ${validVariantImages.length} imagen(es) válida(s) para variante ${variant.id}...`)
                const variantImageData = VariantImageService.convertFromImageData(validVariantImages, variant.id)
                await VariantImageService.updateVariantImages(variant.id, variantImageData)
                console.log(`✅ [GUARDAR] Imágenes de variante ${variant.id} actualizadas`)
              } else {
                console.log(`⚠️ [GUARDAR] No hay imágenes válidas para variante ${variant.id}, limpiando imágenes...`)
                // Si no hay imágenes válidas, limpiar todas las imágenes de la variante
                await VariantImageService.updateVariantImages(variant.id, [])
              }
            } catch (variantImageError: any) {
              console.error('❌ [GUARDAR] Variant image update error:', variantImageError)
              throw new Error(`Error al actualizar las imágenes de la variante: ${variantImageError.message}`)
            }
          } else {
            // Si no hay imágenes, limpiar todas las imágenes de la variante
            try {
              await VariantImageService.updateVariantImages(variant.id, [])
            } catch (error) {
              console.warn(`No se pudieron limpiar las imágenes de la variante ${variant.id}`)
            }
          }
        }
      }
      console.log('✅ [GUARDAR] Todas las imágenes de variantes actualizadas')

      // Update categories
      console.log('🏷️ [GUARDAR] Actualizando categorías...')
      try {
        await AdminService.updateProductCategories(productId, selectedCategories)
        console.log('✅ [GUARDAR] Categorías actualizadas exitosamente')
      } catch (categoryError: any) {
        console.error('❌ [GUARDAR] Category update error:', categoryError)
        throw new Error(`Error al actualizar las categorías: ${categoryError.message}`)
      }
      
      console.log('🎉 [GUARDAR] ¡Guardado completado exitosamente!')
      setSuccess(true)
      console.log('🎉 [GUARDAR] setSuccess(true) ejecutado')
      
      // Limpiar auto-guardado después de guardar exitosamente
      console.log('🧹 [GUARDAR] Limpiando auto-guardado...')
      localStorage.removeItem(AUTOSAVE_KEY)
      setHasUnsavedChanges(false)
      console.log('✅ [GUARDAR] Auto-guardado limpiado después de guardar')
      
      console.log('⏱️ [GUARDAR] Esperando 1.5s antes de redireccionar...')
      setTimeout(() => {
        console.log('🔄 [GUARDAR] Redireccionando a vista de producto...')
        router.push(`/admin/products/${productId}`)
      }, 1500)

    } catch (err) {
      console.error('❌ [GUARDAR] ERROR CRÍTICO:', err)
      console.error('❌ [GUARDAR] Stack trace:', err instanceof Error ? err.stack : 'No stack trace')
      setError(err instanceof Error ? err.message : 'Error al actualizar el producto')
    } finally {
      console.log('🏁 [GUARDAR] Bloque finally - Ejecutando setSaving(false)')
      console.log('🏁 [GUARDAR] Estado actual de saving antes del finally:', saving)
      setSaving(false)
      console.log('🏁 [GUARDAR] setSaving(false) ejecutado - proceso completado')
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
    const newIndex = variants.length
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
    // Inicializar valores de display vacíos para la nueva variante
    setDisplayValues(prev => ({
      ...prev,
      [newIndex]: { price: '', stock: '', weight: '' }
    }))
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

  const handleDiscardChanges = () => {
    const confirmDiscard = confirm(
      '⚠️ ¿Estás seguro de que deseas descartar todos los cambios?\n\n' +
      'Esta acción no se puede deshacer y se perderán todas las modificaciones realizadas.'
    )
    
    if (confirmDiscard) {
      localStorage.removeItem(AUTOSAVE_KEY)
      setHasUnsavedChanges(false)
      console.log('🗑️ Cambios descartados, recargando datos originales')
      loadProduct()
    }
  }

  const hasAutosave = () => {
    return localStorage.getItem(AUTOSAVE_KEY) !== null
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
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/admin/products')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver a productos
            </button>
            
            {hasAutosave() && !success && (
              <button
                onClick={handleDiscardChanges}
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Descartar cambios
              </button>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
                <p className="text-gray-600">Modifica la información del producto y sus variantes</p>
              </div>
              {hasAutosave() && !success && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <div className="animate-pulse h-2 w-2 bg-blue-600 rounded-full"></div>
                  <span>Cambios auto-guardados</span>
                </div>
              )}
            </div>
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
            {autoRecovered && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircleIcon className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">
                      ✨ Cambios no guardados recuperados automáticamente
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Tus modificaciones se han restaurado sin necesidad de refrescar la página
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
                        Precio Público (€) *
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={displayValues[index]?.price ?? ((variant.price_public_cents && variant.price_public_cents > 0) ? (variant.price_public_cents / 100).toFixed(2) : '')}
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        placeholder="123.42"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Precio en euros (ej: 123.42)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Stock *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={displayValues[index]?.stock ?? ((variant.stock !== undefined && variant.stock > 0) ? variant.stock.toString() : '')}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '') // Solo números
                          setDisplayValues(prev => ({
                            ...prev,
                            [index]: { ...prev[index], stock: value }
                          }))
                          handleVariantChange(index, 'stock', parseInt(value || '0'))
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <TagIcon className="h-5 w-5 mr-2 text-gray-400" />
                Categorías
                <span className="ml-2 text-xs text-amber-600 font-normal">(Recomendado)</span>
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecciona las categorías para este producto. Recomendado para mejor organización.
              </p>
            </div>
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
                <p className="mt-3 text-xs text-gray-500">
                  Seleccionadas: <span className="font-medium text-indigo-600">
                    {selectedCategories.length}
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

          {/* Brand Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BuildingStorefrontIcon className="h-5 w-5 mr-2 text-gray-400" />
                Marca
                <span className="ml-2 text-xs text-gray-600 font-normal">(Opcional)</span>
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecciona la marca del producto para mejor organización y filtrado.
              </p>
            </div>
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
                      onChange={(e) => handleInputChange('brand_id', e.target.value || undefined)}
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
                        onChange={(e) => handleInputChange('brand_id', e.target.value)}
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