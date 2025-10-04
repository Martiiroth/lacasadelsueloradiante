import PDFDocument from 'pdfkit'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

export class PDFService {
  // Método para obtener el logo
  private static getLogoPath(): string {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png')
    if (fs.existsSync(logoPath)) {
      return logoPath
    }
    return '' // Sin logo si no existe
  }

  static async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    try {
      console.log('📄 Obteniendo datos de la factura:', invoiceId)
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Obtener factura específica
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
        console.error('❌ Error obteniendo factura:', error)
        throw new Error(`Factura no encontrada: ${invoiceId}`)
      }
      
      console.log('📄 Datos de factura obtenidos:', `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`)
      
      // Generar el PDF con PDFKit
      return await this.generateInvoicePDFWithPDFKit(invoice)
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      throw new Error(`Error generando PDF de la factura ${invoiceId}: ${errorMessage}`)
    }
  }

  private static async generateInvoicePDFWithPDFKit(invoice: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log('📄 Generando PDF con PDFKit...')
        
        const doc = new PDFDocument({ size: 'A4', margin: 50 })
        const chunks: Buffer[] = []
        
        // Capturar el PDF en un buffer
        doc.on('data', (chunk) => chunks.push(chunk))
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks)
          console.log('✅ PDF generado exitosamente con PDFKit, size:', pdfBuffer.length, 'bytes')
          resolve(pdfBuffer)
        })
        doc.on('error', reject)

        const formatPrice = (cents: number) => {
          return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
          }).format(cents / 100)
        }

        const totalCents = invoice.total_cents
        const baseImponible = Math.round(totalCents / 1.21)
        const iva = totalCents - baseImponible

        // Logo y encabezado de empresa
        const logoPath = this.getLogoPath()
        if (logoPath && fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 45, { width: 100 })
        }

        // Información de la empresa (derecha)
        doc.font('Helvetica-Bold').fontSize(12)
        doc.text('T&V Servicios y Complementos S.L.', 350, 50, { align: 'right' })
        doc.font('Helvetica').fontSize(10)
        doc.text('CIF B-86715893', 350, 68, { align: 'right' })
        doc.text('Registro RI-AZE con el número 17208', 350, 83, { align: 'right' })

        // Línea divisoria
        doc.moveTo(50, 130).lineTo(550, 130).stroke()

        // Datos del cliente y factura
        let yPos = 150

        // Cliente (izquierda)
        doc.font('Helvetica-Bold').fontSize(12)
        doc.text('Facturar a:', 50, yPos)
        yPos += 20
        
        doc.font('Helvetica').fontSize(10)
        const clientName = invoice.client ? `${invoice.client.first_name} ${invoice.client.last_name}` : 'Cliente no especificado'
        doc.text(clientName, 50, yPos)
        yPos += 15
        
        if (invoice.client?.company_name) {
          doc.text(invoice.client.company_name, 50, yPos)
          yPos += 15
        }
        
        doc.text(`CIF/NIF: ${invoice.client?.nif_cif || 'No especificado'}`, 50, yPos)
        yPos += 15
        
        if (invoice.client?.address_line1) {
          doc.text(invoice.client.address_line1, 50, yPos)
          if (invoice.client.address_line2) {
            yPos += 15
            doc.text(invoice.client.address_line2, 50, yPos)
          }
          yPos += 15
          doc.text(`${invoice.client.city || ''} ${invoice.client.postal_code || ''}`.trim(), 50, yPos)
        }

        // Datos de factura (derecha)
        yPos = 150
        doc.font('Helvetica-Bold').fontSize(16)
        doc.text(`FACTURA ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`, 350, yPos, { align: 'right' })
        yPos += 25
        
        doc.font('Helvetica').fontSize(10)
        doc.text(`Número de factura: ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`, 350, yPos, { align: 'right' })
        yPos += 15
        
        const fechaFactura = new Date(invoice.created_at).toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })
        doc.text(`Fecha de factura: ${fechaFactura}`, 350, yPos, { align: 'right' })
        yPos += 15
        
        doc.text(`Número de pedido: #${invoice.order?.id?.slice(-8).toUpperCase() || 'N/A'}`, 350, yPos, { align: 'right' })
        yPos += 15
        
        if (invoice.order?.created_at) {
          const fechaPedido = new Date(invoice.order.created_at).toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })
          doc.text(`Fecha de pedido: ${fechaPedido}`, 350, yPos, { align: 'right' })
        }

        // Tabla de productos
        yPos = 280
        doc.moveTo(50, yPos).lineTo(550, yPos).stroke()
        yPos += 10

        // Encabezados de tabla
        doc.font('Helvetica-Bold').fontSize(10)
        doc.text('Producto', 50, yPos)
        doc.text('Cant.', 350, yPos)
        doc.text('Precio (sin IVA)', 400, yPos)
        doc.text('IVA', 500, yPos)
        yPos += 15
        
        doc.moveTo(50, yPos).lineTo(550, yPos).stroke()
        yPos += 10

        // Items
        doc.font('Helvetica').fontSize(9)
        if (invoice.order?.order_items && invoice.order.order_items.length > 0) {
          invoice.order.order_items.forEach((item: any) => {
            const itemBase = Math.round(item.price_cents / 1.21)
            const itemIva = item.price_cents - itemBase
            const productName = item.variant?.product?.title || item.variant?.title || 'Producto'
            
            doc.text(productName, 50, yPos, { width: 280 })
            doc.text(item.qty.toString(), 350, yPos)
            doc.text(formatPrice(itemBase), 400, yPos)
            doc.text(formatPrice(itemIva), 500, yPos)
            yPos += 20
          })
        } else {
          doc.text('No hay productos', 50, yPos)
          yPos += 20
        }

        // Totales
        yPos += 10
        doc.moveTo(350, yPos).lineTo(550, yPos).stroke()
        yPos += 15

        doc.font('Helvetica').fontSize(10)
        doc.text('Base imponible:', 350, yPos)
        doc.text(formatPrice(baseImponible), 500, yPos, { align: 'right' })
        yPos += 20

        doc.text('IVA 21%:', 350, yPos)
        doc.text(formatPrice(iva), 500, yPos, { align: 'right' })
        yPos += 20

        doc.font('Helvetica-Bold').fontSize(12)
        doc.text('Total:', 350, yPos)
        doc.text(formatPrice(totalCents), 500, yPos, { align: 'right' })

        // Texto legal
        yPos = 650
        doc.moveTo(50, yPos).lineTo(550, yPos).stroke()
        yPos += 10

        doc.font('Helvetica').fontSize(7)
        const legalText = 'Sus datos serán tratados con la finalidad de gestionar la relación comercial con Vd. y prestarle los servicios solicitados. Los datos se conservarán mientras dure la relación comercial y, posteriormente, durante los plazos de prescripción legal. La base legal del tratamiento es la ejecución del contrato. Sus datos no se comunicarán a terceros, salvo obligación legal. Puede ejercer sus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición dirigiéndose a TYV SERVICIOS Y COMPLEMENTOS SL – Avenida de Europa, 26. Edificio 3. Planta baja oficina B207. 28224 Pozuelo de Alarcón (Madrid) o enviando un correo electrónico a: administracion@lacasadelsuelo.com acreditando su identidad mediante copia del DNI. Asimismo, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos.'
        
        doc.text(legalText, 50, yPos, {
          width: 500,
          align: 'justify',
          lineGap: 2
        })

        // Finalizar el PDF
        doc.end()
        
      } catch (error) {
        console.error('❌ Error generando PDF con PDFKit:', error)
        reject(error)
      }
    })
  }

  // Método antiguo de compatibilidad
  static async generateInvoicePDFFromHTML(invoiceHTML: string, invoiceNumber: string): Promise<Uint8Array> {
    throw new Error('Método deprecated - usar generateInvoicePDF directamente')
  }
}
