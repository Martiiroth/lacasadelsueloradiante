'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  fetchPriority?: 'auto' | 'high' | 'low'
}

export default function OptimizedImage({ 
  src, 
  alt, 
  className = "", 
  fill = false,
  width,
  height,
  sizes = "(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw",
  priority = false,
  fetchPriority = 'auto'
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (imageError || !src) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <svg 
            className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
              clipRule="evenodd" 
            />
          </svg>
          <span className="text-xs">Sin imagen</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        fetchPriority={fetchPriority}
        className={`${fill ? 'object-cover' : ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => {
          setIsLoading(false)
        }}
        onError={() => {
          console.error('Failed to load image:', src)
          setImageError(true)
          setIsLoading(false)
        }}
        unoptimized={false}
      />
    </div>
  )
}