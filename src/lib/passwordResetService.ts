import nodemailer from 'nodemailer'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'

// Solo para uso en el servidor (APIs)
export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export interface ResetEmailData {
  email: string
  token: string
  resetUrl: string
  companyName?: string
}

export class PasswordResetEmailService {
  private transporter: nodemailer.Transporter
  private supabase

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    })

    // Inicializar Supabase para operaciones de DB
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  async generateResetToken(email: string): Promise<string> {
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Eliminar tokens anteriores del mismo email
    await this.supabase
      .from('password_reset_tokens')
      .delete()
      .eq('email', email)

    // Insertar nuevo token
    const { error } = await this.supabase
      .from('password_reset_tokens')
      .insert([{
        token,
        email,
        expires_at: expiresAt.toISOString(),
        used: false
      }])

    if (error) {
      console.error('❌ Error guardando token:', error)
      throw new Error('Error generando token de recuperación')
    }

    return token
  }

  async validateToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const { data, error } = await this.supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return { valid: false }
    }

    return { valid: true, email: data.email }
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await this.supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token)
  }

  async sendPasswordResetEmail(data: ResetEmailData) {
    const { email, resetUrl, companyName = 'La Casa del Suelo Radiante' } = data

    const mailOptions = {
      from: `"${companyName}" <${process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Recuperar contraseña - ${companyName}`,
      html: this.generateResetEmailTemplate(resetUrl, companyName),
      text: this.generateResetEmailText(resetUrl, companyName)
    }

    try {
      const result = await this.transporter.sendMail(mailOptions)
      console.log('✅ Email de recuperación enviado:', result.messageId)
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('❌ Error enviando email:', error)
      throw new Error('Error al enviar el email de recuperación')
    }
  }

  private generateResetEmailTemplate(resetUrl: string, companyName: string): string {
    return `
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
            <h1 style="margin: 0; color: #007bff;">${companyName}</h1>
          </div>
          
          <div class="content">
            <h2>Recuperar tu contraseña</h2>
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
            <p>&copy; ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.</p>
            <p>Este email se generó automáticamente, no respondas a esta dirección.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateResetEmailText(resetUrl: string, companyName: string): string {
    return `
${companyName} - Recuperar Contraseña

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.

Para crear una nueva contraseña, visita el siguiente enlace:
${resetUrl}

IMPORTANTE:
- Este enlace expira en 1 hora por seguridad
- Si no solicitaste este cambio, ignora este email
- Nunca compartas este enlace con nadie

© ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.
Este email se generó automáticamente, no respondas a esta dirección.
    `
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      console.log('✅ Conexión SMTP verificada')
      return true
    } catch (error) {
      console.error('❌ Error verificando conexión SMTP:', error)
      return false
    }
  }
}

// Singleton instance para server-side
let passwordResetService: PasswordResetEmailService | null = null

export function getPasswordResetService(): PasswordResetEmailService {
  if (!passwordResetService) {
    const config: EmailConfig = {
      host: process.env.EMAIL_HOST || 'mail.lacasadelsueloradiante.es',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '',
      }
    }
    
    passwordResetService = new PasswordResetEmailService(config)
  }
  
  return passwordResetService
}