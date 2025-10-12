// Servicio básico para manejo de imágenes
// TODO: Integrar con Supabase Storage en producción

export class ImageService {
  /**
   * Sube una imagen y retorna la URL
   * Por ahora solo maneja URLs temporales para preview
   * En producción esto debería subir a Supabase Storage
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

      // Por ahora, crear URL temporal para preview
      const temporaryUrl = URL.createObjectURL(file)
      
      // TODO: Implementar subida real a Supabase Storage
      /*
      const { data, error } = await supabase.storage
        .from('brand-logos')
        .upload(`${Date.now()}-${file.name}`, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(data.path)

      return publicUrl
      */

      console.log('Image upload simulated for file:', file.name)
      return temporaryUrl

    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
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