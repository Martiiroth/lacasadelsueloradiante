/**
 * StorageService - Servicio de almacenamiento de archivos
 * 
 * ✅ COMPATIBLE CON ARQUITECTURA SUPABASE SSR
 * Cliente browser a través de lib/supabase.ts (wrapper compatible)
 */

import { supabase } from './supabase'

export interface UploadResult {
  url: string
  path: string
  error?: string
}

export class StorageService {
  private static readonly BUCKET_NAME = 'product-images'
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  /**
   * Sube un archivo al storage de Supabase
   * @param file - Archivo a subir
   * @param folder - Carpeta dentro del bucket (opcional)
   * @returns Resultado con la URL pública y path del archivo
   */
  static async uploadFile(file: File, folder = 'products'): Promise<UploadResult> {
    try {
      // Validaciones
      if (!file) {
        throw new Error('No se proporcionó ningún archivo')
      }

      if (file.size > this.MAX_FILE_SIZE) {
        throw new Error(`El archivo es muy grande. Máximo ${this.MAX_FILE_SIZE / 1024 / 1024}MB permitido`)
      }

      if (!this.ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido. Solo se permiten: ${this.ALLOWED_TYPES.join(', ')}`)
      }

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      console.log('Subiendo archivo:', { fileName, filePath, size: file.size, type: file.type })

      // Subir archivo
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error subiendo archivo:', error)
        
        // Manejo específico de errores comunes
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Error de conectividad: No se puede conectar con Supabase Storage. Verifica que el bucket "product-images" exista y esté configurado correctamente.')
        }
        
        if (error.message.includes('Bucket not found')) {
          throw new Error(`El bucket "${this.BUCKET_NAME}" no existe. Debes crearlo manualmente en el dashboard de Supabase.`)
        }
        
        if (error.message.includes('row-level security policy')) {
          throw new Error('Error de permisos: Las políticas RLS no están configuradas correctamente para el bucket.')
        }
        
        throw new Error(`Error al subir archivo: ${error.message}`)
      }

      if (!data) {
        throw new Error('No se recibieron datos del archivo subido')
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path)

      if (!urlData?.publicUrl) {
        throw new Error('No se pudo obtener la URL pública del archivo')
      }

      console.log('Archivo subido exitosamente:', { path: data.path, url: urlData.publicUrl })

      return {
        url: urlData.publicUrl,
        path: data.path
      }
    } catch (error: any) {
      console.error('Error en uploadFile:', error)
      return {
        url: '',
        path: '',
        error: error.message || 'Error desconocido al subir archivo'
      }
    }
  }

  /**
   * Sube múltiples archivos al storage
   * @param files - Array de archivos a subir
   * @param folder - Carpeta dentro del bucket
   * @returns Array de resultados
   */
  static async uploadMultipleFiles(files: File[], folder = 'products'): Promise<UploadResult[]> {
    const results: UploadResult[] = []
    
    for (const file of files) {
      const result = await this.uploadFile(file, folder)
      results.push(result)
    }

    return results
  }

  /**
   * Elimina un archivo del storage
   * @param path - Path del archivo en el storage
   * @returns true si se eliminó correctamente
   */
  static async deleteFile(path: string): Promise<boolean> {
    try {
      if (!path) {
        console.warn('No se proporcionó path para eliminar')
        return false
      }

      console.log('Eliminando archivo:', path)

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path])

      if (error) {
        console.error('Error eliminando archivo:', error)
        return false
      }

      console.log('Archivo eliminado exitosamente:', path)
      return true
    } catch (error) {
      console.error('Error en deleteFile:', error)
      return false
    }
  }

  /**
   * Elimina múltiples archivos del storage
   * @param paths - Array de paths de archivos a eliminar
   * @returns true si todos se eliminaron correctamente
   */
  static async deleteMultipleFiles(paths: string[]): Promise<boolean> {
    try {
      if (!paths || paths.length === 0) {
        return true
      }

      const validPaths = paths.filter(path => path && path.trim() !== '')
      if (validPaths.length === 0) {
        return true
      }

      console.log('Eliminando múltiples archivos:', validPaths)

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(validPaths)

      if (error) {
        console.error('Error eliminando archivos:', error)
        return false
      }

      console.log('Archivos eliminados exitosamente')
      return true
    } catch (error) {
      console.error('Error en deleteMultipleFiles:', error)
      return false
    }
  }

  /**
   * Obtiene la URL pública de un archivo
   * @param path - Path del archivo en el storage
   * @returns URL pública del archivo
   */
  static getPublicUrl(path: string): string {
    if (!path) return ''

    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(path)

    return data?.publicUrl || ''
  }

  /**
   * Extrae el path del storage desde una URL pública
   * @param url - URL pública del archivo
   * @returns Path del archivo en el storage
   */
  static extractPathFromUrl(url: string): string {
    if (!url) return ''

    try {
      // Las URLs de Supabase Storage tienen el formato:
      // https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      const bucketPath = `/storage/v1/object/public/${this.BUCKET_NAME}/`
      const pathIndex = url.indexOf(bucketPath)
      
      if (pathIndex === -1) {
        return ''
      }

      return url.substring(pathIndex + bucketPath.length)
    } catch (error) {
      console.error('Error extrayendo path de URL:', error)
      return ''
    }
  }

  /**
   * Verifica si el bucket existe y está configurado correctamente
   * @returns true si el bucket está disponible
   */
  static async checkBucketExists(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.getBucket(this.BUCKET_NAME)
      
      if (error) {
        console.error('Error verificando bucket:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Error en checkBucketExists:', error)
      return false
    }
  }

  /**
   * Crea el bucket si no existe (solo para desarrollo/testing)
   * @returns true si el bucket se creó o ya existía
   */
  static async createBucketIfNotExists(): Promise<boolean> {
    try {
      // Verificar si ya existe
      const exists = await this.checkBucketExists()
      if (exists) {
        console.log('Bucket ya existe')
        return true
      }

      // Crear bucket
      const { data, error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
        public: true,
        allowedMimeTypes: this.ALLOWED_TYPES,
        fileSizeLimit: this.MAX_FILE_SIZE
      })

      if (error) {
        console.error('Error creando bucket:', error)
        return false
      }

      console.log('Bucket creado exitosamente:', data)
      return true
    } catch (error) {
      console.error('Error en createBucketIfNotExists:', error)
      return false
    }
  }
}