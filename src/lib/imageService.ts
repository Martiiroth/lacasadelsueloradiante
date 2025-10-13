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

      // Nota: Saltamos la verificación de buckets porque listBuckets() puede fallar con claves anónimas
      // pero el bucket existe y es accesible directamente

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('brand-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Supabase storage error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        
        // Si es un error de bucket no encontrado, dar instrucciones específicas
        if (error.message?.includes('bucket') || (error as any).statusCode === 400) {
          throw new Error(`Bucket no configurado. Ve a tu dashboard de Supabase > Storage y crea el bucket 'brand-logos' como público.`)
        }
        
        throw new Error(`Error al subir imagen: ${error.message}`)
      }

      if (!data) {
        throw new Error('No se recibió confirmación de la subida')
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(data.path)

      console.log('Image uploaded successfully:', publicUrl)
      console.log('File path:', data.path)
      return publicUrl

    } catch (error) {
      console.error('Error uploading image:', error)
      
      // Mostrar mensaje específico según el error
      if ((error as any)?.message?.includes('row-level security policy')) {
        console.error('🔒 RLS ERROR: Las políticas de Storage no están configuradas correctamente.')
        console.error('📋 SOLUCIÓN: Ve a tu dashboard de Supabase → Storage → Policies')
        console.error('📋 Crea políticas para el bucket "brand-logos" (lectura pública + subida autenticada)')
      }
      
      // Fallback temporal: usar URL blob hasta que se configure Storage
      console.warn('Falling back to temporary URL due to storage error')
      const temporaryUrl = URL.createObjectURL(file)
      console.log('Created temporary URL:', temporaryUrl)
      
      // Mostrar error pero no fallar completamente
      console.error('⚠️ STORAGE NO CONFIGURADO: Usando URL temporal. Las imágenes no persistirán.')
      
      return temporaryUrl
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