import PDFDocument from 'pdfkit'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

export class PDFService {
  // Método para obtener el logo
  private static getLogoPath(): string {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png')
      if (fs.existsSync(logoPath)) {
        return logoPath
      }
    } catch (error) {
      console.warn('⚠️ No se pudo cargar el logo')
    }
    return ''
  }

  static async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    try {
      // Obtener los datos de la factura directamente desde Supabase
      console.log('📄 [PDF-SERVICE] Iniciando generación de PDF para factura:', invoiceId)
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      console.log('📄 [PDF-SERVICE] Consultando base de datos...')

      // Obtener factura específica con información del cliente y pedido
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients (
            first_name,
            last_name,
            email,
            phone,
            address_line1,
            address_line2,
            city,
            region,
            postal_code,
            company_name,
            nif_cif
          ),
          order:orders (
            id,
            created_at,
            shipping_address,
            billing_address,
            order_items (
              id,
              qty,
              price_cents,
              variant:product_variants (
                id,
                title,
                sku,
                product:products (
                  title
                )
              )
            )
          )
        `)
        .eq('id', invoiceId)
        .single()

      if (error || !invoice) {
        console.error('❌ [PDF-SERVICE] Error obteniendo factura:', {
          error: error?.message,
          invoiceId,
          hasInvoice: !!invoice
        })
        throw new Error(`Factura no encontrada: ${invoiceId}`)
      }
      
      console.log('✅ [PDF-SERVICE] Datos de factura obtenidos:', {
        invoiceNumber: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`,
        clientEmail: invoice.client?.email,
        total: invoice.total_cents / 100
      })
      
      // Generar PDF con PDFKit
      console.log('📄 [PDF-SERVICE] Generando PDF con PDFKit...')
      const pdfBuffer = await this.generateInvoicePDFWithPDFKit(invoice)
      
      console.log('✅ [PDF-SERVICE] PDF generado exitosamente:', {
        bufferSize: pdfBuffer.length,
        invoiceNumber: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
      })
      
      return pdfBuffer
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      throw new Error(`Error generando PDF de la factura ${invoiceId}: ${errorMessage}`)
    }
  }

  // Método para generar el PDF con PDFKit
  private static async generateInvoicePDFWithPDFKit(invoice: any): Promise<Buffer> {
    console.log('🎨 [PDF-SERVICE] Iniciando generación PDFKit para factura:', `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`)
    
    return new Promise((resolve, reject) => {
      try {
        console.log('📝 [PDF-SERVICE] Creando documento PDFKit...')
        const doc = new PDFDocument({ 
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        })
        
        const chunks: Buffer[] = []
        
        doc.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
          console.log('📊 [PDF-SERVICE] Recibido chunk de datos:', chunk.length, 'bytes')
        })
        
        doc.on('end', () => {
          const finalBuffer = Buffer.concat(chunks)
          console.log('✅ [PDF-SERVICE] PDFKit terminó generación:', {
            totalChunks: chunks.length,
            bufferLength: finalBuffer.length,
            isValidBuffer: Buffer.isBuffer(finalBuffer),
            firstBytes: finalBuffer.slice(0, 10).toString('hex')
          })
          resolve(finalBuffer)
        })
        
        doc.on('error', (error) => {
          console.error('❌ [PDF-SERVICE] Error en PDFKit:', error)
          reject(error)
        })

        // Formatear datos
        const formatPrice = (cents: number) => {
          return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
          }).format(cents / 100)
        }

        const totalCents = invoice.total_cents
        const baseImponible = Math.round(totalCents / 1.21)
        const iva = totalCents - baseImponible

        // Header con logo y datos de empresa
        const logoPath = this.getLogoPath()
        if (logoPath) {
          doc.image(logoPath, 50, 50, { width: 80 })
        }

        doc.font('Helvetica').fontSize(10)
        doc.text('T&V Servicios y Complementos S.L.', 400, 50, { align: 'right', width: 145 })
        doc.text('CIF B-86715893', 400, 65, { align: 'right', width: 145 })
        doc.text('Registro RI-AZE con el número 17208', 400, 80, { align: 'right', width: 145 })

        // Título de factura
        doc.font('Helvetica-Bold').fontSize(24)
        doc.text(`FACTURA ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`, 50, 150, { width: 500 })

        // Datos del cliente
        doc.font('Helvetica-Bold').fontSize(12)
        doc.text('Facturar a:', 50, 200, { width: 200 })
        doc.font('Helvetica').fontSize(10)
        
        const clientName = invoice.client ? `${invoice.client.first_name} ${invoice.client.last_name}` : 'Cliente no especificado'
        doc.text(clientName, 50, 220)
        
        if (invoice.client?.company_name) {
          doc.text(invoice.client.company_name, 50, 235)
        }
        
        doc.text(`CIF/NIF: ${invoice.client?.nif_cif || 'No especificado'}`, 50, 250)
        
        if (invoice.client?.address_line1) {
          let address = invoice.client.address_line1
          if (invoice.client.address_line2) address += `, ${invoice.client.address_line2}`
          doc.text(address, 50, 265)
          
          if (invoice.client.city || invoice.client.postal_code) {
            doc.text(`${invoice.client.city || ''} ${invoice.client.postal_code || ''}`.trim(), 50, 280)
          }
        }

        // Detalles de factura (lado derecho)
        doc.text(`Número de factura: ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`, 350, 200, { width: 200 })
        doc.text(`Fecha de factura: ${new Date(invoice.created_at).toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })}`, 350, 215, { width: 200 })
        
        if (invoice.order?.id) {
          doc.text(`Número de pedido: #${invoice.order.id.slice(-8).toUpperCase()}`, 350, 230, { width: 200 })
        }
        
        if (invoice.order?.created_at) {
          doc.text(`Fecha de pedido: ${new Date(invoice.order.created_at).toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })}`, 350, 245, { width: 200 })
        }

        doc.text('Método de pago: Pagar con Tarjeta', 350, 260, { width: 200 })

        // Tabla de productos
        let tableTop = 330
        doc.font('Helvetica-Bold').fontSize(10)
        
        // Headers de tabla
        doc.text('Producto', 50, tableTop, { width: 240 })
        doc.text('Cantidad', 300, tableTop, { width: 60 })
        doc.text('Precio (sin IVA)', 370, tableTop, { width: 100 })
        doc.text('IVA', 480, tableTop, { width: 60 })
        
        // Línea separadora
        doc.moveTo(50, tableTop + 15)
           .lineTo(545, tableTop + 15)
           .stroke()

        // Items
        doc.font('Helvetica').fontSize(10)
        let yPosition = tableTop + 25
        
        if (invoice.order?.order_items && invoice.order.order_items.length > 0) {
          invoice.order.order_items.forEach((item: any) => {
            const itemBase = Math.round(item.price_cents / 1.21)
            const itemIva = item.price_cents - itemBase
            const productName = item.variant?.product?.title || item.variant?.title || 'Producto'
            
            doc.text(productName, 50, yPosition, { width: 240 })
            doc.text(item.qty.toString(), 300, yPosition)
            doc.text(formatPrice(itemBase), 370, yPosition)
            doc.text(formatPrice(itemIva), 480, yPosition)
            
            yPosition += 20
          })
        } else {
          doc.text('No hay productos', 50, yPosition)
          yPosition += 20
        }

        // Línea separadora antes de totales
        yPosition += 10
        doc.moveTo(50, yPosition)
           .lineTo(545, yPosition)
           .stroke()

        // Totales
        yPosition += 20
        doc.font('Helvetica').fontSize(10)
        doc.text('Base imponible', 370, yPosition, { width: 100 })
        doc.text(formatPrice(baseImponible), 480, yPosition, { width: 60 })
        
        yPosition += 20
        doc.text('IVA 21%', 370, yPosition, { width: 100 })
        doc.text(formatPrice(iva), 480, yPosition, { width: 60 })
        
        yPosition += 20
        doc.font('Helvetica-Bold').fontSize(12)
        doc.text('Total', 370, yPosition, { width: 100 })
        doc.text(formatPrice(totalCents), 480, yPosition, { width: 60 })

        // Texto legal al final
        const legalText = 'Sus datos serán tratados con la finalidad de gestionar la relación comercial con Vd. y prestarle los servicios solicitados. Los datos se conservarán mientras dure la relación comercial y, posteriormente, durante los plazos de prescripción legal. La base legal del tratamiento es la ejecución del contrato. Sus datos no se comunicarán a terceros, salvo obligación legal. Puede ejercer sus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición dirigiéndose a TYV SERVICIOS Y COMPLEMENTOS SL – Avenida de Europa, 26. Edificio 3. Planta baja oficina B207. 28224 Pozuelo de Alarcón (Madrid) o enviando un correo electrónico a: administracion@lacasadelsuelo.com acreditando su identidad mediante copia del DNI. Asimismo, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos.'
        
        doc.font('Helvetica').fontSize(8)
        doc.text(legalText, 50, 700, { 
          width: 495, 
          align: 'justify',
          lineGap: 2 
        })

        console.log('✅ [PDF-SERVICE] Contenido escrito completamente, finalizando documento...')
        doc.end()
        
      } catch (error) {
        console.error('❌ [PDF-SERVICE] Error generando contenido PDF:', error)
        reject(error)
      }
    })
  }
}
