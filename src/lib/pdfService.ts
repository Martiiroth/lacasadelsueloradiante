/**
 * Servicio de generación de PDFs para facturas con jsPDF
 * Optimizado para el sistema de facturas con diseño profesional
 */

import jsPDF from 'jspdf'
import type { Invoice, InvoicePDFData, PDFConfig, InvoiceItem } from '@/types/invoices'
import { supabase } from './supabase'
import { LOGO_BASE64 } from './logoBase64'

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
    config: Partial<PDFConfig> = {},
    isProforma: boolean = false
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
      await this.buildInvoicePDF(doc, invoiceData, finalConfig, isProforma)

      // Convertir a Buffer
      const pdfArrayBuffer = doc.output('arraybuffer')
      return Buffer.from(pdfArrayBuffer)

    } catch (error) {
      console.error('Error generando PDF de factura:', error)
      throw new Error(`Error al generar PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Genera un PDF de proforma desde un pedido
   */
  static async generateProformaFromOrder(orderId: string): Promise<Buffer> {
    try {
      // Obtener datos del pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
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
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        throw new Error(`No se encontró el pedido con ID: ${orderId}`)
      }

      // Obtener items del pedido
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
        .eq('order_id', orderId)

      if (itemsError) {
        throw new Error('Error obteniendo items del pedido')
      }

      // Transformar a formato de factura
      const invoiceItems: InvoiceItem[] = orderItems?.map(item => ({
        id: item.id,
        invoice_id: orderId,
        variant_id: item.variant_id,
        qty: item.qty,
        price_cents: item.price_cents,
        product_title: item.variant?.product?.title,
        variant_title: item.variant?.title,
        sku: item.variant?.sku
      })) || []

      // Calcular IVA
      const TAX_RATE = 21
      const totalWithTax = order.total_cents
      const subtotal = Math.round(totalWithTax / (1 + TAX_RATE / 100))
      const taxAmount = totalWithTax - subtotal

      // Crear datos de proforma
      const proformaData: InvoicePDFData = {
        invoice: {
          id: orderId,
          client_id: order.client_id,
          order_id: orderId,
          invoice_number: 0, // Las proformas no tienen número
          prefix: 'PRO-',
          suffix: '',
          subtotal_cents: subtotal,
          tax_rate: TAX_RATE,
          tax_cents: taxAmount,
          total_cents: totalWithTax,
          currency: 'EUR',
          status: 'draft' as any, // Proforma es borrador
          created_at: order.created_at,
          due_date: null,
          client: order.client,
          order: order
        } as Invoice,
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

      const finalConfig = { ...this.defaultConfig }
      
      // Crear documento PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Generar el contenido del PDF como proforma
      await this.buildInvoicePDF(doc, proformaData, finalConfig, true)

      // Convertir a Buffer
      const pdfArrayBuffer = doc.output('arraybuffer')
      return Buffer.from(pdfArrayBuffer)

    } catch (error) {
      console.error('Error generando PDF de proforma:', error)
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
            billing_address,
            shipping_cost_cents,
            subtotal_cents
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
    config: PDFConfig,
    isProforma: boolean = false
  ): Promise<void> {
    const { invoice, company, items } = data
    
    // Configuración de página
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let currentY = margin

    // Logo de la empresa
    try {
      // Agregar logo (35mm de ancho, altura proporcional)
      doc.addImage(LOGO_BASE64, 'PNG', margin, currentY, 35, 35)
    } catch (error) {
      console.error('Error al cargar logo:', error)
      // Fallback: mostrar nombre de empresa
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('La Casa del Suelo Radiante', margin, currentY + 8)
    }

    // Título FACTURA o PROFORMA (parte superior derecha)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    
    if (isProforma) {
      doc.setTextColor(200, 0, 0) // Rojo para proforma
      const proformaTitle = 'PROFORMA'
      const titleWidth = doc.getTextWidth(proformaTitle)
      doc.text(proformaTitle, pageWidth - margin - titleWidth, currentY + 10)
    } else {
      doc.setTextColor(0, 0, 0) // Negro para factura
      const invoiceTitle = 'FACTURA'
      const titleWidth = doc.getTextWidth(invoiceTitle)
      doc.text(invoiceTitle, pageWidth - margin - titleWidth, currentY + 10)
    }

    // Número de factura (solo para facturas, no para proformas)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    
    if (!isProforma) {
      const invoiceNumber = `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
      const numberWidth = doc.getTextWidth(`Nº: ${invoiceNumber}`)
      doc.text(`Nº: ${invoiceNumber}`, pageWidth - margin - numberWidth, currentY + 20)
    }

    // Fecha
    const invoiceDate = new Date(invoice.created_at).toLocaleDateString('es-ES')
    const dateWidth = doc.getTextWidth(`Fecha: ${invoiceDate}`)
    doc.text(`Fecha: ${invoiceDate}`, pageWidth - margin - dateWidth, currentY + 27)

    currentY = 55

    // Layout de dos columnas: Cliente (izquierda) y Empresa (derecha)
    const columnWidth = (pageWidth - margin * 2) / 2
    const rightColumnX = margin + columnWidth + 10

    // COLUMNA IZQUIERDA: Datos del cliente
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('FACTURAR A:', margin, currentY)
    
    let clientY = currentY + 7
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    // Usar datos del cliente o de la dirección de facturación de la orden
    const clientData = invoice.client || (invoice.order?.billing_address as any)
    
    if (clientData) {
      const clientName = `${clientData.first_name} ${clientData.last_name}`
      doc.text(clientName, margin, clientY)
      clientY += 5

      if (clientData.company_name) {
        doc.text(clientData.company_name, margin, clientY)
        clientY += 5
      }

      if (clientData.nif_cif) {
        doc.text(`NIF/CIF: ${clientData.nif_cif}`, margin, clientY)
        clientY += 5
      }

      if (clientData.address_line1) {
        doc.text(clientData.address_line1, margin, clientY)
        clientY += 5
      }

      if (clientData.city && clientData.postal_code) {
        doc.text(`${clientData.postal_code} ${clientData.city}`, margin, clientY)
        clientY += 5
      }

      if (clientData.email) {
        doc.text(clientData.email, margin, clientY)
        clientY += 5
      }
    }

    // COLUMNA DERECHA: Datos de la empresa
    let companyY = currentY + 7
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('DATOS DE LA EMPRESA:', rightColumnX, currentY)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(company.name, rightColumnX, companyY)
    companyY += 5
    
    doc.text(company.address.split('\n')[0], rightColumnX, companyY)
    companyY += 5
    doc.text(company.address.split('\n')[1], rightColumnX, companyY)
    companyY += 5
    
    doc.text(`NIF: ${company.nif}`, rightColumnX, companyY)
    companyY += 5
    doc.text(`Tel: ${company.phone}`, rightColumnX, companyY)
    companyY += 5
    doc.text(`Email: ${company.email}`, rightColumnX, companyY)
    companyY += 5
    doc.text(`Registro RI-AEE: 17208`, rightColumnX, companyY)

    // Avanzar currentY basándonos en cuál columna es más larga
    currentY = Math.max(clientY, companyY) + 15

    // Tabla de items
    const tableStartY = currentY
    const colWidths = [65, 15, 25, 20, 25] // Descripción, Cant., Precio s/IVA, IVA 21%, Total
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

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Descripción', colPositions[0] + 2, currentY + 5)
    doc.text('Cant.', colPositions[1] + 2, currentY + 5)
    doc.text('Precio s/IVA', colPositions[2] + 2, currentY + 5)
    doc.text('IVA 21%', colPositions[3] + 2, currentY + 5)
    doc.text('Total', colPositions[4] + 2, currentY + 5)

    currentY += 10

    // Items
    doc.setFont('helvetica', 'normal')
    let subtotal = 0

    items.forEach((item) => {
      const description = `${item.product_title || 'Producto'}${item.variant_title ? ` - ${item.variant_title}` : ''}`
      const quantity = item.qty.toString()
      
      // Calcular precio sin IVA (el precio en BD incluye IVA)
      const priceWithTax = item.price_cents
      const priceWithoutTax = Math.round(priceWithTax / 1.21)
      const taxAmount = priceWithTax - priceWithoutTax
      
      const price = this.formatCurrency(priceWithoutTax, config.currency)
      const tax = this.formatCurrency(taxAmount, config.currency)
      const itemTotal = item.qty * priceWithTax
      const totalFormatted = this.formatCurrency(itemTotal, config.currency)

      // Verificar si necesitamos nueva página
      if (currentY > pageHeight - 50) {
        doc.addPage()
        currentY = margin
      }

      doc.text(description, colPositions[0] + 2, currentY + 5)
      doc.text(quantity, colPositions[1] + 2, currentY + 5)
      doc.text(price, colPositions[2] + 2, currentY + 5)
      doc.text(tax, colPositions[3] + 2, currentY + 5)
      doc.text(totalFormatted, colPositions[4] + 2, currentY + 5)

      subtotal += itemTotal
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

    // Mostrar envío si existe
    if (data.invoice.order?.shipping_cost_cents && data.invoice.order.shipping_cost_cents > 0) {
      doc.text('Envío:', totalsX - 50, currentY)
      doc.text(this.formatCurrency(data.invoice.order.shipping_cost_cents, config.currency), totalsX, currentY)
      currentY += 6
    }

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

    // Información bancaria
    currentY += 15
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Datos bancarios para transferencia:', margin, currentY)
    currentY += 5
    
    doc.setFont('helvetica', 'normal')
    doc.text('CaixaBank - IBAN: ES18 2100 8453 5102 0007 7305', margin, currentY)

    // Footer con RGPD
    let footerY = pageHeight - 45
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    
    // Texto de RGPD (dividido en múltiples líneas)
    const rgpdText = [
      'Según el Reglamento General de Protección de Datos (RGPD), publicado en mayo de 2016, Vd. da su consentimiento para el tratamiento de los datos',
      'personales aportados en su petición. Estos se incorporarán al fichero de T&V Servicios y Complementos SL, inscrito en el Registro de la Agencia',
      'Española de Protección de Datos. Sus datos se usarán en la gestión administrativa y comercial de su petición y no se cederán a terceros salvo',
      'obligación legal. Podrá ejercer sus derechos: acceso, rectificación, supresión, limitación, oposición y portabilidad.'
    ]
    
    rgpdText.forEach((line) => {
      doc.text(line, margin, footerY)
      footerY += 3.5
    })
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