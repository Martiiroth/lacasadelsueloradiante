/**
 * Script de prueba para la integración de Redsys
 * Ejecutar: node scripts/test-redsys.js
 */

// Nota: Este es un script de ejemplo para entender cómo funciona la integración
// No es necesario ejecutarlo, está aquí como referencia

const crypto = require('crypto')

// Configuración de prueba
const config = {
  merchantCode: '999008881',
  terminal: '001',
  secretKey: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7',
  currency: '978',
  transactionType: '0',
  merchantUrl: 'http://localhost:3000/api/payments/redsys/callback',
  urlOk: 'http://localhost:3000/checkout/payment-result?status=success',
  urlKo: 'http://localhost:3000/checkout/payment-result?status=error'
}

/**
 * Genera un número de pedido único para Redsys
 */
function generateOrderNumber() {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return (timestamp.slice(-9) + random).slice(0, 12)
}

/**
 * Codifica parámetros en Base64
 */
function encodeBase64(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

/**
 * Crea la firma HMAC SHA256 para Redsys
 */
function createSignature(merchantParameters, secretKey) {
  // Decodificar parámetros para obtener el número de pedido
  const decodedParams = JSON.parse(Buffer.from(merchantParameters, 'base64').toString('utf-8'))
  const orderNumber = decodedParams.DS_MERCHANT_ORDER

  // Crear clave derivada del número de pedido
  const secretKeyBytes = Buffer.from(secretKey, 'base64')
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
 * Ejemplo de creación de parámetros de pago
 */
function createPaymentExample() {
  console.log('🧪 TEST: Creando parámetros de pago para Redsys\n')

  const orderNumber = generateOrderNumber()
  const amount = 10050 // 100.50 EUR en céntimos

  console.log('📝 Datos de la transacción:')
  console.log(`   - Número de pedido: ${orderNumber}`)
  console.log(`   - Importe: ${amount / 100} EUR (${amount} céntimos)`)
  console.log(`   - Comercio: ${config.merchantCode}`)
  console.log(`   - Terminal: ${config.terminal}\n`)

  // Parámetros del comercio
  const params = {
    DS_MERCHANT_MERCHANTCODE: config.merchantCode,
    DS_MERCHANT_TERMINAL: config.terminal,
    DS_MERCHANT_TRANSACTIONTYPE: config.transactionType,
    DS_MERCHANT_CURRENCY: config.currency,
    DS_MERCHANT_ORDER: orderNumber,
    DS_MERCHANT_AMOUNT: amount.toString(),
    DS_MERCHANT_PRODUCTDESCRIPTION: 'Pedido de prueba',
    DS_MERCHANT_MERCHANTURL: config.merchantUrl,
    DS_MERCHANT_URLOK: config.urlOk,
    DS_MERCHANT_URLKO: config.urlKo,
    DS_MERCHANT_CONSUMERLANGUAGE: '001',
    DS_MERCHANT_MERCHANTNAME: 'La Casa del Suelo Radiante'
  }

  // Codificar parámetros
  const merchantParameters = encodeBase64(params)
  console.log('📦 Parámetros codificados (Base64):')
  console.log(`   ${merchantParameters.substring(0, 60)}...\n`)

  // Crear firma
  const signature = createSignature(merchantParameters, config.secretKey)
  console.log('🔐 Firma generada (HMAC SHA256):')
  console.log(`   ${signature}\n`)

  console.log('✅ Datos listos para enviar a Redsys:')
  console.log('   - Ds_SignatureVersion: HMAC_SHA256_V1')
  console.log('   - Ds_MerchantParameters: [codificado]')
  console.log('   - Ds_Signature: [generada]')
  console.log('\n🌐 URL de Redsys (TEST):')
  console.log('   https://sis-t.redsys.es:25443/sis/realizarPago\n')

  return {
    Ds_SignatureVersion: 'HMAC_SHA256_V1',
    Ds_MerchantParameters: merchantParameters,
    Ds_Signature: signature,
    redsysUrl: 'https://sis-t.redsys.es:25443/sis/realizarPago'
  }
}

/**
 * Tarjetas de prueba
 */
function showTestCards() {
  console.log('💳 Tarjetas de prueba para Redsys:\n')
  
  console.log('✅ Transacción AUTORIZADA:')
  console.log('   - Número: 4548812049400004')
  console.log('   - Caducidad: Cualquier fecha futura (ej: 12/25)')
  console.log('   - CVV: 123')
  console.log('   - CIP: 123456\n')
  
  console.log('❌ Transacción DENEGADA:')
  console.log('   - Número: 4548810000000003')
  console.log('   - Caducidad: Cualquier fecha futura')
  console.log('   - CVV: 123\n')
  
  console.log('⚠️  Nota: Estas tarjetas solo funcionan en el entorno de TEST\n')
}

/**
 * Códigos de respuesta comunes
 */
function showResponseCodes() {
  console.log('📊 Códigos de respuesta de Redsys:\n')
  
  console.log('✅ ÉXITO:')
  console.log('   0000-0099: Transacción autorizada\n')
  
  console.log('❌ ERRORES COMUNES:')
  console.log('   0101: Tarjeta caducada')
  console.log('   0102: Tarjeta bloqueada temporalmente')
  console.log('   0106: Intentos de PIN excedidos')
  console.log('   0129: CVV2 incorrecto')
  console.log('   0180: Tarjeta no permite operación')
  console.log('   0190: Denegación sin especificar motivo')
  console.log('   0904: Comercio no registrado\n')
}

// Ejecutar ejemplos
console.log('═══════════════════════════════════════════════════════')
console.log('         REDSYS - SCRIPT DE PRUEBA Y REFERENCIA')
console.log('═══════════════════════════════════════════════════════\n')

showTestCards()
console.log('───────────────────────────────────────────────────────\n')
showResponseCodes()
console.log('───────────────────────────────────────────────────────\n')
createPaymentExample()

console.log('═══════════════════════════════════════════════════════')
console.log('   Para más información, consulta INTEGRACION_REDSYS.md')
console.log('═══════════════════════════════════════════════════════\n')
