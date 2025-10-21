/**
 * Servicio de generación de PDFs para facturas con jsPDF
 * Optimizado para el sistema de facturas con diseño profesional
 */

import jsPDF from 'jspdf'
import type { Invoice, InvoicePDFData, PDFConfig, InvoiceItem } from '@/types/invoices'
import { supabase } from './supabase'

export class PDFService {
  private static defaultConfig: PDFConfig = {
    format: 'A4',
    language: 'es',
    currency: 'EUR'
  }

  /**
   * Genera un PDF de factura con diseño profesional
   */
  static async generateInvoicePDF(
    invoiceId: string, 
    config: Partial<PDFConfig> = {}
  ): Promise<Buffer> {
    try {
      // Obtener datos completos de la factura
      const invoiceData = await this.getInvoiceData(invoiceId)
      if (!invoiceData) {
        throw new Error(`No se encontró la factura con ID: ${invoiceId}`)
      }

      const finalConfig = { ...this.defaultConfig, ...config }
      
      // Crear documento PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Generar el contenido del PDF
      await this.buildInvoicePDF(doc, invoiceData, finalConfig)

      // Convertir a Buffer
      const pdfArrayBuffer = doc.output('arraybuffer')
      return Buffer.from(pdfArrayBuffer)

    } catch (error) {
      console.error('Error generando PDF de factura:', error)
      throw new Error(`Error al generar PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Obtiene todos los datos necesarios para generar la factura
   */
  private static async getInvoiceData(invoiceId: string): Promise<InvoicePDFData | null> {
    try {
      // Obtener factura con relaciones
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients (
            id,
            first_name,
            last_name,
            email,
            nif_cif,
            company_name,
            phone,
            address_line1,
            address_line2,
            city,
            postal_code,
            region
          ),
          order:orders (
            id,
            status,
            created_at,
            confirmation_number,
            shipping_address,
            billing_address
          )
        `)
        .eq('id', invoiceId)
        .single()

      if (invoiceError || !invoice) {
        console.error('Error obteniendo factura:', invoiceError)
        return null
      }

      // Obtener items de la factura (desde order_items del pedido relacionado)
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          variant:product_variants (
            title,
            sku,
            product:products (
              title
            )
          )
        `)
        .eq('order_id', invoice.order_id)

      if (itemsError) {
        console.error('Error obteniendo items de la factura:', itemsError)
        return null
      }

      // Transformar order_items a invoice_items format
      const invoiceItems: InvoiceItem[] = orderItems?.map(item => ({
        id: item.id,
        invoice_id: invoiceId,
        variant_id: item.variant_id,
        qty: item.qty,
        price_cents: item.price_cents,
        product_title: item.variant?.product?.title,
        variant_title: item.variant?.title,
        sku: item.variant?.sku
      })) || []

      const pdfData: InvoicePDFData = {
        invoice: invoice as Invoice,
        company: {
          name: 'T&V SERVICIOS Y COMPLEMENTOS',
          address: 'C. del Apóstol Santiago, 59\nCdad. Lineal, 28017 Madrid',
          phone: '+34 689 571 381',
          email: 'consultas@lacasadelsueloradiante.es',
          website: 'www.lacasadelsueloradiante.es',
          nif: 'B-86715893'
        },
        items: invoiceItems
      }

      return pdfData

    } catch (error) {
      console.error('Error en getInvoiceData:', error)
      return null
    }
  }

  /**
   * Construye el contenido visual del PDF
   */
  private static async buildInvoicePDF(
    doc: jsPDF, 
    data: InvoicePDFData, 
    config: PDFConfig
  ): Promise<void> {
    const { invoice, company, items } = data
    
    // Configuración de página
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let currentY = margin

    // Logo de la empresa (esquina superior izquierda)
    const logoUrl = 'https://lacasadelsueloradiante.es/images/logo.png'
    try {
      // Agregar logo (40mm de ancho, altura proporcional)
      doc.addImage(logoUrl, 'PNG', margin, currentY, 40, 40)
    } catch (error) {
      console.log('No se pudo cargar el logo, continuando sin él')
    }

    // Header con datos de empresa (al lado del logo)
    const textStartX = margin + 45
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(company.name, textStartX, currentY + 5)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(company.address.split('\n')[0], textStartX, currentY + 12)
    doc.text(company.address.split('\n')[1], textStartX, currentY + 17)
    doc.text(`NIF: ${company.nif}`, textStartX, currentY + 22)
    doc.text(`Tel: ${company.phone}`, textStartX, currentY + 27)
    doc.text(`Email: ${company.email}`, textStartX, currentY + 32)

    currentY += 45

    // Título FACTURA
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    const invoiceTitle = 'FACTURA'
    const titleWidth = doc.getTextWidth(invoiceTitle)
    doc.text(invoiceTitle, pageWidth - margin - titleWidth, 30)

    // Número de factura
    const invoiceNumber = `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    const numberWidth = doc.getTextWidth(`Nº: ${invoiceNumber}`)
    doc.text(`Nº: ${invoiceNumber}`, pageWidth - margin - numberWidth, 45)

    // Fecha
    const invoiceDate = new Date(invoice.created_at).toLocaleDateString('es-ES')
    const dateWidth = doc.getTextWidth(`Fecha: ${invoiceDate}`)
    doc.text(`Fecha: ${invoiceDate}`, pageWidth - margin - dateWidth, 55)

    // Fecha de vencimiento
    if (invoice.due_date) {
      const dueDate = new Date(invoice.due_date).toLocaleDateString('es-ES')
      const dueDateWidth = doc.getTextWidth(`Vencimiento: ${dueDate}`)
      doc.text(`Vencimiento: ${dueDate}`, pageWidth - margin - dueDateWidth, 65)
    }

    // Línea separadora después del header
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, 75, pageWidth - margin, 75)

    currentY = 85

    // Datos del cliente
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('FACTURAR A:', margin, currentY)
    currentY += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    if (invoice.client) {
      const clientName = `${invoice.client.first_name} ${invoice.client.last_name}`
      doc.text(clientName, margin, currentY)
      currentY += 5

      if (invoice.client.company_name) {
        doc.text(invoice.client.company_name, margin, currentY)
        currentY += 5
      }

      if (invoice.client.nif_cif) {
        doc.text(`NIF/CIF: ${invoice.client.nif_cif}`, margin, currentY)
        currentY += 5
      }

      if (invoice.client.address_line1) {
        doc.text(invoice.client.address_line1, margin, currentY)
        currentY += 5
      }

      if (invoice.client.city && invoice.client.postal_code) {
        doc.text(`${invoice.client.postal_code} ${invoice.client.city}`, margin, currentY)
        currentY += 5
      }
    }

    currentY += 20

    // Tabla de items
    const tableStartY = currentY
    const colWidths = [80, 20, 25, 30, 35] // Descripción, Cant., Precio, Subtotal
    const colPositions = [
      margin,
      margin + colWidths[0],
      margin + colWidths[0] + colWidths[1],
      margin + colWidths[0] + colWidths[1] + colWidths[2],
      margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]
    ]

