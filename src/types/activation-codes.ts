/**
 * Tipos para el sistema de códigos de activación premium
 */

export type ActivationCodeStatus = 'active' | 'expired' | 'revoked'

export interface ActivationCode {
  id: string
  code: string
  order_id: string
  client_id: string | null
  status: ActivationCodeStatus
  created_at: string
  expires_at: string
  activated_at: string | null
  last_validated_at: string | null
  device_id: string | null
  metadata: Record<string, any>
}

export interface CreateActivationCodeData {
  order_id: string
  client_id?: string | null
  expires_in_days?: number // Default: 30
}

export interface ValidateCodeRequest {
  code: string
  device_id?: string
  app_version?: string
  platform?: 'ios' | 'android'
}

export interface ValidateCodeResponse {
  valid: boolean
  code?: ActivationCode
  message?: string
  expires_at?: string
  days_remaining?: number
}

export interface ActivationCodeWithOrder extends ActivationCode {
  order: {
    id: string
    order_number: string
    total_cents: number
    status: string
    created_at: string
  }
}
