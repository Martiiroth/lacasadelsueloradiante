'use client'

import { useState, useEffect } from 'react'
import { PhotoIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import ImageUpload, { ImageData } from './ImageUpload'
import { VariantImageService, type VariantImageData } from '@/lib/variantImageService'
import type { UpdateVariantData } from '@/types/admin'

interface VariantImageManagerProps {
  variants: UpdateVariantData[]
  onVariantImagesChange: (variantId: string, images: VariantImageData[]) => void
}

export default function VariantImageManager({ 
  variants, 
  onVariantImagesChange 
}: VariantImageManagerProps) {
  const [variantImages, setVariantImages] = useState<Record<string, ImageData[]>>({})
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({})
  const [loadingVariants, setLoadingVariants] = useState<string[]>([])

  // Load existing variant images when component mounts or variants change
  useEffect(() => {
    loadVariantImages()
  }, [variants])

  const loadVariantImages = async () => {
    const variantIds = variants.filter(v => v.id).map(v => v.id!)
    if (variantIds.length === 0) return

    setLoadingVariants(variantIds)

    try {
      const imagesByVariant = await VariantImageService.getAllVariantImages(variantIds)
      
      const convertedImages: Record<string, ImageData[]> = {}
      Object.entries(imagesByVariant).forEach(([variantId, images]) => {
        convertedImages[variantId] = VariantImageService.convertToImageData(images)
      })
      
      setVariantImages(convertedImages)
    } catch (error) {
      console.error('Error loading variant images:', error)
    } finally {
      setLoadingVariants([])
    }
  }

  const handleImageChange = (variantId: string, images: ImageData[]) => {
    // Update local state
    setVariantImages(prev => ({
      ...prev,
      [variantId]: images
    }))

    // Convert to VariantImageData and notify parent
    const variantImageData = VariantImageService.convertFromImageData(images, variantId)
    onVariantImagesChange(variantId, variantImageData)
  }

  const toggleVariantExpanded = (variantId: string) => {
    setExpandedVariants(prev => ({
      ...prev,
      [variantId]: !prev[variantId]
    }))
  }

  const getVariantDisplayName = (variant: UpdateVariantData) => {
    if (variant.title) return variant.title
    if (variant.sku) return `SKU: ${variant.sku}`
    return 'Variante sin nombre'
  }

  const getVariantImageCount = (variantId: string) => {
    return variantImages[variantId]?.length || 0
  }

  if (variants.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay variantes</h3>
        <p className="mt-1 text-sm text-gray-500">
          Crea variantes del producto para poder asignarles imágenes específicas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <PhotoIcon className="h-5 w-5 mr-2 text-gray-400" />
            Imágenes por Variante
          </h3>
          <p className="text-sm text-gray-500">
            Gestiona imágenes específicas para cada variante del producto.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {variants.length} variante{variants.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3">
        {variants.map((variant) => {
          if (!variant.id) return null // Skip new variants without ID
          
          const variantId = variant.id
          const isExpanded = expandedVariants[variantId]
          const isLoading = loadingVariants.includes(variantId)
          const imageCount = getVariantImageCount(variantId)
          
          return (
            <div 
              key={variantId} 
              className="border border-gray-200 rounded-lg bg-white overflow-hidden"
            >
              {/* Variant Header */}
              <div 
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleVariantExpanded(variantId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button" 
                      className="flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {getVariantDisplayName(variant)}
                      </h4>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        {variant.sku && (
                          <span>SKU: {variant.sku}</span>
                        )}
                        <span>€{((variant.price_public_cents || 0) / 100).toFixed(2)}</span>
                        <span>Stock: {variant.stock}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isLoading ? (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-gray-600"></div>
                        <span>Cargando...</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {imageCount} imagen{imageCount !== 1 ? 'es' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Variant Images */}
              {isExpanded && (
                <div className="p-4">
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Cargando imágenes...</p>
                    </div>
                  ) : (
                    <ImageUpload
                      images={variantImages[variantId] || []}
                      onChange={(images) => handleImageChange(variantId, images)}
                      maxImages={10}
                      maxFileSize={5}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <PhotoIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Imágenes por Variante
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Cada variante puede tener sus propias imágenes específicas</li>
                <li>Si una variante no tiene imágenes, se mostrarán las imágenes generales del producto</li>
                <li>Las imágenes de variante son ideales para mostrar diferentes colores, acabados o configuraciones</li>
                <li>Haz clic en una variante para expandir y gestionar sus imágenes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}