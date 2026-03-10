/**
 * Servicio de integración con Redsys
 * Maneja la comunicación con la pasarela de pago de Redsys
 */

import crypto from 'crypto'

// Configuración de Redsys desde variables de entorno
const MERCHANT_CODE = process.env.REDSYS_MERCHANT_CODE || '999008881'
const TERMINAL = process.env.REDSYS_TERMINAL || '001'
const SECRET_KEY = process.env.REDSYS_SECRET_KEY || ''
const CURRENCY = process.env.REDSYS_CURRENCY || '978' // EUR
const ENVIRONMENT = process.env.REDSYS_ENVIRONMENT || 'test'
// URL que Redsys tiene registrada (callback, OK, KO). Si en el panel tienes lacasadelsueloradiante.es sin www, ponla aquí.
const REDSYS_BASE_URL = process.env.REDSYS_MERCHANT_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// URLs de Redsys
const REDSYS_URLS = {
  test: 'https://sis-t.redsys.es:25443/sis/realizarPago',
  production: 'https://sis.redsys.es/sis/realizarPago'
}

export interface RedsysPaymentParams {
  // Datos del comercio
  DS_MERCHANT_MERCHANTCODE: string
  DS_MERCHANT_TERMINAL: string
  DS_MERCHANT_TRANSACTIONTYPE: string
  DS_MERCHANT_CURRENCY: string
  
  // Datos de la transacción
  DS_MERCHANT_ORDER: string
  DS_MERCHANT_AMOUNT: string
  DS_MERCHANT_PRODUCTDESCRIPTION?: string
  
  // URLs de retorno
  DS_MERCHANT_MERCHANTURL: string
  DS_MERCHANT_URLOK: string
  DS_MERCHANT_URLKO: string
  
  // Datos opcionales
  DS_MERCHANT_CONSUMERLANGUAGE?: string
  DS_MERCHANT_MERCHANTNAME?: string
  DS_MERCHANT_TITULAR?: string
}

export interface RedsysFormData {
  Ds_SignatureVersion: string
  Ds_MerchantParameters: string
  Ds_Signature: string
  redsysUrl: string
}

export interface RedsysResponse {
  Ds_SignatureVersion: string
  Ds_MerchantParameters: string
  Ds_Signature: string
}

export interface RedsysDecodedResponse {
  Ds_Date: string
  Ds_Hour: string
  Ds_Amount: string
  Ds_Currency: string
  Ds_Order: string
  Ds_MerchantCode: string
  Ds_Terminal: string
  Ds_Response: string
  Ds_MerchantData: string
  Ds_SecurePayment: string
  Ds_TransactionType: string
  Ds_Card_Country: string
  Ds_AuthorisationCode: string
  Ds_ConsumerLanguage: string
  Ds_Card_Type: string
}

/**
 * Clase para manejar la integración con Redsys
 */
export class RedsysService {
  
  /**
   * Genera un número de pedido único para Redsys (exactamente 12 dígitos numéricos).
   * Redsys exige DS_MERCHANT_ORDER máximo 12 posiciones, solo numéricos para evitar errores.
   */
  static generateOrderNumber(orderId?: string): string {
    const now = Date.now()
    const ts = now.toString().slice(-8)
    const rnd = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    let orderNumber = (ts + rnd).replace(/\D/g, '')
    orderNumber = orderNumber.padStart(12, '0').slice(-12)
    if (orderNumber.length !== 12 || !/^\d{12}$/.test(orderNumber)) {
      orderNumber = now.toString().slice(-12).padStart(12, '0').slice(-12)
    }
    console.log('🔢 Redsys DS_MERCHANT_ORDER:', { orderNumber, length: orderNumber.length, orderId: orderId?.slice(0, 8) })
    return orderNumber
  }

  /**
   * Codifica los parámetros en Base64 URL-safe
   */
  private static encodeBase64(data: string): string {
    return Buffer.from(data).toString('base64')
  }

  /**
   * Decodifica un string Base64 URL-safe
   */
  private static decodeBase64(data: string): string {
    return Buffer.from(data, 'base64').toString('utf-8')
  }

