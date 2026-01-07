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
      host: 'mail.lacasadelsueloradiante.es',
      port: 587, // Puerto STARTTLS según configuración del servidor
      secure: false, // STARTTLS (usa secure: false con puerto 587)
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      // Configuración para servidor personalizado
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
  subtotal?: number
  shipping?: number
  tax?: number
  total: number
  createdAt: string
  shippingAddress?: string
  invoiceId?: string  // ID de la factura si existe
}

// Tipos para datos de nuevo registro
interface NewRegistrationEmailData {
  clientName: string
  clientEmail: string
  phone?: string
  nif_cif?: string
  region?: string
  city?: string
  address_line1?: string
  postal_code?: string
  activity?: string
  company_name?: string
  company_position?: string
  registrationDate: string
  registrationSource: 'public' | 'admin'
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

        ${data.status === 'pending' ? `
        <div style="background: #fef3c7; padding: 20px; border: 2px solid #f59e0b; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e; display: flex; align-items: center;">
            <span style="display: inline-block; width: 24px; height: 24px; margin-right: 8px;">💳</span>
            Instrucciones de Pago - Transferencia Bancaria
          </h3>
          
          <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h4 style="margin-top: 0; color: #92400e;">Datos para la transferencia:</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #92400e; width: 30%;">IBAN:</td>
                <td style="padding: 8px 0; font-family: monospace; font-size: 16px; color: #1f2937;">ES18 2100 8453 5102 0007 7305</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #92400e;">Titular:</td>
                <td style="padding: 8px 0; color: #1f2937;">La Casa del Suelo Radiante S.L.</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #92400e;">Banco:</td>
                <td style="padding: 8px 0; color: #1f2937;">CaixaBank</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #92400e;">Importe:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold; font-size: 18px;">€${data.total.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #92400e;">Concepto:</td>
                <td style="padding: 8px 0; font-family: monospace; font-size: 16px; color: #1f2937; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">Pedido #${data.orderNumber}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fffbeb; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h4 style="margin-top: 0; color: #92400e;">📋 Instrucciones importantes:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #92400e;">
              <li style="margin-bottom: 8px;">Realiza la transferencia por el importe exacto: <strong>€${data.total.toFixed(2)}</strong></li>
              <li style="margin-bottom: 8px;">Incluye <strong>obligatoriamente</strong> el concepto: <strong>Pedido #${data.orderNumber}</strong></li>
              <li style="margin-bottom: 8px;">Una vez recibida la transferencia, procesaremos tu pedido en 24-48 horas laborables</li>
              <li style="margin-bottom: 8px;">Recibirás un email de confirmación cuando procesemos el pago</li>
              <li style="margin-bottom: 0;">Si tienes dudas, contacta con nosotros indicando tu número de pedido</li>
            </ul>
          </div>
          
          <p style="text-align: center; color: #92400e; font-weight: bold; margin: 15px 0 0 0;">
            ⏰ El pedido se procesará automáticamente una vez confirmemos la recepción del pago
          </p>
        </div>
        ` : ''}

        ${shippingAddressText ? `
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0369a1;">Información de Envío del Pedido</h4>
          <p style="margin: 5px 0; white-space: pre-line;">${shippingAddressText}</p>
        </div>
        ` : ''}

        ${(data as any).invoiceId ? `
        <div style="background: #dcfce7; padding: 20px; border: 2px solid #16a34a; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #166534; display: flex; align-items: center;">
            <span style="display: inline-block; width: 24px; height: 24px; margin-right: 8px;">📄</span>
            Factura Adjunta
          </h4>
          <p style="margin: 10px 0; color: #166534;">
            Tu factura ha sido generada y está adjunta a este email en formato PDF.
          </p>
          <p style="margin: 10px 0; color: #166534; font-size: 14px;">
            También puedes consultar todas tus facturas en cualquier momento desde tu área de cliente en nuestra web.
          </p>
        </div>
        ` : ''}
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h4 style="margin-top: 0; color: #2c3e50;">¿Necesitas ayuda?</h4>
          <p style="margin: 10px 0;">Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos:</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> consultas@lacasadelsueloradiante.es</p>
          <p style="margin: 5px 0;"><strong>Teléfono:</strong> 689 57 13 81</p>
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

