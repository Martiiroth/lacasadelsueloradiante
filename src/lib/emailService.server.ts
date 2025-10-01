// Email service que solo se ejecuta en el servidor
import nodemailer from 'nodemailer'

// Configuración del transporter usando la configuración de Zoho
let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter) {
    // Verificar variables de entorno
    const emailUser = process.env.EMAIL_USER
    const emailPassword = process.env.EMAIL_PASSWORD
    
    console.log('📧 Email config check:')
    console.log('- EMAIL_USER:', emailUser ? 'SET' : 'MISSING')
    console.log('- EMAIL_PASSWORD:', emailPassword ? 'SET' : 'MISSING')
    
    if (!emailUser || !emailPassword) {
      console.error('❌ Email credentials missing!')
      throw new Error('Email credentials not configured')
    }

    transporter = nodemailer.createTransport({
      host: 'smtppro.zoho.eu', // Cambiar a .com si es cuenta global
      port: 465,
      secure: true, // SSL
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      // Configuración adicional para Zoho
      tls: {
        rejectUnauthorized: false
      }
    })
  }
  return transporter
}

// Tipos para los datos del pedido
interface OrderEmailData {
  orderId: string
  orderNumber: string
  status: string
  clientName: string
  clientEmail: string
  items: Array<{
    title: string
    quantity: number
    price: number
  }>
  total: number
  createdAt: string
  shippingAddress?: string
}

// Mapeo de estados a textos legibles en español
const statusMap = {
  'pending': 'Pendiente',
  'confirmed': 'Confirmado', 
  'processing': 'En Proceso',
  'shipped': 'Enviado',
  'delivered': 'Entregado',
  'cancelled': 'Cancelado',
  'refunded': 'Reembolsado'
}

class ServerEmailService {
  private static getStatusText(status: string): string {
    return statusMap[status as keyof typeof statusMap] || status
  }

  private static getStatusColor(status: string): string {
    const colors = {
      'pending': '#f59e0b',
      'confirmed': '#3b82f6',
      'processing': '#8b5cf6',
      'shipped': '#06b6d4',
      'delivered': '#10b981',
      'cancelled': '#ef4444',
      'refunded': '#6b7280'
    }
    return colors[status as keyof typeof colors] || '#6b7280'
  }