  /**
   * Crea la firma HMAC SHA256 para Redsys
   */
  private static createSignature(merchantParameters: string): string {
    const decodedParams = JSON.parse(this.decodeBase64(merchantParameters))
    let orderNumber = decodedParams.DS_MERCHANT_ORDER
    if (typeof orderNumber !== 'string' || !/^\d{1,12}$/.test(orderNumber.replace(/\s/g, ''))) {
      orderNumber = String(orderNumber ?? '').replace(/\D/g, '').padStart(12, '0').slice(-12)
    } else {
      orderNumber = orderNumber.replace(/\D/g, '').padStart(12, '0').slice(-12)
    }
    if (orderNumber.length !== 12) {
      throw new Error(`DS_MERCHANT_ORDER inválido para firma: longitud ${orderNumber.length}, debe ser 12`)
    }

    // Crear clave derivada del número de pedido (16 bytes para 3DES)
    const secretKeyBytes = Buffer.from(SECRET_KEY, 'base64')
    const cipher = crypto.createCipheriv('des-ede3-cbc', secretKeyBytes, Buffer.alloc(8, 0))
    cipher.setAutoPadding(false)
    
    const orderPadded = orderNumber.padEnd(16, '\0')
    let derivedKey = cipher.update(orderPadded, 'utf8')
    derivedKey = Buffer.concat([derivedKey, cipher.final()])

    // Crear firma HMAC con la clave derivada
    const hmac = crypto.createHmac('sha256', derivedKey)
    hmac.update(merchantParameters)
    return hmac.digest('base64')
  }

  /**
   * Verifica la firma de la respuesta de Redsys
   */
  static verifySignature(merchantParameters: string, signature: string): boolean {
    try {
      console.log('🔐 Verificando firma de Redsys...')
      console.log('🔐 Parámetros recibidos:', {
        parametersLength: merchantParameters?.length || 0,
        signatureReceived: signature?.substring(0, 20) + '...',
        hasSecretKey: !!SECRET_KEY,
        secretKeyLength: SECRET_KEY?.length || 0
      })

      const calculatedSignature = this.createSignature(merchantParameters)
      
      console.log('🔐 Firmas comparadas:', {
        received: signature?.substring(0, 20) + '...',
        calculated: calculatedSignature?.substring(0, 20) + '...',
        match: calculatedSignature === signature
      })

      return calculatedSignature === signature
    } catch (error) {
      console.error('❌ Error verificando firma de Redsys:', error)
      return false
    }
  }

  /**
   * Prepara los parámetros de pago para enviar a Redsys
   */
  static createPaymentForm(
    amount: number, // Importe en céntimos
    orderId: string,
    description: string,
    consumerName?: string
  ): RedsysFormData {
    if (!SECRET_KEY || SECRET_KEY.length < 10) {
      throw new Error(
        'REDSYS_SECRET_KEY no está configurada o es inválida. Configura la clave en .env (clave que te proporciona Redsys para el terminal). Error SIS0042 suele deberse a esto.'
      )
    }

    const baseUrl = REDSYS_BASE_URL.replace(/\/$/, '')
    const orderNumber = this.generateOrderNumber(orderId)

    console.log('🔢 Generando número de orden para Redsys:', {
      orderNumber,
      length: orderNumber.length,
      isValid: /^\d{12}$/.test(orderNumber),
      orderId,
      redsysBaseUrl: baseUrl
    })

    // Validar que el número de orden tenga exactamente 12 dígitos numéricos
    if (!/^\d{12}$/.test(orderNumber)) {
      console.error('❌ Número de orden inválido:', orderNumber)
      throw new Error(`Número de orden inválido para Redsys: ${orderNumber}. Debe tener exactamente 12 dígitos.`)
    }

    // Validar que el amount sea un número entero positivo (en céntimos)
    const amountInt = Math.floor(Number(amount))
    if (isNaN(amountInt) || amountInt <= 0) {
      throw new Error(`Importe inválido para Redsys: ${amount}. Debe ser un número entero positivo.`)
    }

    // Parámetros del comercio
    // Redsys exige DS_MERCHANT_AMOUNT con exactamente 12 dígitos (ceros a la izquierda)
    const amountPadded = amountInt.toString().padStart(12, '0')
    console.log('💰 Redsys DS_MERCHANT_AMOUNT:', {
      amountCents: amountInt,
      amountEuros: (amountInt / 100).toFixed(2),
      amountPadded,
      length: amountPadded.length
    })

    const params: RedsysPaymentParams = {
      DS_MERCHANT_MERCHANTCODE: MERCHANT_CODE,
      DS_MERCHANT_TERMINAL: TERMINAL,
      DS_MERCHANT_TRANSACTIONTYPE: '0', // 0 = Autorización
      DS_MERCHANT_CURRENCY: CURRENCY,
      DS_MERCHANT_ORDER: orderNumber,
      DS_MERCHANT_AMOUNT: amountPadded,
      DS_MERCHANT_PRODUCTDESCRIPTION: description,
      DS_MERCHANT_MERCHANTURL: `${baseUrl}/api/payments/redsys/callback`,
      DS_MERCHANT_URLOK: `${baseUrl}/checkout/payment-result?status=success&order=${orderId}`,
      DS_MERCHANT_URLKO: `${baseUrl}/checkout/payment-result?status=error&order=${orderId}`,
      DS_MERCHANT_CONSUMERLANGUAGE: '001', // Español
      DS_MERCHANT_MERCHANTNAME: 'La Casa del Suelo Radiante',
      DS_MERCHANT_TITULAR: consumerName
    }

    // Codificar parámetros en Base64
    const merchantParameters = this.encodeBase64(JSON.stringify(params))
    
    // Crear firma
    const signature = this.createSignature(merchantParameters)

    // Determinar URL de Redsys según el entorno
    const redsysUrl = REDSYS_URLS[ENVIRONMENT as keyof typeof REDSYS_URLS] || REDSYS_URLS.test

    return {
      Ds_SignatureVersion: 'HMAC_SHA256_V1',
      Ds_MerchantParameters: merchantParameters,
      Ds_Signature: signature,
      redsysUrl
    }
  }

