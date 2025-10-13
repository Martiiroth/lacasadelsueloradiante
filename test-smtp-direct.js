// Script para probar la conexión SMTP sin Next.js
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testSMTPConnection() {
  console.log('🔄 Probando conexión SMTP...')
  console.log('📧 Host:', process.env.EMAIL_HOST)
  console.log('📧 Port:', process.env.EMAIL_PORT)
  console.log('📧 User:', process.env.EMAIL_USER)
  console.log()

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Opciones adicionales para servidores self-hosted
    tls: {
      rejectUnauthorized: false // Para certificados self-signed
    }
  })

  try {
    console.log('🔍 Verificando conexión SMTP...')
    await transporter.verify()
    console.log('✅ Conexión SMTP exitosa!')
    
    console.log('📤 Enviando email de prueba...')
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_USER, // Enviar a nosotros mismos
      subject: 'Prueba de sistema de recuperación de contraseñas',
      text: 'Este es un email de prueba del sistema de recuperación de contraseñas.',
      html: `
        <h2>Prueba de Email</h2>
        <p>Este es un email de prueba del sistema de recuperación de contraseñas.</p>
        <p><strong>Configuración:</strong></p>
        <ul>
          <li>Host: ${process.env.EMAIL_HOST}</li>
          <li>Puerto: ${process.env.EMAIL_PORT}</li>
          <li>Usuario: ${process.env.EMAIL_USER}</li>
        </ul>
        <p>Si recibes este email, ¡la configuración está funcionando correctamente! 🎉</p>
      `
    })
    
    console.log('✅ Email enviado exitosamente!')
    console.log('📬 Message ID:', info.messageId)
    console.log('📧 Revisa tu bandeja de entrada en:', process.env.EMAIL_USER)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    
    // Sugerir configuraciones alternativas
    console.log('\n🔧 Prueba estas configuraciones alternativas:')
    console.log('1. Puerto 465 con SSL:')
    console.log('   EMAIL_PORT=465')
    console.log('   EMAIL_SECURE=true')
    console.log()
    console.log('2. Puerto 25 sin cifrado:')
    console.log('   EMAIL_PORT=25') 
    console.log('   EMAIL_SECURE=false')
    console.log()
    console.log('3. Verificar que el servidor mail.lacasadelsueloradiante.es esté activo')
  }
}

testSMTPConnection()