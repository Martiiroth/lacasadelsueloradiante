/**
 * ActivationCodesService - Servicio para códigos de activación premium
 * 
 * Genera códigos únicos para activar funcionalidades premium en la app móvil
 * Los códigos expiran 30 días después de la compra
 */

import { supabase } from './supabase'
import type {
  ActivationCode,
  CreateActivationCodeData,
  ValidateCodeRequest,
  ValidateCodeResponse,
  ActivationCodeWithOrder
} from '../types/activation-codes'

export class ActivationCodesService {
  // Generar código de activación para una orden
  static async generateCodeForOrder(data: CreateActivationCodeData): Promise<ActivationCode | null> {
    try {
      const expiresInDays = data.expires_in_days || 30
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)

      // Generar código único
      let code = this.generateRandomCode()
      let attempts = 0
      const maxAttempts = 10

      // Verificar que el código no exista (muy improbable, pero por seguridad)
      while (attempts < maxAttempts) {
        const { data: existing } = await supabase
          .from('activation_codes')
          .select('id')
          .eq('code', code)
          .single()

        if (!existing) break

        code = this.generateRandomCode()
        attempts++
      }

      if (attempts >= maxAttempts) {
        console.error('No se pudo generar un código único después de varios intentos')
        return null
      }

      // Crear código en la base de datos
      const { data: activationCode, error } = await supabase
        .from('activation_codes')
        .insert({
          code,
          order_id: data.order_id,
          client_id: data.client_id || null,
          status: 'active',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creando código de activación:', error)
        return null
      }

      console.log(`✅ Código de activación generado: ${code} (expira: ${expiresAt.toLocaleDateString()})`)

      return activationCode
    } catch (error) {
      console.error('Error en generateCodeForOrder:', error)
      return null
    }
  }

  // Validar código desde la app
  static async validateCode(request: ValidateCodeRequest): Promise<ValidateCodeResponse> {
    try {
      const { code, device_id, app_version, platform } = request

      // Buscar código
      const { data: activationCode, error } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', code.toUpperCase().replace(/\s/g, ''))
        .single()

      if (error || !activationCode) {
        return {
          valid: false,
          message: 'Código no encontrado'
        }
      }

      // Verificar estado
      if (activationCode.status === 'revoked') {
        return {
          valid: false,
          message: 'Código revocado'
        }
      }

      // Verificar expiración
      const now = new Date()
      const expiresAt = new Date(activationCode.expires_at)

      if (expiresAt < now) {
        // Actualizar estado a expirado
        await supabase
          .from('activation_codes')
          .update({ status: 'expired' })
          .eq('id', activationCode.id)

        return {
          valid: false,
          message: 'Código expirado',
          expires_at: activationCode.expires_at
        }
      }

      // Calcular días restantes
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Actualizar metadata y última validación
      const metadata = {
        ...activationCode.metadata,
        app_version,
        platform,
        last_device_id: device_id
      }

      await supabase
        .from('activation_codes')
        .update({
          last_validated_at: new Date().toISOString(),
          device_id: device_id || activationCode.device_id,
          activated_at: activationCode.activated_at || new Date().toISOString(),
          metadata
        })
        .eq('id', activationCode.id)

      console.log(`✅ Código validado: ${code} (${daysRemaining} días restantes)`)

      return {
        valid: true,
        code: activationCode,
        expires_at: activationCode.expires_at,
        days_remaining: daysRemaining,
        message: 'Código válido'
      }
    } catch (error) {
      console.error('Error en validateCode:', error)
      return {
        valid: false,
        message: 'Error al validar código'
      }
    }
  }

  // Obtener código por order_id
  static async getCodeByOrderId(orderId: string): Promise<ActivationCode | null> {
    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (error) {
        console.error('Error obteniendo código por order_id:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error en getCodeByOrderId:', error)
      return null
    }
  }

  // Obtener códigos de un cliente
  static async getClientCodes(clientId: string): Promise<ActivationCodeWithOrder[]> {
    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .select(`
          *,
          order:orders (
            id,
            order_number,
            total_cents,
            status,
            created_at
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error obteniendo códigos del cliente:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error en getClientCodes:', error)
      return []
    }
  }

  // Revocar código (por ejemplo, si se cancela pedido)
  static async revokeCode(codeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('activation_codes')
        .update({ status: 'revoked' })
        .eq('id', codeId)

      if (error) {
        console.error('Error revocando código:', error)
        return false
      }

      console.log(`⚠️ Código revocado: ${codeId}`)
      return true
    } catch (error) {
      console.error('Error en revokeCode:', error)
      return false
    }
  }

  // Generar código aleatorio formato XXXX-XXXX-XXXX
  private static generateRandomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sin caracteres ambiguos
    let code = ''

    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
      if ((i + 1) % 4 === 0 && i < 11) {
        code += '-'
      }
    }

    return code
  }

  // Verificar y actualizar códigos expirados (función de limpieza)
  static async expireOldCodes(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('expires_at', new Date().toISOString())
        .select('id')

      if (error) {
        console.error('Error expirando códigos antiguos:', error)
        return 0
      }

      const count = data?.length || 0
      if (count > 0) {
        console.log(`🧹 ${count} códigos marcados como expirados`)
      }

      return count
    } catch (error) {
      console.error('Error en expireOldCodes:', error)
      return 0
    }
  }
}