  /**
   * Procesa la respuesta de Redsys
   */
  static processResponse(response: RedsysResponse): {
    isValid: boolean
    isSuccess: boolean
    data: RedsysDecodedResponse | null
    message: string
  } {
    try {
      // Verificar firma
      const isValidSignature = this.verifySignature(
        response.Ds_MerchantParameters,
        response.Ds_Signature
      )

      if (!isValidSignature) {
        return {
          isValid: false,
          isSuccess: false,
          data: null,
          message: 'Firma inválida'
        }
      }

      // Decodificar parámetros
      const decodedData = JSON.parse(
        this.decodeBase64(response.Ds_MerchantParameters)
      ) as RedsysDecodedResponse

      // Verificar código de respuesta (0000-0099 = éxito)
      const responseCode = parseInt(decodedData.Ds_Response)
      const isSuccess = responseCode >= 0 && responseCode <= 99

      return {
        isValid: true,
        isSuccess,
        data: decodedData,
        message: isSuccess 
          ? 'Pago procesado correctamente' 
          : `Pago rechazado - Código: ${decodedData.Ds_Response}`
      }
    } catch (error) {
      console.error('Error procesando respuesta de Redsys:', error)
      return {
        isValid: false,
        isSuccess: false,
        data: null,
        message: 'Error procesando respuesta'
      }
    }
  }

  /**
   * Obtiene el estado de una transacción según el código de respuesta
   */
  static getTransactionStatus(responseCode: string): {
    status: 'success' | 'error' | 'pending'
    message: string
  } {
    const code = parseInt(responseCode)
    
    if (code >= 0 && code <= 99) {
      return {
        status: 'success',
        message: 'Transacción autorizada'
      }
    } else if (code === 900) {
      return {
        status: 'pending',
        message: 'Transacción en proceso de autorización'
      }
    } else {
      // Códigos de error comunes
      const errorMessages: { [key: number]: string } = {
        101: 'Tarjeta caducada',
        102: 'Tarjeta bloqueada temporalmente',
        106: 'Intentos de PIN excedidos',
        125: 'Tarjeta no efectiva',
        129: 'Código de seguridad (CVV2) incorrecto',
        180: 'Tarjeta no permite operación',
        184: 'Error en autenticación del titular',
        190: 'Denegación sin especificar motivo',
        191: 'Fecha de caducidad errónea',
        202: 'Tarjeta bloqueada transitoriamente',
        904: 'Comercio no registrado'
      }

      return {
        status: 'error',
        message: errorMessages[code] || `Error en la transacción (código: ${code})`
      }
    }
  }
}

export default RedsysService
