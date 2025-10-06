/**
 * VariantImageService - Servicio de imágenes de variantes
 * 
 * ✅ COMPATIBLE CON ARQUITECTURA SUPABASE SSR
 * Cliente browser a través de lib/supabase.ts (wrapper compatible)
 */

import { supabase } from './supabase'
import { StorageService } from './storageService'
import type { ImageData } from '@/components/admin/ImageUpload'

export interface VariantImageData {
  id?: string
  variant_id: string
  url: string
  alt?: string
  position: number
  path?: string // Supabase Storage path
  file?: File
  uploading?: boolean
  error?: string
}

export class VariantImageService {
  // === GESTIÓN DE IMÁGENES DE VARIANTE ===
  
  static async getVariantImages(variantId: string): Promise<VariantImageData[]> {
    try {
      const { data, error } = await supabase
        .from('variant_images')
        .select('*')
        .eq('variant_id', variantId)
        .order('position', { ascending: true })

      if (error) {
        console.error('Error fetching variant images:', error)
        return []
      }

      return (data || []).map(img => ({
        id: img.id,
        variant_id: img.variant_id,
        url: img.url,
        alt: img.alt || '',
        position: img.position
      }))
    } catch (error) {
      console.error('Error in getVariantImages:', error)
      return []
    }
  }

  static async updateVariantImages(variantId: string, images: VariantImageData[]): Promise<boolean> {
    try {
      console.log('updateVariantImages called with:', { variantId, imageCount: images.length })
      
      // Validate that the variant exists
      const { data: variantExists, error: variantError } = await supabase
        .from('product_variants')
        .select('id')
        .eq('id', variantId)
        .single()

      if (variantError || !variantExists) {
        throw new Error(`Variant with ID ${variantId} not found`)
      }

      // Get existing images to clean up storage if needed
      const { data: existingImages } = await supabase
        .from('variant_images')
        .select('url')
        .eq('variant_id', variantId)

      // Delete existing images from database
      const { error: deleteError } = await supabase
        .from('variant_images')
        .delete()
        .eq('variant_id', variantId)

      if (deleteError) {
        console.error('Error deleting existing variant images:', deleteError)
        throw new Error(`Error deleting existing images: ${deleteError.message}`)
      }

      console.log('Successfully deleted existing variant images from database')

      // Clean up old images from storage that are no longer being used
      if (existingImages && existingImages.length > 0) {
        const newImageUrls = images.map(img => img.url)
        const imagesToDelete = existingImages.filter(existing => 
          !newImageUrls.includes(existing.url) &&
          existing.url.includes('supabase') // Only delete Supabase storage URLs
        )

        for (const imageToDelete of imagesToDelete) {
          try {
            const path = StorageService.extractPathFromUrl(imageToDelete.url)
            if (path) {
              await StorageService.deleteFile(path)
              console.log('Deleted unused variant image from storage:', path)
            }
          } catch (storageError) {
            console.warn('Failed to delete variant image from storage:', imageToDelete.url, storageError)
          }
        }
      }

      // If no new images, we're done
      if (images.length === 0) {
        console.log('No new variant images to insert')
        return true
      }

      // Filter only images that are properly uploaded (have paths) or are valid URLs
      const validImages = images.filter(img => {
        // Accept images with storage paths (properly uploaded)
        if (img.path) return true
        
        // Accept valid HTTP/HTTPS URLs that are not blob URLs
        return img.url && 
               img.url.trim() !== '' && 
               (img.url.startsWith('http://') || img.url.startsWith('https://')) &&
               !img.url.startsWith('blob:')
      })
      
      console.log('Filtered variant images:', { original: images.length, valid: validImages.length })
      
      if (validImages.length === 0) {
        console.log('No valid variant images to insert - only temporary URLs found')
        return true
      }

      // Insert new images
      const imageData = validImages.map((img, index) => ({
        variant_id: variantId,
        url: img.url,
        alt: img.alt || '',
        position: index
      }))

      console.log('Inserting variant image data:', imageData)

      const { error: insertError } = await supabase
        .from('variant_images')
        .insert(imageData)

      if (insertError) {
        console.error('Error inserting variant images:', insertError)
        throw new Error(`Error inserting images: ${insertError.message}`)
      }

      console.log('Successfully inserted variant images')
      return true
    } catch (error) {
      console.error('Error in updateVariantImages:', error)
      throw error
    }
  }

  static async deleteVariantImages(variantId: string): Promise<boolean> {
    try {
      // Get images to delete from storage
      const { data: images } = await supabase
        .from('variant_images')
        .select('url')
        .eq('variant_id', variantId)

      // Delete images from storage first
      if (images && images.length > 0) {
        for (const image of images) {
          try {
            if (image.url.includes('supabase')) { // Only delete Supabase storage URLs
              const path = StorageService.extractPathFromUrl(image.url)
              if (path) {
                await StorageService.deleteFile(path)
                console.log('Deleted variant image from storage:', path)
              }
            }
          } catch (storageError) {
            console.warn('Failed to delete variant image from storage:', image.url, storageError)
          }
        }
      }

      // Delete images from database
      const { error } = await supabase
        .from('variant_images')
        .delete()
        .eq('variant_id', variantId)

      if (error) {
        console.error('Error deleting variant images from database:', error)
        return false
      }

      console.log('Variant images deleted successfully with storage cleanup')
      return true
    } catch (error) {
      console.error('Error in deleteVariantImages:', error)
      return false
    }
  }

  // === UTILIDADES ===
  
  static async getAllVariantImages(variantIds: string[]): Promise<Record<string, VariantImageData[]>> {
    try {
      if (variantIds.length === 0) return {}

      const { data, error } = await supabase
        .from('variant_images')
        .select('*')
        .in('variant_id', variantIds)
        .order('position', { ascending: true })

      if (error) {
        console.error('Error fetching variant images:', error)
        return {}
      }

      // Group images by variant_id
      const imagesByVariant: Record<string, VariantImageData[]> = {}
      
      data?.forEach(img => {
        if (!imagesByVariant[img.variant_id]) {
          imagesByVariant[img.variant_id] = []
        }
        
        imagesByVariant[img.variant_id].push({
          id: img.id,
          variant_id: img.variant_id,
          url: img.url,
          alt: img.alt || '',
          position: img.position
        })
      })

      return imagesByVariant
    } catch (error) {
      console.error('Error in getAllVariantImages:', error)
      return {}
    }
  }

  static convertToImageData(variantImages: VariantImageData[]): ImageData[] {
    return variantImages.map(img => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      position: img.position,
      path: img.path
    }))
  }

  static convertFromImageData(images: ImageData[], variantId: string): VariantImageData[] {
    return images.map(img => ({
      id: img.id,
      variant_id: variantId,
      url: img.url,
      alt: img.alt,
      position: img.position,
      path: img.path,
      file: img.file,
      uploading: img.uploading,
      error: img.error
    }))
  }
}