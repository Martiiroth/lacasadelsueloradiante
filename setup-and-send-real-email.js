// Script para crear tabla de tokens y enviar email real con token válido
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function setupAndSendRealEmail() {
  console.log('🔄 Configurando sistema completo y enviando email real...\n')

  // Inicializar Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // 1. Crear tabla de tokens si no existe
    console.log('1️⃣ Creando tabla password_reset_tokens...')
    
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          token uuid UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
          email text NOT NULL,
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
          expires_at timestamp with time zone NOT NULL,
          used boolean DEFAULT false NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
        CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
      `
    })

    if (createTableError) {
      console.log('⚠️  Tabla puede ya existir, continuando...')
    } else {
      console.log('✅ Tabla creada exitosamente')
    }

    // 2. Verificar que el email existe en Supabase Auth
    console.log('\n2️⃣ Verificando usuario en Supabase Auth...')
    
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const userExists = authUsers?.users.some(user => user.email === 'javipablo0408@gmail.com')
    
    if (!userExists) {
      console.log('❌ El email javipablo0408@gmail.com no existe en Supabase Auth')
      console.log('   Necesitas crear una cuenta primero en /auth/signup')
      return
    }
    
    console.log('✅ Usuario encontrado en Supabase Auth')

    // 3. Limpiar tokens anteriores del mismo email
    console.log('\n3️⃣ Limpiando tokens anteriores...')
    
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('email', 'javipablo0408@gmail.com')
    
    console.log('✅ Tokens anteriores eliminados')

    // 4. Generar nuevo token
    console.log('\n4️⃣ Generando nuevo token...')
    
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert([{
        token,
        email: 'javipablo0408@gmail.com',
        expires_at: expiresAt.toISOString(),
        used: false
      }])

    if (insertError) {
      console.error('❌ Error guardando token:', insertError)
      return
    }

    console.log('✅ Token generado y guardado:', token)
    console.log('⏰ Expira el:', expiresAt.toLocaleString())

    // 5. Configurar y enviar email
    console.log('\n5️⃣ Enviando email...')
    
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

    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${token}`

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
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} La Casa del Suelo Radiante. Todos los derechos reservados.</p>
            <p>Este email tiene un token REAL y válido en la base de datos.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const info = await transporter.sendMail({
      from: `"La Casa del Suelo Radiante" <${process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS}>`,
      to: 'javipablo0408@gmail.com',
      subject: '🔑 Recuperar contraseña - La Casa del Suelo Radiante (TOKEN REAL)',
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

© ${new Date().getFullYear()} La Casa del Suelo Radiante. Todos los derechos reservados.
Este email tiene un token REAL y válido en la base de datos.
      `
    })

    console.log('✅ ¡Email enviado exitosamente!')
    console.log('📬 Message ID:', info.messageId)
    console.log('📧 Para:', 'javipablo0408@gmail.com')
    console.log('🔗 Enlace REAL:', resetUrl)
    console.log('🎫 Token REAL en DB:', token)
    
    console.log('\n🎉 ¡SISTEMA COMPLETAMENTE CONFIGURADO!')
    console.log('📋 El token ahora está guardado en Supabase y será válido')
    console.log('📧 Revisa tu Gmail y prueba el enlace')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

setupAndSendRealEmail()