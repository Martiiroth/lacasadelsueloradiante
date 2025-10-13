import { createClient } from '@/utils/supabase/client'

// Servicio para manejo de imágenes con Supabase Storage
export class ImageService {
  /**
   * Sube una imagen a Supabase Storage y retorna la URL pública
   */
  static async uploadImage(file: File): Promise<string> {
    try {
      // Validaciones básicas
      if (!file) {
        throw new Error('No se proporcionó archivo')
      }

      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no soportado. Use JPG, PNG, GIF o WebP')
      }

      // Validar tamaño (2MB máximo)
      const maxSize = 2 * 1024 * 1024 // 2MB en bytes
      if (file.size > maxSize) {
        throw new Error('El archivo es muy grande. Máximo 2MB')
      }

      // Crear cliente de Supabase
      const supabase = createClient()

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      console.log('Uploading file to Supabase Storage:', fileName)

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('brand-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Supabase storage error:', error)
        throw new Error(`Error al subir imagen: ${error.message}`)
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(data.path)

      console.log('Image uploaded successfully:', publicUrl)
      return publicUrl

    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  /**
   * Elimina una imagen de Supabase Storage
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      const supabase = createClient()

      // Extraer el path del archivo desde la URL
      const urlParts = imageUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]

      if (!fileName) {
        throw new Error('No se pudo extraer el nombre del archivo de la URL')
      }

      console.log('Deleting file from Supabase Storage:', fileName)

      const { error } = await supabase.storage
        .from('brand-logos')
        .remove([fileName])

      if (error) {
        console.error('Error deleting image:', error)
        return false
      }

      console.log('Image deleted successfully:', fileName)
      return true

    } catch (error) {
      console.error('Error deleting image:', error)
      return false
    }
  }

  /**
   * Valida si una URL de imagen es válida
   */
  static async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      const contentType = response.headers.get('content-type')
      return response.ok && (contentType?.startsWith('image/') || false)
    } catch (error) {
      console.error('Error validating image URL:', error)
      return false
    }
  }

  /**
   * Obtiene información básica de una imagen
   */
  static getImageInfo(file: File) {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeFormatted: this.formatFileSize(file.size)
    }
  }

  /**
   * Formatea el tamaño de archivo en formato legible
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}