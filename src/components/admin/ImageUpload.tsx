'use client'

import { useState, useRef, useCallback } from 'react'
import { PhotoIcon, XMarkIcon, ArrowUpIcon, ArrowDownIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { StorageService } from '@/lib/storageService'

export interface ImageData {
  id?: string
  url: string
  alt?: string
  position: number
  path?: string // Path en Supabase Storage
  file?: File
  uploading?: boolean
  error?: string
}

interface ImageUploadProps {
  images: ImageData[]
  onChange: (images: ImageData[]) => void
  maxImages?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
}

export default function ImageUpload({ 
  images, 
  onChange, 
  maxImages = 10,
  maxFileSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const newImages: ImageData[] = []

    // First add files with uploading state for immediate preview
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file type
      if (!acceptedTypes.includes(file.type)) {
        alert(`Tipo de archivo no soportado: ${file.type}. Solo se permiten: ${acceptedTypes.join(', ')}`)
        continue
      }
      
      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`El archivo ${file.name} es muy grande. Máximo ${maxFileSize}MB permitido.`)
        continue
      }
      
      // Check if we're exceeding max images
      if (images.length + newImages.length >= maxImages) {
        alert(`Máximo ${maxImages} imágenes permitidas`)
        break
      }

      // Create temporary preview URL
      const tempUrl = URL.createObjectURL(file)
      
      newImages.push({
        url: tempUrl,
        alt: '',
        position: images.length + newImages.length,
        file,
        uploading: true
      })
    }

    // Add images immediately for preview
    const allImages = [...images, ...newImages]
    onChange(allImages)

    // Upload files to Supabase Storage one by one
    for (let i = 0; i < newImages.length; i++) {
      const imageData = newImages[i]
      if (!imageData.file) continue

      try {
        console.log('Subiendo archivo:', imageData.file.name)
        
        const uploadResult = await StorageService.uploadFile(imageData.file, 'products')
        
        if (uploadResult.error) {
          console.error('Error subiendo archivo:', uploadResult.error)
          
          // Update image with error state
          const currentImages = [...allImages]
          const imageIndex = images.length + i
          currentImages[imageIndex] = {
            ...imageData,
            uploading: false,
            error: uploadResult.error
          }
          onChange(currentImages)
        } else {
          console.log('Archivo subido exitosamente:', uploadResult)
          
          // Cleanup temp URL
          URL.revokeObjectURL(imageData.url)
          
          // Update image with final URL and path
          const currentImages = [...allImages]
          const imageIndex = images.length + i
          currentImages[imageIndex] = {
            ...imageData,
            url: uploadResult.url,
            path: uploadResult.path,
            uploading: false,
            file: undefined, // Remove file reference
            error: undefined
          }
          onChange(currentImages)
        }
      } catch (error: any) {
        console.error('Error inesperado subiendo archivo:', error)
        
        // Update image with error state
        const currentImages = [...allImages]
        const imageIndex = images.length + i
        currentImages[imageIndex] = {
          ...imageData,
          uploading: false,
          error: error.message || 'Error inesperado'
        }
        onChange(currentImages)
      }
    }
    
    setUploading(false)
  }, [images, onChange, maxImages, maxFileSize, acceptedTypes])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const removeImage = async (index: number) => {
    const imageToRemove = images[index]
    
    // If image has a path (uploaded to storage), delete it
    if (imageToRemove.path) {
      try {
        console.log('Eliminando imagen del storage:', imageToRemove.path)
        await StorageService.deleteFile(imageToRemove.path)
      } catch (error) {
        console.error('Error eliminando imagen del storage:', error)
      }
    }
    
    // If image has a blob URL, revoke it
    if (imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url)
    }
    
    const updatedImages = images.filter((_, i) => i !== index)
    // Reposition remaining images
    const repositioned = updatedImages.map((img, i) => ({ ...img, position: i }))
    onChange(repositioned)
  }

  const updateImageAlt = (index: number, alt: string) => {
    const updatedImages = [...images]
    updatedImages[index] = { ...updatedImages[index], alt }
    onChange(updatedImages)
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return
    
    const updatedImages = [...images]
    const [movedImage] = updatedImages.splice(fromIndex, 1)
    updatedImages.splice(toIndex, 0, movedImage)
    
    // Reposition all images
    const repositioned = updatedImages.map((img, i) => ({ ...img, position: i }))
    onChange(repositioned)
  }

  return (
    <div className="space-y-4">
      {/* Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <PhotoIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Gestión de Imágenes
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Actualmente, este componente admite URLs de imágenes permanentes (http/https).</p>
              <p>Las imágenes subidas directamente son solo para previsualización y no se guardarán.</p>
            </div>
          </div>
        </div>
      </div>

      {/* URL Input */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Añadir Imagen por URL</h4>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const input = e.target as HTMLInputElement
                const url = input.value.trim()
                if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                  const newImage: ImageData = {
                    url,
                    alt: '',
                    position: images.length
                  }
                  onChange([...images, newImage])
                  input.value = ''
                }
              }
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement
              const url = input.value.trim()
              if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                const newImage: ImageData = {
                  url,
                  alt: '',
                  position: images.length
                }
                onChange([...images, newImage])
                input.value = ''
              }
            }}
            className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Añadir
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            {uploading ? 'Procesando imágenes...' : 'Arrastra imágenes aquí o haz clic para seleccionar (solo previsualización)'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Máximo {maxImages} imágenes, {maxFileSize}MB cada una. Formatos: JPG, PNG, WebP
          </p>
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">
            Imágenes ({images.length}/{maxImages})
          </h4>
          <div className="space-y-3">
            {images.map((image, index) => (
              <div key={index} className={`flex items-start gap-4 p-4 rounded-lg ${
                image.error ? 'bg-red-50 border border-red-200' : 
                image.uploading ? 'bg-blue-50 border border-blue-200' : 
                'bg-gray-50'
              }`}>
                {/* Image Preview */}
                <div className="flex-shrink-0 relative">
                  <img
                    src={image.url}
                    alt={image.alt || `Imagen ${index + 1}`}
                    className={`w-20 h-20 object-cover rounded-lg border border-gray-200 ${
                      image.uploading ? 'opacity-50' : ''
                    }`}
                  />
                  
                  {/* Upload Loading Overlay */}
                  {image.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                      <div className="flex flex-col items-center gap-1">
                        <CloudArrowUpIcon className="h-6 w-6 text-blue-500 animate-pulse" />
                        <span className="text-xs text-blue-600 font-medium">Subiendo...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Error Overlay */}
                  {image.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-20 rounded-lg">
                      <XMarkIcon className="h-6 w-6 text-red-500" />
                    </div>
                  )}
                </div>
                
                {/* Image Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      Posición {index + 1}
                    </span>
                    {index === 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Principal
                      </span>
                    )}
                    {image.uploading && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Subiendo...
                      </span>
                    )}
                    {image.error && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Error
                      </span>
                    )}
                  </div>
                  
                  {image.error && (
                    <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
                      {image.error}
                    </div>
                  )}
                  
                  <input
                    type="text"
                    placeholder="Texto alternativo (alt)"
                    value={image.alt || ''}
                    onChange={(e) => updateImageAlt(index, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Controls */}
                <div className="flex flex-col gap-1">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => moveImage(index, index - 1)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover arriba"
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                  
                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => moveImage(index, index + 1)}
                    disabled={index === images.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover abajo"
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </button>
                  
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={async () => await removeImage(index)}
                    disabled={image.uploading}
                    className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar imagen"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Instructions */}
      {images.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Las imágenes aparecerán aquí cuando las agregues. La primera imagen será la principal.
          </p>
        </div>
      )}
    </div>
  )
}
