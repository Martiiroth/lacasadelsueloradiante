import jsPDF from 'jspdf'
import { createClient } from '@supabase/supabase-js'

export class PDFServiceJsPDF {
  
  /**
   * Generar PDF de factura usando jsPDF
   */
  static async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    try {
      console.log('📄 [PDF-JSPDF] Iniciando generación de PDF para factura:', invoiceId)
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      console.log('📄 [PDF-JSPDF] Consultando base de datos...')

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
        console.error('❌ [PDF-JSPDF] Error obteniendo factura:', {
          error: error?.message,
          invoiceId,
          hasInvoice: !!invoice
        })
        throw new Error(`Factura no encontrada: ${invoiceId}`)
      }
      
      console.log('✅ [PDF-JSPDF] Datos de factura obtenidos:', {
        invoiceNumber: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`,
        clientEmail: invoice.client?.email,
        total: invoice.total_cents / 100
      })

      // Generar PDF con jsPDF
      console.log('📄 [PDF-JSPDF] Generando PDF con jsPDF...')
      const pdfBytes = this.generateInvoicePDFWithJsPDF(invoice)
      
      console.log('✅ [PDF-JSPDF] PDF generado exitosamente:', {
        bufferSize: pdfBytes.length,
        invoiceNumber: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
      })
      
      return Buffer.from(pdfBytes)
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      throw new Error(`Error generando PDF de la factura ${invoiceId}: ${errorMessage}`)
    }
  }

  /**
   * Método para generar el PDF con jsPDF
   */
  private static generateInvoicePDFWithJsPDF(invoice: any): Uint8Array {
    console.log('🎨 [PDF-JSPDF] Iniciando generación jsPDF para factura:', `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`)
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Configurar fuentes
    doc.setFont('helvetica')

    // ========== HEADER CON DATOS DE LA EMPRESA ==========
    
    // Logo y datos de empresa (lado derecho)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('T&V Servicios y Complementos S.L.', 200, 20, { align: 'right' })
    doc.text('CIF B-86715893', 200, 28, { align: 'right' })
    doc.text('Registro RI-AZE con el número 17208', 200, 36, { align: 'right' })
    doc.text('Avenida de Europa, 26. Edificio 3. Planta baja oficina B207', 200, 44, { align: 'right' })
    doc.text('28224 Pozuelo de Alarcón (Madrid)', 200, 52, { align: 'right' })
    doc.text('Teléfono: +34 910 123 456', 200, 60, { align: 'right' })
    doc.text('Email: administracion@lacasadelsueloradiante.com', 200, 68, { align: 'right' })

    // ========== TÍTULO DE FACTURA ==========
    
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text(`FACTURA ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`, 20, 90)

    // ========== DATOS DEL CLIENTE ==========
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Facturar a:', 20, 110)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    let yPosition = 120
    const clientName = invoice.client ? `${invoice.client.first_name} ${invoice.client.last_name}` : 'Cliente no especificado'
    doc.text(clientName, 20, yPosition)
    yPosition += 8
    
    if (invoice.client?.company_name) {
      doc.text(invoice.client.company_name, 20, yPosition)
      yPosition += 8
    }
    
    doc.text(`CIF/NIF: ${invoice.client?.nif_cif || 'No especificado'}`, 20, yPosition)
    yPosition += 8
    
    if (invoice.client?.address_line1) {
      let address = invoice.client.address_line1
      if (invoice.client.address_line2) address += `, ${invoice.client.address_line2}`
      doc.text(address, 20, yPosition)
      yPosition += 8
      
      if (invoice.client.city || invoice.client.postal_code) {
        doc.text(`${invoice.client.city || ''} ${invoice.client.postal_code || ''}`.trim(), 20, yPosition)
        yPosition += 8
      }
    }

    // ========== DETALLES DE FACTURA (LADO DERECHO) ==========
    
    doc.text(`Número de factura: ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`, 120, 110)
    
    doc.text(`Fecha de factura: ${new Date(invoice.created_at).toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })}`, 120, 120)
    
    if (invoice.order?.id) {
      doc.text(`Número de pedido: #${invoice.order.id.slice(-8).toUpperCase()}`, 120, 130)
    }
    
    if (invoice.order?.created_at) {
      doc.text(`Fecha de pedido: ${new Date(invoice.order.created_at).toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })}`, 120, 140)
    }
    
    doc.text('Método de pago: Pagar con Tarjeta', 120, 150)

    // ========== TABLA DE PRODUCTOS ==========
    
    const tableTop = 170
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    
    // Headers de tabla con fondo gris
    doc.setFillColor(240, 240, 240)
    doc.rect(20, tableTop, 170, 10, 'F')
    
    // Líneas de separación verticales de la tabla
    doc.setDrawColor(200, 200, 200)
    doc.line(20, tableTop, 20, tableTop + 10) // Izquierda
    doc.line(110, tableTop, 110, tableTop + 10) // Después de Producto
    doc.line(135, tableTop, 135, tableTop + 10) // Después de Cantidad
    doc.line(160, tableTop, 160, tableTop + 10) // Después de Precio (sin IVA)
    doc.line(190, tableTop, 190, tableTop + 10) // Derecha
    
    // Headers de texto
    doc.text('Producto', 22, tableTop + 6)
    doc.text('Cant.', 115, tableTop + 6)
    doc.text('Precio (sin IVA)', 140, tableTop + 6)
    doc.text('IVA', 165, tableTop + 6)
    
    // Línea separadora horizontal
    doc.line(20, tableTop + 10, 190, tableTop + 10)
    
    // ========== ITEMS DE LA FACTURA ==========
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    
    let currentY = tableTop + 20
    const rowHeight = 12
    const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`
    
    if (invoice.order?.order_items && invoice.order.order_items.length > 0) {
      invoice.order.order_items.forEach((item: any, index: number) => {
        const itemBase = Math.round(item.price_cents / 1.21)
        const itemIva = item.price_cents - itemBase
        const productName = item.variant?.product?.title || item.variant?.title || 'Producto'
        
        // Fondo alternado para filas
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(20, currentY - 8, 170, rowHeight, 'F')
        }
        
        // Límites de texto para que no se salga de las columnas
        const maxProductNameLength = 35
        const truncatedProductName = productName.length > maxProductNameLength 
          ? productName.substring(0, maxProductNameLength) + '...'
          : productName
        
        // Datos de la fila
        doc.text(truncatedProductName, 22, currentY)
        doc.text(item.qty.toString(), 117, currentY)
        doc.text(formatPrice(itemBase), 142, currentY)
        doc.text(formatPrice(itemIva), 167, currentY)
        
        currentY += rowHeight
      })
    } else {
      doc.text('No hay productos', 22, currentY)
      currentY += rowHeight
    }
    
    // ========== TOTALES ==========
    
    const totalCents = invoice.total_cents
    const baseImponible = Math.round(totalCents / 1.21)
    const iva = totalCents - baseImponible
    
    // Línea separadora antes de totales
    currentY += 10
    doc.setDrawColor(200, 200, 200)
    doc.line(20, currentY, 190, currentY)
    
    // Totales
    currentY += 15
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    doc.text('Base imponible', 120, currentY)
    doc.text(formatPrice(baseImponible), 165, currentY)
    
    currentY += 10
    doc.text('IVA 21%', 120, currentY)
    doc.text(formatPrice(iva), 165, currentY)
    
    currentY += 15
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Total', 120, currentY)
    doc.text(formatPrice(totalCents), 165, currentY)

    // ========== TEXTO LEGAL ==========
    
    const legalText = 'Sus datos serán tratados con la finalidad de gestionar la relación comercial con Vd. y prestarle los servicios solicitados. Los datos se conservarán mientras dure la relación comercial y, posteriormente, durante los plazos de prescripción legal. La base legal del tratamiento es la ejecución del contrato. Sus datos no se comunicarán a terceros, salvo obligación legal. Puede ejercer sus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición dirigiéndose a TYV SERVICIOS Y COMPLEMENTOS SL – Avenida de Europa, 26. Edificio 3. Planta baja oficina B207. 28224 Pozuelo de Alarcón (Madrid) o enviando un correo electrónico a: administracion@lacasadelsueloradiante.com'
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    
    // Dividir el texto en múltiples líneas
    const splitText = doc.splitTextToSize(legalText, 170)
    doc.text(splitText, 20, 250)

    console.log('✅ [PDF-JSPDF] Contenido escrito completamente, obteniendo bytes...')
    
    // Obtener los bytes del PDF
    const pdfBytes = doc.output('arraybuffer')
    return new Uint8Array(pdfBytes)
  }
}