    // Headers de tabla
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Descripción', colPositions[0] + 2, currentY + 5)
    doc.text('Cant.', colPositions[1] + 2, currentY + 5)
    doc.text('Precio', colPositions[2] + 2, currentY + 5)
    doc.text('Subtotal', colPositions[4] + 2, currentY + 5)

    currentY += 10

    // Items
    doc.setFont('helvetica', 'normal')
    let subtotal = 0

    items.forEach((item) => {
      const description = `${item.product_title || 'Producto'}${item.variant_title ? ` - ${item.variant_title}` : ''}`
      const quantity = item.qty.toString()
      const price = this.formatCurrency(item.price_cents, config.currency)
      const itemSubtotal = item.qty * item.price_cents
      const subtotalFormatted = this.formatCurrency(itemSubtotal, config.currency)

      // Verificar si necesitamos nueva página
      if (currentY > pageHeight - 50) {
        doc.addPage()
        currentY = margin
      }

      doc.text(description, colPositions[0] + 2, currentY + 5)
      doc.text(quantity, colPositions[1] + 2, currentY + 5)
      doc.text(price, colPositions[2] + 2, currentY + 5)
      doc.text(subtotalFormatted, colPositions[4] + 2, currentY + 5)

      subtotal += itemSubtotal
      currentY += 8

      // Línea separadora
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, currentY, pageWidth - margin, currentY)
      currentY += 2
    })

    // Totales
    currentY += 10
    const totalsX = pageWidth - margin - 60

    doc.setFont('helvetica', 'normal')
    doc.text('Subtotal (Base imponible):', totalsX - 50, currentY)
    doc.text(this.formatCurrency(invoice.subtotal_cents, config.currency), totalsX, currentY)
    currentY += 6

    doc.text(`IVA (${invoice.tax_rate}%):`, totalsX - 50, currentY)
    doc.text(this.formatCurrency(invoice.tax_cents, config.currency), totalsX, currentY)
    currentY += 8

    // Línea separadora antes del total
    doc.setDrawColor(0, 0, 0)
    doc.line(totalsX - 55, currentY - 2, pageWidth - margin, currentY - 2)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('TOTAL:', totalsX - 50, currentY + 2)
    doc.text(this.formatCurrency(invoice.total_cents, config.currency), totalsX, currentY + 2)

    // Footer
    const footerY = pageHeight - 30
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    
    const footerText = `${company.name} | ${company.email} | ${company.phone}`
    const footerWidth = doc.getTextWidth(footerText)
    doc.text(footerText, (pageWidth - footerWidth) / 2, footerY)
  }

  /**
   * Formatea moneda según configuración
   */
  private static formatCurrency(cents: number, currency: string): string {
    const amount = cents / 100
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  /**
   * Genera vista previa rápida de factura (imagen base64)
   */
  static async generateInvoicePreview(invoiceId: string): Promise<string> {
    try {
      const pdfBuffer = await this.generateInvoicePDF(invoiceId)
      // Para preview simple, retornamos un placeholder
      // En implementación completa podrías usar pdf2pic o similar
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    } catch (error) {
      console.error('Error generando preview:', error)
      throw error
    }
  }
}