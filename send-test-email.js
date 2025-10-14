// Script para enviar email de recuperación directamente a javipablo0408@gmail.com
import nodemailer from 'nodemailer'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function sendTestResetEmail() {
  console.log('📧 Enviando email de recuperación a javipablo0408@gmail.com...\n')

  // Configurar transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  })

  // Generar token de prueba
  const token = uuidv4()
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`

  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperar Contraseña</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
        .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        .warning { background: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #007bff;">La Casa del Suelo Radiante</h1>
        </div>
        
        <div class="content">
          <h2>Recuperar tu contraseña</h2>
          <p>Hola Javi,</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul>
              <li>Este enlace expira en 1 hora por seguridad</li>
              <li>Si no solicitaste este cambio, ignora este email</li>
              <li>Nunca compartas este enlace con nadie</li>
            </ul>
          </div>
          
          <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
          
          <p><strong>Token de prueba:</strong> ${token}</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} La Casa del Suelo Radiante. Todos los derechos reservados.</p>
          <p>Este email se generó automáticamente para pruebas del sistema.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const info = await transporter.sendMail({
      from: `"La Casa del Suelo Radiante" <${process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS}>`,
      to: 'javipablo0408@gmail.com',
      subject: '🔑 Recuperar contraseña - La Casa del Suelo Radiante',
      html: emailTemplate,
      text: `
La Casa del Suelo Radiante - Recuperar Contraseña

Hola Javi,

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.

Para crear una nueva contraseña, visita el siguiente enlace:
${resetUrl}

IMPORTANTE:
- Este enlace expira en 1 hora por seguridad
- Si no solicitaste este cambio, ignora este email
- Nunca compartas este enlace con nadie

Token de prueba: ${token}

© ${new Date().getFullYear()} La Casa del Suelo Radiante. Todos los derechos reservados.
Este email se generó automáticamente para pruebas del sistema.
      `
    })

    console.log('✅ ¡Email enviado exitosamente!')
    console.log('📬 Message ID:', info.messageId)
    console.log('📧 Para:', 'javipablo0408@gmail.com')
    console.log('🔗 Enlace de reset:', resetUrl)
    console.log('🎫 Token:', token)
    console.log('\n📋 Revisa tu bandeja de entrada en Gmail!')
    console.log('📋 Si no aparece, revisa la carpeta de spam/correo no deseado')

  } catch (error) {
    console.error('❌ Error enviando email:', error)
  }
}

sendTestResetEmail()