  // Plantilla HTML para emails de notificación de pedidos
  private static createOrderEmailTemplate(data: OrderEmailData, isForAdmin: boolean = false): string {
    const statusText = this.getStatusText(data.status)
    const statusColor = this.getStatusColor(data.status)
    const recipient = isForAdmin ? 'Administrador' : data.clientName

    // Formatear dirección de envío y facturación si existen
    function formatAddress(addr: any): string {
      if (!addr) return ''
      try {
        const obj = typeof addr === 'string' ? JSON.parse(addr) : addr
        if (typeof obj === 'object' && obj !== null) {
          return [
            obj.name,
            obj.address_line1,
            obj.address_line2,
            obj.city,
            obj.region,
            obj.postal_code,
            obj.country
          ].filter(Boolean).join('<br>')
        } else {
          return String(addr)
        }
      } catch {
        return String(addr).replace(/\n/g, '<br>')
      }
    }

  const shippingAddressText = formatAddress((data as any).shippingAddress)

    // Información del cliente (si existe)
    let clientInfoHtml = ''
    if ((data as any).clientInfo) {
      const c = (data as any).clientInfo
      clientInfoHtml = `
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1565c0;">Información del Cliente</h4>
          <p style="margin: 5px 0;"><strong>Nombre:</strong> ${c.first_name} ${c.last_name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${c.email}</p>
          ${c.phone ? `<p style=\"margin: 5px 0;\"><strong>Teléfono:</strong> ${c.phone}</p>` : ''}
          ${c.company_name ? `<p style=\"margin: 5px 0;\"><strong>Empresa:</strong> ${c.company_name}</p>` : ''}
          ${c.nif_cif ? `<p style=\"margin: 5px 0;\"><strong>NIF/CIF:</strong> ${c.nif_cif}</p>` : ''}
          ${c.company_position ? `<p style=\"margin: 5px 0;\"><strong>Cargo:</strong> ${c.company_position}</p>` : ''}
          ${c.activity ? `<p style=\"margin: 5px 0;\"><strong>Actividad:</strong> ${c.activity}</p>` : ''}
          ${c.address_line1 ? `<p style=\"margin: 5px 0;\"><strong>Dirección:</strong> ${c.address_line1}${c.address_line2 ? ', ' + c.address_line2 : ''}</p>` : ''}
          ${c.city ? `<p style=\"margin: 5px 0;\"><strong>Ciudad:</strong> ${c.city}</p>` : ''}
          ${c.region ? `<p style=\"margin: 5px 0;\"><strong>Región:</strong> ${c.region}</p>` : ''}
          ${c.postal_code ? `<p style=\"margin: 5px 0;\"><strong>Código Postal:</strong> ${c.postal_code}</p>` : ''}
        </div>
      `
    }

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Actualización de Pedido #${data.orderNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">La Casa del Suelo Radiante</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Tu especialista en calefacción</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-top: 0;">Hola ${recipient},</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">Estado del Pedido Actualizado</h3>
          <p style="margin: 10px 0;"><strong>Número de Pedido:</strong> #${data.orderNumber}</p>
          <p style="margin: 10px 0;">
            <strong>Estado:</strong> 
            <span style="background-color: ${statusColor}; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 14px;">
              ${statusText}
            </span>
          </p>
          <p style="margin: 10px 0;"><strong>Fecha:</strong> ${new Date(data.createdAt).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        ${clientInfoHtml}
        
        <div style="margin: 30px 0;">
          <h4 style="color: #2c3e50; margin-bottom: 15px;">Productos del Pedido:</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f1f3f4;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e1e5e9;">Producto</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e1e5e9;">Cantidad</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e1e5e9;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e1e5e9;">${item.title}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e1e5e9;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e1e5e9;">€${item.price.toFixed(2)}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="text-align: right; background: #f8f9fa; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0; color: #2c3e50;">Total: €${data.total.toFixed(2)}</h3>
          </div>
        </div>

        ${shippingAddressText ? `
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0369a1;">Información de Envío del Pedido</h4>
          <p style="margin: 5px 0; white-space: pre-line;">${shippingAddressText}</p>
        </div>
        ` : ''}
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h4 style="margin-top: 0; color: #2c3e50;">¿Necesitas ayuda?</h4>
          <p style="margin: 10px 0;">Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos:</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> consultas@lacasadelsueloradianteapp.com</p>
          <p style="margin: 5px 0;"><strong>Teléfono:</strong> 123-456-789</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Gracias por confiar en La Casa del Suelo Radiante
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
            Este es un email automático, por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    </body>
    </html>
    `
  }

  // Enviar notificación de cambio de estado
  static async sendOrderStatusNotification(orderData: OrderEmailData): Promise<boolean> {
    try {
  const adminEmail = 'consultas@lacasadelsueloradianteapp.com'
      const statusText = this.getStatusText(orderData.status)
      const transporter = getTransporter()

      // Email para el cliente
      const clientEmailOptions = {
        from: {
          name: 'La Casa del Suelo Radiante',
          address: 'consultas@lacasadelsueloradianteapp.com'
        },
        to: orderData.clientEmail,
        subject: `Actualización de tu pedido #${orderData.orderNumber} - ${statusText}`,
        html: this.createOrderEmailTemplate(orderData, false)
      }

      // Email para el administrador
      const adminEmailOptions = {
        from: {
          name: 'La Casa del Suelo Radiante',
          address: 'consultas@lacasadelsueloradianteapp.com'
        },
        to: adminEmail,
        subject: `[ADMIN] Pedido #${orderData.orderNumber} actualizado - ${statusText}`,
        html: this.createOrderEmailTemplate(orderData, true)
      }

      // Enviar ambos emails
      const [clientResult, adminResult] = await Promise.allSettled([
        transporter.sendMail(clientEmailOptions),
        transporter.sendMail(adminEmailOptions)
      ])

      // Log de resultados
      if (clientResult.status === 'fulfilled') {
        console.log(`✅ Email enviado al cliente ${orderData.clientEmail} para pedido #${orderData.orderNumber}`)
      } else {
        console.error(`❌ Error enviando email al cliente:`, clientResult.reason)
      }

      if (adminResult.status === 'fulfilled') {
        console.log(`✅ Email enviado al administrador para pedido #${orderData.orderNumber}`)
      } else {
        console.error(`❌ Error enviando email al administrador:`, adminResult.reason)
      }

      // Retornar true si al menos uno se envió correctamente
      return clientResult.status === 'fulfilled' || adminResult.status === 'fulfilled'
    } catch (error) {
      console.error('Error in sendOrderStatusNotification:', error)
      return false
    }
  }

  // Método específico para notificar cuando se crea un nuevo pedido
  static async sendNewOrderNotification(orderData: OrderEmailData): Promise<boolean> {
    // Para pedidos nuevos, establecer el status como 'pending'
    const newOrderData = {
      ...orderData,
      status: 'pending'
    }
    
    return this.sendOrderStatusNotification(newOrderData)
  }

  // Verificar configuración del email
  static async verifyEmailConfiguration(): Promise<boolean> {
    try {
      console.log('🔧 Creating transporter...')
      const transporter = getTransporter()
      
      console.log('🧪 Testing SMTP connection...')
      await transporter.verify()
      
      console.log('✅ Configuración de email verificada correctamente')
      return true
    } catch (error) {
      console.error('❌ Error en la configuración de email:')
      console.error('- Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('- Error message:', error instanceof Error ? error.message : String(error))
      console.error('- Full error:', error)
      return false
    }
  }
}

export default ServerEmailService