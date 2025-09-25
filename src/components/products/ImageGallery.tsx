'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ProductImage, VariantImage } from '../../types/products'

interface ImageGalleryProps {
  productImages: ProductImage[]
  variantImages?: VariantImage[]
  productTitle: string
}

export default function ImageGallery({ 
  productImages, 
  variantImages = [], 
  productTitle 
}: ImageGalleryProps) {
  const allImages = [
    ...productImages.map(img => ({ ...img, type: 'product' as const })),
    ...variantImages.map(img => ({ ...img, type: 'variant' as const }))
  ].sort((a, b) => a.position - b.position)

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  if (allImages.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }

  const selectedImage = allImages[selectedImageIndex]

  return (
    <div className="space-y-4">
      {/* Imagen principal */}
      <div className="relative">
        <div 
          className={`aspect-square relative bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in ${
            isZoomed ? 'cursor-zoom-out' : ''
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <Image
            src={selectedImage.url}
            alt={selectedImage.alt || productTitle}
            fill
            className={`object-cover transition-transform duration-300 ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Navegación de flechas */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImageIndex(
                selectedImageIndex === 0 ? allImages.length - 1 : selectedImageIndex - 1
              )}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
              aria-label="Imagen anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedImageIndex(
                selectedImageIndex === allImages.length - 1 ? 0 : selectedImageIndex + 1
              )}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
              aria-label="Imagen siguiente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Contador de imágenes */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {selectedImageIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={`${image.type}-${image.id}`}
              onClick={() => setSelectedImageIndex(index)}
              className={`flex-shrink-0 w-16 h-16 relative rounded border-2 overflow-hidden transition-all ${
                index === selectedImageIndex 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productTitle} ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
              {image.type === 'variant' && (
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-tl">
                  V
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Indicador de zoom */}
      {isZoomed && (
        <p className="text-sm text-gray-500 text-center">
          Haz clic en la imagen para alejar
        </p>
      )}
    </div>
  )
}