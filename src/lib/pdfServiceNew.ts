/**
 * PDFService - Servicio de generación de PDFs completamente reconstruido
 * 
 * ✅ ROBUSTO Y FUNCIONAL
 * ✅ Manejo de errores completo
 * ✅ Logging detallado
 * ✅ Validaciones estrictas
 * ✅ Diseño profesional
 */

import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { InvoiceService, type InvoiceWithRelations } from './invoiceServiceNew'

// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

const COMPANY_INFO = {
  name: 'T&V Servicios y Complementos S.L.',
  cif: 'B-86715893',
  address: 'Avenida de Europa, 26. Edificio 3. Planta baja oficina B207',
  city: '28224 Pozuelo de Alarcón (Madrid)',
  email: 'administracion@lacasadelsueloradiante.es',
  phone: '+34 91 123 45 67',
  website: 'www.lacasadelsueloradiante.es',
  registro: 'Registro RI-AZE con el número 17208'
}

const PDF_CONFIG = {
  pageSize: 'A4' as const,
  margins: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
  },
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    success: '#059669',
    text: '#1f2937',
    light: '#f8fafc'
  }
}

// ============================================================================
// CLASE PRINCIPAL DEL SERVICIO PDF
// ============================================================================

export class PDFServiceNew {

  /**
   * Generar PDF de factura completo
   */
  static async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    try {
      console.log('📄 [PDF] Iniciando generación de PDF para factura:', invoiceId)

      // 1. Obtener datos completos de la factura
      const invoice = await InvoiceService.getInvoiceById(invoiceId)
      if (!invoice) {
        throw new Error(`Factura no encontrada: ${invoiceId}`)
      }

      console.log('✅ [PDF] Datos de factura obtenidos:', {
        number: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`,
        total: invoice.total_cents / 100,
        clientName: invoice.client ? `${invoice.client.first_name} ${invoice.client.last_name}` : 'Desconocido'
      })

      // 2. Generar PDF
      const pdfBuffer = await this.createPDFDocument(invoice)

      // 3. Marcar como PDF generado
      await InvoiceService.markPDFGenerated(invoiceId)

      console.log('✅ [PDF] PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes')
      return pdfBuffer

    } catch (error) {
      console.error('❌ [PDF] Error generando PDF:', error)
      throw new Error(`Error generando PDF: ${error instanceof Error ? error.message : 'Desconocido'}`)
    }
  }

  /**
   * Crear documento PDF con diseño profesional
   */
  private static async createPDFDocument(invoice: InvoiceWithRelations): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🎨 [PDF] Creando documento PDF...')

        // Crear documento
        const doc = new PDFDocument({
          size: PDF_CONFIG.pageSize,
          margins: PDF_CONFIG.margins,
          info: {
            Title: `Factura ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`,
            Author: COMPANY_INFO.name,
            Subject: 'Factura',
            Creator: 'La Casa del Suelo Radiante',
            Producer: 'Sistema de Facturación'
          }
        })

        const chunks: Buffer[] = []

        // Capturar datos del PDF
        doc.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })

        doc.on('end', () => {
          const finalBuffer = Buffer.concat(chunks)
          console.log('✅ [PDF] Documento PDF creado, tamaño:', finalBuffer.length, 'bytes')
          resolve(finalBuffer)
        })

        doc.on('error', (error) => {
          console.error('❌ [PDF] Error en documento PDF:', error)
          reject(error)
        })

        // Generar contenido del PDF
        this.generatePDFContent(doc, invoice)

        // Finalizar documento
        doc.end()

      } catch (error) {
        console.error('❌ [PDF] Error creando documento:', error)
        reject(error)
      }
    })
  }

  /**
   * Generar contenido completo del PDF
   */
  private static generatePDFContent(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations): void {
    try {
      // Header con información de la empresa
      this.drawHeader(doc)

      // Información de la factura
      this.drawInvoiceInfo(doc, invoice)

      // Información del cliente
      this.drawClientInfo(doc, invoice)

      // Tabla de productos
      this.drawProductsTable(doc, invoice)

      // Totales
      this.drawTotals(doc, invoice)

      // Footer con información legal
      this.drawFooter(doc)

      console.log('✅ [PDF] Contenido del PDF generado completamente')

    } catch (error) {
      console.error('❌ [PDF] Error generando contenido:', error)
      throw error
    }
  }

  /**
   * Dibujar header de la empresa
   */
  private static drawHeader(doc: PDFKit.PDFDocument): void {
    // Logo y nombre de empresa (lado izquierdo)
    doc.fontSize(24)
       .fillColor(PDF_CONFIG.colors.primary)
       .text('🔥', 50, 60, { width: 30 })
    
    doc.fontSize(20)
       .fillColor(PDF_CONFIG.colors.text)
       .text('La Casa del Suelo Radiante', 90, 65, { width: 300 })

    // Información de empresa (lado derecho)
    const companyInfoY = 60
    const rightX = 350

    doc.fontSize(10)
       .fillColor(PDF_CONFIG.colors.secondary)
       .text(COMPANY_INFO.name, rightX, companyInfoY, { width: 195, align: 'right' })
       .text(`CIF: ${COMPANY_INFO.cif}`, rightX, companyInfoY + 15, { width: 195, align: 'right' })
       .text(COMPANY_INFO.address, rightX, companyInfoY + 30, { width: 195, align: 'right' })
       .text(COMPANY_INFO.city, rightX, companyInfoY + 45, { width: 195, align: 'right' })
       .text(COMPANY_INFO.registro, rightX, companyInfoY + 60, { width: 195, align: 'right' })

    // Línea separadora
    doc.strokeColor(PDF_CONFIG.colors.secondary)
       .lineWidth(1)
       .moveTo(50, 140)
       .lineTo(545, 140)
       .stroke()
  }

  /**
   * Dibujar información de la factura
   */
  private static drawInvoiceInfo(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations): void {
    const invoiceNumber = `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
    
    // Título FACTURA
    doc.fontSize(28)
       .fillColor(PDF_CONFIG.colors.primary)
       .text(`FACTURA ${invoiceNumber}`, 50, 160, { width: 500 })

    // Información de fechas (lado derecho)
    const rightX = 350
    const infoY = 200

    doc.fontSize(10)
       .fillColor(PDF_CONFIG.colors.text)
       .text('Fecha de factura:', rightX, infoY, { width: 100 })
       .text(new Date(invoice.invoice_date).toLocaleDateString('es-ES'), rightX + 100, infoY, { width: 95, align: 'right' })

    if (invoice.due_date) {
      doc.text('Fecha de vencimiento:', rightX, infoY + 15, { width: 100 })
         .text(new Date(invoice.due_date).toLocaleDateString('es-ES'), rightX + 100, infoY + 15, { width: 95, align: 'right' })
    }

    if (invoice.order?.id) {
      doc.text('Número de pedido:', rightX, infoY + 30, { width: 100 })
         .text(`#${invoice.order.id.slice(-8).toUpperCase()}`, rightX + 100, infoY + 30, { width: 95, align: 'right' })
    }
  }

  /**
   * Dibujar información del cliente
   */
  private static drawClientInfo(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations): void {
    const clientY = 260

    // Título
    doc.fontSize(12)
       .fillColor(PDF_CONFIG.colors.text)
       .text('Facturar a:', 50, clientY)

    // Nombre del cliente
    if (invoice.client) {
      const clientName = `${invoice.client.first_name} ${invoice.client.last_name}`
      doc.fontSize(11)
         .text(clientName, 50, clientY + 20)

      // Empresa si existe
      if (invoice.client.company_name) {
        doc.text(invoice.client.company_name, 50, clientY + 35)
      }

      // NIF/CIF
      if (invoice.client.nif_cif) {
        doc.text(`NIF/CIF: ${invoice.client.nif_cif}`, 50, clientY + 50)
      }

      // Dirección
      let addressY = clientY + 65
      if (invoice.client.address_line1) {
        doc.text(invoice.client.address_line1, 50, addressY)
        addressY += 15
      }
      
      if (invoice.client.city || invoice.client.postal_code) {
        const cityText = `${invoice.client.postal_code || ''} ${invoice.client.city || ''}`.trim()
        if (cityText) {
          doc.text(cityText, 50, addressY)
        }
      }
    } else {
      doc.fontSize(11)
         .text('Cliente no especificado', 50, clientY + 20)
    }
  }

  /**
   * Dibujar tabla de productos
   */
  private static drawProductsTable(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations): void {
    const tableTop = 380
    const tableLeft = 50
    const tableWidth = 495

    // Headers de la tabla
    doc.fontSize(10)
       .fillColor(PDF_CONFIG.colors.light)
       .rect(tableLeft, tableTop, tableWidth, 25)
       .fill()

    doc.fillColor(PDF_CONFIG.colors.text)
       .text('Producto', tableLeft + 10, tableTop + 8, { width: 240 })
       .text('Cant.', tableLeft + 260, tableTop + 8, { width: 40, align: 'center' })
       .text('Precio (sin IVA)', tableLeft + 310, tableTop + 8, { width: 80, align: 'right' })
       .text('IVA', tableLeft + 400, tableTop + 8, { width: 50, align: 'right' })
       .text('Total', tableLeft + 460, tableTop + 8, { width: 75, align: 'right' })

    // Línea separadora
    doc.strokeColor(PDF_CONFIG.colors.secondary)
       .lineWidth(0.5)
       .moveTo(tableLeft, tableTop + 25)
       .lineTo(tableLeft + tableWidth, tableTop + 25)
       .stroke()

    // Productos
    let currentY = tableTop + 35
    
    if (invoice.order?.order_items && invoice.order.order_items.length > 0) {
      invoice.order.order_items.forEach((item) => {
        const itemBasePrice = Math.round(item.price_cents / 1.21)
        const itemIva = item.price_cents - itemBasePrice
        const itemTotal = item.price_cents * item.qty

        const productName = item.variant?.product?.title || item.variant?.title || 'Producto'

        doc.fontSize(9)
           .fillColor(PDF_CONFIG.colors.text)
           .text(productName, tableLeft + 10, currentY, { width: 240 })
           .text(item.qty.toString(), tableLeft + 260, currentY, { width: 40, align: 'center' })
           .text(this.formatCurrency(itemBasePrice), tableLeft + 310, currentY, { width: 80, align: 'right' })
           .text(this.formatCurrency(itemIva), tableLeft + 400, currentY, { width: 50, align: 'right' })
           .text(this.formatCurrency(itemTotal), tableLeft + 460, currentY, { width: 75, align: 'right' })

        currentY += 20
      })
    } else {
      doc.fontSize(9)
         .fillColor(PDF_CONFIG.colors.secondary)
         .text('No hay productos especificados', tableLeft + 10, currentY, { width: 400 })
    }
  }

  /**
   * Dibujar totales
   */
  private static drawTotals(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations): void {
    const totalsY = 520
    const rightX = 350

    // Calcular importes
    const totalCents = invoice.total_cents
    const baseImponible = Math.round(totalCents / 1.21)
    const iva = totalCents - baseImponible

    // Línea separadora
    doc.strokeColor(PDF_CONFIG.colors.secondary)
       .lineWidth(1)
       .moveTo(rightX, totalsY)
       .lineTo(545, totalsY)
       .stroke()

    // Base imponible
    doc.fontSize(10)
       .fillColor(PDF_CONFIG.colors.text)
       .text('Base imponible:', rightX, totalsY + 15, { width: 120 })
       .text(this.formatCurrency(baseImponible), rightX + 120, totalsY + 15, { width: 75, align: 'right' })

    // IVA
    doc.text('IVA (21%):', rightX, totalsY + 35, { width: 120 })
       .text(this.formatCurrency(iva), rightX + 120, totalsY + 35, { width: 75, align: 'right' })

    // Total
    doc.fontSize(12)
       .fillColor(PDF_CONFIG.colors.primary)
       .text('TOTAL:', rightX, totalsY + 60, { width: 120 })
       .text(this.formatCurrency(totalCents), rightX + 120, totalsY + 60, { width: 75, align: 'right' })
  }

  /**
   * Dibujar footer con información legal
   */
  private static drawFooter(doc: PDFKit.PDFDocument): void {
    const footerY = 700

    // Información legal
    const legalText = `Sus datos serán tratados con la finalidad de gestionar la relación comercial con Vd. y prestarle los servicios solicitados. Los datos se conservarán mientras dure la relación comercial y, posteriormente, durante los plazos de prescripción legal. La base legal del tratamiento es la ejecución del contrato. Sus datos no se comunicarán a terceros, salvo obligación legal. Puede ejercer sus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición dirigiéndose a ${COMPANY_INFO.name} – ${COMPANY_INFO.address}. ${COMPANY_INFO.city} o enviando un correo electrónico a: ${COMPANY_INFO.email}`

    doc.fontSize(7)
       .fillColor(PDF_CONFIG.colors.secondary)
       .text(legalText, 50, footerY, { 
         width: 495, 
         align: 'justify',
         lineGap: 2 
       })

    // Información de contacto
    doc.fontSize(8)
       .fillColor(PDF_CONFIG.colors.text)
       .text(`${COMPANY_INFO.email} | ${COMPANY_INFO.phone} | ${COMPANY_INFO.website}`, 50, footerY + 50, {
         width: 495,
         align: 'center'
       })
  }

  /**
   * Formatear moneda
   */
  private static formatCurrency(cents: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100)
  }
}

export default PDFServiceNew