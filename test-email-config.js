#!/usr/bin/env node

// Script para probar la configuración de email
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.production.localhost' })

async function testEmailConfiguration() {
  console.log('🧪 Testing email configuration...')
  console.log('📧 Server:', process.env.EMAIL_USER ? 'mail.lacasadelsueloradiante.es' : 'NOT SET')
  console.log('📧 User:', process.env.EMAIL_USER || 'NOT SET')
  console.log('📧 Password:', process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET')

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email credentials not configured')
    process.exit(1)
  }

  try {
    // Crear transporter
    const transporter = nodemailer.createTransport({
      host: 'mail.lacasadelsueloradiante.es',
      port: 465, // Puerto SSL según configuración del servidor
      secure: true, // SSL directo
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    })

    // Verificar conexión
    console.log('🔍 Verifying SMTP connection...')
    await transporter.verify()
    console.log('✅ SMTP connection verified successfully!')

    // Enviar email de prueba
    console.log('📤 Sending test email...')
    const testEmail = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'La Casa del Suelo Radiante',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
      },
      to: process.env.EMAIL_USER, // Enviar a nosotros mismos
      subject: '🧪 Test Email - Configuración de Servidor',
      html: `
        <h2>✅ Configuración de Email Correcta</h2>
        <p>Este email confirma que la configuración del servidor de correo <strong>mail.lacasadelsueloradiante.es</strong> está funcionando correctamente.</p>
        <hr>
        <p><small>Enviado desde: ${process.env.EMAIL_USER}</small></p>
        <p><small>Fecha: ${new Date().toLocaleString('es-ES')}</small></p>
      `
    }

    const result = await transporter.sendMail(testEmail)
    console.log('✅ Test email sent successfully!')
    console.log('📧 Message ID:', result.messageId)
    console.log('📧 Response:', result.response)

  } catch (error) {
    console.error('❌ Email configuration test failed:')
    console.error(error.message)
    
    if (error.code === 'EAUTH') {
      console.error('💡 Posibles soluciones:')
      console.error('   - Verificar usuario y contraseña')
      console.error('   - Verificar que el usuario esté habilitado para SMTP')
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Posibles soluciones:')
      console.error('   - Verificar que el servidor mail.lacasadelsueloradiante.es esté activo')
      console.error('   - Verificar el puerto 587')
    }
    
    process.exit(1)
  }
}

testEmailConfiguration()