  // Template para notificación de nuevo registro
  private static createNewRegistrationEmailTemplate(data: NewRegistrationEmailData): string {
    const sourceText = data.registrationSource === 'public' ? 'Registro público en la web' : 'Creado desde panel de admin'
    const registrationDate = new Date(data.registrationDate).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevo Cliente Registrado</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #e97316;">
          <h1 style="color: #e97316; margin: 0; font-size: 28px;">🎉 Nuevo Cliente Registrado</h1>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">La Casa del Suelo Radiante</p>
        </div>

        <!-- Contenido principal -->
        <div style="padding: 30px 0;">
          <h2 style="color: #2c3e50; margin-top: 0;">¡Tenemos un nuevo cliente!</h2>
          
          <p style="font-size: 16px; margin-bottom: 25px;">
            Se ha registrado un nuevo cliente en la plataforma. Aquí tienes sus datos:
          </p>

          <!-- Datos del cliente -->
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #e97316; padding-bottom: 10px;">
              Información del Cliente
            </h3>
            
            <div style="display: grid; gap: 15px;">
              <div>
                <strong style="color: #e97316;">Nombre:</strong> 
                <span style="margin-left: 10px;">${data.clientName}</span>
              </div>
              
              <div>
                <strong style="color: #e97316;">Email:</strong> 
                <span style="margin-left: 10px;">${data.clientEmail}</span>
              </div>
              
              ${data.phone ? `
              <div>
                <strong style="color: #e97316;">Teléfono:</strong> 
                <span style="margin-left: 10px;">${data.phone}</span>
              </div>
              ` : ''}
              
              ${data.nif_cif ? `
              <div>
                <strong style="color: #e97316;">NIF/CIF:</strong> 
                <span style="margin-left: 10px;">${data.nif_cif}</span>
              </div>
              ` : ''}
              
              ${data.company_name ? `
              <div>
                <strong style="color: #e97316;">Empresa:</strong> 
                <span style="margin-left: 10px;">${data.company_name}</span>
                ${data.company_position ? `<br><em style="margin-left: 65px; color: #666;">Cargo: ${data.company_position}</em>` : ''}
              </div>
              ` : ''}
              
              ${data.activity ? `
              <div>
                <strong style="color: #e97316;">Actividad:</strong> 
                <span style="margin-left: 10px;">${data.activity}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Dirección si está disponible -->
          ${(data.address_line1 || data.city || data.region) ? `
          <div style="background: #f1f5f9; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
              📍 Dirección
            </h3>
            <div style="font-size: 14px; line-height: 1.8;">
              ${data.address_line1 ? `<div>${data.address_line1}</div>` : ''}
              ${data.postal_code && data.city ? `<div>${data.postal_code} ${data.city}</div>` : ''}
              ${data.region ? `<div>${data.region}</div>` : ''}
            </div>
          </div>
          ` : ''}

          <!-- Información del registro -->
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e;">
            <h4 style="color: #166534; margin-top: 0;">📋 Detalles del Registro</h4>
            <p style="margin: 5px 0;"><strong>Fecha:</strong> ${registrationDate}</p>
            <p style="margin: 5px 0;"><strong>Origen:</strong> ${sourceText}</p>
          </div>

          <!-- Acciones sugeridas -->
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
            <h4 style="color: #92400e; margin-top: 0;">💡 Próximos Pasos Sugeridos</h4>
            <ul style="margin: 10px 0; padding-left: 20px; color: #92400e;">
              <li style="margin-bottom: 8px;">Revisar el perfil del cliente en el panel de admin</li>
              <li style="margin-bottom: 8px;">Contactar al cliente para darle la bienvenida</li>
              <li style="margin-bottom: 8px;">Ofrecer información sobre productos y servicios</li>
              <li style="margin-bottom: 8px;">Verificar si necesita asesoramiento técnico</li>
            </ul>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Panel de Administración - La Casa del Suelo Radiante
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
            Este es un email automático de notificación.
          </p>
        </div>
      </div>
    </body>
    </html>
    `
  }

  // Enviar notificación de cambio de estado
  // recipients: 'client' | 'admin' | 'both' - determina a quién enviar (default: 'both')
  static async sendOrderStatusNotification(orderData: OrderEmailData, recipients: 'client' | 'admin' | 'both' = 'both'): Promise<boolean> {
    try {
  const adminEmail = 'consultas@lacasadelsueloradiante.es'
      const statusText = this.getStatusText(orderData.status)
      const transporter = getTransporter()

      // Adjuntar PDF según el estado del pedido
      let pdfAttachment = null
      
      // Si el pedido es PENDING, adjuntar PROFORMA
      if (orderData.status === 'pending') {
        try {
          console.log('📄 Generando PROFORMA para pedido pending:', orderData.orderId)
          const { PDFService } = await import('./pdfService')
          const pdfBuffer = await PDFService.generateProformaFromOrder(orderData.orderId)
          
          if (pdfBuffer) {
            pdfAttachment = {
              filename: `proforma-${orderData.orderNumber}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
            console.log('✅ PDF de PROFORMA preparado para adjuntar:', pdfAttachment.filename)
          }
        } catch (pdfError) {
          console.error('Error generando PDF de proforma para email:', pdfError)
        }
      }
      // Si hay invoiceId (pedido DELIVERED), adjuntar FACTURA
      else if (orderData.invoiceId) {
        try {
          console.log('📄 Obteniendo PDF de FACTURA para adjuntar al email:', orderData.invoiceId)
          const { PDFService } = await import('./pdfService')
          const pdfBuffer = await PDFService.generateInvoicePDF(orderData.invoiceId)
          
          if (pdfBuffer) {
            // Obtener número de factura para el nombre del archivo
            const { InvoiceService } = await import('./invoiceService')
            const invoice = await InvoiceService.getInvoiceById(orderData.invoiceId)
            const invoiceNumber = invoice ? `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}` : 'factura'
            
            pdfAttachment = {
              filename: `factura-${invoiceNumber}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
            console.log('✅ PDF de FACTURA preparado para adjuntar:', pdfAttachment.filename)
          }
        } catch (pdfError) {
          console.error('Error obteniendo PDF de factura para email:', pdfError)
        }
      }

      // Email para el cliente
      const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'consultas@lacasadelsueloradiante.es'
      const fromName = process.env.EMAIL_FROM_NAME || 'La Casa del Suelo Radiante'
      
      const clientEmailOptions: any = {
        from: {
          name: fromName,
          address: fromAddress
        },
        to: orderData.clientEmail,
        subject: `Actualización de tu pedido #${orderData.orderNumber} - ${statusText}`,
        html: this.createOrderEmailTemplate(orderData, false),
        attachments: pdfAttachment ? [pdfAttachment] : []
      }

      // Email para el administrador
      const adminEmailOptions: any = {
        from: {
          name: fromName,
          address: fromAddress
        },
        to: adminEmail,
        subject: `[ADMIN] Pedido #${orderData.orderNumber} actualizado - ${statusText}`,
        html: this.createOrderEmailTemplate(orderData, true),
        attachments: pdfAttachment ? [pdfAttachment] : []
      }

      // Determinar qué emails enviar según recipients
      const sendToClient = recipients === 'client' || recipients === 'both'
      const sendToAdmin = recipients === 'admin' || recipients === 'both'

      console.log('📧 [EMAIL] Enviando emails con configuración:', {
        recipients,
        sendToClient,
        sendToAdmin,
        clientEmail: orderData.clientEmail,
        pdfAttached: !!pdfAttachment,
        pdfType: orderData.status === 'pending' ? 'PROFORMA' : (orderData.invoiceId ? 'FACTURA' : 'NINGUNO')
      })

      // Preparar array de promesas según recipients
      const emailPromises: Promise<any>[] = []
      if (sendToClient) {
        emailPromises.push(transporter.sendMail(clientEmailOptions))
      }
      if (sendToAdmin) {
        emailPromises.push(transporter.sendMail(adminEmailOptions))
      }

      // Enviar emails
      const results = await Promise.allSettled(emailPromises)

      // Log de resultados detallados
      console.log('📧 [EMAIL] Resultados del envío:')
      
      let clientResult: PromiseSettledResult<any> | null = null
      let adminResult: PromiseSettledResult<any> | null = null

      if (sendToClient && sendToAdmin) {
        // Ambos emails enviados
        clientResult = results[0]
        adminResult = results[1]
      } else if (sendToClient) {
        // Solo cliente
        clientResult = results[0]
      } else if (sendToAdmin) {
        // Solo admin
        adminResult = results[0]
      }

      if (clientResult) {
        if (clientResult.status === 'fulfilled') {
          console.log(`✅ [EMAIL] Email enviado al cliente ${orderData.clientEmail}:`, {
            messageId: clientResult.value.messageId,
            response: clientResult.value.response
          })
        } else {
          console.error(`❌ [EMAIL] Error enviando email al cliente:`, {
            error: clientResult.reason instanceof Error ? clientResult.reason.message : String(clientResult.reason),
            clientEmail: orderData.clientEmail
          })
        }
      }

      if (adminResult) {
        if (adminResult.status === 'fulfilled') {
          console.log(`✅ [EMAIL] Email enviado al administrador:`, {
            messageId: adminResult.value.messageId,
            response: adminResult.value.response
          })
        } else {
          console.error(`❌ [EMAIL] Error enviando email al administrador:`, {
            error: adminResult.reason instanceof Error ? adminResult.reason.message : String(adminResult.reason)
          })
        }
      }

      // Retornar true si al menos uno se envió correctamente
      const success = results.some(result => result.status === 'fulfilled')
      return success
    } catch (error) {
      console.error('Error in sendOrderStatusNotification:', error)
      return false
    }
  }

  // Método específico para notificar cuando se crea un nuevo pedido
  static async sendNewOrderNotification(orderData: OrderEmailData): Promise<boolean> {
    // Mantener el status que se pasa desde el llamador
    // Si no se especifica status, usar 'pending' por defecto
    const finalOrderData = {
      ...orderData,
      status: orderData.status || 'pending'
    }
    
    return this.sendOrderStatusNotification(finalOrderData)
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

  // Enviar notificación de nuevo registro al admin
  static async sendNewRegistrationNotification(registrationData: NewRegistrationEmailData): Promise<boolean> {
    try {
      const adminEmail = process.env.EMAIL_ADMIN_ADDRESS || 'admin@lacasadelsueloradiante.es'
      const transporter = getTransporter()

      const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'consultas@lacasadelsueloradiante.es'
      const fromName = process.env.EMAIL_FROM_NAME || 'Sistema La Casa del Suelo Radiante'
      
      const emailOptions = {
        from: {
          name: fromName,
          address: fromAddress
        },
        to: adminEmail,
        subject: `🎉 Nuevo Cliente Registrado - ${registrationData.clientName}`,
        html: this.createNewRegistrationEmailTemplate(registrationData)
      }

      console.log(`📧 Enviando notificación de nuevo registro al admin: ${adminEmail}`)
      const result = await transporter.sendMail(emailOptions)
      console.log(`✅ Notificación de nuevo registro enviada correctamente para ${registrationData.clientName}`)
      
      return true
    } catch (error) {
      console.error('❌ Error enviando notificación de nuevo registro:', error)
      return false
    }
  }
}

export default ServerEmailService